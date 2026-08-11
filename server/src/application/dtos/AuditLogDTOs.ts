import { z } from 'zod';

export const AuditLogQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 50)),
    action: z.string().optional(),
    actorId: z.string().optional(),
    resourceId: z.string().optional(),
    startDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
    endDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
  })
});

export type AuditLogQueryDTO = z.infer<typeof AuditLogQuerySchema>['query'];
