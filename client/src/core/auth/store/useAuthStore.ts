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
  roles?: string[];
  departmentId?: string | null;
  isSuperAdmin?: boolean;
  clearanceLevel: 'TOP_SECRET' | 'SECRET' | 'CONFIDENTIAL' | 'UNCLASSIFIED' | string;
}

interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  token: string | null;
  user: EnterpriseUser | null;
  setAuth: (isSignedIn: boolean, user: EnterpriseUser | null, token?: string | null) => void;
  setLoaded: (isLoaded: boolean) => void;
  signOut: () => void;
}

const initialToken = typeof window !== 'undefined' ? localStorage.getItem('auren_token') : null;

export const useAuthStore = create<AuthState>((set) => ({
  isLoaded: false,
  isSignedIn: Boolean(initialToken),
  token: initialToken,
  user: null,
  setAuth: (isSignedIn, user, token = null) => {
    if (token) {
      localStorage.setItem('auren_token', token);
    } else if (!isSignedIn) {
      localStorage.removeItem('auren_token');
    }
    set({ isSignedIn, user, token: token || (isSignedIn ? localStorage.getItem('auren_token') : null) });
  },
  setLoaded: (isLoaded) => set({ isLoaded }),
  signOut: () => {
    localStorage.removeItem('auren_token');
    set({ isSignedIn: false, user: null, token: null });
  },
}));

