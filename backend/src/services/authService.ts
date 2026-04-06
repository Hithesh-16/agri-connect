import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config, prisma } from '../config';
import { AuthPayload } from '../types';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('auth');

export class AuthService {
  static generateAccessToken(payload: AuthPayload): string {
    return jwt.sign(payload as object, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as string,
    } as jwt.SignOptions);
  }

  static async generateRefreshToken(userId: string, deviceInfo?: string, ipAddress?: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.refreshTokenExpiresInDays);

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        deviceInfo,
        ipAddress,
        expiresAt,
      },
    });

    log.info({ userId }, 'Refresh token created');
    return token;
  }

  static async generateTokenPair(userId: string, mobile: string, deviceInfo?: string, ipAddress?: string) {
    const accessToken = this.generateAccessToken({ userId, mobile });
    const refreshToken = await this.generateRefreshToken(userId, deviceInfo, ipAddress);
    return { accessToken, refreshToken };
  }

  static async rotateRefreshToken(oldToken: string, deviceInfo?: string, ipAddress?: string) {
    const existing = await prisma.refreshToken.findUnique({
      where: { token: oldToken },
      include: { user: true },
    });

    if (!existing) {
      log.warn('Refresh token not found — possible theft attempt');
      return null;
    }

    if (existing.revoked) {
      // Token reuse detected — revoke all tokens for this user (security measure)
      log.error({ userId: existing.userId }, 'Revoked refresh token reused — revoking all user tokens');
      await prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revoked: false },
        data: { revoked: true, revokedAt: new Date() },
      });
      return null;
    }

    if (existing.expiresAt < new Date()) {
      log.warn({ userId: existing.userId }, 'Expired refresh token used');
      await prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revoked: true, revokedAt: new Date() },
      });
      return null;
    }

    // Revoke old token
    const newToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.refreshTokenExpiresInDays);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revoked: true, revokedAt: new Date(), replacedById: newToken },
      }),
      prisma.refreshToken.create({
        data: {
          token: newToken,
          userId: existing.userId,
          deviceInfo,
          ipAddress,
          expiresAt,
        },
      }),
    ]);

    const accessToken = this.generateAccessToken({
      userId: existing.userId,
      mobile: existing.user.mobile,
    });

    log.info({ userId: existing.userId }, 'Refresh token rotated');
    return { accessToken, refreshToken: newToken };
  }

  static async revokeRefreshToken(token: string) {
    await prisma.refreshToken.updateMany({
      where: { token, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
  }

  static async revokeAllUserTokens(userId: string) {
    const result = await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
    log.info({ userId, count: result.count }, 'All refresh tokens revoked');
  }

  // Clean up expired tokens (call via cron or BullMQ)
  static async cleanupExpiredTokens() {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    log.info({ count: result.count }, 'Expired refresh tokens cleaned up');
  }

  static async findOrCreateUser(mobile: string) {
    let user = await prisma.user.findUnique({ where: { mobile } });

    if (!user) {
      user = await prisma.user.create({
        data: { mobile },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      });
    }

    return user;
  }

  static async getUserProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        crops: { include: { crop: true } },
        mandis: { include: { mandi: true } },
      },
    });
  }

  static async updateProfile(userId: string, data: Record<string, any>) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}
