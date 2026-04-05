import jwt from 'jsonwebtoken';
import { config, prisma } from '../config';
import { AuthPayload } from '../types';

export class AuthService {
  static generateToken(payload: AuthPayload): string {
    return jwt.sign(payload as object, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as string,
    } as jwt.SignOptions);
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
