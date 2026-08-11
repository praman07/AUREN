import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../core/api/useApi';
import type { PaginatedProcessingJobs, ProcessingJobStatus } from '../types';

export const processingJobKeys = {
  all: ['processing-jobs'] as const,
  lists: () => [...processingJobKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...processingJobKeys.lists(), filters] as const,
};

interface ProcessingJobFilters {
  page?: number;
  limit?: number;
  status?: ProcessingJobStatus | '';
  queueName?: string;
  documentId?: string;
}

export const useProcessingJobs = (filters: ProcessingJobFilters) => {
  const api = useApi();
  
  // Strip undefined/empty filters
  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
  );

  return useQuery({
    queryKey: processingJobKeys.list(activeFilters),
    queryFn: async (): Promise<PaginatedProcessingJobs> => {
      const searchParams = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      const response = await api.get(`/jobs?${searchParams.toString()}`);
      return response.data;
    },
    // Prevent jitter during pagination
    placeholderData: (previousData) => previousData,
    // Poll more frequently if viewing recent jobs, otherwise standard staleTime
    refetchInterval: 10000,
  });
};
