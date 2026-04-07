import { prisma } from '../config';
import { Prisma } from '@prisma/client';

// ─── USER ───────────────────────────────────────────────

export async function findUserById(id: string, include?: Prisma.UserInclude) {
  return prisma.user.findUnique({ where: { id }, include });
}

export async function findUserByMobile(mobile: string) {
  return prisma.user.findUnique({ where: { mobile } });
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data });
}

// ─── REFRESH TOKEN ──────────────────────────────────────

export async function createRefreshToken(data: Prisma.RefreshTokenCreateInput) {
  return prisma.refreshToken.create({ data });
}

export async function findRefreshToken(token: string) {
  return prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
}

export async function revokeRefreshToken(token: string) {
  return prisma.refreshToken.update({
    where: { token },
    data: { revoked: true, revokedAt: new Date() },
  });
}

export async function revokeAllUserTokens(userId: string) {
  return prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true, revokedAt: new Date() },
  });
}

export async function deleteExpiredTokens() {
  return prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

// ─── OTP ────────────────────────────────────────────────

export async function invalidateOtps(mobile: string) {
  return prisma.otpVerification.updateMany({
    where: { mobile, verified: false },
    data: { verified: true },
  });
}

export async function createOtp(data: { mobile: string; otp: string; expiresAt: Date }) {
  return prisma.otpVerification.create({ data });
}

export async function findValidOtp(mobile: string, otp: string) {
  return prisma.otpVerification.findFirst({
    where: { mobile, otp, verified: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markOtpVerified(id: string) {
  return prisma.otpVerification.update({
    where: { id },
    data: { verified: true },
  });
}

// ─── USER CROPS / MANDIS ────────────────────────────────

export async function findUserCrops(userId: string) {
  return prisma.userCrop.findMany({
    where: { userId },
    include: { crop: true },
  });
}

export async function replaceUserCrops(userId: string, cropIds: string[]) {
  return prisma.$transaction([
    prisma.userCrop.deleteMany({ where: { userId } }),
    ...cropIds.map((cropId) => prisma.userCrop.create({ data: { userId, cropId } })),
  ]);
}

export async function findUserMandis(userId: string) {
  return prisma.userMandi.findMany({
    where: { userId },
    include: { mandi: true },
  });
}

export async function replaceUserMandis(userId: string, mandiIds: string[]) {
  return prisma.$transaction([
    prisma.userMandi.deleteMany({ where: { userId } }),
    ...mandiIds.map((mandiId) => prisma.userMandi.create({ data: { userId, mandiId } })),
  ]);
}
