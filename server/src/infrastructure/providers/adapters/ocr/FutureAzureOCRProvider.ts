import { IOCRProvider } from '../../interfaces/IOCRProvider';

export class FutureAzureOCRProvider implements IOCRProvider {
  async extractText(fileBuffer: Buffer, mimeType: string): Promise<any> {
    throw new Error(`Not implemented. Requires Azure Document Intelligence setup.`);
  }
}
