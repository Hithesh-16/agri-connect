import { z } from 'zod';

export const createServiceListingSchema = z.object({
  categoryId: z.string().min(1),
  title: z.record(z.string()),
  description: z.record(z.string()).optional(),
  images: z.array(z.string()).optional(),
  pricingType: z.enum(['FIXED', 'NEGOTIABLE', 'BID_BASED']).optional(),
  pricePerUnit: z.number().positive(),
  unit: z.enum(['PER_HOUR', 'PER_DAY', 'PER_ACRE', 'PER_UNIT', 'PER_KG', 'PER_QUINTAL', 'PER_TRIP', 'PER_WORKER_DAY', 'FIXED']).optional(),
  minBookingDuration: z.number().int().min(1).optional(),
  equipmentMake: z.string().optional(),
  equipmentModel: z.string().optional(),
  equipmentYear: z.number().int().optional(),
  equipmentHP: z.number().int().optional(),
  equipmentDetails: z.record(z.unknown()).optional(),
  seasonalAvailable: z.array(z.string()).optional(),
});
