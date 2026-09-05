import { BaseMessage } from '@langchain/core/messages';
import { UserAuthContext } from '../retrievers/OrganizationRetriever';

export type IntentCategory = 
  | 'IDENTITY'
  | 'DOC_CATALOG_BROWSE'
  | 'CASUAL'
  | 'INTERNAL_KNOWLEDGE'
  | 'EXTERNAL_WEB'
  | 'DYNAMIC_DATA'
  | 'MIXED'
  | 'MEMORY_SAVE'
  | 'MEMORY_READ'
  | 'MEMORY_DELETE'
  | 'CONVERSATION_HISTORY'
  | 'SYSTEM_UTILITY';

export interface SourceCitation {
  type: 'internal' | 'web';
  title: string;
  url?: string;
  documentId?: string;
  documentVersionId?: string;
  chunkId?: string;
  isVisual?: boolean;
  mimeType?: string;
  snippet?: string;
}

export type ResearchStrategy = 'SIMPLE_FACT' | 'DEEP_RESEARCH';

export interface AURENGraphState {
  messages: BaseMessage[];
  userQuery: string;
  rawUserQuery?: string;
  resolvedQuery?: string;
  authContext: UserAuthContext;
  mode: 'LOCAL' | 'HYBRID';
  executionMode?: 'FAST' | 'DEEP' | 'AUTO';
  isWebAccessEnabled: boolean;
  useKnowledgeBase?: boolean; // When true: always search vector DB first for every query
  
  // Graph decisions & context
  intentCategory?: IntentCategory;
  intentConfidence?: number;
  internalDocs: Array<{ content: string; pageContent?: string; metadata: any }>;
  catalogDocs?: Array<{
    id: string;
    title: string;
    filename: string;
    scope: string;
    visibility: string;
    departmentId?: string | null;
    ownerId: string;
    createdAt: Date | string;
  }>;
  webResults: Array<{
    rank?: number;
    title: string;
    snippet: string;
    url: string;
    source?: string;
    timestamp?: string;
    extractedContent?: string;
    crawlSuccess?: boolean;
    crawlSource?: string;
    extractedLength?: number;
  }>;
  userMemories?: Array<{ key: string; value: string }>;
  historyDocs?: Array<{ role: string; content: string }>;
  systemTimeInfo?: string;
  
  // Ambiguity Detection & Strategy
  isAmbiguous?: boolean;
  clarificationQuestion?: string;
  clarificationOptions?: Array<{ label: string; value: string; description?: string }>;
  isClarificationContinuation?: boolean;
  researchStrategy?: ResearchStrategy;
  researchBrief?: string;

  // Deep Research & Iteration tracking
  researchIterations?: number;
  currentSearchQuery?: string;
  researchGap?: string;
  searchQueryHistory?: string[];
  
  // SSE Event tracking & Citations
  activeTool?: { name: string; status: 'running' | 'completed' | 'blocked'; resultCount?: number };
  citations: SourceCitation[];
  finalAnswer: string;
  webSearchStatus?: { status: string; extractedPagesCount?: number; error?: string } | string;
  internalKnowledgeStatus?: string;
  toolResults?: any[];
  retrievalTelemetry?: {
    searchedSourcesCount: number;
    crawledSourcesCount: number;
    successfullyExtractedSourcesCount: number;
    relevantEvidenceSourcesCount: number;
    failedSourcesCount: number;
    searchedSources: Array<{ title: string; url: string }>;
    crawledSources: string[];
    successfullyExtractedSources: string[];
    relevantEvidenceSources: any[];
    failedSources: Array<{ url: string; error?: string }>;
  };
  validatedEvidence?: any[];

  fastRoutingTarget?: 'web' | 'rag' | 'none';
}



