import { useAuthStore } from '../../../core/auth/store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const getHeaders = (): Record<string, string> => {
  const token = useAuthStore.getState().token || (typeof window !== 'undefined' ? localStorage.getItem('auren_token') : null);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const safeJsonResponse = async (res: Response): Promise<any> => {
  try {
    const text = await res.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
  } catch (e) {
    console.warn('Failed to parse JSON response body:', e);
    return null;
  }
};

export const chatService = {
  async fetchConversations() {
    try {
      const res = await fetch(`${BASE_URL}/chat/conversations`, { headers: getHeaders() });
      if (!res.ok) return [];
      const data = await safeJsonResponse(res);
      if (data && data.success && Array.isArray(data.conversations)) {
        useChatStore.getState().setConversations(data.conversations);
        return data.conversations;
      }
      return [];
    } catch (e) {
      console.error('Error fetching conversations:', e);
      return [];
    }
  },

  async loadConversation(id: string) {
    try {
      const res = await fetch(`${BASE_URL}/chat/conversations/${id}`, { headers: getHeaders() });
      if (!res.ok) return;
      const data = await safeJsonResponse(res);
      if (data && data.success && data.conversation) {
        const formattedMessages = (data.conversation.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt)
        }));
        useChatStore.getState().setMessages(formattedMessages);
        useChatStore.getState().setActiveConversationId(id);
      }
    } catch (e) {
      console.error('Error loading conversation:', e);
    }
  },

  async renameConversation(id: string, title: string) {
    try {
      const res = await fetch(`${BASE_URL}/chat/conversations/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ title })
      });
      if (res.ok) {
        await this.fetchConversations();
      }
    } catch (e) {
      console.error('Error renaming conversation:', e);
    }
  },

  async deleteConversation(id: string) {
    try {
      const res = await fetch(`${BASE_URL}/chat/conversations/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        const { activeConversationId, clearHistory } = useChatStore.getState();
        if (activeConversationId === id) {
          clearHistory();
        }
        await this.fetchConversations();
      }
    } catch (e) {
      console.error('Error deleting conversation:', e);
    }
  },

  async fetchMemories() {
    try {
      const res = await fetch(`${BASE_URL}/chat/memories`, { headers: getHeaders() });
      if (!res.ok) return [];
      const data = await safeJsonResponse(res);
      if (data && data.success && Array.isArray(data.memories)) {
        useChatStore.getState().setMemories(data.memories);
        return data.memories;
      }
      return [];
    } catch (e) {
      console.error('Error fetching memories:', e);
      return [];
    }
  },

  async createMemory(key: string, value: string) {
    try {
      const res = await fetch(`${BASE_URL}/chat/memories`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        await this.fetchMemories();
      }
    } catch (e) {
      console.error('Error creating memory:', e);
    }
  },

  async deleteMemory(id: string) {
    try {
      const res = await fetch(`${BASE_URL}/chat/memories/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        await this.fetchMemories();
      }
    } catch (e) {
      console.error('Error deleting memory:', e);
    }
  },

  async streamChat(message: string) {
    const { user } = useAuthStore.getState();
    const { addMessage, appendStreamChunk, finalizeStream, setStreaming, activeConversationId, activeMode, executionMode, useKnowledgeBase, setActiveConversationId } = useChatStore.getState();
    
    if (!user) {
      console.error('No authenticated user found for chat');
      return;
    }

    addMessage({ role: 'user', content: message });
    addMessage({ role: 'assistant', content: '' });
    setStreaming(true);

    try {
      const res = await fetch(`${BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          message,
          organizationId: user.organizationId,
          conversationId: activeConversationId || undefined,
          mode: activeMode,
          executionMode: executionMode,
          useKnowledgeBase: useKnowledgeBase,
        })
      });

      if (!res.ok) {
        const errorData = await safeJsonResponse(res);
        const errorMessage = errorData?.error || `Request failed with status ${res.status}`;
        throw new Error(errorMessage);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error('No readable stream received from server');

      let sources: any[] | undefined = undefined;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;

          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            switch (event.type) {
              case 'retrieval_started':
                if (event.data?.conversationId) {
                  setActiveConversationId(event.data.conversationId);
                  this.fetchConversations();
                }
                break;
              case 'clarification_required':
                if (event.data) {
                  useChatStore.getState().setClarification(event.data);
                  useChatStore.getState().finalizeStream();
                }
                return;

              case 'token':
                if (typeof event.data === 'string') {
                  appendStreamChunk(event.data);
                }
                break;
              case 'sources':
                if (Array.isArray(event.data)) {
                  sources = event.data;
                }
                break;
              case 'completed':
                finalizeStream(sources);
                this.fetchConversations();
                return;
              case 'error':
                const errText = typeof event.data === 'string' ? event.data : 'An unknown error occurred';
                appendStreamChunk(`\n\n[Error: ${errText}]`);
                finalizeStream(sources);
                return;
              case 'tool_call':
                if (event.data) {
                  useChatStore.getState().setToolCall(event.data);
                }
                break;
              case 'tool_result':
                if (event.data) {
                  useChatStore.getState().setToolResult(event.data);
                }
                break;
              case 'searching_web_started':
              case 'searching_web':
                useChatStore.getState().setToolCall({
                  name: 'web_search',
                  query: event.data?.query,
                  status: 'running',
                  stepLabel: `Searching the web... (Iteration ${event.data?.iteration || 1})`
                });
                break;
              case 'searching_web_completed':
                // Search phase complete, transitioning to extraction/evaluation
                break;
              case 'crawling_started':
              case 'crawling_sources':
                useChatStore.getState().setToolCall({
                  name: 'web_search',
                  status: 'running',
                  stepLabel: `Crawling & extracting content from ${event.data?.count || 0} sources...`
                });
                break;
              case 'crawling_completed':
              case 'evidence_extracted':
                useChatStore.getState().setToolCall({
                  name: 'web_search',
                  status: 'running',
                  stepLabel: `Extracted relevant evidence from ${event.data?.extractedCount ?? 0} pages`
                });
                break;
              case 'evaluating_evidence_started':
              case 'evaluating_evidence':
                useChatStore.getState().setToolCall({
                  name: 'web_search',
                  status: 'running',
                  stepLabel: `Evaluating evidence sufficiency (Iteration ${event.data?.iteration || 1})...`
                });
                break;
              case 'evaluating_evidence_completed':
                if (event.data?.decision === 'RESEARCH_GAP_FOUND') {
                  useChatStore.getState().setToolCall({
                    name: 'web_search',
                    status: 'running',
                    stepLabel: `Information gap found: ${event.data.gap || 'Refining query'}...`
                  });
                }
                break;
              case 'search_query_generated':
                useChatStore.getState().setToolCall({
                  name: 'web_search',
                  query: event.data?.refinedQuery,
                  status: 'running',
                  stepLabel: `Refining query for iteration ${event.data?.iteration || 2}: "${event.data?.refinedQuery || ''}"`
                });
                break;
              case 'synthesis_started':
                {
                  const lastMsg = useChatStore.getState().messages.slice(-1)[0];
                  const hasInternalSources = Array.isArray(sources) && sources.some(s => s.type === 'internal' || !!s.documentId);
                  const existingToolName = lastMsg?.activeTool?.name;

                  let targetTool: string | null = null;
                  if (existingToolName === 'internal_knowledge' || hasInternalSources) {
                    targetTool = 'internal_knowledge';
                  } else if (existingToolName === 'web_search' || (Array.isArray(sources) && sources.some(s => s.type === 'web' || !!s.url))) {
                    targetTool = 'web_search';
                  } else if (existingToolName) {
                    targetTool = existingToolName;
                  }

                  if (targetTool) {
                    useChatStore.getState().setToolCall({
                      name: targetTool,
                      status: 'completed',
                      stepLabel: 'Synthesizing final answer from retrieved evidence...'
                    });
                  }
                }
                break;
            }
          } catch (e) {
            console.warn('Failed to parse SSE line:', jsonStr, e);
          }
        }
      }

      if (buffer.trim().startsWith('data:')) {
        const jsonStr = buffer.trim().slice(5).trim();
        if (jsonStr) {
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'token' && typeof event.data === 'string') {
              appendStreamChunk(event.data);
            } else if (event.type === 'sources' && Array.isArray(event.data)) {
              sources = event.data;
            }
          } catch (_) {}
        }
      }

      finalizeStream(sources);
      this.fetchConversations();
    } catch (error: any) {
      console.error('Chat stream error:', error);
      appendStreamChunk(`\n\n[Error: ${error.message || 'Failed to communicate with AUREN AI'}]`);
      finalizeStream();
    }
  }
};


