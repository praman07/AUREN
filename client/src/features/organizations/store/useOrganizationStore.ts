import { create } from 'zustand';
import type { Organization } from '../types';
import { mockOrganizations } from '../mock/organizations.mock';

interface OrganizationState {
  organizations: Organization[];
  selectedOrgId: string | null;
  isCreateModalOpen: boolean;
  isArchiveAlertOpen: boolean;
  
  // Actions
  setSelectedOrgId: (id: string | null) => void;
  setCreateModalOpen: (isOpen: boolean) => void;
  setArchiveAlertOpen: (isOpen: boolean) => void;
  archiveOrganization: (id: string) => Promise<void>;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  organizations: [...mockOrganizations],
  selectedOrgId: null,
  isCreateModalOpen: false,
  isArchiveAlertOpen: false,
  
  setSelectedOrgId: (id) => set({ selectedOrgId: id }),
  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
  setArchiveAlertOpen: (isOpen) => set({ isArchiveAlertOpen: isOpen }),
  
  archiveOrganization: async (id) => {
    // Simulate network delay
    await new Promise(res => setTimeout(res, 600));
    set((state) => ({
      organizations: state.organizations.map(org => 
        org.id === id ? { ...org, status: 'ARCHIVED' } : org
      ),
      isArchiveAlertOpen: false,
      selectedOrgId: null, // close drawer if archiving
    }));
  }
}));
