import { z } from 'zod';

export const userIdSchema = z.string().uuid();

export const CreateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
  }),
});

export const RenameRoleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ name: z.string().min(1).max(100) }),
});

export const DeleteRoleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const AssignRoleSchema = z.object({
  body: z.object({
    userId: userIdSchema,
    roleId: userIdSchema,
  }),
});

export const RemoveRoleSchema = AssignRoleSchema;

export const RoleIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const CreateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
  }),
});

export const RenameDepartmentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ name: z.string().min(1).max(100) }),
});

export const DeleteDepartmentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const AssignDepartmentSchema = z.object({
  body: z.object({
    userId: userIdSchema,
    departmentId: userIdSchema,
  }),
});

export const UpdateResourcePolicySchema = z.object({
  params: z.object({ documentId: z.string().uuid() }),
  body: z.object({
    allowedRoles: z.array(userIdSchema).optional(),
    deniedRoles: z.array(userIdSchema).optional(),
    allowedUsers: z.array(userIdSchema).optional(),
    deniedUsers: z.array(userIdSchema).optional(),
    allowedDepartments: z.array(userIdSchema).optional(),
    deniedDepartments: z.array(userIdSchema).optional(),
  }).refine((body) => Object.keys(body).length > 0, {
    message: 'At least one policy list must be provided',
  }),
});