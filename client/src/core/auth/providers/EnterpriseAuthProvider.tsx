import React, { useEffect } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useAuthStore } from '../store/useAuthStore';

/**
 * EnterpriseAuthProvider acts as the bridge between Clerk (Identity)
 * and our internal EKOS Backend (Authorization/RBAC).
 */
export const EnterpriseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn, getToken } = useClerkAuth();
  const { user } = useUser();
  const { setAuth, setLoaded } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const syncIdentity = async () => {
      if (!isClerkLoaded) return;

      if (!isClerkSignedIn || !user) {
        if (isMounted) {
          setAuth(false, null);
          setLoaded(true);
        }
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('No token available');
        }

        const response = await fetch('/api/v1/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Backend authorization failed');
        }

        const data = await response.json();
        const enterpriseUser = data.data;

        // Optionally merge with clerk user fields if needed, but we trust backend
        if (isMounted) {
          setAuth(true, {
            ...enterpriseUser,
            email: user.primaryEmailAddress?.emailAddress || '',
            firstName: user.firstName || 'Authorized',
            lastName: user.lastName || 'User',
          });
          setLoaded(true);
        }
      } catch (error) {
        console.error('Failed to sync identity with EKOS backend', error);
        if (isMounted) {
          setAuth(false, null);
          setLoaded(true);
        }
      }
    };

    syncIdentity();

    return () => {
      isMounted = false;
    };
  }, [isClerkLoaded, isClerkSignedIn, user, getToken, setAuth, setLoaded]);

  return <>{children}</>;
};
