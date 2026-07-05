export interface OCRExtractionResult {
  text: string;
  metadata: {
    pageCount: number;
    language: string;
    confidence: number;
    processingDurationMs: number;
  };
}

export interface IOCRProvider {
  extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRExtractionResult>;
}
