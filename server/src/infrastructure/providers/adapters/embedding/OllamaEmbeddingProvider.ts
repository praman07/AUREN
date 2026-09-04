import { IEmbeddingProvider } from '../../interfaces/IEmbeddingProvider';
import { env } from '../../../../shared/config/env';

export class OllamaEmbeddingProvider implements IEmbeddingProvider {
  private cachedDimension: number | null = null;

  async embedText(text: string): Promise<number[]> {
    const model = process.env.OLLAMA_EMBEDDING_MODEL || env.OLLAMA_EMBEDDING_MODEL || 'qwen3-embedding:8b';
    const ollamaUrl = process.env.OLLAMA_EMBEDDING_URL || process.env.OLLAMA_API_URL || process.env.OLLAMA_BASE_URL || env.OLLAMA_API_URL || 'http://127.0.0.1:11434';
    console.log(`[OllamaEmbeddingProvider] Sending to /api/embed: model='${model}', text='${text.substring(0, 50)}...'`);
    try {
      const res = await fetch(`${ollamaUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input: text })
      });

      if (!res.ok) {
        console.warn(`[OllamaEmbeddingProvider] API error ${res.status}: ${res.statusText}`);
        throw new Error(`Ollama embedding HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as any;
      let embedding = Array.isArray(data.embeddings) && data.embeddings.length > 0 ? data.embeddings[0] : data.embedding;

      // Fallback to legacy /api/embeddings if /api/embed returned empty embeddings array
      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        console.warn(`[OllamaEmbeddingProvider] /api/embed returned empty embeddings, falling back to /api/embeddings endpoint...`);
        const legacyRes = await fetch(`${ollamaUrl}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt: text })
        });
        if (legacyRes.ok) {
          const legacyData = (await legacyRes.json()) as any;
          embedding = legacyData.embedding;
        }
      }

      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        throw new Error(`Ollama embedding endpoint returned empty vector for model '${model}' (input len=${text.length}): ${JSON.stringify(data)}`);
      }
      this.cachedDimension = embedding.length;
      return embedding;
    } catch (err: any) {
      if (err.message?.startsWith('Ollama embedding')) throw err; // already wrapped
      console.error(`[OllamaEmbeddingProvider] fetch failed (is Ollama running?): ${err.message}`);
      throw new Error(`Ollama unreachable at ${ollamaUrl} — is Ollama running? (${err.message})`);
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      // Qwen embedding model requires non-empty text and benefits from task instruction prefix
      const cleanText = text && text.trim().length > 0 ? text.trim() : 'Document content snippet';
      embeddings.push(await this.embedText(cleanText));
    }
    return embeddings;
  }

  getDimensions(): number {
    if (this.cachedDimension) return this.cachedDimension;
    const model = process.env.OLLAMA_EMBEDDING_MODEL || env.OLLAMA_EMBEDDING_MODEL || 'qwen3-embedding:8b';
    if (model.includes('qwen3-embedding')) return 4096;
    return 768;
  }
}
