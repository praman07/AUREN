import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

// Mocks the Clerk useSignIn hook
export const useSignIn = () => {
  const { setAuth } = useAuthStore();
  const isLoaded = true;

  const signIn = {
    create: async (params: { identifier?: string; password?: string }) => {
      // Simulate network request
      await new Promise(res => setTimeout(res, 800));
      
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
        clearanceLevel: 'L5' as any,
      };

      setAuth(true, mockUser);
      return { status: 'complete' };
    }
  };

  return { isLoaded, signIn };
};

// Mocks the Clerk useSignUp hook
export const useSignUp = () => {
  const { setAuth } = useAuthStore();
  const isLoaded = true;

  const signUp = {
    create: async (params: { emailAddress?: string; password?: string }) => {
      await new Promise(res => setTimeout(res, 800));
      
      const mockUser = {
        id: 'usr_mock456',
        email: params.emailAddress || 'newuser@acme.com',
        firstName: 'New',
        lastName: 'User',
        organizationId: 'org_123',
        industry: 'CORPORATE',
        departments: ['dept_unassigned'],
        role: 'MEMBER' as any,
        clearanceLevel: 'L1' as any,
      };

      setAuth(true, mockUser);
      return { status: 'complete' };
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
    // Simulate initial session resolution on app load
    const timer = setTimeout(() => {
      // By default, let's start signed out for this demo, or we can mock an existing session.
      // We will start signed out to show the login screen.
      setAuth(false, null);
      setLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [setAuth, setLoaded]);

  return <>{children}</>;
};
