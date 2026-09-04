import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

const safeJsonResponse = async (res: Response): Promise<any> => {
  try {
    const text = await res.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
};

// Mocks the Clerk useSignIn hook
export const useSignIn = () => {
  const { setAuth } = useAuthStore();
  const isLoaded = true;

  const signIn = {
    create: async (params: { identifier?: string; password?: string }) => {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: params.identifier, password: params.password }),
      });
      const json = (await safeJsonResponse(response)) || {};
      if (response.ok && json.success && json.data) {
        const user = json.data.user || json.data;
        const token = json.data.token;
        setAuth(true, {
          id: user.id || 'usr_logged_in',
          email: user.email || params.identifier || '',
          firstName: user.firstName || 'Authorized',
          lastName: user.lastName || 'User',
          organizationId: user.organizationId || 'org_default',
          industry: user.industry || 'CORPORATE',
          departments: user.departments || [],
          role: user.role || 'MEMBER',
          roles: user.roles || [],
          departmentId: user.departmentId || null,
          isSuperAdmin: Boolean(user.isSuperAdmin),
          clearanceLevel: user.isSuperAdmin ? 'TOP_SECRET' : 'SECRET',
        }, token);
        return { status: 'complete' };
      }

      if (!response.ok && response.status >= 500) {
        throw new Error(`Backend server unreachable (HTTP ${response.status}). Please ensure server is running on port 5000.`);
      }

      throw new Error(json.error || json.message || 'Invalid credentials or authentication failed');
    }
  };

  return { isLoaded, signIn };
};

// Mocks the Clerk useSignUp hook
export const useSignUp = () => {
  const isLoaded = true;

  const signUp = {
    create: async (_params: { emailAddress?: string; password?: string }) => {
      throw new Error('Public registration is disabled. Please contact your Organization Super Admin or initialize a new workspace via Onboarding.');
    }
  };

  return { isLoaded, signUp };
};

// Mocks the Clerk useAuth hook
export const useAuth = () => {
  const { isLoaded, isSignedIn, signOut } = useAuthStore();
  return { isLoaded, isSignedIn, signOut: async () => signOut() };
};

// Mock Provider that initializes the session
export const MockClerkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setLoaded, setAuth } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    const existingToken = localStorage.getItem('auren_token');

    if (!existingToken) {
      setAuth(false, null);
      setLoaded(true);
      return;
    }

    fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${existingToken}` },
    })
      .then(res => (res && res.ok ? safeJsonResponse(res) : null))
      .then(json => {
        if (isMounted) {
          if (json && json.success && json.data) {
            const u = json.data;
            setAuth(true, {
              id: u.id,
              email: u.email,
              firstName: u.firstName || 'User',
              lastName: u.lastName || '',
              organizationId: u.organizationId,
              industry: u.industry || 'CORPORATE',
              departments: u.departments || [],
              role: u.role || 'ADMIN',
              roles: u.roles || [],
              departmentId: u.departmentId || null,
              isSuperAdmin: Boolean(u.isSuperAdmin),
              clearanceLevel: u.isSuperAdmin ? 'TOP_SECRET' : 'SECRET',
            }, existingToken);
          } else {
            localStorage.removeItem('auren_token');
            setAuth(false, null);
          }
          setLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          localStorage.removeItem('auren_token');
          setAuth(false, null);
          setLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [setAuth, setLoaded]);

  return <>{children}</>;
};
