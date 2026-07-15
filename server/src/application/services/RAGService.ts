import { IRetrievalEngine } from './RetrievalEngine';
import { AIGateway } from '../../infrastructure/providers/gateway/AIGateway';
import { prisma } from '../../infrastructure/database/prisma';

export interface RAGRequest {
  message: string;
  conversationId?: string;
  organizationId: string;
  userId: string;
  departmentIds: string[];
}

export interface ChatStreamEvent {
  type: 'retrieval_started' | 'sources' | 'token' | 'completed' | 'error';
  data?: any;
}

export class RAGService {
  constructor(
    private readonly retrievalEngine: IRetrievalEngine,
    private readonly aiGateway: AIGateway
  ) {}

  public async streamChat(request: RAGRequest, onEvent: (event: ChatStreamEvent) => void): Promise<void> {
    try {
      // 1. Initialize or verify Conversation
      let chatId = request.conversationId;
      if (!chatId) {
        const chat = await prisma.chat.create({
          data: {
            title: request.message.substring(0, 50),
            userId: request.userId,
            organizationId: request.organizationId,
          }
        });
        chatId = chat.id;
      } else {
        const chat = await prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat || chat.organizationId !== request.organizationId) {
          throw new Error('Unauthorized conversation access');
        }
      }

      // 2. Log user message
      await prisma.message.create({
        data: {
          chatId,
          userId: request.userId,
          organizationId: request.organizationId,
          role: 'user',
          content: request.message
        }
      });

      // 3. Retrieval
      onEvent({ type: 'retrieval_started' });
      const promptContext = await this.retrievalEngine.buildPrompt({
        query: request.message,
        organizationId: request.organizationId,
        userId: request.userId,
        departmentIds: request.departmentIds,
        limit: 10
      });

      // Emit sources
      // Parse context block or retrieve original chunks to send as sources
      // The RetrievalEngine abstracted chunks into context block, but we need deterministic citations.
      // We will extract chunk metadata from the search response.
      const searchResponse = await this.retrievalEngine.search({
        query: request.message,
        organizationId: request.organizationId,
        userId: request.userId,
        departmentIds: request.departmentIds,
        limit: 10
      });
      
      const sources = searchResponse.chunks.map(c => ({
        documentId: c.documentId,
        page: c.metadata?.pageNumbers,
        title: c.metadata?.sectionTitle,
        chunkId: c.id
      }));

      onEvent({ type: 'sources', data: sources });

      // 4. Call AIGateway
      // Simulate historical context
      const history = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'asc' },
        take: 10
      });

      const messages = history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      
      // Override the last user message to include the prompt context (Zero-Trust Retrieval)
      messages[messages.length - 1].content = promptContext.fullPrompt;

      let fullResponse = '';

      const stream = await this.aiGateway.streamChat({
        messages,
        context: {
          organizationId: request.organizationId,
          userId: request.userId,
          documentId: undefined
        }
      });

      for await (const chunk of stream) {
        fullResponse += chunk;
        onEvent({ type: 'token', data: chunk });
      }

      // 5. Save assistant response
      await prisma.message.create({
        data: {
          chatId,
          userId: null,
          organizationId: request.organizationId,
          role: 'assistant',
          content: fullResponse
        }
      });

      onEvent({ type: 'completed', data: { conversationId: chatId } });

      // 6. Audit Logging
      await prisma.auditLog.create({
        data: {
          organizationId: request.organizationId,
          actorId: request.userId,
          action: 'READ' as any, // Simplified for now, in a real app use CHAT_COMPLETED
          resourceId: chatId,
          metadata: {
            sourcesCount: sources.length
          }
        }
      });

    } catch (error: any) {
      console.error('RAG Error:', error);
      onEvent({ type: 'error', data: error.message });
      
      await prisma.auditLog.create({
        data: {
          organizationId: request.organizationId,
          actorId: request.userId,
          action: 'READ' as any,
          metadata: { error: error.message }
        }
      });
    }
  }
}
