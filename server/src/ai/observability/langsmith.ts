import { Client } from 'langsmith';

export const isLangSmithEnabled = (): boolean => {
  return (
    process.env.LANGCHAIN_TRACING_V2 === 'true' &&
    !!process.env.LANGCHAIN_API_KEY
  );
};

export const getLangSmithClient = (): Client | null => {
  if (!isLangSmithEnabled()) return null;
  
  return new Client({
    apiUrl: process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com',
    apiKey: process.env.LANGCHAIN_API_KEY,
  });
};

export interface PrivacyPreservingTraceMetadata {
  organizationId: string;
  userId: string;
  requestId: string;
  mode: 'LOCAL' | 'HYBRID';
  intentCategory?: string;
  retrievedInternalCount?: number;
  webSearchCount?: number;
  webAccessEnabled?: boolean;
}

export const sanitizeMetadataForTracing = (
  meta: PrivacyPreservingTraceMetadata
): Record<string, any> => {
  return {
    organizationId: meta.organizationId,
    userId: meta.userId,
    requestId: meta.requestId,
    mode: meta.mode,
    intentCategory: meta.intentCategory || 'UNSPECIFIED',
    retrievedInternalCount: meta.retrievedInternalCount ?? 0,
    webSearchCount: meta.webSearchCount ?? 0,
    webAccessEnabled: meta.webAccessEnabled ?? false,
    timestamp: new Date().toISOString(),
  };
};
