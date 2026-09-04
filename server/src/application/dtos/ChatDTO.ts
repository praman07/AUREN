import { z } from 'zod';

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000, "Message too long"),
  conversationId: z.string().uuid().optional(),
  departmentIds: z.array(z.string()).optional().default([]),
  mode: z.enum(['hybrid', 'local']).optional().default('hybrid'),
  executionMode: z.enum(['FAST', 'DEEP', 'AUTO']).optional().default('AUTO'),
  useKnowledgeBase: z.boolean().optional().default(false),
});

export type ChatRequestDTO = z.infer<typeof ChatRequestSchema>;
