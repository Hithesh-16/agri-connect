import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/permissions';
import { AuthRequest, paginate, paginatedResponse } from '../types';
import { PaymentService } from '../services/paymentService';
import { prisma } from '../config';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('payments');
const router = Router();

// ─── Payment Orders ──────────────────────────────────────

const createOrderSchema = z.object({
  bookingId: z.string().min(1),
  flowType: z.enum(['FULL_PREPAY', 'ADVANCE_BALANCE', 'POST_PAY', 'CASH_SPLIT']).optional(),
});

// POST /api/payments/order — create Razorpay order
router.post('/order', authenticate, validate(createOrderSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, flowType } = req.body;

    // Verify booking belongs to this farmer
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.farmerId !== req.user!.userId) {
      res.status(404).json({ success: false, error: 'Booking not found.' });
      return;
    }

    const order = await PaymentService.createOrder(bookingId, flowType);
    res.json({ success: true, data: order });
  } catch (err: any) {
    log.error({ err }, 'Create order failed');
    res.status(500).json({ success: false, error: err.message || 'Failed to create payment order.' });
  }
});

// POST /api/payments/verify — verify Razorpay payment
const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

router.post('/verify', authenticate, validate(verifySchema), async (req: AuthRequest, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const payment = await PaymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    res.json({ success: true, data: { paymentId: payment.id, status: payment.status } });
  } catch (err: any) {
    log.error({ err }, 'Payment verification failed');
    res.status(400).json({ success: false, error: err.message || 'Payment verification failed.' });
  }
});

// POST /api/payments/escrow/release — release escrow (farmer confirms)
router.post('/escrow/release', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      res.status(400).json({ success: false, error: 'paymentId required.' });
      return;
    }

    // Only farmer who paid or admin can release
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.payerId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not authorized to release this payment.' });
      return;
    }

    const result = await PaymentService.releaseEscrow(paymentId, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Escrow release failed.' });
  }
});

// POST /api/payments/refund — process refund
const refundSchema = z.object({
  paymentId: z.string().min(1),
  reason: z.string().min(1).max(500),
  amount: z.number().positive().optional(), // partial refund amount
});

router.post('/refund', authenticate, validate(refundSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId, reason, amount } = req.body;

    // Farmer or admin can request refund
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.payerId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not authorized.' });
      return;
    }

    const result = await PaymentService.processRefund(paymentId, reason, amount);
    res.json({ success: true, data: { status: result.status, refundAmount: result.refundAmount } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Refund failed.' });
  }
});

// GET /api/payments/history — user's payment history
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const pag = paginate(
      typeof req.query.page === 'string' ? req.query.page : undefined,
      typeof req.query.limit === 'string' ? req.query.limit : undefined,
    );
    const { payments, total } = await PaymentService.getUserPayments(req.user!.userId, pag.page, pag.limit);
    res.json({ success: true, ...paginatedResponse(payments, total, pag.page, pag.limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch payment history.' });
  }
});

// ─── Wallet ──────────────────────────────────────────────

// GET /api/payments/wallet — wallet balance
router.get('/wallet', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: req.user!.userId },
        include: { transactions: true },
      });
    }

    res.json({ success: true, data: wallet });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch wallet.' });
  }
});

// POST /api/payments/wallet/add — add money to wallet (create Razorpay order)
const addMoneySchema = z.object({
  amount: z.number().positive().min(10).max(50000),
});

router.post('/wallet/add', authenticate, validate(addMoneySchema), async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;

    // For now, directly credit the wallet (Razorpay integration for wallet top-up can be added)
    const wallet = await prisma.wallet.upsert({
      where: { userId: req.user!.userId },
      update: { balance: { increment: amount } },
      create: { userId: req.user!.userId, balance: amount },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'CREDIT',
        source: 'TOPUP',
        description: `Added ₹${amount} to wallet`,
        balanceBefore: Number(wallet.balance) - amount,
        balanceAfter: Number(wallet.balance),
      },
    });

    res.json({ success: true, data: { balance: wallet.balance } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add money.' });
  }
});

// ─── Provider Earnings ───────────────────────────────────

// GET /api/payments/earnings — provider earnings dashboard
router.get('/earnings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const provider = await prisma.serviceProvider.findUnique({ where: { userId: req.user!.userId } });
    if (!provider) {
      res.status(404).json({ success: false, error: 'Not a provider.' });
      return;
    }

    const earnings = await PaymentService.getProviderEarnings(provider.id);
    res.json({ success: true, data: earnings });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch earnings.' });
  }
});

// ─── Razorpay Webhook ────────────────────────────────────

// POST /api/payments/webhook — Razorpay webhook handler
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'] as string;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        log.warn('Invalid Razorpay webhook signature');
        res.status(400).json({ success: false, error: 'Invalid signature.' });
        return;
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    switch (event) {
      case 'payment.captured': {
        const rpPaymentId = payload.payment.entity.id;
        const rpOrderId = payload.payment.entity.order_id;
        log.info({ event, rpPaymentId, rpOrderId }, 'Webhook: payment captured');
        // Auto-verify if not already verified
        const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: rpOrderId } });
        if (payment && payment.status === 'PENDING') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'CAPTURED', razorpayPaymentId: rpPaymentId, method: payload.payment.entity.method?.toUpperCase() },
          });
        }
        break;
      }
      case 'payment.failed': {
        const rpOrderId = payload.payment.entity.order_id;
        log.warn({ event, rpOrderId }, 'Webhook: payment failed');
        await prisma.payment.updateMany({
          where: { razorpayOrderId: rpOrderId, status: 'PENDING' },
          data: { status: 'FAILED', failureReason: payload.payment.entity.error_description },
        });
        break;
      }
      case 'refund.processed': {
        log.info({ event }, 'Webhook: refund processed');
        break;
      }
      default:
        log.debug({ event }, 'Unhandled webhook event');
    }

    res.json({ success: true });
  } catch (err) {
    log.error({ err }, 'Webhook processing failed');
    res.status(500).json({ success: false });
  }
});

// ─── Invoice ──────────────────────────────────────────────

// GET /api/payments/invoices/:id — get invoice
router.get('/invoices/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: String(req.params.id) },
      include: { payment: { select: { payerId: true, payeeProviderId: true, status: true } } },
    });
    if (!invoice) {
      res.status(404).json({ success: false, error: 'Invoice not found.' });
      return;
    }
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoice.' });
  }
});

export default router;
