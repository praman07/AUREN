export enum PipelineEventType {
  DOCUMENT_UPLOADED = 'document.uploaded',
  OCR_COMPLETED = 'ocr.completed',
  OCR_FAILED = 'ocr.failed',
  CHUNKING_COMPLETED = 'chunking.completed',
  CHUNKING_FAILED = 'chunking.failed',
  EMBEDDING_COMPLETED = 'embedding.completed',
  EMBEDDING_FAILED = 'embedding.failed',
  INDEXING_COMPLETED = 'indexing.completed',
  INDEXING_FAILED = 'indexing.failed',
}

export interface PipelineEventPayload {
  documentId: string;
  organizationId: string;
  versionId: string;
  error?: string;
}
