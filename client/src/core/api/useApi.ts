import { useCallback } from 'react';
import { useAuthStore } from '../auth/store/useAuthStore';

const API_BASE = '/api/v1';

export function useApi() {
  const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    let token = useAuthStore.getState().token || (typeof window !== 'undefined' ? localStorage.getItem('auren_token') : null);

    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Auto-set Content-Type for JSON unless it's FormData
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // If unauthorized, clear auth state so UI redirects to login
      useAuthStore.getState().signOut();
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Unauthorized session');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `API request failed with status ${response.status}`);
    }

    // 204 No Content won't have JSON body
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }, []);

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
