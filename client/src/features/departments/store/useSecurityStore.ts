import { create } from 'zustand';
import { Department, Role, Group, OrganizationPolicy, PermissionKey } from '../types';
import { mockDepartments, mockRoles, mockGroups, mockPolicy, mockPermissionMatrix } from '../mock/security.mock';

interface SecurityState {
  departments: Department[];
  roles: Role[];
  groups: Group[];
  policy: OrganizationPolicy;
  permissionMatrix: Record<string, Record<string, boolean>>;
  
  selectedDepartmentId: string | null;
  
  // Actions
  setSelectedDepartmentId: (id: string | null) => void;
  togglePermission: (roleId: string, permission: PermissionKey) => void;
  updatePolicy: (updates: Partial<OrganizationPolicy>) => Promise<void>;
}

export const useSecurityStore = create<SecurityState>((set) => ({
  departments: [...mockDepartments],
  roles: [...mockRoles],
  groups: [...mockGroups],
  policy: { ...mockPolicy },
  permissionMatrix: JSON.parse(JSON.stringify(mockPermissionMatrix)),
  
  selectedDepartmentId: null,
  
  setSelectedDepartmentId: (id) => set({ selectedDepartmentId: id }),
  
  togglePermission: (roleId, permission) => set((state) => {
    const newMatrix = { ...state.permissionMatrix };
    if (!newMatrix[roleId]) newMatrix[roleId] = {};
    newMatrix[roleId][permission] = !newMatrix[roleId][permission];
    return { permissionMatrix: newMatrix };
  }),
  
  updatePolicy: async (updates) => {
    await new Promise(res => setTimeout(res, 400));
    set((state) => ({
      policy: { ...state.policy, ...updates }
    }));
  }
}));
