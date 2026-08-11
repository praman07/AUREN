import { useAuthStore } from '../../../core/auth/store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const chatService = {
  async streamChat(message: string) {
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
      // Mocking the token for now since actual auth syncing is pending or uses Clerk
      const authPayload = { id: user.id, organizationId: user.organizationId, role: user.role, clearanceLevel: user.clearanceLevel };
      const token = btoa(JSON.stringify(authPayload));

      const res = await fetch(`${BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          organizationId: user.organizationId
        })
      });

      if (!res.ok) {
        throw new Error('Failed to start chat stream');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error('No readable stream');

      let sources: any[] | undefined = undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        // Depending on backend implementation, it might emit raw text or SSE events.
        // We will just append the raw text as standard for our test script output.
        // If it outputs sources in a specific format, we can parse it here.
        appendStreamChunk(chunk);
      }

      finalizeStream(sources);
    } catch (error) {
      console.error('Chat stream error:', error);
      appendStreamChunk('\n\n[Error: Failed to communicate with AUREN AI]');
      finalizeStream();
    }
  }
};
