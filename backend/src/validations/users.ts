import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  surname: z.string().min(1).max(100).optional(),
  aadhaar: z.string().regex(/^\d{12}$/).optional(),
  role: z.enum(['FARMER', 'TRADER', 'DEALER', 'CORPORATE']).optional(),
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
  profilePhoto: z.string().optional(),
});

export const updateCropsSchema = z.object({
  cropIds: z.array(z.string()),
});

export const updateMandisSchema = z.object({
  mandiIds: z.array(z.string()),
});
