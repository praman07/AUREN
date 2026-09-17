import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, Scope } from '../types';
import { api } from '../services/api';

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [personas, setPersonas] = useState<UserProfile[]>([]);
  const [activeScope, setActiveScopeState] = useState<Scope>('organization');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const fetchPersonas = useCallback(async () => {
    try {
      const data = await api.getPersonas();
      setPersonas(data);
    } catch (err) {
      console.error('Error fetching personas:', err);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
      setIsAuthenticated(true);
      const savedScope = localStorage.getItem('auren_scope') as Scope;
      if (savedScope && ['personal', 'organization', 'departmental', 'enterprise', 'all'].includes(savedScope)) {
        setActiveScopeState(savedScope);
      } else if (profile.preferences.defaultScope) {
        setActiveScopeState(profile.preferences.defaultScope);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchPersonas();
  }, [fetchUser, fetchPersonas]);

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
      if (res.user.role === 'super_admin') {
        setActiveScope('enterprise');
      } else if (res.user.role === 'dept_head') {
        setActiveScope('organization');
      }
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const switchPersona = async (personaId: string) => {
    setIsLoading(true);
    try {
      const res = await api.switchPersona(personaId);
      setUser(res.user);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Switch persona error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPreferences = async (prefs: Partial<UserProfile['preferences']>) => {
    try {
      const updated = await api.updatePreferences(prefs);
      if (user) {
        setUser({
          ...user,
          preferences: { ...user.preferences, ...updated },
        });
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
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
        refreshProfile: fetchUser,
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
