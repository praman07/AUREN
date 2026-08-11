import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../core/api/useApi';

export interface DocumentOwner {
  firstName: string;
  lastName: string;
  email: string;
}

export interface DocumentJob {
  status: string;
  error?: string | null;
  createdAt: string;
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
  mimeType: string;
  sizeBytes: number;
  isFavorited: boolean;
  createdAt: string;
  owner?: DocumentOwner;
  jobs?: DocumentJob[];
  versions?: DocumentVersion[];
}

export function useDocuments() {
  const api = useApi();
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await api.get('/documents');
      return response.data as Document[];
    },
  });
}

export function useDocument(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['documents', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/documents/${id}`);
      return response.data as Document;
    },
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/documents/upload', formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
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
