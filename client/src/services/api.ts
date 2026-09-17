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


export const api = {
  // User profile & preferences
  async getProfile(): Promise<UserProfile> {
    const res = await fetch('/api/me');
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async updatePreferences(preferences: Partial<UserProfile['preferences']>): Promise<UserProfile['preferences']> {
    const res = await fetch('/api/me/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    return res.json();
  },

  // Documents
  async getDocuments(scope: Scope = 'all', search = ''): Promise<AurenDocument[]> {
    const params = new URLSearchParams();
    if (scope !== 'all') params.set('scope', scope);
    if (search) params.set('search', search);

    const res = await fetch(`/api/documents?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async getDocument(id: string): Promise<AurenDocument> {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch document details');
    return res.json();
  },

  async uploadDocument(data: {
    title: string;
    filename: string;
    content?: string;
    scope: 'personal' | 'organization';
    type?: string;
    accessPolicy?: any;
  }): Promise<AurenDocument> {
    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
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
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update document');
    return res.json();
  },

  async deleteDocument(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  // Connectors
  async getConnectors(): Promise<Connector[]> {
    const res = await fetch('/api/connectors');
    if (!res.ok) throw new Error('Failed to fetch connectors');
    return res.json();
  },

  async syncConnector(id: string): Promise<{ success: boolean; message: string; syncedAt: string }> {
    const res = await fetch(`/api/connectors/${id}/sync`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to trigger connector sync');
    return res.json();
  },

  async updateConnectorPolicy(id: string, policy: Partial<ConnectorPolicy>): Promise<ConnectorPolicy> {
    const res = await fetch(`/api/connectors/${id}/policy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    if (!res.ok) throw new Error('Failed to update connector policy');
    return res.json();
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
    const res = await fetch(`/api/connectors/data${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch connector data items');
    return res.json();
  },

  async syncConnectorItem(id: string): Promise<{ success: boolean; item: ConnectorDataItem }> {
    const res = await fetch(`/api/connectors/data/${id}/sync`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to sync connector item');
    return res.json();
  },

  // Chat
  async getConversations(): Promise<ChatConversation[]> {
    const res = await fetch('/api/chat/conversations');
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async getConversation(id: string): Promise<ChatConversation> {
    const res = await fetch(`/api/chat/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
  },

  async updateConversation(
    id: string,
    data: { title?: string; pinned?: boolean }
  ): Promise<ChatConversation> {
    const res = await fetch(`/api/chat/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    return res.json();
  },

  async deleteConversation(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/chat/conversations/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
    return res.json();
  },

  // Search
  async search(query: string, scope: Scope = 'all', type = 'all'): Promise<{ query: string; results: SearchResult[]; total: number }> {
    const params = new URLSearchParams({ q: query, scope, type });
    const res = await fetch(`/api/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to execute search');
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch('/api/notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    const res = await fetch('/api/notifications/read-all', {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to mark all as read');
    return res.json();
  },

  // Auth & Personas
  async getPersonas(): Promise<UserProfile[]> {
    const res = await fetch('/api/auth/personas');
    if (!res.ok) throw new Error('Failed to fetch personas');
    return res.json();
  },

  async login(personaId?: string, email?: string): Promise<{ success: boolean; user: UserProfile }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId, email }),
    });
    if (!res.ok) throw new Error('Failed to log in');
    return res.json();
  },

  async logout(): Promise<{ success: boolean }> {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to log out');
    return res.json();
  },

  async switchPersona(personaId: string): Promise<{ success: boolean; user: UserProfile }> {
    const res = await fetch('/api/auth/switch-persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId }),
    });
    if (!res.ok) throw new Error('Failed to switch persona');
    return res.json();
  },

  // Departments Registry
  async getDepartments(): Promise<any[]> {
    const res = await fetch('/api/departments');
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json();
  },

  async executeDepartmentAction(deptId: string, data: any): Promise<any> {
    const res = await fetch(`/api/departments/${deptId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to execute department action');
    return res.json();
  },

  // Super Admin Directives & Enterprise Knowledge
  async broadcastSuperAdminDirective(data: { title: string; message: string; targetDepartmentIds?: string[] }): Promise<any> {
    const res = await fetch('/api/super-admin/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to broadcast directive');
    return res.json();
  },

  async getSuperAdminAuditLog(): Promise<any[]> {
    const res = await fetch('/api/super-admin/audit-log');
    if (!res.ok) throw new Error('Failed to fetch Super Admin audit log');
    return res.json();
  },

  async publishEnterpriseDoc(data: {
    title: string;
    filename?: string;
    content?: string;
    summary?: string;
    notifyDepartmentHeads?: boolean;
  }): Promise<AurenDocument> {
    const res = await fetch('/api/super-admin/enterprise-docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to publish enterprise document');
    return res.json();
  },
};
