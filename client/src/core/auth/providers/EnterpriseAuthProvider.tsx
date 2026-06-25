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
        // In the future:
        // const token = await getToken();
        // const response = await axios.post('/api/v1/auth/sync', {}, { headers: { Authorization: `Bearer ${token}` }});
        
        // Mocking the Backend Sync Delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const enterpriseUser = {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          firstName: user.firstName || 'Authorized',
          lastName: user.lastName || 'User',
          organizationId: 'org_123',
          departmentId: 'dept_it',
          roles: ['ORG_ADMIN'] as any,
        };

        if (isMounted) {
          setAuth(true, enterpriseUser);
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
