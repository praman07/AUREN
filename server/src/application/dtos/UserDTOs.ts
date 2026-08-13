import { z } from 'zod';

export const InviteUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    departmentId: z.string().uuid().optional(),
    roles: z.array(z.string().uuid()).optional(),
    password: z.string().min(8).max(256).optional(),
    isSuperAdmin: z.boolean().optional().default(false),
  }),
});

export type InviteUserDTO = z.infer<typeof InviteUserSchema>['body'];

export const UserIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

/** Secret-free user view for admin listing. */
export const toPublicUser = (user: any) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  organizationId: user.organizationId,
  departmentId: user.departmentId,
  department: user.department ? { id: user.department.id, name: user.department.name } : null,
  roles: (user.userRoles || []).map((ur: any) => ({ id: ur.role.id, name: ur.role.name })),
  isSuperAdmin: user.isSuperAdmin,
  clerkUserId: user.clerkUserId,
  status: user.deletedAt ? 'SUSPENDED' : 'ACTIVE',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});