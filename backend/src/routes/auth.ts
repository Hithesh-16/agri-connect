import { Router, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { OtpService } from '../services/otpService';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../types';
import { prisma } from '../config';

const router = Router();

const sendOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
});

const verifyOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const registerSchema = z.object({
  firstName: z.string().min(1).max(100),
  surname: z.string().min(1).max(100),
  role: z.enum(['FARMER', 'TRADER', 'DEALER', 'CORPORATE']),
  aadhaar: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits').optional(),
  houseNo: z.string().optional(),
  street: z.string().optional(),
  village: z.string().optional(),
  post: z.string().optional(),
  mandal: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  language: z.string().optional(),
  updatesConsent: z.boolean().optional(),
});

// POST /api/auth/send-otp
router.post('/send-otp', validate(sendOtpSchema), async (req, res: Response) => {
  try {
    const { mobile } = req.body;
    const result = await OtpService.sendOtp(mobile);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to send OTP.' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', validate(verifyOtpSchema), async (req, res: Response) => {
  try {
    const { mobile, otp } = req.body;
    const valid = await OtpService.verifyOtp(mobile, otp);

    if (!valid) {
      res.status(400).json({ success: false, error: 'Invalid or expired OTP.' });
      return;
    }

    const user = await AuthService.findOrCreateUser(mobile);
    const deviceInfo = req.get('user-agent');
    const ipAddress = req.ip;
    const tokens = await AuthService.generateTokenPair(user.id, user.mobile, deviceInfo, ipAddress);

    const isRegistered = !!(user.firstName && user.role);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          mobile: user.mobile,
          firstName: user.firstName,
          surname: user.surname,
          role: user.role,
          isRegistered,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Verification failed.' });
  }
});

// POST /api/auth/register (requires JWT)
router.post('/register', authenticate, validate(registerSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const data: any = { ...req.body };

    if (data.dob) {
      data.dob = new Date(data.dob);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        mobile: user.mobile,
        firstName: user.firstName,
        surname: user.surname,
        role: user.role,
        isRegistered: true,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Registration failed.' });
  }
});

// POST /api/auth/refresh — rotate refresh token, get new access token
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

router.post('/refresh', validate(refreshSchema), async (req, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const deviceInfo = req.get('user-agent');
    const ipAddress = req.ip;

    const result = await AuthService.rotateRefreshToken(refreshToken, deviceInfo, ipAddress);

    if (!result) {
      res.status(401).json({ success: false, error: 'Invalid or expired refresh token. Please log in again.' });
      return;
    }

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Token refresh failed.' });
  }
});

// POST /api/auth/logout — revoke refresh token
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      await AuthService.revokeRefreshToken(refreshToken);
    }
    // Also revoke all tokens if requested
    if (req.body?.allDevices) {
      await AuthService.revokeAllUserTokens(req.user!.userId);
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.json({ success: true, message: 'Logged out successfully.' });
  }
});

export default router;
