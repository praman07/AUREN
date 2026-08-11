export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'READ' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'PERMISSION_GRANT' 
  | 'PERMISSION_REVOKE' 
  | 'EMBEDDING_GENERATED' 
  | 'INDEXING_COMPLETED' 
  | 'INDEXING_FAILED';

export interface AuditLog {
  id: string;
  organizationId: string;
  actorId: string | null;
  action: AuditAction;
  resourceId: string | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
