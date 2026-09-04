import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../core/api/useApi';

export interface DocumentOwner {
  firstName: string;
  lastName: string;
  email: string;
}

export interface DocumentJob {
  id: string;
  queueName: string;
  status: string;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
  failedAt?: string | null;
}

export interface DocumentVersion {
  id: string;
  version: number;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  classification: string;
  visibility: 'PUBLIC' | 'DEPARTMENT' | 'RESTRICTED' | 'PRIVATE' | string;
  scope?: 'PERSONAL' | 'ORGANIZATION' | string;
  departmentId?: string | null;
  mimeType: string;
  sizeBytes: number;
  isFavorited: boolean;
  createdAt: string;
  owner?: DocumentOwner;
  jobs?: DocumentJob[];
  versions?: DocumentVersion[];
  allowedRoles?: string[];
  deniedRoles?: string[];
  allowedUsers?: string[];
  deniedUsers?: string[];
  allowedDepartments?: string[];
  deniedDepartments?: string[];
}

export interface UpdateDocumentPermissionsPayload {
  visibility?: 'PUBLIC' | 'DEPARTMENT' | 'RESTRICTED' | 'PRIVATE' | string;
  classification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'TOP_SECRET' | string;
  scope?: 'PERSONAL' | 'ORGANIZATION' | string;
  departmentId?: string | null;
  allowedRoles?: string[];
  deniedRoles?: string[];
  allowedUsers?: string[];
  deniedUsers?: string[];
  allowedDepartments?: string[];
  deniedDepartments?: string[];
}

export function useDocuments() {
  const api = useApi();
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await api.get('/documents');
      if (response && response.success && Array.isArray(response.data)) {
        return response.data as Document[];
      }
      if (Array.isArray(response)) {
        return response as Document[];
      }
      return (response?.data || []) as Document[];
    },
    refetchInterval: 30000,
  });
}

export function useDocument(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['documents', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/documents/${id}`);
      if (response && response.success && response.data) {
        return response.data as Document;
      }
      return (response?.data || response) as Document;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const doc = query.state.data as Document | undefined;
      const latestJob = doc?.jobs && doc.jobs.length > 0 ? doc.jobs[0] : null;
      const status = latestJob?.status;
      if (status === 'READY' || status === 'COMPLETED' || status === 'FAILED' || status === 'PARTIALLY_FAILED') {
        return 30000;
      }
      return 2000;
    },
  });
}

export function useUploadDocument() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: File | { file: File; scope?: string }) => {
      const file = args instanceof File ? args : args.file;
      const scope = args instanceof File ? undefined : args.scope;

      const formData = new FormData();
      formData.append('file', file);
      if (scope) {
        formData.append('scope', scope);
      }
      const response = await api.post('/documents/upload', formData);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useUpdateDocumentPermissions() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateDocumentPermissionsPayload }) => {
      const response = await api.patch(`/documents/${id}`, payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.id] });
    },
  });
}

export function useDeleteDocument() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.del(`/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteAllDocuments() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.del('/documents');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

