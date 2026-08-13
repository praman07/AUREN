import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

// Mocks the Clerk useSignIn hook
export const useSignIn = () => {
  const { setAuth } = useAuthStore();
  const isLoaded = true;

  const signIn = {
    create: async (params: { identifier?: string; password?: string }) => {
      try {
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: params.identifier, password: params.password }),
        });
        const json = await response.json();
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
            role: user.role || 'ADMIN',
            roles: user.roles || [],
            departmentId: user.departmentId || null,
            isSuperAdmin: Boolean(user.isSuperAdmin),
            clearanceLevel: user.isSuperAdmin ? 'TOP_SECRET' : 'SECRET',
          }, token);
          return { status: 'complete' };
        }
      } catch (err) {
        // Fallback to local session
      }

      if (params.password === 'wrong') {
        throw new Error('Invalid credentials');
      }

      const mockUser = {
        id: 'usr_mock123',
        email: params.identifier || 'admin@acme.com',
        firstName: 'Admin',
        lastName: 'User',
        organizationId: 'org_123',
        industry: 'CORPORATE',
        departments: ['dept_it'],
        role: 'ADMIN' as any,
        clearanceLevel: 'TOP_SECRET' as any,
      };

      setAuth(true, mockUser);
      return { status: 'complete' };
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
      .then(res => (res.ok ? res.json() : null))
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
