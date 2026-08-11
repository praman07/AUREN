import { IEmbeddingProvider } from '../../interfaces/IEmbeddingProvider';
import { env } from '../../../../shared/config/env';

export class OllamaEmbeddingProvider implements IEmbeddingProvider {
  async embedText(text: string): Promise<number[]> {
    const model = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text:latest';
    console.log(`[OllamaEmbeddingProvider] Sending to /api/embed: model='${model}', text='${text.substring(0, 50)}...'`);
    const res = await fetch(`${env.OLLAMA_API_URL || 'http://localhost:11434'}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: text })
    });
    
    if (!res.ok) {
      console.warn(`[OllamaEmbeddingProvider] API error: ${res.statusText}.`);
      throw new Error(`Ollama Embedding Failed: ${res.statusText}`);
    }
    
    const data = (await res.json()) as any;
    return data.embeddings[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      embeddings.push(await this.embedText(text));
    }
    return embeddings;
  }

  getDimensions(): number { return 768; /* nomic-embed-text dimension */ }
}
