import { ProviderFactory } from '../../infrastructure/providers/registry/ProviderFactory';
import { PipelineEventType, PipelineEventPayload } from '../../domain/events/PipelineEvents';
import { prisma } from '../../infrastructure/database/prisma';
import { DocumentProcessingOrchestrator } from './DocumentProcessingOrchestrator';

import { IStorageProvider } from '../../infrastructure/storage/IStorageProvider';

export class OcrService {
  constructor(
    private readonly providerFactory: ProviderFactory,
    private readonly orchestrator: DocumentProcessingOrchestrator,
    private readonly storageProvider: IStorageProvider
  ) {}

  public async processDocument(payload: PipelineEventPayload): Promise<void> {
    try {
      const docVersion = await prisma.documentVersion.findUnique({ where: { id: payload.versionId } });
      if (!docVersion) throw new Error('Document version not found');

      // 1. Fetch File
      const fileBuffer = await this.storageProvider.download(docVersion.s3Key);
      const mimeType = 'application/pdf'; // Stubbed

      // 2. Resolve OCR Provider
      const ocrProvider = this.providerFactory.getOCRProvider();

      // 3. Extract Text
      const result = await ocrProvider.extractText(fileBuffer, mimeType);
      
      // Save the extracted text back to storage
      const txtPath = docVersion.s3Key + '.txt';
      await this.storageProvider.upload(Buffer.from(result.text, 'utf8'), txtPath);

      // 4. Persist Raw Text & Metadata
      await prisma.documentVersion.update({
        where: { id: payload.versionId },
        data: {
          updatedAt: new Date()
        }
      });

      // Note: In reality, you'd save the raw text to Object Storage (e.g. document-raw-text/id.txt)
      // because putting multi-MB strings in Postgres is bad practice.

      // 5. Emit OCR_COMPLETED to Orchestrator
      console.log('[OcrService] Orchestrator instance:', typeof this.orchestrator, this.orchestrator);
      await this.orchestrator.handleEvent(PipelineEventType.OCR_COMPLETED, payload);

    } catch (error: any) {
      console.error('OCR Processing Failed:', error);
      console.log('[OcrService catch] Orchestrator instance:', typeof this.orchestrator, this.orchestrator);
      // Emit OCR_FAILED to Orchestrator
      await this.orchestrator.handleEvent(PipelineEventType.OCR_FAILED, {
        ...payload,
        error: error.message
      });
      throw error; // Rethrow so BullMQ registers the failure and retries
    }
  }
}
