import { z } from 'zod';

export const createListingSchema = z.object({
  cropId: z.string().min(1, 'cropId is required'),
  type: z.enum(['sell', 'buy']),
  quantity: z.number().positive('quantity must be positive'),
  unit: z.string().min(1, 'unit is required'),
  pricePerUnit: z.number().positive().optional(),
  description: z.string().optional(),
  mandiId: z.string().optional(),
  location: z.string().optional(),
  category: z.enum(['crop', 'machinery', 'resource', 'tool', 'seed', 'labor', 'irrigation', 'animal', 'postharvest', 'growth_regulator']).optional(),
  itemId: z.string().optional(),
  itemName: z.string().optional(),
  listingType: z.enum(['sell', 'buy', 'rent', 'exchange']).optional(),
  images: z.array(z.string()).optional(),
  phone: z.string().optional(),
  condition: z.enum(['new', 'used', 'half_used']).optional(),
  rentalBasis: z.enum(['per_day', 'per_hour', 'per_acre']).optional(),
});

export const updateListingSchema = z.object({
  quantity: z.number().positive().optional(),
  pricePerUnit: z.number().positive().nullable().optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  phone: z.string().nullable().optional(),
  condition: z.enum(['new', 'used', 'half_used']).nullable().optional(),
  rentalBasis: z.enum(['per_day', 'per_hour', 'per_acre']).nullable().optional(),
});

export const createInquirySchema = z.object({
  message: z.string().min(1, 'message is required'),
  phone: z.string().optional(),
});
