import { env } from '../../../../shared/config/env';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatStreamChunk {
  content: string;
}

export class OllamaChatProvider {
  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    const res = await fetch(`${env.OLLAMA_API_URL || 'http://localhost:11434'}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL || 'qwen2.5:14b',
        messages: messages,
        stream: true
      })
    });

    if (!res.ok) throw new Error(`Ollama Chat Error: ${res.statusText}`);
    
    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n').filter(l => l.trim() !== '');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            yield parsed.message.content;
          }
        } catch (e) {
          // ignore parse errors for partial chunks
        }
      }
    }
  }
}
