import { prisma } from '../config';
import { Prisma } from '@prisma/client';

// ─── PAYMENT ────────────────────────────────────────────

export async function findPaymentById(id: string, include?: Prisma.PaymentInclude) {
  return prisma.payment.findUnique({ where: { id }, include });
}

export async function findPaymentByOrderId(razorpayOrderId: string) {
  return prisma.payment.findUnique({ where: { razorpayOrderId } });
}

export async function createPayment(data: Prisma.PaymentCreateInput) {
  return prisma.payment.create({ data });
}

export async function updatePayment(id: string, data: Prisma.PaymentUpdateInput) {
  return prisma.payment.update({ where: { id }, data });
}

export async function updatePaymentsByOrder(razorpayOrderId: string, data: Prisma.PaymentUpdateManyMutationInput) {
  return prisma.payment.updateMany({
    where: { razorpayOrderId, status: 'PENDING' },
    data,
  });
}

export async function findUserPayments(
  userId: string,
  pagination: { skip: number; take: number },
  include?: Prisma.PaymentInclude,
) {
  return Promise.all([
    prisma.payment.findMany({
      where: { payerId: userId },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
      include,
    }),
    prisma.payment.count({ where: { payerId: userId } }),
  ]);
}

// ─── WALLET ─────────────────────────────────────────────

export async function findWalletByUserId(userId: string, include?: Prisma.WalletInclude) {
  return prisma.wallet.findUnique({ where: { userId }, include });
}

export async function createWallet(userId: string) {
  return prisma.wallet.create({
    data: { userId },
    include: { transactions: true },
  });
}

export async function upsertWallet(userId: string, incrementAmount: number) {
  return prisma.wallet.upsert({
    where: { userId },
    update: { balance: { increment: incrementAmount } },
    create: { userId, balance: incrementAmount },
  });
}

export async function createWalletTransaction(data: Prisma.WalletTransactionCreateInput) {
  return prisma.walletTransaction.create({ data });
}

// ─── INVOICE ────────────────────────────────────────────

export async function findInvoiceById(id: string, include?: Prisma.InvoiceInclude) {
  return prisma.invoice.findUnique({ where: { id }, include });
}

// ─── PAYOUT ─────────────────────────────────────────────

export async function createPayout(data: Prisma.PayoutCreateInput) {
  return prisma.payout.create({ data });
}

export async function findProviderPayouts(providerId: string) {
  return prisma.payout.findMany({
    where: { providerId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function aggregateProviderPayouts(providerId: string) {
  return prisma.payout.aggregate({
    where: { providerId, status: 'COMPLETED' },
    _sum: { netAmount: true },
  });
}

export async function aggregateProviderPayments(providerId: string) {
  return prisma.payment.aggregate({
    where: { payeeProviderId: providerId, status: 'CAPTURED' },
    _sum: { amount: true, platformFee: true },
    _count: true,
  });
}

// ─── TAX PROFILE ────────────────────────────────────────

export async function findTaxProfile(providerId: string) {
  return prisma.taxProfile.findUnique({ where: { providerId } });
}

export async function upsertTaxProfile(providerId: string, data: Partial<{ tdsRate: number; totalTdsDeducted: number; financialYear: string }>) {
  return prisma.taxProfile.upsert({
    where: { providerId },
    update: data,
    create: { providerId, ...data } as any,
  });
}
