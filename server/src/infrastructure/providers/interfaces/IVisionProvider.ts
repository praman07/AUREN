export interface VisionInput {
  imageBuffer?: Buffer;
  imageBase64?: string;
  imagePath?: string;
  prompt?: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export interface VisionResponse {
  text: string;
  modelUsed: string;
  metadata?: Record<string, any>;
}

export interface IVisionProvider {
  analyzeImage(input: VisionInput): Promise<VisionResponse>;
  describeDocumentPage(imageBuffer: Buffer, pageNumber?: number): Promise<string>;
}
