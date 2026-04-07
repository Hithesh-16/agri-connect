import { Response } from 'express';
import { AuthRequest } from '../../types';
import { OtpService } from '../../services/otpService';
import { AuthService } from '../../services/authService';
import * as userRepo from '../../repositories/user-repository';
import { AppError } from '../../errors/app-error';
import { sendSuccess, sendMessage } from '../../utils/response';

export async function sendOtp(req: AuthRequest, res: Response) {
  const result = await OtpService.sendOtp(req.body.mobile);
  sendSuccess(res, result);
}

export async function verifyOtp(req: AuthRequest, res: Response) {
  const { mobile, otp } = req.body;
  const isValid = await OtpService.verifyOtp(mobile, otp);

  if (!isValid) {
    throw new AppError('Invalid or expired OTP.', 400);
  }

  const user = await AuthService.findOrCreateUser(mobile);
  const tokens = await AuthService.generateTokenPair(
    user.id,
    user.mobile,
    req.get('user-agent'),
    req.ip,
  );

  sendSuccess(res, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user.id,
      mobile: user.mobile,
      firstName: user.firstName,
      surname: user.surname,
      role: user.role,
      isRegistered: !!(user.firstName && user.role),
    },
  });
}

export async function register(req: AuthRequest, res: Response) {
  const data: any = { ...req.body };
  if (data.dob) data.dob = new Date(data.dob);

  const user = await userRepo.updateUser(req.user!.userId, data);

  sendSuccess(res, {
    id: user.id,
    mobile: user.mobile,
    firstName: user.firstName,
    surname: user.surname,
    role: user.role,
    isRegistered: true,
  });
}

export async function refresh(req: AuthRequest, res: Response) {
  const result = await AuthService.rotateRefreshToken(
    req.body.refreshToken,
    req.get('user-agent'),
    req.ip,
  );

  if (!result) {
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  sendSuccess(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
}

export async function logout(req: AuthRequest, res: Response) {
  const { refreshToken, allDevices } = req.body || {};

  if (refreshToken) {
    await AuthService.revokeRefreshToken(refreshToken);
  }
  if (allDevices) {
    await AuthService.revokeAllUserTokens(req.user!.userId);
  }

  sendMessage(res, 'Logged out successfully.');
}
