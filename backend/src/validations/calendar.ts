import { z } from 'zod';

export const generateTasksSchema = z.object({
  cropId: z.string().min(1, 'cropId is required'),
  sowingDate: z.string().min(1, 'sowingDate is required'),
});
