import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { RAGService } from '../../application/services/RAGService';
import { RetrievalEngine } from '../../application/services/RetrievalEngine';
import { requireAuth } from '../middlewares/requireAuth';
import { VectorSearchProvider } from '../../infrastructure/search/VectorSearchProvider';
import { BM25SearchProvider } from '../../infrastructure/search/BM25SearchProvider';
import { HybridRanker } from '../../domain/retrieval/HybridRanker';
import { ContextBuilder } from '../../domain/retrieval/ContextBuilder';
import { PromptBuilder } from '../../domain/retrieval/PromptBuilder';
import { ProviderFactory } from '../../infrastructure/providers/registry/ProviderFactory';
import { PermissionFilter } from '../../infrastructure/search/PermissionFilter';
import { AIGateway } from '../../infrastructure/providers/gateway/AIGateway';

const router = Router();

const providerFactory = new ProviderFactory();
const aiGateway = new AIGateway(providerFactory);
const permissionFilter = new PermissionFilter();

const vectorSearch = new VectorSearchProvider(providerFactory, permissionFilter, aiGateway);
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

const ragService = new RAGService(retrievalEngine, aiGateway);
const chatController = new ChatController(ragService);

router.post('/stream', requireAuth, chatController.stream);

export default router;
