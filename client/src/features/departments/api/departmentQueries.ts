import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../core/api/useApi';
import type { Department } from '../types';

export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  detail: (id: string) => [...departmentKeys.all, 'detail', id] as const,
};

export const useDepartments = () => {
  const api = useApi();
  return useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: async (): Promise<Department[]> => {
      const response = await api.get('/departments');
      return response.data;
    },
  });
};

export const useCreateDepartment = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await api.post('/departments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
    },
  });
};

export const useArchiveDepartment = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/departments/${id}/archive`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
    },
  });
};

export const useRestoreDepartment = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/departments/${id}/restore`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
    },
  });
};
