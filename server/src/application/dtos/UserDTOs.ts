import { z } from 'zod';

export const InviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  departmentId: z.string().uuid().optional(),
  roles: z.array(z.string()).optional()
});

export type InviteUserDTO = z.infer<typeof InviteUserSchema>;

export const UserIdParamSchema = z.object({
  id: z.string().uuid()
});
