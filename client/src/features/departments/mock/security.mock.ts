import type { Department, Role, PermissionKey, Group, OrganizationPolicy } from '../types';

export const mockDepartments: Department[] = [
  {
    id: 'dept_1',
    name: 'Engineering',
    manager: 'Sarah Jenkins',
    memberCount: 42,
    documentCount: 1560,
    storageUsedGB: 120.5,
    aiTokensUsed: 5200000,
    securityLevel: 'CONFIDENTIAL',
    status: 'ACTIVE'
  },
  {
    id: 'dept_2',
    name: 'Legal',
    manager: 'Elena Rodriguez',
    memberCount: 8,
    documentCount: 840,
    storageUsedGB: 45.2,
    aiTokensUsed: 850000,
    securityLevel: 'STRICTLY_CONFIDENTIAL',
    status: 'ACTIVE'
  },
  {
    id: 'dept_3',
    name: 'Human Resources',
    manager: 'Michael Scott',
    memberCount: 12,
    documentCount: 420,
    storageUsedGB: 15.8,
    aiTokensUsed: 120000,
    securityLevel: 'INTERNAL',
    status: 'ACTIVE'
  },
  {
    id: 'dept_4',
    name: 'Special Projects',
    manager: 'James Holden',
    memberCount: 5,
    documentCount: 125,
    storageUsedGB: 8.4,
    aiTokensUsed: 9800000,
    securityLevel: 'TOP_SECRET',
    status: 'ACTIVE'
  },
  {
    id: 'dept_5',
    name: 'Marketing',
    manager: 'Pending',
    memberCount: 24,
    documentCount: 3200,
    storageUsedGB: 450.0,
    aiTokensUsed: 450000,
    securityLevel: 'PUBLIC',
    status: 'ARCHIVED'
  }
];

export const mockRoles: Role[] = [
  { id: 'SUPER_ADMIN', name: 'Super Admin', isCustom: false, isSystem: true },
  { id: 'ORG_ADMIN', name: 'Organization Admin', isCustom: false, isSystem: false },
  { id: 'DEPT_ADMIN', name: 'Department Admin', isCustom: false, isSystem: false },
  { id: 'HR_MANAGER', name: 'HR Manager', isCustom: false, isSystem: false },
  { id: 'LEGAL', name: 'Legal Counsel', isCustom: false, isSystem: false },
  { id: 'ENGINEER', name: 'Engineer', isCustom: true, isSystem: false },
  { id: 'USER', name: 'Employee', isCustom: false, isSystem: false },
  { id: 'GUEST', name: 'Guest', isCustom: false, isSystem: false },
];

export const allPermissions: PermissionKey[] = [
  'DOC_READ', 'DOC_CREATE', 'DOC_UPDATE', 'DOC_DELETE', 'DOC_UPLOAD', 'DOC_DOWNLOAD', 'DOC_SHARE',
  'USER_INVITE', 'DEPT_MANAGE', 'ORG_MANAGE', 'ANALYTICS_VIEW', 'AUDIT_LOGS', 'AI_MANAGE', 'PERM_MANAGE'
];

// Seed some initial matrix state
export const mockPermissionMatrix: Record<string, Record<string, boolean>> = {};
mockRoles.forEach(role => {
  mockPermissionMatrix[role.id] = {};
  allPermissions.forEach(perm => {
    // Give super admin everything
    if (role.id === 'SUPER_ADMIN') mockPermissionMatrix[role.id][perm] = true;
    // Give user basic read/create
    else if (role.id === 'USER' && (perm === 'DOC_READ' || perm === 'DOC_CREATE' || perm === 'DOC_UPLOAD')) mockPermissionMatrix[role.id][perm] = true;
    // Guests only read
    else if (role.id === 'GUEST' && perm === 'DOC_READ') mockPermissionMatrix[role.id][perm] = true;
    else mockPermissionMatrix[role.id][perm] = false;
  });
});

export const mockGroups: Group[] = [
  { id: 'grp_1', name: 'Core Engineering', memberCount: 15, roles: ['ENGINEER', 'USER'] },
  { id: 'grp_2', name: 'Executive Team', memberCount: 5, roles: ['ORG_ADMIN'] },
];

export const mockPolicy: OrganizationPolicy = {
  defaultClearance: 'INTERNAL',
  passwordPolicy: 'Strict (12 chars, special, numbers)',
  mfaRequired: true,
  sessionTimeoutMinutes: 120,
  documentRetentionDays: 365,
  aiUsageEnabled: true,
};
