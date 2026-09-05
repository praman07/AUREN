import { prisma } from '../../infrastructure/database/prisma';
import { AccessSubject } from './DocumentAccessPolicy';

export interface EvaluateConnectorResourceInput {
  organizationId: string;
  connectedAccountId?: string | null;
  provider?: string | null;
  resourcePattern?: string | null; // e.g. "owner/repo" for GitHub
  sourceUrl?: string | null;
  externalId?: string | null;
}

export type ConnectorPolicyEvaluationResult = 'ALLOW' | 'DENY' | 'NEUTRAL';

export class ConnectorPolicyService {
  /**
   * Evaluates authoritative AUREN Connector Policy for a subject and connector resource.
   * Precedence:
   * 1. Tenant Boundary: subject.organizationId === resource.organizationId
   * 2. Explicit DENY (user / role / department) -> DENY (overrides everything)
   * 3. Explicit ALLOW (user / role / department) -> ALLOW
   * 4. Policy exists for resource but user has no grant -> DENY (Default Deny)
   * 5. No policy exists for resource -> NEUTRAL (defers to source / document access policy)
   */
  public static async evaluateAccess(
    subject: AccessSubject,
    resource: EvaluateConnectorResourceInput,
    cachedPolicies?: any[]
  ): Promise<ConnectorPolicyEvaluationResult> {
    // 1. Tenant Isolation: strict organization boundary
    if (!subject.organizationId || subject.organizationId !== resource.organizationId) {
      return 'DENY';
    }

    const repoPattern = this.extractRepoPattern(resource);
    if (!repoPattern) {
      return 'NEUTRAL';
    }

    // 2. Fetch policies (use pre-fetched array if passed during bulk evaluation)
    let policies: any[] = [];
    if (cachedPolicies) {
      policies = cachedPolicies.filter(
        (p) =>
          p.organizationId === resource.organizationId &&
          p.resourcePattern.toLowerCase() === repoPattern.toLowerCase() &&
          (!resource.connectedAccountId || p.connectedAccountId === resource.connectedAccountId)
      );
    } else {
      policies = await prisma.connectorPolicy.findMany({
        where: {
          organizationId: resource.organizationId,
          resourcePattern: repoPattern,
          ...(resource.connectedAccountId ? { connectedAccountId: resource.connectedAccountId } : {}),
        },
      });
    }

    if (!policies || policies.length === 0) {
      return 'NEUTRAL';
    }

    // Evaluate policies matching this repository
    for (const policy of policies) {
      // 3. Explicit DENY wins across all dimensions (user, role, department)
      if (policy.deniedUsers && policy.deniedUsers.includes(subject.id)) {
        return 'DENY';
      }
      if (policy.deniedRoles && subject.roles && subject.roles.some((r: string) => policy.deniedRoles.includes(r))) {
        return 'DENY';
      }
      if (policy.deniedDepartments && subject.departments && subject.departments.some((d: string) => policy.deniedDepartments.includes(d))) {
        return 'DENY';
      }

      // 4. Explicit ALLOW check (user, role, department)
      if (policy.allowedUsers && policy.allowedUsers.includes(subject.id)) {
        return 'ALLOW';
      }
      if (policy.allowedRoles && subject.roles && subject.roles.some((r: string) => policy.allowedRoles.includes(r))) {
        return 'ALLOW';
      }
      if (policy.allowedDepartments && subject.departments && subject.departments.some((d: string) => policy.allowedDepartments.includes(d))) {
        return 'ALLOW';
      }
    }

    // 5. Default DENY: Policy exists for this repository, but subject is neither allowed nor explicitly denied
    return 'DENY';
  }

  /**
   * Helper to extract "owner/repo" from resource metadata.
   */
  public static extractRepoPattern(resource: EvaluateConnectorResourceInput): string | null {
    if (resource.resourcePattern && resource.resourcePattern.includes('/')) {
      return resource.resourcePattern.trim().toLowerCase();
    }
    if (resource.externalId && resource.externalId.startsWith('github://')) {
      const parts = resource.externalId.replace('github://', '').split('/');
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`.toLowerCase();
      }
    }
    if (resource.sourceUrl && resource.sourceUrl.includes('github.com/')) {
      const match = resource.sourceUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
      if (match && match[1]) {
        return match[1].replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();
      }
    }
    return null;
  }
}
