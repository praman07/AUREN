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

      const userDepartments = user.departments || [];
      const explicitDepartments = validatedData.departmentIds;
      let finalDepartmentIds: string[] = [];

      if (explicitDepartments.length > 0) {
        // Prevent IDOR: Ensure explicit departments are a subset of user's allowed departments
        finalDepartmentIds = explicitDepartments.filter((id: string) => userDepartments.includes(id));
        if (finalDepartmentIds.length !== explicitDepartments.length) {
          res.status(403).json({ success: false, error: 'Forbidden: Access to one or more requested departments is denied.' });
          return;
        }
      } else {
        finalDepartmentIds = userDepartments;
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
          userId: req.user!.id,
          roleIds: req.user!.roles,
          departmentIds: req.user!.departments
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
