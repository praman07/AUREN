import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../core/api/useApi';

export interface OrganizationDetails {
  id: string;
  name: string;
  domain: string | null;
  industry: string;
  plan?: string;
  status?: string;
  storageUsedGB?: number;
  storageLimitGB?: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    departments: number;
    documents: number;
  };
}

export interface OrganizationMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  departmentId: string | null;
  department?: { id: string; name: string } | null;
  roles: { id: string; name: string }[];
  isSuperAdmin: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export function useOrganization() {
  const api = useApi();
  return useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const response = await api.get('/organization');
      return (response.data || response) as OrganizationDetails;
    },
  });
}

export function useOrganizationMembers() {
  const api = useApi();
  return useQuery({
    queryKey: ['organization', 'members'],
    queryFn: async () => {
      const response = await api.get('/organization/members');
      return (response.data || response) as OrganizationMember[];
    },
  });
}

export function useUpdateOrganizationSettings() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name?: string; domain?: string; industry?: string }) => {
      const response = await api.patch('/organization/settings', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });
}

export function useUpdateMemberStatus() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, active }: { memberId: string; active: boolean }) => {
      const response = await api.patch(`/organization/members/${memberId}/status`, { active });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', 'members'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
