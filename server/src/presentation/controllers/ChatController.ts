import { Request, Response } from 'express';
import { RAGService } from '../../application/services/RAGService';
import { ChatRequestSchema } from '../../application/dtos/ChatDTO';

export class ChatController {
  constructor(private readonly ragService: RAGService) {}

  public stream = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = ChatRequestSchema.parse(req.body);
      
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // Setup SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      await this.ragService.streamChat(
        {
          message: validatedData.message,
          conversationId: validatedData.conversationId,
          organizationId: user.organizationId,
          userId: user.id,
          departmentIds: validatedData.departmentIds.length > 0 
            ? validatedData.departmentIds 
            : user.departments || []
        },
        (event) => {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
          if (event.type === 'completed' || event.type === 'error') {
            res.end();
          }
        }
      );

    } catch (error: any) {
      if (!res.headersSent) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', data: 'Internal Server Error' })}\n\n`);
        res.end();
      }
    }
  };
}
