import { z } from 'zod';

export const CreateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
  })
});

export type CreateDepartmentDTO = z.infer<typeof CreateDepartmentSchema>['body'];

export const UpdateDepartmentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
  })
});

export type UpdateDepartmentDTO = z.infer<typeof UpdateDepartmentSchema>['body'];

export const DepartmentIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});
