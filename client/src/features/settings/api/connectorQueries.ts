import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../core/api/useApi';

export interface ConnectorAccount {
  id: string;
  provider: 'GITHUB' | 'GMAIL' | 'NOTION' | string;
  name: string;
  configured: boolean;
  account: {
    id: string;
    accountEmail?: string;
    lastSyncAt?: string | null;
    status?: string;
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
    },
  });
}
