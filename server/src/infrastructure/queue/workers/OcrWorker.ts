import { BaseWorker } from '../BaseWorker';
import { PipelineEventPayload } from '../../../domain/events/PipelineEvents';
import { OcrService } from '../../../application/services/OcrService';

export class OcrWorker extends BaseWorker<PipelineEventPayload> {
  constructor(private readonly ocrService: OcrService) {
    super('ocr'); // queue name
  }

  protected async handle(data: PipelineEventPayload): Promise<any> {
    console.log(`[OcrWorker] Processing OCR for document ${data.documentId}`);
    await this.ocrService.processDocument(data);
    console.log(`[OcrWorker] Finished OCR for document ${data.documentId}`);
  }
}
