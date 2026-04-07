import { prisma } from '../config';
import * as providerRepo from '../repositories/provider-repository';
import { NotFoundError, ForbiddenError, ConflictError, AppError } from '../errors/app-error';
import { paginate } from '../utils/pagination';
import { enqueue, QUEUES } from '../config/queue';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('provider-service');

export async function registerProvider(userId: string, data: any) {
  const existing = await providerRepo.findByUserId(userId);
  if (existing) throw new ConflictError('You are already registered as a provider.');

  const provider = await providerRepo.create({ user: { connect: { id: userId } }, ...data });

  const vendorRole = await prisma.roleDefinition.findUnique({ where: { name: 'VENDOR' } });
  if (vendorRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: vendorRole.id } },
      update: { isActive: true },
      create: { userId, roleId: vendorRole.id },
    });
  }

  await enqueue(QUEUES.AUDIT_LOG, 'provider.registered', { userId, providerId: provider.id, type: provider.type });
  log.info({ userId, providerId: provider.id }, 'Provider registered');
  return provider;
}

export async function getMyProfile(userId: string) {
  const provider = await providerRepo.findByUserId(userId, {
    listings: { where: { isActive: true } },
    user: { select: { firstName: true, surname: true, mobile: true, profilePhoto: true } },
  });
  if (!provider) throw new NotFoundError('Provider profile');
  return provider;
}

export async function updateMyProfile(userId: string, data: any) {
  return prisma.serviceProvider.update({ where: { userId }, data });
}

export async function getPublicProfile(providerId: string) {
  const provider = await providerRepo.findById(providerId, {
    listings: { where: { isActive: true, isPaused: false } },
    user: { select: { firstName: true, surname: true, profilePhoto: true } },
  });
  if (!provider) throw new NotFoundError('Provider');

  const { aadhaarNumber, panNumber, bankAccountNo, bankIfsc, kycDocuments, ...publicData } = provider;
  return publicData;
}

export async function submitKyc(userId: string, data: any) {
  const provider = await providerRepo.findByUserId(userId);
  if (!provider) throw new NotFoundError('Provider profile');
  if (provider.kycStatus === 'VERIFIED') throw new AppError('KYC already verified.', 400);

  const updated = await providerRepo.update(provider.id, {
    ...data,
    kycStatus: 'SUBMITTED',
    kycSubmittedAt: new Date(),
  });

  await enqueue(QUEUES.NOTIFICATION, 'kyc.submitted', { providerId: provider.id, userId });
  log.info({ providerId: provider.id }, 'KYC submitted');
  return { kycStatus: updated.kycStatus };
}

export async function getKycStatus(userId: string) {
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId },
    select: { kycStatus: true, kycSubmittedAt: true, kycVerifiedAt: true, kycReviewNote: true, isVerified: true },
  });
  if (!provider) throw new NotFoundError('Provider profile');
  return provider;
}

export async function reviewKyc(providerId: string, adminUserId: string, action: string, note?: string) {
  const provider = await providerRepo.findById(providerId);
  if (!provider) throw new NotFoundError('Provider');

  const isApproved = action === 'approve';
  const updated = await providerRepo.update(providerId, {
    kycStatus: isApproved ? 'VERIFIED' : 'REJECTED',
    kycVerifiedAt: isApproved ? new Date() : null,
    kycReviewNote: note,
    isVerified: isApproved,
  });

  await enqueue(QUEUES.NOTIFICATION, 'kyc.reviewed', {
    providerId, userId: provider.userId, status: updated.kycStatus, note,
  });

  log.info({ providerId, action, adminId: adminUserId }, 'KYC reviewed');
  return { kycStatus: updated.kycStatus };
}

export async function getKycQueue(filters: Record<string, string>) {
  const status = filters.status || 'SUBMITTED';
  const { page: p, limit: l, skip } = paginate(filters.page, filters.limit);

  const where = { kycStatus: status as any };
  const [providers, total] = await providerRepo.findMany(where, { skip, take: l }, {
    user: { select: { id: true, mobile: true, firstName: true, surname: true } },
  });

  return { providers, total, page: p, limit: l };
}
