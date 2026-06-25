export type OrganizationStatus = 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
export type OrganizationPlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  industry: string;
  domain: string;
  timezone: string;
  
  // Analytics / Stats
  storageUsedGB: number;
  storageLimitGB: number;
  userCount: number;
  departmentCount: number;
  aiTokensUsed: number;
  
  plan: OrganizationPlan;
  status: OrganizationStatus;
  
  createdAt: string;
  updatedAt: string;
}
