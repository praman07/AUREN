import { z } from 'zod';

export const TogglePermissionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    permission: z.string().min(1).max(100),
    enabled: z.boolean(),
  })
});

export type TogglePermissionDTO = z.infer<typeof TogglePermissionSchema>['body'];

export const RoleIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});
