export interface RetrievedChunk {
  id: string;
  documentId: string;
  content: string;
  score: number;
  vectorScore: number;
  keywordScore: number;
  metadata: {
    page?: number;
    section?: string;
    createdAt: Date;
    [key: string]: any;
  };
}

export interface SearchRequest {
  query: string;
  organizationId: string;
  userId: string;
  departmentIds: string[];
  roleIds: string[];
  isSuperAdmin?: boolean;
  scope?: 'PERSONAL' | 'ORGANIZATION';
  limit: number;
  filters?: Record<string, any>;
  targetDocumentIds?: string[];
}

export interface SearchResponse {
  chunks: RetrievedChunk[];
  totalFound: number;
  executionTimeMs: number;
}

export interface ContextWindow {
  text: string;
  tokens: number;
  citations: string[];
}

export interface PromptContext {
  systemInstruction: string;
  contextBlock: string;
  userQuery: string;
  fullPrompt: string;
}
