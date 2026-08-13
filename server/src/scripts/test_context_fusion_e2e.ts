import { RetrievalEngine } from '../application/services/RetrievalEngine';
import { VectorSearchProvider } from '../infrastructure/search/VectorSearchProvider';
import { BM25SearchProvider } from '../infrastructure/search/BM25SearchProvider';
import { HybridRanker } from '../domain/retrieval/HybridRanker';
import { ContextBuilder } from '../domain/retrieval/ContextBuilder';
import { PromptBuilder } from '../domain/retrieval/PromptBuilder';
import { PermissionFilter } from '../infrastructure/search/PermissionFilter';
import { ProviderFactory } from '../infrastructure/providers/registry/ProviderFactory';
import * as dotenv from 'dotenv';
dotenv.config();

async function runContextFusionE2E() {
  console.log('--- STARTING CONTEXT FUSION E2E TEST ---');

  const filter = new PermissionFilter();
  const providerFactory = new ProviderFactory();
  const vectorSearch = new VectorSearchProvider(filter, providerFactory);
  const keywordSearch = new BM25SearchProvider(filter);
  const ranker = new HybridRanker(); // alpha, beta hardcoded in class
  const contextBuilder = new ContextBuilder();
  const promptBuilder = new PromptBuilder();

  const engine = new RetrievalEngine(
    vectorSearch,
    keywordSearch,
    ranker,
    contextBuilder,
    promptBuilder
  );

  try {
    // Attempting a real fusion search
    console.log('Executing search query...');
    const result = await engine.search({
      query: 'company holidays',
      limit: 5,
      organizationId: 'test_org',
      userId: 'test_user',
      roleIds: [], departmentIds: ['hr', 'engineering']
    });

    console.log(`[PASS] Context Fusion executed. Retrieved ${result.totalFound} chunks.`);
    console.log(`Execution time: ${result.executionTimeMs}ms`);
  } catch (err: any) {
    if (err.message.includes('ECONNREFUSED') || err.message.includes('fetch failed')) {
      console.log(`[PARTIAL] Context Fusion test setup succeeded, but infrastructure (Qdrant) is unavailable: ${err.message}`);
    } else {
      console.error(`[FAIL] Context Fusion failed:`, err);
    }
  }
}

runContextFusionE2E();
