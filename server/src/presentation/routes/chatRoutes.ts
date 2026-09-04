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
import { AIGateway } from '../../infrastructure/gateway/AIGateway';

import { providerFactory, aiGateway } from '../../di';

const router = Router();

import { DuckDuckGoSearchProvider } from '../../infrastructure/search/WebSearchProvider';
import { DateTimeProvider } from '../../infrastructure/tools/DateTimeProvider';

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

const webSearchProvider = new DuckDuckGoSearchProvider();
const dateTimeProvider = new DateTimeProvider();

const ragService = new RAGService();
const chatController = new ChatController(ragService);

router.post('/stream', requireAuth, chatController.stream);

// Conversation CRUD endpoints
router.get('/conversations', requireAuth, chatController.getConversations);
router.get('/conversations/:id', requireAuth, chatController.getConversationById);
router.patch('/conversations/:id', requireAuth, chatController.updateConversation);
router.delete('/conversations/:id', requireAuth, chatController.deleteConversation);

// User Memory management endpoints
router.get('/memories', requireAuth, chatController.getMemories);
router.post('/memories', requireAuth, chatController.createMemory);
router.delete('/memories/:id', requireAuth, chatController.deleteMemory);

export default router;

