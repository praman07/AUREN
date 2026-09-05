import { IEmbeddingProvider } from '../../interfaces/IEmbeddingProvider';
import { fetch as undiciFetch, Agent } from 'undici';

const customDispatcher = new Agent({
  headersTimeout: 120000,
  bodyTimeout: 120000,
  connectTimeout: 30000
});

const customFetch = (input: any, init?: any) => {
  return undiciFetch(input, {
    ...init,
    dispatcher: customDispatcher
  });
};

export class LlamaCppEmbeddingProvider implements IEmbeddingProvider {
  private baseUrl: string;
  private modelName: string;
  private cachedDimension: number;

  constructor(baseUrl?: string, modelName?: string, dimension?: number) {
    this.baseUrl = baseUrl || process.env.LLAMACPP_EMBEDDING_BASE_URL || process.env.LLAMACPP_BASE_URL || 'http://127.0.0.1:8081';
    this.modelName = modelName || process.env.LLAMACPP_EMBEDDING_MODEL || 'nomic-embed-text.gguf';
    
    const envDim = process.env.LLAMACPP_EMBEDDING_DIM ? parseInt(process.env.LLAMACPP_EMBEDDING_DIM, 10) : undefined;
    this.cachedDimension = dimension || envDim || 768;
  }

  public getDimensions(): number {
    return this.cachedDimension;
  }

  public async embedText(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    if (!results || results.length === 0) {
      throw new Error('LlamaCppEmbeddingProvider returned empty embeddings array');
    }
    return results[0];
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    // Sub-batch size = 16 (supported by physical batch capacity -b 8192) to reduce 27 requests down to 2-3 requests
    const subBatchSize = 16;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += subBatchSize) {
      const subBatch = texts.slice(i, i + subBatchSize);
      const subEmbeddings = await this.embedSubBatch(subBatch);
      allEmbeddings.push(...subEmbeddings);
    }

    return allEmbeddings;
  }

  private async embedSubBatch(texts: string[]): Promise<number[][]> {
    console.log(`[LlamaCppEmbeddingProvider] embedSubBatch called with ${texts.length} texts, total length: ${texts.reduce((acc, t) => acc + t.length, 0)} chars`);
    const cleanBaseUrl = this.baseUrl.replace(/\/$/, '');
    const endpoint = cleanBaseUrl.endsWith('/v1') 
      ? `${cleanBaseUrl}/embeddings`
      : `${cleanBaseUrl}/v1/embeddings`;

    // Truncate texts to 1500 chars (~375 tokens) to guarantee fitting inside llama-server 512 token physical batch limit
    const safeTexts = texts.map(t => t.length > 1500 ? t.slice(0, 1500) : t);

    try {
      const response = await customFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: safeTexts.length === 1 ? safeTexts[0] : safeTexts,
          model: this.modelName
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error(`[LlamaCppEmbeddingProvider] /v1/embeddings returned status ${response.status}: ${errBody}`);
        return await this.embedBatchLegacy(texts, cleanBaseUrl);
      }

      const body = await response.json() as any;
      
      if (body && Array.isArray(body.data)) {
        const embeddings: number[][] = body.data
          .sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0))
          .map((item: any) => item.embedding);

        if (embeddings.length > 0 && embeddings[0]?.length) {
          this.cachedDimension = embeddings[0].length;
        }

        return embeddings;
      }

      throw new Error(`Invalid response structure from llama.cpp embedding endpoint: ${JSON.stringify(body)}`);
    } catch (error: any) {
      console.error('[LlamaCppEmbeddingProvider] Primary endpoint error:', error.message);
      if (error.message && !error.message.includes('legacy endpoint failed')) {
        try {
          return await this.embedBatchLegacy(texts, cleanBaseUrl);
        } catch (legacyErr: any) {
          throw new Error(`LlamaCppEmbeddingProvider failed at ${endpoint}: ${error.message} (Legacy fallback also failed: ${legacyErr.message})`);
        }
      }
      throw new Error(`LlamaCppEmbeddingProvider failed at ${endpoint}: ${error.message}`);
    }
  }

  private async embedBatchLegacy(texts: string[], cleanBaseUrl: string): Promise<number[][]> {
    const legacyEndpoint = cleanBaseUrl.endsWith('/v1')
      ? `${cleanBaseUrl.slice(0, -3)}/embeddings`
      : `${cleanBaseUrl}/embeddings`;

    const results: number[][] = [];

    for (const text of texts) {
      const response = await customFetch(legacyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`legacy endpoint failed with status ${response.status}: ${errText}`);
      }

      const body = await response.json() as any;
      const embedding = body.embedding || body.data?.[0]?.embedding;
      if (!Array.isArray(embedding)) {
        throw new Error(`legacy endpoint returned no embedding array`);
      }
      results.push(embedding);
    }

    if (results.length > 0 && results[0]?.length) {
      this.cachedDimension = results[0].length;
    }

    return results;
  }
}
