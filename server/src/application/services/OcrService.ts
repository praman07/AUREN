import { ProviderFactory } from '../../infrastructure/providers/registry/ProviderFactory';
import { PipelineEventType, PipelineEventPayload } from '../../domain/events/PipelineEvents';
import { prisma } from '../../infrastructure/database/prisma';
import { DocumentProcessingOrchestrator } from './DocumentProcessingOrchestrator';

export class OcrService {
  constructor(
    private readonly providerFactory: ProviderFactory,
    private readonly orchestrator: DocumentProcessingOrchestrator
  ) {}

  public async processDocument(payload: PipelineEventPayload): Promise<void> {
    try {
      // 1. Fetch File (Stubbed: usually from S3/LocalStorageProvider)
      // const fileBuffer = await this.storageProvider.download(payload.versionId);
      const fileBuffer = Buffer.from('mock document content');
      const mimeType = 'application/pdf'; // Stubbed

      // 2. Resolve OCR Provider
      const ocrProvider = this.providerFactory.getOCRProvider();

      // 3. Extract Text
      const result = await ocrProvider.extractText(fileBuffer, mimeType);

      // 4. Persist Raw Text & Metadata
      await prisma.documentVersion.update({
        where: { id: payload.versionId },
        data: {
          // Assuming there is a text payload or object storage reference for the raw text
          // For now we could store it in a new table DocumentText or update metadata
          metadata: {
            ocr: result.metadata
          }
        }
      });

      // Note: In reality, you'd save the raw text to Object Storage (e.g. document-raw-text/id.txt)
      // because putting multi-MB strings in Postgres is bad practice.

      // 5. Emit OCR_COMPLETED to Orchestrator
      await this.orchestrator.handleEvent(PipelineEventType.OCR_COMPLETED, payload);

    } catch (error: any) {
      console.error('OCR Processing Failed:', error);
      // Emit OCR_FAILED to Orchestrator
      await this.orchestrator.handleEvent(PipelineEventType.OCR_FAILED, {
        ...payload,
        error: error.message
      });
      throw error; // Rethrow so BullMQ registers the failure and retries
    }
  }
}
