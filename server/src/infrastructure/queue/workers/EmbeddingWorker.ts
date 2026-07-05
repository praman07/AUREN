import { BaseWorker } from '../BaseWorker';
import { PipelineEventPayload } from '../../domain/events/PipelineEvents';
import { EmbeddingService } from '../../../application/services/EmbeddingService';

export class EmbeddingWorker extends BaseWorker<PipelineEventPayload> {
  constructor(private readonly embeddingService: EmbeddingService) {
    super('embedding'); // queue name
  }

  protected async handle(data: PipelineEventPayload): Promise<any> {
    console.log(`[EmbeddingWorker] Processing embeddings for document ${data.documentId}`);
    await this.embeddingService.processDocument(data);
    console.log(`[EmbeddingWorker] Finished embeddings for document ${data.documentId}`);
  }
}
