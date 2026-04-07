import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../config';
import { env } from '../config/env';
import { createChildLogger } from '../config/logger';
import { enqueue, QUEUES } from '../config/queue';

const log = createChildLogger('payment');

let razorpay: InstanceType<typeof Razorpay> | null = null;
if (env.razorpayKeyId && env.razorpayKeySecret) {
  razorpay = new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
}

// Commission rates by category slug
const COMMISSION_RATES: Record<string, number> = {
  machinery: 0.10,
  'drone-services': 0.12,
  transport: 0.10,
  'farm-labor': 0.08,
  'agri-inputs': 0.05,
  livestock: 0.08,
  'professional-services': 0.15,
  'post-harvest': 0.10,
  'farm-infrastructure': 0.10,
};
const DEFAULT_COMMISSION_RATE = 0.10;
const GST_RATE = 0.18; // 18% GST on platform fee
const TDS_RATE = 0.01; // 1% TDS under Section 194-O

export class PaymentService {

  /**
   * Create a Razorpay order for a booking
   */
  static async createOrder(bookingId: string, flowType: string = 'FULL_PREPAY') {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceListing: { include: { category: true } },
        provider: true,
      },
    });

    if (!booking) throw new Error('Booking not found');

    // Calculate amounts
    const baseAmount = booking.totalAmount;
    const categorySlug = booking.serviceListing.category.slug;
    const commissionRate = COMMISSION_RATES[categorySlug] || DEFAULT_COMMISSION_RATE;
    const platformFee = baseAmount * commissionRate;
    const gstOnFee = platformFee * GST_RATE;

    // Determine payment amount based on flow
    let paymentAmount = baseAmount;
    let paymentType = 'FULL';
    if (flowType === 'ADVANCE_BALANCE') {
      paymentAmount = baseAmount * 0.3; // 30% advance
      paymentType = 'ADVANCE';
    }

    // Calculate TDS (only if provider crosses threshold)
    let tdsAmount = 0;
    const taxProfile = await prisma.taxProfile.findUnique({ where: { providerId: booking.providerId } });
    if (taxProfile && Number(taxProfile.totalPayouts) + baseAmount > Number(taxProfile.tdsThreshold)) {
      tdsAmount = baseAmount * TDS_RATE;
    }

    // Create Razorpay order (if Razorpay configured)
    let razorpayOrderId: string | undefined;
    if (razorpay) {
      const order = await razorpay.orders.create({
        amount: Math.round(paymentAmount * 100), // Razorpay uses paise
        currency: 'INR',
        receipt: bookingId,
        notes: { bookingId, flowType, paymentType },
      });
      razorpayOrderId = order.id;
    } else {
      razorpayOrderId = `mock_order_${Date.now()}`;
      log.warn('Razorpay not configured — using mock order ID');
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        payerId: booking.farmerId,
        payeeProviderId: booking.providerId,
        razorpayOrderId,
        amount: paymentAmount,
        platformFee,
        gstOnFee,
        tdsAmount,
        flowType: flowType as any,
        paymentType,
        escrowStatus: 'HELD',
      },
    });

    log.info({ bookingId, paymentId: payment.id, amount: paymentAmount, flowType }, 'Payment order created');

    return {
      paymentId: payment.id,
      razorpayOrderId,
      amount: paymentAmount,
      currency: 'INR',
      platformFee,
      gstOnFee,
      tdsAmount,
      razorpayKeyId: razorpayKeyId || 'mock_key',
    };
  }

  /**
   * Verify Razorpay payment signature and capture
   */
  static async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
    if (!payment) throw new Error('Payment not found');

    // Verify signature
    if (razorpayKeySecret) {
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED', failureReason: 'Signature verification failed' },
        });
        throw new Error('Payment signature verification failed');
      }
    }

    // Update payment
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        status: 'CAPTURED',
        escrowStatus: 'HELD',
      },
    });

    // Update booking payment status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        advanceAmount: payment.paymentType === 'ADVANCE' ? Number(payment.amount) : undefined,
        status: payment.paymentType === 'ADVANCE' ? 'CONFIRMED' : 'CONFIRMED',
      },
    });

    // Schedule auto-release escrow after 48 hours (if service completed and farmer doesn't confirm)
    await enqueue(QUEUES.NOTIFICATION, 'escrow.auto-release-check', {
      paymentId: payment.id,
      bookingId: payment.bookingId,
    }, { delay: 48 * 60 * 60 * 1000 }); // 48 hours

    log.info({ paymentId: payment.id, razorpayPaymentId }, 'Payment verified and captured');
    return updated;
  }

  /**
   * Release escrow to provider (after farmer confirms or auto-confirm)
   */
  static async releaseEscrow(paymentId: string, releasedBy: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) throw new Error('Payment not found');
    if (payment.escrowStatus !== 'HELD') throw new Error('Escrow already released or not applicable');

    const netAmount = Number(payment.amount) - Number(payment.platformFee) - Number(payment.gstOnFee) - Number(payment.tdsAmount);

    // Update payment
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        escrowStatus: 'RELEASED',
        escrowReleasedAt: new Date(),
      },
    });

    // Update TDS tracking
    await prisma.taxProfile.upsert({
      where: { providerId: payment.payeeProviderId },
      update: {
        totalPayouts: { increment: netAmount },
        totalTdsDeducted: { increment: Number(payment.tdsAmount) },
      },
      create: {
        providerId: payment.payeeProviderId,
        totalPayouts: netAmount,
        totalTdsDeducted: Number(payment.tdsAmount),
      },
    });

    // Create payout record
    await prisma.payout.create({
      data: {
        providerId: payment.payeeProviderId,
        amount: netAmount,
        status: 'PENDING',
        periodStart: payment.createdAt,
        periodEnd: new Date(),
        bookingCount: 1,
        grossAmount: Number(payment.amount),
        commissionTotal: Number(payment.platformFee),
        tdsTotal: Number(payment.tdsAmount),
        netAmount,
      },
    });

    log.info({ paymentId, netAmount, releasedBy }, 'Escrow released');

    await enqueue(QUEUES.NOTIFICATION, 'escrow.released', {
      type: 'push',
      to: payment.payeeProviderId,
      title: 'Payment Released',
      body: `₹${netAmount.toFixed(0)} has been released for your booking.`,
    });

    return { netAmount, platformFee: Number(payment.platformFee), tds: Number(payment.tdsAmount) };
  }

  /**
   * Process refund
   */
  static async processRefund(paymentId: string, reason: string, partialAmount?: number) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'CAPTURED') throw new Error('Payment not in refundable state');

    const refundAmount = partialAmount || Number(payment.amount);

    let razorpayRefundId: string | undefined;
    if (razorpay && payment.razorpayPaymentId) {
      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100),
        notes: { reason, paymentId },
      } as any);
      razorpayRefundId = refund.id;
    } else {
      razorpayRefundId = `mock_refund_${Date.now()}`;
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: partialAmount ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
        refundAmount: refundAmount,
        refundReason: reason,
        refundedAt: new Date(),
        razorpayRefundId,
        escrowStatus: 'REFUNDED',
      },
    });

    log.info({ paymentId, refundAmount, reason }, 'Refund processed');
    return updated;
  }

  /**
   * Get payment history for a user
   */
  static async getUserPayments(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { payerId: userId },
        include: {
          booking: { select: { bookingNumber: true, status: true, startDate: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where: { payerId: userId } }),
    ]);
    return { payments, total };
  }

  /**
   * Get provider earnings summary
   */
  static async getProviderEarnings(providerId: string) {
    const [payouts, totalEarned, pendingEscrow] = await Promise.all([
      prisma.payout.findMany({
        where: { providerId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.payout.aggregate({
        where: { providerId, status: 'COMPLETED' },
        _sum: { netAmount: true },
      }),
      prisma.payment.aggregate({
        where: { payeeProviderId: providerId, escrowStatus: 'HELD' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalEarned: Number(totalEarned._sum.netAmount || 0),
      pendingEscrow: Number(pendingEscrow._sum.amount || 0),
      recentPayouts: payouts,
    };
  }
}
