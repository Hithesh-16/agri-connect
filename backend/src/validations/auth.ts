import { z } from 'zod';

export const sendOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
});

export const verifyOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const registerSchema = z.object({
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

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});
