import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../core/api/useApi';

export interface ConnectorAccount {
  id: string;
  provider: 'GITHUB' | 'GMAIL' | 'NOTION' | 'GOOGLE_DRIVE' | 'SLACK' | string;
  name: string;
  configured: boolean;
  account: {
    id: string;
    accountId?: string;
    accountEmail?: string;
    lastSyncAt?: string | null;
    lastSyncStatus?: 'PENDING' | 'SYNCING' | 'SUCCESS' | 'FAILED' | string | null;
    status?: 'ACTIVE' | 'INACTIVE' | 'ERROR' | string;
    lastError?: string | null;
    lastErrorAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    hasStoredCredential?: boolean;
    errorCount?: number;
  } | null;
}

export function useConnectors() {
  const api = useApi();
  return useQuery({
    queryKey: ['connectors'],
    queryFn: async () => {
      const response = await api.get('/connectors');
      return (response.data || response) as ConnectorAccount[];
    },
    refetchInterval: (query) => {
      const list = query.state.data;
      if (Array.isArray(list)) {
        const isSyncing = list.some(
          c => c.account?.lastSyncStatus === 'PENDING' || c.account?.lastSyncStatus === 'SYNCING'
        );
        if (isSyncing) return 3000;
      }
      return false;
    },
  });
}

export function useGetGoogleAuthUrl() {
  const api = useApi();
  return useMutation({
    mutationFn: async () => {
      const response = await api.get('/connectors/google/auth-url');
      return response.data as { url: string };
    },
  });
}

export function useConnectConnector() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      provider: string;
      accountId: string;
      accountEmail?: string;
      accessToken: string;
    }) => {
      const response = await api.post('/connectors/connect', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
    },
  });
}

export function useSyncConnector() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectorId: string) => {
      const response = await api.post(`/connectors/${connectorId}/sync`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDisconnectConnector() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectorId: string) => {
      const response = await api.post(`/connectors/${connectorId}/disconnect`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

