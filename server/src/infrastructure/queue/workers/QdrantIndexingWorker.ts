import { BaseWorker } from '../BaseWorker';
import { PipelineEventPayload } from '../../../domain/events/PipelineEvents';
import { QdrantIndexingService } from '../../../application/services/QdrantIndexingService';

export class QdrantIndexingWorker extends BaseWorker<PipelineEventPayload> {
  constructor(private readonly indexingService: QdrantIndexingService) {
    super('qdrant-indexing'); // queue name
  }

  protected async handle(data: PipelineEventPayload): Promise<any> {
    console.log(`[QdrantIndexingWorker] Processing indexing for document ${data.documentId}`);
    await this.indexingService.processDocument(data);
    console.log(`[QdrantIndexingWorker] Finished indexing for document ${data.documentId}`);
  }
}
