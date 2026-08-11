export type ClearanceLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'STRICTLY_CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
export type DepartmentStatus = 'ACTIVE' | 'ARCHIVED';

export interface Department {
  id: string;
  name: string;
  manager: string;
  memberCount: number;
  documentCount: number;
  storageUsedGB: number;
  aiTokensUsed: number;
  securityLevel: ClearanceLevel;
  status: DepartmentStatus;
}

export type PermissionKey = 
  | 'DOC_READ' | 'DOC_CREATE' | 'DOC_UPDATE' | 'DOC_DELETE' | 'DOC_UPLOAD' | 'DOC_DOWNLOAD' | 'DOC_SHARE'
  | 'USER_INVITE' | 'DEPT_MANAGE' | 'ORG_MANAGE' | 'ANALYTICS_VIEW' | 'AUDIT_LOGS' | 'AI_MANAGE' | 'PERM_MANAGE';

export interface Role {
  id: string;
  name: string;
  isCustom: boolean;
  isSystem: boolean;
}

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  roles: string[];
}

export interface OrganizationPolicy {
  defaultClearance: ClearanceLevel;
  passwordPolicy: string;
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  documentRetentionDays: number;
  aiUsageEnabled: boolean;
}
