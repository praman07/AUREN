import { prisma } from '../../infrastructure/database/prisma';
import { KnowledgeGraph } from '../../ai/graph/KnowledgeGraph';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { sanitizeMetadataForTracing } from '../../ai/observability/langsmith';

export interface RAGRequest {
  message: string;
  conversationId?: string;
  organizationId: string;
  userId: string;
  departmentIds: string[];
  roleIds: string[];
  mode?: 'hybrid' | 'local';
  executionMode?: 'FAST' | 'DEEP' | 'AUTO';
  useKnowledgeBase?: boolean;
}

export interface ChatStreamEvent {
  type:
    | 'retrieval_started'
    | 'sources'
    | 'token'
    | 'completed'
    | 'error'
    | 'tool_call'
    | 'tool_result'
    | 'graph_started'
    | 'llm_started'
    | 'intent_detected'
    | 'intent_classified'
    | 'node_execution'
    | 'context_passed_to_llm'
    | 'research_started'
    | 'research_iteration'
    | 'searching_web'
    | 'searching_web_started'
    | 'searching_web_completed'
    | 'crawling_sources'
    | 'crawling_started'
    | 'crawling_completed'
    | 'evidence_extracted'
    | 'evaluating_evidence'
    | 'evaluating_evidence_started'
    | 'evaluating_evidence_completed'
    | 'search_query_generated'
    | 'synthesis_started'
    | 'synthesis_completed'
    | 'research_complete'
    | 'research_failed'
    | 'clarification_required'
    | 'retrieval_failure'
    | 'rlm_started'
    | 'rlm_step'
    | 'rlm_completed'
    | 'rlm_fallback';
  data?: any;
}

export class RAGService {
  public async streamChat(request: RAGRequest, onEvent: (event: ChatStreamEvent) => void): Promise<void> {
    try {
      const mode = (request.mode || 'hybrid').toUpperCase() as 'LOCAL' | 'HYBRID';

      // 1. Fetch Organization settings for Web Access Policy
      const org = await prisma.organization.findUnique({
        where: { id: request.organizationId },
        select: { webAccessEnabled: true }
      });
      const isWebAccessEnabled = org ? org.webAccessEnabled !== false : true;

      // 2. Fetch User & Roles for Zero-Trust Auth Context
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: { isSuperAdmin: true, departmentId: true, firstName: true, lastName: true, email: true }
      });

      const userRoles = await prisma.userRole.findMany({
        where: { userId: request.userId },
        select: { roleId: true }
      });

      const userName = user?.firstName || user?.lastName
        ? [user.firstName, user.lastName].filter(Boolean).join(' ')
        : undefined;

      const authContext = {
        organizationId: request.organizationId,
        userId: request.userId,
        userName,
        email: user?.email || undefined,
        roles: userRoles.map(r => r.roleId),
        departmentId: user?.departmentId || undefined,
        isSuperAdmin: user?.isSuperAdmin || false,
      };

      // 3. Initialize or verify Conversation Chat ID
      let chatId = request.conversationId;
      let isNewChat = false;
      let chatTitle = request.message.substring(0, 50);

      if (!chatId) {
        isNewChat = true;
        const chat = await prisma.chat.create({
          data: {
            title: chatTitle,
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
        chatTitle = chat.title;
      }

      // Emit conversation metadata event to client
      onEvent({
        type: 'retrieval_started',
        data: { conversationId: chatId, title: chatTitle, isNew: isNewChat }
      });

      // 4. Log User Message to Database
      await prisma.message.create({
        data: {
          chatId,
          userId: request.userId,
          organizationId: request.organizationId,
          role: 'user',
          content: request.message
        }
      });

      // 5. Load Chat History from Database
      const history = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'asc' },
        take: 20
      });

      const messages = history.slice(0, -1).map(m => {
        return m.role === 'user'
          ? new HumanMessage(m.content)
          : new AIMessage(m.content);
      });

      // 5b. Load User Long-Term Memories
      const memories = await prisma.userMemory.findMany({
        where: { userId: request.userId, organizationId: request.organizationId },
        take: 20,
        orderBy: { updatedAt: 'desc' },
      });
      const userMemories = memories.map((m: any) => ({ key: m.key, value: m.value }));

      // 6. Build and Execute LangGraph StateGraph Workflow
      const compiledGraph = KnowledgeGraph.buildGraph({
        onEvent: (evt) => onEvent(evt as ChatStreamEvent)
      });

      const graphResult = (await compiledGraph.invoke({
        messages,
        userQuery: request.message,
        authContext,
        mode,
        isWebAccessEnabled,
        useKnowledgeBase: request.useKnowledgeBase ?? false,
        internalDocs: [],
        webResults: [],
        userMemories,
        citations: [],
        finalAnswer: '',
        executionMode: request.executionMode || 'AUTO'
      }, {
        configurable: {
          metadata: sanitizeMetadataForTracing({
            organizationId: request.organizationId,
            userId: request.userId,
            requestId: chatId,
            mode,
            webAccessEnabled: isWebAccessEnabled
          })
        }
      })) as import('../../ai/graph/GraphState').AURENGraphState;

      // 7. Save Assistant Message to Database
      if (graphResult.isAmbiguous && graphResult.clarificationQuestion) {
        await prisma.message.create({
          data: {
            chatId,
            userId: null,
            organizationId: request.organizationId,
            role: 'assistant',
            content: graphResult.clarificationQuestion
          }
        });
      } else if (!graphResult.isAmbiguous && graphResult.finalAnswer) {
        await prisma.message.create({
          data: {
            chatId,
            userId: null,
            organizationId: request.organizationId,
            role: 'assistant',
            content: graphResult.finalAnswer
          }
        });
      }

      // 8. Update Chat updatedAt timestamp
      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() }
      }).catch(() => {});

      // 9. Log Audit Log Event
      await prisma.auditLog.create({
        data: {
          organizationId: request.organizationId,
          actorId: request.userId,
          action: 'READ' as any,
          resourceId: chatId,
          metadata: {
            engine: 'LangGraph',
            intentCategory: graphResult.intentCategory,
            isAmbiguous: graphResult.isAmbiguous || false,
            internalDocsCount: graphResult.internalDocs?.length || 0,
            webResultsCount: graphResult.webResults?.length || 0,
            mode
          }
        }
      });

    } catch (error: any) {
      console.error('[RAGService-LangGraph Error]:', error);
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
