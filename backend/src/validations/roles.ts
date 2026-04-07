import { z } from 'zod';

export const assignRoleSchema = z.object({
  roleId: z.string().min(1),
  organizationId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});
