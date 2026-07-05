import { IOCRProvider } from '../../interfaces/IOCRProvider';

export class FutureAzureOCRProvider implements IOCRProvider {
  async extractText(fileBuffer: Buffer, mimeType: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
