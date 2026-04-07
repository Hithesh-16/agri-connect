import { Request, Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../../types';
import { PaymentService } from '../../services/paymentService';
import { env } from '../../config/env';
import { AppError } from '../../errors/app-error';
import { sendSuccess, sendMessage } from '../../utils/response';
import { paginate } from '../../utils/pagination';
import { createChildLogger } from '../../config/logger';

const log = createChildLogger('payment-controller');

export async function createOrder(req: AuthRequest, res: Response) {
  const order = await PaymentService.createOrderForUser(req.user!.userId, req.body.bookingId, req.body.flowType);
  sendSuccess(res, order);
}

export async function verify(req: AuthRequest, res: Response) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const payment = await PaymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  sendSuccess(res, { paymentId: payment.id, status: payment.status });
}

export async function releaseEscrow(req: AuthRequest, res: Response) {
  const result = await PaymentService.releaseEscrowForUser(req.user!.userId, req.body.paymentId);
  sendSuccess(res, result);
}

export async function refund(req: AuthRequest, res: Response) {
  const { paymentId, reason, amount } = req.body;
  const result = await PaymentService.refundForUser(req.user!.userId, paymentId, reason, amount);
  sendSuccess(res, { status: result.status, refundAmount: result.refundAmount });
}

export async function history(req: AuthRequest, res: Response) {
  const pag = paginate(req.query.page as string, req.query.limit as string);
  const { payments, total } = await PaymentService.getUserPayments(req.user!.userId, pag.page, pag.limit);
  sendSuccess(res, payments, { page: pag.page, limit: pag.limit, total, totalPages: Math.ceil(total / pag.limit) });
}

export async function getWallet(req: AuthRequest, res: Response) {
  const wallet = await PaymentService.getOrCreateWallet(req.user!.userId);
  sendSuccess(res, wallet);
}

export async function addMoney(req: AuthRequest, res: Response) {
  const result = await PaymentService.addWalletFunds(req.user!.userId, req.body.amount);
  sendSuccess(res, result);
}

export async function getEarnings(req: AuthRequest, res: Response) {
  const earnings = await PaymentService.getEarningsForUser(req.user!.userId);
  sendSuccess(res, earnings);
}

export async function webhook(req: Request, res: Response) {
  if (env.razorpayWebhookSecret) {
    const signature = req.headers['x-razorpay-signature'] as string;
    const expected = crypto
      .createHmac('sha256', env.razorpayWebhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expected) {
      log.warn('Invalid Razorpay webhook signature');
      throw new AppError('Invalid signature.', 400);
    }
  }

  await PaymentService.handleWebhook(req.body.event, req.body.payload);
  sendSuccess(res, null);
}

export async function getInvoice(req: AuthRequest, res: Response) {
  const invoice = await PaymentService.getInvoice(req.params.id as string);
  sendSuccess(res, invoice);
}
