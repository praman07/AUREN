import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../core/api/useApi';
import type { Role, PermissionKey } from '../types';

export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
};

export const useRoles = () => {
  const api = useApi();
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: async (): Promise<(Role & { permissions: { action: PermissionKey }[] })[]> => {
      const response = await api.get('/roles');
      return response.data;
    },
  });
};

export const useTogglePermission = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { roleId: string; permission: PermissionKey; enabled: boolean }) => {
      const response = await api.patch(`/roles/${data.roleId}/permissions/toggle`, {
        permission: data.permission,
        enabled: data.enabled
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
};
