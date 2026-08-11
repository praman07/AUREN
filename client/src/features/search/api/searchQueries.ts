import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../core/api/useApi';

export interface SemanticSearchResult {
  id: string;
  documentId: string;
  content: string;
  score: number;
  metadata: {
    page?: number;
    section?: string;
    documentTitle?: string;
    createdAt: string;
    [key: string]: any;
  };
}

export interface SemanticSearchResponse {
  chunks: SemanticSearchResult[];
  totalFound: number;
  executionTimeMs: number;
}

export const useSemanticSearch = (query: string) => {
  const api = useApi();
  
  return useQuery({
    queryKey: ['semantic-search', query],
    queryFn: async (): Promise<SemanticSearchResponse> => {
      if (!query.trim()) return { chunks: [], totalFound: 0, executionTimeMs: 0 };
      const response = await api.post('/semantic-search/search', {
        query,
        limit: 10
      });
      return response.data;
    },
    enabled: query.trim().length > 0,
    staleTime: 300000,
  });
};
