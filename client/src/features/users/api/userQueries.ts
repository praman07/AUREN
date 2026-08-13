import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../core/api/useApi';

export interface RoleItem {
  id: string;
  name: string;
  permissions?: string[];
  isDefault?: boolean;
}

export interface UserDetailsExt {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  department: string;
  departmentId?: string | null;
  roles: string[];
  userRoles: { id: string; name: string }[];
  clearanceLevel: number;
  status: 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'SUSPENDED' | 'LOCKED';
  lastActive: string | null;
  createdAt: string;
}

export function useUsers() {
  const api = useApi();
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      const list = response.data || response;
      return list.map((user: any) => ({
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        organization: user.organizationId,
        department: user.departmentName || user.departmentId || 'Unassigned',
        departmentId: user.departmentId || null,
        roles: user.roles && user.roles.length > 0 ? user.roles : ['USER'],
        userRoles: user.userRoles || [],
        clearanceLevel: user.isSuperAdmin ? 5 : 1,
        status: user.isActive ? 'ACTIVE' : 'SUSPENDED',
        lastActive: user.updatedAt,
        createdAt: user.createdAt
      })) as UserDetailsExt[];
    },
  });
}

export function useRoles() {
  const api = useApi();
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return (response.data || response) as RoleItem[];
    },
  });
}

export function useInviteUser() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; role: string; department: string }) => {
      const payload = {
        email: data.email,
        firstName: 'New',
        lastName: 'User',
        roles: [data.role],
        departmentId: data.department === 'Engineering' ? undefined : undefined
      };
      const response = await api.post('/users/invite', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useAssignRole() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const response = await api.post('/super-admin/roles/assign', { userId, roleId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useRemoveRole() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const response = await api.post('/super-admin/roles/remove', { userId, roleId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useAssignDepartment() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, departmentId }: { userId: string; departmentId: string }) => {
      const response = await api.post('/super-admin/departments/assign', { userId, departmentId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeactivateUser() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/users/${id}/deactivate`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useReactivateUser() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/users/${id}/reactivate`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

