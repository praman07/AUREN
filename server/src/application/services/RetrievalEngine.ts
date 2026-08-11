import { SearchRequest, SearchResponse, ContextWindow, PromptContext } from '../../domain/retrieval/types';
import { VectorSearchProvider } from '../../infrastructure/search/VectorSearchProvider';
import { BM25SearchProvider } from '../../infrastructure/search/BM25SearchProvider';
import { HybridRanker } from '../../domain/retrieval/HybridRanker';
import { ContextBuilder } from '../../domain/retrieval/ContextBuilder';
import { PromptBuilder } from '../../domain/retrieval/PromptBuilder';
import { prisma } from '../../infrastructure/database/prisma';

export interface IRetrievalEngine {
  search(request: SearchRequest): Promise<SearchResponse>;
  buildPrompt(request: SearchRequest): Promise<PromptContext>;
}

export class RetrievalEngine implements IRetrievalEngine {
  constructor(
    private vectorSearch: VectorSearchProvider,
    private keywordSearch: BM25SearchProvider,
    private ranker: HybridRanker,
    private contextBuilder: ContextBuilder,
    private promptBuilder: PromptBuilder
  ) {}

  public async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();

    // 1. Concurrent Execution of Semantic and Lexical Search
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorSearch.search(request),
      this.keywordSearch.search(request)
    ]);

    // 2. Hybrid Ranking & Deduplication
    const rankedChunks = this.ranker.rankAndMerge(vectorResults, keywordResults, request.limit);

    // 3. Enrich with Document Metadata
    const documentIds = [...new Set(rankedChunks.map(c => c.documentId))];
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        organizationId: request.organizationId
      },
      select: {
        id: true,
        title: true
      }
    });

    const docMap = new Map(documents.map(d => [d.id, d.title]));

    const enrichedChunks = rankedChunks.map(chunk => {
      chunk.metadata = chunk.metadata || {};
      chunk.metadata.documentTitle = docMap.get(chunk.documentId) || 'Unknown Document';
      return chunk;
    });

    return {
      chunks: enrichedChunks,
      totalFound: enrichedChunks.length,
      executionTimeMs: Date.now() - startTime
    };
  }

  public async buildPrompt(request: SearchRequest): Promise<PromptContext> {
    // 1. Retrieve & Rank
    const searchResponse = await this.search(request);

    // 2. Build Context Window (merge, format, truncate)
    const contextWindow = this.contextBuilder.buildContextWindow(searchResponse.chunks, 3000);

    // 3. Construct Final Prompt Context
    return this.promptBuilder.build(
      request.query, 
      contextWindow,
      'You are EKOS Knowledge Assistant. Answer the user question based strictly on the provided CONTEXT.'
    );
  }
}
