import React, { useEffect } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
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

      const existingToken = localStorage.getItem('auren_token');

      if (!isClerkSignedIn || !user) {
        if (existingToken) {
          try {
            const response = await fetch('/api/v1/auth/me', {
              headers: {
                Authorization: `Bearer ${existingToken}`
              }
            });
            if (response.ok) {
              const json = await safeJsonResponse(response);
              if (isMounted && json && json.success && json.data) {
                const u = json.data;
                setAuth(true, {
                  id: u.id,
                  email: u.email,
                  firstName: u.firstName || 'Authorized',
                  lastName: u.lastName || 'User',
                  organizationId: u.organizationId,
                  industry: u.industry || 'CORPORATE',
                  departments: u.departments || [],
                  role: u.role || 'MEMBER',
                  roles: u.roles || [],
                  departmentId: u.departmentId || null,
                  isSuperAdmin: Boolean(u.isSuperAdmin),
                  clearanceLevel: u.isSuperAdmin ? 'TOP_SECRET' : 'SECRET',
                }, existingToken);
                setLoaded(true);
                return;
              }
            }
          } catch (e) {
            console.error('Failed to authenticate with local token', e);
          }
        }
        if (isMounted) {
          localStorage.removeItem('auren_token');
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

        const data = await safeJsonResponse(response);
        const enterpriseUser = data?.data;

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
