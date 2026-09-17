import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { UserProfile, Scope } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../core/auth/store/useAuthStore';

interface AuthContextType {
  user: UserProfile | null;
  personas: UserProfile[];
  activeScope: Scope;
  setActiveScope: (scope: Scope) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (personaId?: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchPersona: (personaId: string) => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserProfile['preferences']>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storeUser = useAuthStore((state) => state.user);
  const signOutStore = useAuthStore((state) => state.signOut);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [personas, setPersonas] = useState<UserProfile[]>([]);
  const [activeScope, setActiveScopeState] = useState<Scope>('organization');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Sync state from storeUser
  useEffect(() => {
    if (storeUser) {
      const isSuperAdmin = Boolean(storeUser.isSuperAdmin || storeUser.role === 'ADMIN');
      setUser({
        id: storeUser.id,
        name: `${storeUser.firstName || ''} ${storeUser.lastName || ''}`.trim() || storeUser.email,
        firstName: storeUser.firstName || 'User',
        email: storeUser.email,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: isSuperAdmin ? 'super_admin' : 'member',
        department: storeUser.departments?.[0] || 'Core Architecture',
        isSuperAdmin,
        organization: {
          id: storeUser.organizationId || 'org_1',
          name: 'Northstar Technologies',
          domain: 'northstar-test.local',
        },
        preferences: {
          theme: 'light',
          defaultScope: 'organization',
          defaultChatBehavior: 'technical',
          realtimeSync: true,
          notifyOnDocumentReady: true,
          notifyOnConnectorSync: true,
        },
      });
      setIsAuthenticated(true);
    }
  }, [storeUser]);

  const fetchPersonas = useCallback(async () => {
    try {
      const data = await api.getPersonas();
      setPersonas(data);
    } catch (err) {
      // fallback mock personas
    }
  }, []);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const setActiveScope = (scope: Scope) => {
    setActiveScopeState(scope);
    localStorage.setItem('auren_scope', scope);
  };

  const login = async (personaId?: string, email?: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(personaId, email);
      setUser(res.user);
      setIsAuthenticated(true);
    } catch (err) {
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    signOutStore();
    setUser(null);
    setIsAuthenticated(false);
  };

  const switchPersona = async (personaId: string) => {
    setIsLoading(true);
    try {
      const res = await api.switchPersona(personaId);
      setUser(res.user);
    } catch (err) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPreferences = async (prefs: Partial<UserProfile['preferences']>) => {
    if (user) {
      setUser({
        ...user,
        preferences: { ...user.preferences, ...prefs },
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        personas,
        activeScope,
        setActiveScope,
        isLoading,
        isAuthenticated,
        login,
        logout,
        switchPersona,
        updateUserPreferences,
        refreshProfile: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
