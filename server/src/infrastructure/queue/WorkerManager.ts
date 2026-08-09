import { OcrWorker } from './workers/OcrWorker';
import { ChunkingWorker } from './workers/ChunkingWorker';
import { EmbeddingWorker } from './workers/EmbeddingWorker';
import { QdrantIndexingWorker } from './workers/QdrantIndexingWorker';

import { OcrService } from '../../application/services/OcrService';
import { ChunkingService } from '../../application/services/ChunkingService';
import { EmbeddingService } from '../../application/services/EmbeddingService';
import { QdrantIndexingService } from '../../application/services/QdrantIndexingService';

export class WorkerManager {
  private workers: any[] = [];

  constructor(
    private readonly ocrService: OcrService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingService: EmbeddingService,
    private readonly qdrantIndexingService: QdrantIndexingService
  ) {}

  start() {
    console.log('[WorkerManager] Started waiting for jobs...');
    this.workers.push(new OcrWorker(this.ocrService));
    this.workers.push(new ChunkingWorker(this.chunkingService));
    this.workers.push(new EmbeddingWorker(this.embeddingService));
    this.workers.push(new QdrantIndexingWorker(this.qdrantIndexingService));
  }
}
