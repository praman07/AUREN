import { Router } from 'express';
import { SemanticSearchController } from '../controllers/SemanticSearchController';
import { RetrievalEngine } from '../../application/services/RetrievalEngine';
import { requireAuth } from '../middlewares/requireAuth';
import { VectorSearchProvider } from '../../infrastructure/search/VectorSearchProvider';
import { BM25SearchProvider } from '../../infrastructure/search/BM25SearchProvider';
import { HybridRanker } from '../../domain/retrieval/HybridRanker';
import { ContextBuilder } from '../../domain/retrieval/ContextBuilder';
import { PromptBuilder } from '../../domain/retrieval/PromptBuilder';
import { ProviderFactory } from '../../infrastructure/providers/registry/ProviderFactory';
import { PermissionFilter } from '../../infrastructure/search/PermissionFilter';
import { AIGateway } from '../../infrastructure/gateway/AIGateway';

import { providerFactory, aiGateway } from '../../di';

const router = Router();

// DI Setup
const permissionFilter = new PermissionFilter();

const vectorSearch = new VectorSearchProvider(permissionFilter, providerFactory);
const bm25Search = new BM25SearchProvider(permissionFilter);
const ranker = new HybridRanker();
const contextBuilder = new ContextBuilder();
const promptBuilder = new PromptBuilder();

const retrievalEngine = new RetrievalEngine(
  vectorSearch,
  bm25Search,
  ranker,
  contextBuilder,
  promptBuilder
);

const semanticSearchController = new SemanticSearchController(retrievalEngine);

// Routes
router.post('/search', requireAuth, semanticSearchController.search);

export default router;
