import { BaseWorker } from '../BaseWorker';
import { PipelineEventPayload } from '../../../domain/events/PipelineEvents';
import { OcrService } from '../../../application/services/OcrService';

export class OcrWorker extends BaseWorker<PipelineEventPayload> {
  constructor(private readonly ocrService: OcrService) {
    super('ocr'); // queue name
  }

  protected async handle(data: PipelineEventPayload, job?: any): Promise<any> {
    console.log(`[OcrWorker] Processing OCR for document ${data.documentId} (attempt ${job?.attemptsMade ?? 1}/${job?.opts?.attempts ?? 5})`);
    await this.ocrService.processDocument(data, job);
    console.log(`[OcrWorker] Finished OCR for document ${data.documentId}`);
  }
}
