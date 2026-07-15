import { z } from 'zod';

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000, "Message too long"),
  conversationId: z.string().uuid().optional(),
  departmentIds: z.array(z.string()).optional().default([]), // For scoping
});

export type ChatRequestDTO = z.infer<typeof ChatRequestSchema>;
