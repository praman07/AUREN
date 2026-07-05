import { RetrievedChunk, SearchRequest } from '../../domain/retrieval/types';
import { PermissionFilter } from './PermissionFilter';
import { ProviderFactory } from '../providers/registry/ProviderFactory';

export class VectorSearchProvider {
  constructor(
    private permissionFilter: PermissionFilter,
    private providerFactory: ProviderFactory
  ) {}

  public async search(request: SearchRequest): Promise<RetrievedChunk[]> {
    const filter = this.permissionFilter.buildVectorFilter(request);
    // 1. Embed query
    const embeddingProvider = this.providerFactory.getEmbeddingProvider();
    const queryVector = await embeddingProvider.embedText(request.query);
    
    // 2. Search vector store
    const vectorStore = this.providerFactory.getVectorStoreProvider();
    const results = await vectorStore.search('chunks', queryVector, request.limit, filter);
    
    // Translate provider results to RetrievedChunk
    return results.map(r => ({
      id: r.id,
      documentId: r.payload.documentId,
      content: r.payload.content,
      score: r.score,
      vectorScore: r.score,
      keywordScore: 0,
      metadata: r.payload.metadata
    }));
  }
}
