import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../core/api/useApi';
import type { PaginatedAuditLogs, AuditAction } from '../types';

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...auditLogKeys.lists(), filters] as const,
};

interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: AuditAction | '';
  actorId?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
}

export const useAuditLogs = (filters: AuditLogFilters) => {
  const api = useApi();
  
  // Strip undefined/empty filters
  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
  );

  return useQuery({
    queryKey: auditLogKeys.list(activeFilters),
    queryFn: async (): Promise<PaginatedAuditLogs> => {
      const searchParams = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      const response = await api.get(`/audit-logs?${searchParams.toString()}`);
      return response.data;
    },
    // Keep previous data while fetching new page to prevent UI jitter
    placeholderData: (previousData) => previousData,
  });
};
