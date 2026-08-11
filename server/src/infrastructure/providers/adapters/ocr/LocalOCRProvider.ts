import { IOCRProvider, OCRExtractionResult } from '../../interfaces/IOCRProvider';

export class LocalOCRProvider implements IOCRProvider {
  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRExtractionResult> {
    const startTime = Date.now();
    let extractedText = '';
    let confidence = 0;
    let pageCount = 1;

    // Extraction Strategy Simulation:
    if (mimeType === 'application/pdf') {
      // 1. Check if PDF contains selectable text
      const hasSelectableText = this.hasTextLayer(fileBuffer);
      
      if (hasSelectableText) {
        extractedText = fileBuffer.toString('utf8');
        confidence = 1.0;
      } else {
        extractedText = fileBuffer.toString('utf8');
        confidence = 0.85;
      }
    } else if (mimeType.startsWith('image/')) {
      extractedText = "[Performed Tesseract OCR on image] ...";
      confidence = 0.90;
    } else {
      extractedText = fileBuffer.toString('utf8');
      confidence = 1.0;
    }

    return {
      text: extractedText,
      metadata: {
        pageCount,
        language: 'en',
        confidence,
        processingDurationMs: Date.now() - startTime
      }
    };
  }

  private hasTextLayer(buffer: Buffer): boolean {
    return true;
  }
}
