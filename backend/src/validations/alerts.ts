import { z } from 'zod';

export const createAlertSchema = z.object({
  cropId: z.string().min(1, 'cropId is required'),
  mandiId: z.string().optional(),
  targetPrice: z.number().positive('targetPrice must be positive'),
  direction: z.enum(['above', 'below']),
  priceType: z.enum(['mandi', 'farmGate', 'dealer', 'retail']).default('mandi'),
});

export const updateAlertSchema = z.object({
  isActive: z.boolean().optional(),
});
