import { z } from 'zod';

export const registerProviderSchema = z.object({
  type: z.enum(['MACHINERY_OWNER', 'INPUT_DEALER', 'TRANSPORTER', 'LABOR_INDIVIDUAL', 'LABOR_TEAM_LEADER', 'LIVESTOCK_DEALER', 'DRONE_OPERATOR', 'PROFESSIONAL']),
  businessName: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  serviceRadius: z.number().int().min(1).max(200).optional(),
  languages: z.array(z.string()).optional(),
  experience: z.number().int().min(0).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
});

export const submitKycSchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  panNumber: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'Invalid PAN format').optional(),
  gstNumber: z.string().optional(),
  bankAccountNo: z.string().min(8).max(18),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format'),
  kycDocuments: z.array(z.string().url()).min(1, 'At least one document required'),
});

export const reviewKycSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().max(500).optional(),
});
