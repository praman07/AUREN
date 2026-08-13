import { useAuthStore } from '../../../core/auth/store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const chatService = {
  async streamChat(message: string, customToken?: string) {
    const { user } = useAuthStore.getState();
    const { addMessage, appendStreamChunk, finalizeStream, setStreaming } = useChatStore.getState();
    
    if (!user) {
      console.error('No authenticated user found for chat');
      return;
    }

    addMessage({ role: 'user', content: message });
    addMessage({ role: 'assistant', content: '' });
    setStreaming(true);

    try {
      // 1. Resolve Bearer token from auth store or saved token
      let token: string | null = customToken || useAuthStore.getState().token || (typeof window !== 'undefined' ? localStorage.getItem('auren_token') : null);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          organizationId: user.organizationId
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
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
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;

          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            switch (event.type) {
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
                return;
              case 'error':
                const errText = typeof event.data === 'string' ? event.data : 'An unknown error occurred';
                appendStreamChunk(`\n\n[Error: ${errText}]`);
                finalizeStream(sources);
                return;
              default:
                break;
            }
          } catch (e) {
            console.warn('Failed to parse SSE line:', jsonStr, e);
          }
        }
      }

      // Process any remaining complete line in buffer
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
    } catch (error: any) {
      console.error('Chat stream error:', error);
      appendStreamChunk(`\n\n[Error: ${error.message || 'Failed to communicate with AUREN AI'}]`);
      finalizeStream();
    }
  }
};

