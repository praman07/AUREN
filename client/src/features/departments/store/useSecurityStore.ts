import { create } from 'zustand';
import type { Group, OrganizationPolicy } from '../types';
import { mockGroups, mockPolicy } from '../mock/security.mock';

interface SecurityState {
  groups: Group[];
  policy: OrganizationPolicy;
  
  selectedDepartmentId: string | null;
  
  // Actions
  setSelectedDepartmentId: (id: string | null) => void;
  updatePolicy: (updates: Partial<OrganizationPolicy>) => Promise<void>;
}

export const useSecurityStore = create<SecurityState>((set) => ({
  groups: [...mockGroups],
  policy: { ...mockPolicy },
  
  selectedDepartmentId: null,
  
  setSelectedDepartmentId: (id) => set({ selectedDepartmentId: id }),

  updatePolicy: async (updates) => {
    await new Promise(res => setTimeout(res, 400));
    set((state) => ({
      policy: { ...state.policy, ...updates }
    }));
  }
}));
