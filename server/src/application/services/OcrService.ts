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

  private determineMimeType(dbMimeType?: string, filename?: string, buffer?: Buffer): string {
    // 1. Check buffer magic bytes for authoritative content verification
    if (buffer && buffer.length >= 4) {
      if (buffer.toString('ascii', 0, 4) === '%PDF') {
        return 'application/pdf';
      }
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        return 'image/png';
      }
      if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return 'image/jpeg';
      }
      if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
        return 'image/webp';
      }
      if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        return 'image/gif';
      }
    }

    // 2. If DB mimeType is specific, use DB metadata
    if (dbMimeType && dbMimeType !== 'application/octet-stream' && dbMimeType !== 'unknown') {
      return dbMimeType;
    }

    // 3. Fallback to extension check from filename/title or s3Key
    if (filename) {
      const lower = filename.toLowerCase();
      if (lower.endsWith('.pdf')) return 'application/pdf';
      if (lower.endsWith('.png')) return 'image/png';
      if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
      if (lower.endsWith('.webp')) return 'image/webp';
      if (lower.endsWith('.gif')) return 'image/gif';
      if (lower.endsWith('.bmp')) return 'image/bmp';
      if (lower.endsWith('.tiff') || lower.endsWith('.tif')) return 'image/tiff';
      if (lower.endsWith('.txt')) return 'text/plain';
    }

    return 'application/octet-stream';
  }

  public async processDocument(payload: PipelineEventPayload, job?: any): Promise<void> {
    try {
      const docVersion = await prisma.documentVersion.findUnique({
        where: { id: payload.versionId },
        include: { document: true }
      });
      if (!docVersion) throw new Error('Document version not found');

      // 1. Fetch File
      const fileBuffer = await this.storageProvider.download(docVersion.s3Key);
      const mimeType = this.determineMimeType(
        docVersion.document?.mimeType,
        docVersion.document?.title || docVersion.s3Key,
        fileBuffer
      );
      console.log(`[OcrService] Document version ${payload.versionId} resolved MIME type: ${mimeType}`);

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
      
      const attemptsMade = job?.attemptsMade ?? 1;
      const maxAttempts = job?.opts?.attempts ?? 5;
      const isFinalAttempt = attemptsMade >= maxAttempts;

      if (isFinalAttempt) {
        console.error(`[OcrService] All ${maxAttempts} OCR attempts exhausted for doc ${payload.documentId}. Marking document state as FAILED.`);
        await this.orchestrator.handleEvent(PipelineEventType.OCR_FAILED, {
          ...payload,
          error: error.message
        });
      } else {
        console.warn(`[OcrService] OCR attempt ${attemptsMade}/${maxAttempts} failed for doc ${payload.documentId}. Will retry via BullMQ.`);
      }

      throw error; // Rethrow so BullMQ registers the failure and retries
    }
  }
}
