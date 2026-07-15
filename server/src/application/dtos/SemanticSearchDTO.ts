import { z } from 'zod';

export const SemanticSearchSchema = z.object({
  query: z.string().min(1, "Query is required").max(1000),
  departmentIds: z.array(z.string()).optional().default([]),
  limit: z.number().min(1).max(50).optional().default(10),
  filters: z.record(z.any()).optional()
});

export type SemanticSearchRequestDTO = z.infer<typeof SemanticSearchSchema>;
