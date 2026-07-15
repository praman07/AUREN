import { SearchRequest, SearchResponse, ContextWindow, PromptContext } from '../../domain/retrieval/types';
import { VectorSearchProvider } from '../../infrastructure/search/VectorSearchProvider';
import { BM25SearchProvider } from '../../infrastructure/search/BM25SearchProvider';
import { HybridRanker } from '../../domain/retrieval/HybridRanker';
import { ContextBuilder } from '../../domain/retrieval/ContextBuilder';
import { PromptBuilder } from '../../domain/retrieval/PromptBuilder';

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

    return {
      chunks: rankedChunks,
      totalFound: rankedChunks.length,
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
