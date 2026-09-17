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
    metadata?: Record<string, any> | null;
  } | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: {
    login: string;
    avatarUrl?: string;
  };
  private: boolean;
  defaultBranch: string;
  description: string | null;
  htmlUrl: string;
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

export function useGetGitHubAuthUrl() {
  const api = useApi();
  return useMutation({
    mutationFn: async () => {
      const response = await api.get('/connectors/github/auth-url');
      return response.data as { url: string };
    },
  });
}

export function useGetGitHubRepos(connectorId: string, enabled: boolean = true) {
  const api = useApi();
  return useQuery({
    queryKey: ['github-repos', connectorId],
    queryFn: async () => {
      const response = await api.get(`/connectors/${connectorId}/github/repos`);
      return (response.data || response) as GitHubRepo[];
    },
    enabled: Boolean(connectorId) && enabled,
    staleTime: 60 * 1000,
  });
}

export function useSelectGitHubRepos() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ connectorId, repositories }: { connectorId: string; repositories: string[] }) => {
      const response = await api.post(`/connectors/${connectorId}/github/select-repos`, { repositories });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
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

export function useSyncGitHubConnector() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectorId: string) => {
      const response = await api.post(`/connectors/${connectorId}/github/sync`, {});
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

export interface ConnectorPolicy {
  id: string;
  organizationId: string;
  connectedAccountId: string;
  resourcePattern: string;
  allowedRoles: string[];
  allowedDepartments: string[];
  allowedUsers: string[];
  deniedRoles: string[];
  deniedDepartments: string[];
  deniedUsers: string[];
  createdAt: string;
  updatedAt: string;
}

export function useGetConnectorPolicies(connectorId: string, enabled: boolean = true) {
  const api = useApi();
  return useQuery({
    queryKey: ['connector-policies', connectorId],
    queryFn: async () => {
      const response = await api.get(`/connectors/${connectorId}/policies`);
      return (response.data || response) as ConnectorPolicy[];
    },
    enabled: Boolean(connectorId) && enabled,
  });
}

export function useSaveConnectorPolicy() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      connectorId,
      resourcePattern,
      allowedRoles,
      allowedDepartments,
      allowedUsers,
      deniedRoles,
      deniedDepartments,
      deniedUsers,
    }: {
      connectorId: string;
      resourcePattern: string;
      allowedRoles?: string[];
      allowedDepartments?: string[];
      allowedUsers?: string[];
      deniedRoles?: string[];
      deniedDepartments?: string[];
      deniedUsers?: string[];
    }) => {
      const response = await api.post(`/connectors/${connectorId}/policies`, {
        resourcePattern,
        allowedRoles,
        allowedDepartments,
        allowedUsers,
        deniedRoles,
        deniedDepartments,
        deniedUsers,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['connector-policies', variables.connectorId] });
    },
  });
}

export function useDeleteConnectorPolicy() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ connectorId, policyId }: { connectorId: string; policyId: string }) => {
      const response = await api.del(`/connectors/${connectorId}/policies/${policyId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['connector-policies', variables.connectorId] });
    },
  });
}

