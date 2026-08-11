import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../core/api/useApi';
import type { UserDetails } from '../types';

export function useUsers() {
  const api = useApi();
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      // The backend returns the Prisma User model.
      // We will map it to the UserDetails type required by the frontend.
      return response.data.map((user: any) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organization: user.organizationId,
        department: user.departmentId || 'Unassigned',
        roles: user.roles || ['USER'], // fallback if roles not returned
        clearanceLevel: user.clearanceLevel,
        status: user.deletedAt ? 'SUSPENDED' : (user.clerkUserId ? 'ACTIVE' : 'INVITED'),
        lastActive: user.updatedAt,
        createdAt: user.createdAt
      })) as UserDetails[];
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
        firstName: 'Pending',
        lastName: 'User',
        departmentId: data.department === 'Engineering' ? undefined : undefined, // In reality, we'd map string to UUID here, for now it's just passing email and roles
        roles: [data.role]
      };
      const response = await api.post('/users/invite', payload);
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
