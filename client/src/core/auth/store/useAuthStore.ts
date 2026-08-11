import { create } from 'zustand';

export interface EnterpriseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  industry: string;
  departments: string[];
  role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST' | string;
  clearanceLevel: 'TOP_SECRET' | 'SECRET' | 'CONFIDENTIAL' | 'UNCLASSIFIED' | string;
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
