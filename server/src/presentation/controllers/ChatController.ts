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

      try {
        await this.ragService.streamChat(
          {
            message: validatedData.message,
            conversationId: validatedData.conversationId,
            organizationId: user.organizationId,
            userId: user.id,
            roleIds: user.roles || [],
            departmentIds: user.departments || [],
            mode: validatedData.mode,
            executionMode: validatedData.executionMode,
            useKnowledgeBase: validatedData.useKnowledgeBase ?? false,
          },
          (event) => {
            if (res.writableEnded) return;
            res.write(`data: ${JSON.stringify(event)}\n\n`);
            if (
              event.type === 'completed' ||
              event.type === 'error' ||
              event.type === 'clarification_required' ||
              event.type === 'retrieval_failure'
            ) {
              res.end();
            }
          }
        );
      } finally {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'completed' })}\n\n`);
          res.end();
        }
      }

    } catch (error: any) {
      if (!res.headersSent) {
        res.status(400).json({ success: false, error: error.message });
      } else if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', data: 'Internal Server Error' })}\n\n`);
        res.end();
      }
    }
  };

  public getConversations = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { prisma } = require('../../infrastructure/database/prisma');
      const conversations = await prisma.chat.findMany({
        where: { userId: user.id, organizationId: user.organizationId },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      res.json({ success: true, conversations });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public getConversationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { prisma } = require('../../infrastructure/database/prisma');
      const conversation = await prisma.chat.findFirst({
        where: { id, userId: user.id, organizationId: user.organizationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!conversation) {
        res.status(404).json({ success: false, error: 'Conversation not found' });
        return;
      }

      res.json({ success: true, conversation });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public updateConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { title } = req.body;
      const { prisma } = require('../../infrastructure/database/prisma');

      const existing = await prisma.chat.findFirst({
        where: { id, userId: user.id, organizationId: user.organizationId }
      });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Conversation not found' });
        return;
      }

      const updated = await prisma.chat.update({
        where: { id },
        data: { title }
      });

      res.json({ success: true, conversation: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public deleteConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { prisma } = require('../../infrastructure/database/prisma');

      const existing = await prisma.chat.findFirst({
        where: { id, userId: user.id, organizationId: user.organizationId }
      });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Conversation not found' });
        return;
      }

      await prisma.message.deleteMany({ where: { chatId: id } });
      await prisma.chat.delete({ where: { id } });

      res.json({ success: true, message: 'Conversation deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public getMemories = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { prisma } = require('../../infrastructure/database/prisma');
      const memories = await prisma.userMemory.findMany({
        where: { userId: user.id, organizationId: user.organizationId },
        orderBy: { updatedAt: 'desc' }
      });
      res.json({ success: true, memories });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public createMemory = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { key, value } = req.body;
      if (!key || !value) {
        res.status(400).json({ success: false, error: 'Key and value are required' });
        return;
      }
      const { prisma } = require('../../infrastructure/database/prisma');
      const memory = await prisma.userMemory.upsert({
        where: {
          userId_key: {
            userId: user.id,
            key,
          }
        },
        update: { value, organizationId: user.organizationId },
        create: {
          userId: user.id,
          organizationId: user.organizationId,
          key,
          value,
        }
      });
      res.json({ success: true, memory });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public deleteMemory = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { prisma } = require('../../infrastructure/database/prisma');

      const existing = await prisma.userMemory.findFirst({
        where: { id, userId: user.id, organizationId: user.organizationId }
      });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Memory item not found' });
        return;
      }

      await prisma.userMemory.delete({ where: { id } });
      res.json({ success: true, message: 'Memory item deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

}
