export enum AICapability {
  CHAT = 'CHAT',
  EMBEDDING = 'EMBEDDING',
  OCR = 'OCR',
  VISION = 'VISION',
  SUMMARIZATION = 'SUMMARIZATION',
  CLASSIFICATION = 'CLASSIFICATION',
  EXTRACTION = 'EXTRACTION',
  TRANSLATION = 'TRANSLATION',
  RERANKING = 'RERANKING'
}

export interface InferenceContext {
  requestId: string;
  organizationId: string;
  userId?: string;
  timestamp: Date;
  latencyMs?: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  providerUsed?: string;
  modelUsed?: string;
}

export interface InferenceRequest<T> {
  capability: AICapability;
  payload: T;
  context: Omit<InferenceContext, 'timestamp' | 'latencyMs' | 'tokensUsed' | 'providerUsed' | 'modelUsed'>;
  fallbackAllowed?: boolean;
  stream?: boolean;
}

export interface InferenceResponse<T> {
  result: T;
  context: InferenceContext;
}
