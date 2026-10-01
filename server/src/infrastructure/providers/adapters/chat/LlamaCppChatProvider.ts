import { IChatProvider, ChatOptions, ChatMessage } from '../../interfaces/IChatProvider';

export { ChatMessage, ChatOptions };

export interface ModelMetadata {
  requestedModel: string;
  actualModel: string;
  mode: 'CHAT';
  isFallback: false;
  provider: string;
  endpoint: string;
}

export interface LlamaCppModelConfig extends ModelMetadata {
  baseUrl: string;
  model: string;
  temperature: number;
  numCtx: number;
  numPredict?: number;
}

function formatMessagesForOpenAI(messages: any[]): Array<{ role: string; content: any }> {
  return (messages || []).map((m) => {
    let role = 'user';
    if (m && typeof m._getType === 'function') {
      const type = m._getType();
      if (type === 'system') role = 'system';
      else if (type === 'human' || type === 'user') role = 'user';
      else if (type === 'ai' || type === 'assistant') role = 'assistant';
    } else if (m && m.role) {
      role = m.role;
    }

    // Support multimodal content (image_url + text parts)
    if (m && Array.isArray(m.content)) {
      return { role, content: m.content };
    }

    const content = typeof m?.content === 'string' ? m.content : String(m?.content || '');
    return { role, content };
  });
}

export async function* streamLlamaCppChat(
  baseUrl: string,
  model: string,
  messages: any[],
  temperature: number = 0.1,
  maxTokens?: number
): AsyncGenerator<{ content: string }, void, unknown> {
  const cleanBaseUrl = baseUrl.endsWith('/v1')
    ? baseUrl
    : `${baseUrl.replace(/\/$/, '')}/v1`;

  const payload: any = {
    model,
    messages: formatMessagesForOpenAI(messages),
    temperature,
    stream: true
  };
  if (maxTokens !== undefined) {
    payload.max_tokens = maxTokens;
  }

  const response = await globalThis.fetch(`${cleanBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer no-key-required'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown server error');
    throw new Error(`llama-server request failed with status ${response.status}: ${errorText}`);
  }

  if (!response.body) {
    throw new Error('llama-server response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let yieldedCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;

        const dataStr = line.slice(5).trim();
        if (!dataStr || dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          const deltaContent = parsed.choices?.[0]?.delta?.content;
          if (typeof deltaContent === 'string' && deltaContent.length > 0) {
            yieldedCount++;
            yield { content: deltaContent };
          }
        } catch {
          // Ignore partial or non-JSON frame lines
        }
      }
    }

    if (buffer.trim()) {
      const line = buffer.trim();
      if (line.startsWith('data:')) {
        const dataStr = line.slice(5).trim();
        if (dataStr && dataStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(dataStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (typeof deltaContent === 'string' && deltaContent.length > 0) {
              yieldedCount++;
              yield { content: deltaContent };
            }
          } catch {}
        }
      }
    }

    if (yieldedCount === 0) {
      console.warn(`[LlamaCppChatProvider] Warning: SSE stream completed with 0 tokens emitted for model ${model}`);
    }
  } finally {
    reader.releaseLock();
  }
}

export class LlamaCppChatProvider implements IChatProvider {
  /**
   * Resolves the single multimodal generation model config.
   *
   * ARCHITECTURE: ONE generation model (Qwen2.5-VL-3B-Instruct Q4_K_M).
   * No FAST/ANALYSIS/DEEP splitting. No silent fallbacks.
   */
  public getModelConfig(options: ChatOptions = {}): LlamaCppModelConfig {
    const baseUrl =
      options.baseUrl ||
      process.env.LLM_BASE_URL ||
      process.env.LLAMACPP_BASE_URL ||
      'http://127.0.0.1:8083';

    const generationModel =
      options.modelName ||
      process.env.GENERATION_MODEL ||
      process.env.LLAMACPP_MODEL ||
      'qwen2.5-vl-3b-instruct';

    const temperature = options.temperature ?? 0.1;
    const numCtx = options.numCtx ?? (Number(process.env.LLAMACPP_NUM_CTX) || 8192);

    return {
      baseUrl,
      model: generationModel,
      requestedModel: generationModel,
      actualModel: generationModel,
      mode: 'CHAT',
      isFallback: false,
      provider: 'llamacpp',
      endpoint: baseUrl,
      temperature,
      numCtx,
      ...(options.numPredict !== undefined ? { numPredict: options.numPredict } : {})
    };
  }

  /**
   * Returns a configured model instance targeting llama-server's OpenAI-compatible HTTP API.
   * Exposes stream() and invoke() methods compatible with KnowledgeGraph and AIGateway.
   */
  public getChatModel(options: ChatOptions = {}): any {
    const config = this.getModelConfig(options);

    return {
      stream: (messages: any[]) => {
        return streamLlamaCppChat(
          config.baseUrl,
          config.model,
          messages,
          config.temperature,
          config.numPredict
        );
      },
      invoke: async (messages: any[]) => {
        let text = '';
        for await (const chunk of streamLlamaCppChat(
          config.baseUrl,
          config.model,
          messages,
          config.temperature,
          config.numPredict
        )) {
          text += chunk.content;
        }
        return { content: text };
      },
      withStructuredOutput: (schema: any) => {
        return {
          invoke: async (messages: any[]) => {
            const rawMessages = Array.isArray(messages) ? [...messages] : [messages];
            let text = '';
            for await (const chunk of streamLlamaCppChat(
              config.baseUrl,
              config.model,
              rawMessages,
              config.temperature,
              config.numPredict
            )) {
              text += chunk.content;
            }

            try {
              const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
              const jsonStr = jsonMatch ? jsonMatch[0] : text;
              const parsed = JSON.parse(jsonStr);
              return schema && typeof schema.parse === 'function' ? schema.parse(parsed) : parsed;
            } catch (err) {
              console.warn(`[LlamaCppChatProvider] withStructuredOutput JSON parsing failed:`, err);
              return {};
            }
          }
        };
      }
    };
  }

  /**
   * Streams chat completion token-by-token using llama-server HTTP SSE.
   */
  public async *streamChat(
    messages: (ChatMessage | any)[],
    options: ChatOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const config = this.getModelConfig(options);

    for await (const chunk of streamLlamaCppChat(
      config.baseUrl,
      config.model,
      messages,
      config.temperature,
      config.numPredict
    )) {
      yield chunk.content;
    }
  }
}
