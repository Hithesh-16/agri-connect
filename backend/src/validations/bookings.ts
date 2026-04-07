import { z } from 'zod';

export const createBookingSchema = z.object({
  serviceListingId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  slotType: z.enum(['MORNING', 'AFTERNOON', 'FULL_DAY']).optional(),
  farmLocation: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    village: z.string().optional(),
    mandal: z.string().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
    address: z.string().optional(),
  }),
  farmSize: z.number().positive().optional(),
  cropType: z.string().optional(),
  farmerNotes: z.string().max(500).optional(),
});

export const updateStatusSchema = z.object({
  status: z.string().min(1, 'status is required'),
  reason: z.string().max(500).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const rescheduleBookingSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  slotType: z.enum(['MORNING', 'AFTERNOON', 'FULL_DAY']).optional(),
  reason: z.string().max(500).optional(),
});

export const createRecurringSchema = z.object({
  serviceListingId: z.string().min(1),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  slotType: z.enum(['MORNING', 'AFTERNOON', 'FULL_DAY']).optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  farmLocation: z.object({}).passthrough(),
  farmSize: z.number().positive().optional(),
  cropType: z.string().optional(),
});
