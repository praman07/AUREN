import { z } from 'zod';

export const ProcessingJobQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 50)),
    status: z.string().optional(),
    queueName: z.string().optional(),
    documentId: z.string().optional(),
  })
});

export type ProcessingJobQueryDTO = z.infer<typeof ProcessingJobQuerySchema>['query'];
