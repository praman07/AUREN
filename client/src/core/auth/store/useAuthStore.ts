import { create } from 'zustand';

export type EnterpriseRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'DEPT_MANAGER' | 'USER' | 'GUEST';

export interface EnterpriseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  departmentId: string;
  roles: EnterpriseRole[];
}

interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: EnterpriseUser | null;
  setAuth: (isSignedIn: boolean, user: EnterpriseUser | null) => void;
  setLoaded: (isLoaded: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoaded: false, // Simulates checking session on mount
  isSignedIn: false,
  user: null,
  setAuth: (isSignedIn, user) => set({ isSignedIn, user }),
  setLoaded: (isLoaded) => set({ isLoaded }),
  signOut: () => set({ isSignedIn: false, user: null }),
}));
