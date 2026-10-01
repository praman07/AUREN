import type {
  AurenDocument,
  ChatConversation,
  Connector,
  ConnectorPolicy,
  ConnectorDataItem,
  NotificationItem,
  SearchResult,
  UserProfile,
  Scope,
} from '../types';
import { useAuthStore } from '../core/auth/store/useAuthStore';

// Helper for dev mock token fallback (browser + Node safe)
const getAuthToken = (): string => {
  const token = useAuthStore.getState().token || (typeof window !== 'undefined' ? localStorage.getItem('auren_token') : null);
  if (token) return token;
  
  const mockUser = {
    id: 'user-northstar-praman',
    email: 'praman.bhogal@northstar-test.local',
    organizationId: 'org-northstar-technologies',
    industry: 'CORPORATE',
    role: 'Senior Backend Engineer',
    roles: ['Senior Backend Engineer'],
    departments: ['Engineering'],
    departmentId: 'dept-northstar-Engineering',
    isSuperAdmin: true,
  };
  const jsonStr = JSON.stringify(mockUser);
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(jsonStr)));
  }
  return '';
};

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const normalizedPath = path.startsWith('/api/v1/')
    ? path
    : path.startsWith('/api/')
    ? `/api/v1${path.slice(4)}`
    : `/api/v1${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${getAuthToken()}`);
  }

  return fetch(normalizedPath, {
    ...options,
    headers,
  });
}

// Automatically unbox backend `{ success: true, data: ... }` response wrappers
async function jsonOrData<T>(res: Response, defaultFallback?: T): Promise<T> {
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    let msg = `HTTP error ${res.status}`;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.error || parsed.message || msg;
    } catch {}
    if (defaultFallback !== undefined) return defaultFallback;
    throw new Error(msg);
  }
  const json = await res.json();
  if (json && typeof json === 'object' && 'data' in json && json.data !== undefined) {
    return json.data;
  }
  return json;
}

export const api = {
  // User profile & preferences
  async getProfile(): Promise<UserProfile> {
    const res = await authFetch('/api/auth/me');
    return jsonOrData<UserProfile>(res);
  },

  async updatePreferences(preferences: Partial<UserProfile['preferences']>): Promise<UserProfile['preferences']> {
    const res = await authFetch('/api/users/me/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });
    return jsonOrData<UserProfile['preferences']>(res);
  },

  // Documents
  async getDocuments(scope: Scope = 'all', search = ''): Promise<AurenDocument[]> {
    const params = new URLSearchParams();
    if (scope !== 'all') params.set('scope', scope);
    if (search) params.set('search', search);

    const res = await authFetch(`/api/documents?${params.toString()}`);
    return jsonOrData<AurenDocument[]>(res, []);
  },

  async getDocument(id: string): Promise<AurenDocument> {
    const res = await authFetch(`/api/documents/${id}`);
    return jsonOrData<AurenDocument>(res);
  },

  async uploadDocument(data: {
    title: string;
    filename: string;
    content?: string;
    scope: 'personal' | 'organization';
    type?: string;
    accessPolicy?: any;
  }): Promise<AurenDocument> {
    const res = await authFetch('/api/documents/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return jsonOrData<AurenDocument>(res);
  },

  async updateDocument(
    id: string,
    data: {
      title?: string;
      content?: string;
      scope?: 'personal' | 'organization';
      type?: string;
      accessPolicy?: any;
    }
  ): Promise<AurenDocument> {
    const res = await authFetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return jsonOrData<AurenDocument>(res);
  },

  async deleteDocument(id: string): Promise<{ success: boolean; id: string }> {
    const res = await authFetch(`/api/documents/${id}`, {
      method: 'DELETE',
    });
    return jsonOrData<{ success: boolean; id: string }>(res, { success: true, id });
  },

  // Connectors
  async getConnectors(): Promise<Connector[]> {
    const res = await authFetch('/api/connectors');
    return jsonOrData<Connector[]>(res, []);
  },

  async syncConnector(id: string): Promise<{ success: boolean; message: string; syncedAt: string }> {
    const res = await authFetch(`/api/connectors/${id}/sync`, {
      method: 'POST',
    });
    return jsonOrData<{ success: boolean; message: string; syncedAt: string }>(res, {
      success: true,
      message: 'Synced',
      syncedAt: new Date().toISOString(),
    });
  },

  async disconnectConnector(id: string): Promise<{ success: boolean }> {
    const res = await authFetch(`/api/connectors/${id}/disconnect`, {
      method: 'POST',
    });
    return jsonOrData<{ success: boolean }>(res, { success: true });
  },

  async updateConnectorPolicy(id: string, policy: Partial<ConnectorPolicy>): Promise<ConnectorPolicy> {
    const res = await authFetch(`/api/connectors/${id}/policy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    return jsonOrData<ConnectorPolicy>(res);
  },

  async getConnectorData(params?: {
    scope?: string;
    connectorId?: string;
    search?: string;
    type?: string;
    status?: string;
    sort?: string;
  }): Promise<ConnectorDataItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.scope && params.scope !== 'all') searchParams.set('scope', params.scope);
    if (params?.connectorId && params.connectorId !== 'all') searchParams.set('connectorId', params.connectorId);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.type && params.type !== 'all') searchParams.set('type', params.type);
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.sort) searchParams.set('sort', params.sort);

    const query = searchParams.toString();
    const res = await authFetch(`/api/connectors/data${query ? `?${query}` : ''}`);
    return jsonOrData<ConnectorDataItem[]>(res, []);
  },

  async syncConnectorItem(id: string): Promise<{ success: boolean; item: ConnectorDataItem }> {
    const res = await authFetch(`/api/connectors/data/${id}/sync`, {
      method: 'POST',
    });
    return jsonOrData<{ success: boolean; item: ConnectorDataItem }>(res);
  },

  // Chat
  async getConversations(): Promise<ChatConversation[]> {
    const res = await authFetch('/api/chat/conversations');
    const data = await jsonOrData<any>(res, []);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.conversations)) return data.conversations;
    return [];
  },

  async getConversation(id: string): Promise<ChatConversation> {
    const res = await authFetch(`/api/chat/conversations/${id}`);
    const data = await jsonOrData<any>(res);
    return data?.conversation || data;
  },

  async updateConversation(
    id: string,
    data: { title?: string; pinned?: boolean }
  ): Promise<ChatConversation> {
    const res = await authFetch(`/api/chat/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return jsonOrData<ChatConversation>(res);
  },

  async deleteConversation(id: string): Promise<{ success: boolean }> {
    const res = await authFetch(`/api/chat/conversations/${id}`, {
      method: 'DELETE',
    });
    return jsonOrData<{ success: boolean }>(res, { success: true });
  },

  // Search
  async search(query: string, scope: Scope = 'all', type = 'all'): Promise<{ query: string; results: SearchResult[]; total: number }> {
    const params = new URLSearchParams({ q: query, scope, type });
    const res = await authFetch(`/api/search?${params.toString()}`);
    return jsonOrData<{ query: string; results: SearchResult[]; total: number }>(res, { query, results: [], total: 0 });
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await authFetch('/api/notifications');
    return jsonOrData<NotificationItem[]>(res, []);
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await authFetch(`/api/notifications/${id}/read`, {
      method: 'POST',
    });
    return jsonOrData<{ success: boolean }>(res, { success: true });
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    const res = await authFetch('/api/notifications/read-all', {
      method: 'POST',
    });
    return jsonOrData<{ success: boolean }>(res, { success: true });
  },

  // Auth & Personas
  async getPersonas(): Promise<UserProfile[]> {
    const res = await authFetch('/api/auth/personas');
    return jsonOrData<UserProfile[]>(res, []);
  },

  async login(personaId?: string, email?: string): Promise<{ success: boolean; user: UserProfile }> {
    const res = await authFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId, email }),
    });
    return jsonOrData<{ success: boolean; user: UserProfile }>(res);
  },

  async logout(): Promise<{ success: boolean }> {
    const res = await authFetch('/api/auth/logout', { method: 'POST' });
    return jsonOrData<{ success: boolean }>(res, { success: true });
  },

  async switchPersona(personaId: string): Promise<{ success: boolean; user: UserProfile }> {
    const res = await authFetch('/api/auth/switch-persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId }),
    });
    return jsonOrData<{ success: boolean; user: UserProfile }>(res);
  },

  // Departments Registry
  async getDepartments(): Promise<any[]> {
    const res = await authFetch('/api/departments');
    return jsonOrData<any[]>(res, []);
  },

  async executeDepartmentAction(deptId: string, data: any): Promise<any> {
    const res = await authFetch(`/api/departments/${deptId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return jsonOrData<any>(res);
  },

  // Super Admin Directives & Enterprise Knowledge
  async broadcastSuperAdminDirective(data: { title: string; message: string; targetDepartmentIds?: string[] }): Promise<any> {
    const res = await authFetch('/api/super-admin/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return jsonOrData<any>(res);
  },

  async getSuperAdminAuditLog(): Promise<any[]> {
    const res = await authFetch('/api/super-admin/audit-log');
    return jsonOrData<any[]>(res, []);
  },

  async publishEnterpriseDoc(data: {
    title: string;
    filename?: string;
    content?: string;
    summary?: string;
    notifyDepartmentHeads?: boolean;
  }): Promise<AurenDocument> {
    const res = await authFetch('/api/super-admin/enterprise-docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return jsonOrData<AurenDocument>(res);
  },
};
