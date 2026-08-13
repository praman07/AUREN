import { DocumentRepository } from './infrastructure/repositories/DocumentRepository';
import { DocumentVersionRepository } from './infrastructure/repositories/DocumentVersionRepository';
import { AuditLogRepository } from './infrastructure/repositories/AuditLogRepository';
import { UserRepository } from './infrastructure/repositories/UserRepository';
import { DepartmentRepository } from './infrastructure/repositories/DepartmentRepository';
import { UnitOfWork } from './infrastructure/database/UnitOfWork';
import { LocalStorageProvider } from './infrastructure/storage/LocalStorageProvider';
import { QueueManager } from './infrastructure/queue/QueueManager';
import { PipelineStatusService } from './application/services/PipelineStatusService';
import { DocumentProcessingOrchestrator } from './application/services/DocumentProcessingOrchestrator';
import { LocalEventPublisher } from './infrastructure/events/LocalEventPublisher';
import { UploadService } from './application/services/UploadService';
import { DocumentService } from './application/services/DocumentService';
import { UserService } from './application/services/UserService';
import { ProviderFactory } from './infrastructure/providers/registry/ProviderFactory';
import { OcrService } from './application/services/OcrService';
import { ChunkingService } from './application/services/ChunkingService';
import { EmbeddingService } from './application/services/EmbeddingService';
import { QdrantIndexingService } from './application/services/QdrantIndexingService';
import { WorkerManager } from './infrastructure/queue/WorkerManager';
import { AIGateway } from './infrastructure/gateway/AIGateway';
import { ConnectorRegistry } from './application/connectors/ConnectorRegistry';
import { GitHubConnector } from './infrastructure/connectors/GitHubConnector';
import { GmailConnector } from './infrastructure/connectors/GmailConnector';
import { NotionConnector } from './infrastructure/connectors/NotionConnector';
import { ConnectorService } from './application/connectors/ConnectorService';

// Repositories
export const documentRepository = new DocumentRepository();
export const documentVersionRepository = new DocumentVersionRepository();
export const auditLogRepository = new AuditLogRepository();
export const userRepository = new UserRepository();
export const departmentRepository = new DepartmentRepository();
export const unitOfWork = new UnitOfWork();
export const storageProvider = new LocalStorageProvider();

// Infrastructure
export const queueManager = new QueueManager();
export const providerFactory = new ProviderFactory();
export const aiGateway = new AIGateway(providerFactory);
export const pipelineStatusService = new PipelineStatusService(auditLogRepository, unitOfWork);
export const orchestrator = new DocumentProcessingOrchestrator(pipelineStatusService, queueManager);
export const eventPublisher = new LocalEventPublisher(orchestrator);

// Services
export const documentService = new DocumentService(documentRepository, auditLogRepository, unitOfWork, eventPublisher);
export const userService = new UserService(userRepository, unitOfWork, eventPublisher);
export const uploadService = new UploadService(storageProvider, documentRepository, documentVersionRepository, auditLogRepository, unitOfWork, eventPublisher);
export const ocrService = new OcrService(providerFactory, orchestrator, storageProvider);
export const chunkingService = new ChunkingService(orchestrator, storageProvider);
export const embeddingService = new EmbeddingService(orchestrator, aiGateway);
export const qdrantIndexingService = new QdrantIndexingService(orchestrator, providerFactory);

// Workers
export const workerManager = new WorkerManager(ocrService, chunkingService, embeddingService, qdrantIndexingService);

// Connector registry — register real providers at startup so HTTP sync works
ConnectorRegistry.getInstance().register(new GitHubConnector());
ConnectorRegistry.getInstance().register(new GmailConnector());
ConnectorRegistry.getInstance().register(new NotionConnector());

export const connectorService = new ConnectorService(orchestrator, storageProvider);
