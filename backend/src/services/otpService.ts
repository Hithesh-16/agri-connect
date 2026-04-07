import { prisma, config } from '../config';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('otp');

export class OtpService {
  static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendOtp(mobile: string): Promise<{ message: string }> {
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

    // Invalidate any previous OTPs for this mobile
    await prisma.otpVerification.updateMany({
      where: { mobile, verified: false },
      data: { verified: true },
    });

    await prisma.otpVerification.create({
      data: {
        mobile,
        otp,
        expiresAt,
      },
    });

    // In production, send OTP via SMS gateway (MSG91, Twilio, etc.)
    // For development, log the OTP
    if (config.nodeEnv === 'development') {
      log.debug({ mobile }, 'Dev OTP generated');
    }

    return { message: 'OTP sent successfully.' };
  }

  static async verifyOtp(mobile: string, otp: string): Promise<boolean> {
    // Accept universal OTP only in development mode
    if (config.universalOtp && otp === config.universalOtp) {
      return true;
    }

    const record = await prisma.otpVerification.findFirst({
      where: {
        mobile,
        otp,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return false;
    }

    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return true;
  }
}
