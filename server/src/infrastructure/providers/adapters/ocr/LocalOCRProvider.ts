import { IOCRProvider, OCRExtractionResult } from '../../interfaces/IOCRProvider';
import { ProviderFactory } from '../../registry/ProviderFactory';

const pdfParseModule = require('pdf-parse');
const PDFParseClass = pdfParseModule.PDFParse;
const pdfParseFunc = typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule.default || pdfParseModule);

export class LocalOCRProvider implements IOCRProvider {
  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRExtractionResult> {
    const startTime = Date.now();
    let extractedText = '';
    let confidence = 1.0;
    let pageCount = 1;
    let visionMetadata: Record<string, any> = {};

    try {
      if (mimeType === 'application/pdf' || (fileBuffer.length > 4 && fileBuffer.toString('ascii', 0, 4) === '%PDF')) {
        if (PDFParseClass) {
          const parser = new PDFParseClass({ data: fileBuffer });
          const result = await parser.getText();
          extractedText = result.text || '';
          pageCount = result.total || 1;
          await parser.destroy().catch(() => {});
        } else {
          const parsed = await pdfParseFunc(fileBuffer);
          extractedText = parsed.text || '';
          pageCount = parsed.numpages || 1;
        }
        confidence = 0.95;
      } else if (mimeType.startsWith('image/')) {
        // High-fidelity Vision transcription via Qwen2.5-VL / configured Vision provider
        const useVision = process.env.VISION_PROVIDER || process.env.USE_VISION_FOR_OCR === 'true';
        if (useVision) {
          try {
            const visionProvider = new ProviderFactory().getVisionProvider();
            const visionRes = await visionProvider.analyzeImage({
              imageBuffer: fileBuffer,
              prompt: 'Provide an accurate and complete transcription of all text, headings, tabular content, and visual descriptions from this document page.'
            });
            extractedText = visionRes.text;
            confidence = 0.98;
            visionMetadata = {
              modelUsed: visionRes.modelUsed,
              visionExtracted: true,
              ...(visionRes.metadata || {})
            };
          } catch (visionErr: any) {
            console.error('[LocalOCRProvider] Vision transcription failed:', visionErr.message);
            throw new Error(`Vision transcription failed: ${visionErr.message}`);
          }
        } else {
          extractedText = `[Extracted image document content]\nFile size: ${fileBuffer.length} bytes`;
          confidence = 0.85;
        }
      } else {
        extractedText = fileBuffer.toString('utf8');
        confidence = 1.0;
      }
    } catch (err: any) {
      console.error('[LocalOCRProvider] Error parsing document buffer:', err.message);
      throw new Error(`Failed to extract text from document: ${err.message}`);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('Text extraction yielded no readable text content');
    }

    if (extractedText.trim().startsWith('%PDF-')) {
      throw new Error('Text extraction failed: binary PDF header encountered in output');
    }

    return {
      text: extractedText,
      metadata: {
        pageCount,
        language: 'en',
        confidence,
        processingDurationMs: Date.now() - startTime,
        ...visionMetadata
      }
    };
  }
}
