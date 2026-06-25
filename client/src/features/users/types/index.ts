export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'SUSPENDED' | 'LOCKED';
export type EnterpriseRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'DEPT_MANAGER' | 'USER' | 'GUEST';

export interface UserDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  organization: string;
  department: string;
  roles: EnterpriseRole[];
  clearanceLevel: number; // e.g., 1 to 5
  status: UserStatus;
  lastActive: string | null;
  createdAt: string;
}
