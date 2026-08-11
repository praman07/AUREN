import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

const API_BASE = '/api/v1';

export function useApi() {
  const { getToken } = useAuth();

  const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken();
    
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Auto-set Content-Type for JSON unless it's FormData (which needs browser to set boundary)
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `API request failed with status ${response.status}`);
    }

    // 204 No Content won't have JSON body
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }, [getToken]);

  return {
    get: (endpoint: string, options?: RequestInit) => fetchWithAuth(endpoint, { ...options, method: 'GET' }),
    post: (endpoint: string, body: any, options?: RequestInit) => fetchWithAuth(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
    patch: (endpoint: string, body: any, options?: RequestInit) => fetchWithAuth(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
    del: (endpoint: string, options?: RequestInit) => fetchWithAuth(endpoint, { ...options, method: 'DELETE' }),
  };
}
