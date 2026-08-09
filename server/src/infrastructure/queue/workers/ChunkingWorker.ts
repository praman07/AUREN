import { BaseWorker } from '../BaseWorker';
import { PipelineEventPayload } from '../../../domain/events/PipelineEvents';
import { ChunkingService } from '../../../application/services/ChunkingService';

export class ChunkingWorker extends BaseWorker<PipelineEventPayload> {
  constructor(private readonly chunkingService: ChunkingService) {
    super('chunking'); // queue name
  }

  protected async handle(data: PipelineEventPayload): Promise<any> {
    console.log(`[ChunkingWorker] Processing chunking for document ${data.documentId}`);
    await this.chunkingService.processDocument(data);
    console.log(`[ChunkingWorker] Finished chunking for document ${data.documentId}`);
  }
}
