import { QdrantIndexingService } from '../QdrantIndexingService';
import { PipelineEventType } from '../../../domain/events/PipelineEvents';

// Mocking dependencies
const mockOrchestrator = {
  handleEvent: jest.fn()
};

const mockVectorStore = {
  ensureCollection: jest.fn(),
  upsertPoints: jest.fn()
};

const mockProviderFactory = {
  getVectorStoreProvider: jest.fn().mockReturnValue(mockVectorStore)
};

// Mock prisma
jest.mock('../../../infrastructure/database/prisma', () => ({
  prisma: {
    document: { findUnique: jest.fn() },
    documentChunk: { findMany: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn()
  }
}));

import { prisma } from '../../../infrastructure/database/prisma';

describe('QdrantIndexingService', () => {
  let service: QdrantIndexingService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new QdrantIndexingService(mockOrchestrator as any, mockProviderFactory as any);
  });

  const basePayload = {
    organizationId: 'org-1',
    documentId: 'doc-1',
    versionId: 'ver-1'
  };

  const baseDoc = {
    organizationId: 'org-1',
    departmentId: 'dept-1',
    sensitivityLevel: 'CONFIDENTIAL',
    classification: 'INTERNAL',
    ownerId: 'user-1'
  };

  it('1. Successful batch indexing & 10. INDEXING_COMPLETED event', async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(baseDoc);
    
    // 300 chunks to test batching (batch size is 100)
    const mockChunks = Array.from({ length: 300 }).map((_, i) => ({
      id: `chunk-${i}`,
      documentId: 'doc-1',
      versionId: 'ver-1',
      embeddingDim: 768,
      vectorData: [0.1, 0.2],
      pageNumbers: '1',
      sectionTitle: 'Intro',
      chunkIndex: i,
      text: 'Test',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    (prisma.documentChunk.findMany as jest.Mock).mockResolvedValue(mockChunks);
    mockVectorStore.ensureCollection.mockResolvedValue(undefined);
    mockVectorStore.upsertPoints.mockResolvedValue(undefined);
    (prisma.$transaction as jest.Mock).mockResolvedValue(undefined);

    await service.processDocument(basePayload);

    expect(mockVectorStore.ensureCollection).toHaveBeenCalledWith('org_org-1_docs', 768);
    // 3 batches of 100
    expect(mockVectorStore.upsertPoints).toHaveBeenCalledTimes(3);
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    expect(mockOrchestrator.handleEvent).toHaveBeenCalledWith(PipelineEventType.INDEXING_COMPLETED, basePayload);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'INDEXING_COMPLETED' })
    }));
  });

  it('2. Empty embedding set', async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(baseDoc);
    (prisma.documentChunk.findMany as jest.Mock).mockResolvedValue([]);

    await service.processDocument(basePayload);

    expect(mockVectorStore.upsertPoints).not.toHaveBeenCalled();
    expect(mockOrchestrator.handleEvent).toHaveBeenCalledWith(PipelineEventType.INDEXING_COMPLETED, basePayload);
  });

  it('3. Duplicate/replayed job - handled by Qdrant upsert and deterministic IDs', async () => {
    // Qdrant upsertPoints by ID replaces existing points automatically.
    // The query explicitly fetches chunks with indexingStatus != COMPLETED.
    // If it was already completed, it returns [], effectively skipping it.
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(baseDoc);
    (prisma.documentChunk.findMany as jest.Mock).mockResolvedValue([]);

    await service.processDocument(basePayload);
    
    expect(mockVectorStore.upsertPoints).not.toHaveBeenCalled();
    expect(mockOrchestrator.handleEvent).toHaveBeenCalledWith(PipelineEventType.INDEXING_COMPLETED, basePayload);
  });

  it('4. Qdrant temporary failure', async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(baseDoc);
    (prisma.documentChunk.findMany as jest.Mock).mockResolvedValue([{
      id: 'chunk-1',
      embeddingDim: 768,
      vectorData: [0.1],
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    
    mockVectorStore.upsertPoints.mockRejectedValue(new Error('Network Timeout'));

    await expect(service.processDocument(basePayload)).rejects.toThrow('Network Timeout');
    
    // Should emit INDEXING_FAILED
    expect(mockOrchestrator.handleEvent).toHaveBeenCalledWith(PipelineEventType.INDEXING_FAILED, expect.any(Object));
    // Prisma transaction should NOT have been called (no db update)
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('6. Wrong organization metadata (Zero-Trust Violation)', async () => {
    // Document authoritative org is different
    (prisma.document.findUnique as jest.Mock).mockResolvedValue({
      ...baseDoc,
      organizationId: 'org-2' // Mismatch
    });

    await expect(service.processDocument(basePayload)).rejects.toThrow('Zero-Trust Violation');
    expect(mockOrchestrator.handleEvent).toHaveBeenCalledWith(PipelineEventType.INDEXING_FAILED, expect.any(Object));
  });

  it('8. Incorrect vector dimension (missing)', async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(baseDoc);
    (prisma.documentChunk.findMany as jest.Mock).mockResolvedValue([{
      id: 'chunk-1',
      embeddingDim: null // Missing dim
    }]);

    await expect(service.processDocument(basePayload)).rejects.toThrow('Chunks are missing embedding dimensions');
  });

});
