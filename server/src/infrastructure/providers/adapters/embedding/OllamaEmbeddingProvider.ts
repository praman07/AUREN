import { IEmbeddingProvider } from '../../interfaces/IEmbeddingProvider';
import { env } from '../../../../shared/config/env';

export class OllamaEmbeddingProvider implements IEmbeddingProvider {
  async embedText(text: string): Promise<number[]> {
    const res = await fetch(`${env.OLLAMA_API_URL || 'http://localhost:11434'}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: env.OLLAMA_MODEL || 'nomic-embed-text', input: text })
    });
    if (!res.ok) {
      console.warn(`[OllamaEmbeddingProvider] API error: ${res.statusText}.`);
      throw new Error(`Ollama Embedding Failed: ${res.statusText}`);
    }
    const data = await res.json();
    return data.embeddings[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const res = await fetch(`${env.OLLAMA_API_URL || 'http://localhost:11434'}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: env.OLLAMA_MODEL || 'nomic-embed-text', input: texts })
    });
    
    if (!res.ok) {
      console.warn(`[OllamaEmbeddingProvider] Batch API error: ${res.statusText}.`);
      throw new Error(`Ollama Batch Embedding Failed: ${res.statusText}`);
    }
    
    const data = await res.json();
    return data.embeddings;
  }

  getDimensions(): number { return 768; /* nomic-embed-text dimension */ }
}

