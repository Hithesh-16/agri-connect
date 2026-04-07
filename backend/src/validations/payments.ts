import { z } from 'zod';

export const createOrderSchema = z.object({
  bookingId: z.string().min(1),
  flowType: z.enum(['FULL_PREPAY', 'ADVANCE_BALANCE', 'POST_PAY', 'CASH_SPLIT']).optional(),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const escrowReleaseSchema = z.object({
  paymentId: z.string().min(1, 'paymentId required'),
});

export const refundSchema = z.object({
  paymentId: z.string().min(1),
  reason: z.string().min(1).max(500),
  amount: z.number().positive().optional(),
});

export const addMoneySchema = z.object({
  amount: z.number().positive().min(10).max(50000),
});
