export interface AccessSubject {
  id: string;
  organizationId: string;
  roles: string[];
  departments: string[];
  isSuperAdmin: boolean;
}

export interface AccessControlledDocument {
  id: string;
  organizationId: string;
  ownerId: string;
  departmentId: string | null;
  visibility: 'ORG_WIDE' | 'DEPARTMENT' | 'PRIVATE';
  scope?: 'PERSONAL' | 'ORGANIZATION';
  allowedRoles?: string[];
  deniedRoles?: string[];
  allowedUsers?: string[];
  deniedUsers?: string[];
  allowedDepartments?: string[];
  deniedDepartments?: string[];
}

/**
 * Zero-Trust document access policy — same semantics as the chunk-level
 * PermissionFilter used for Qdrant/BM25: organization MUST match, any
 * explicit deny (user/role/department) wins, then ownership or explicit
 * allow or visibility grants.
 *
 * For PERSONAL scope:
 * Access requires owner access OR explicit ACL inclusion (user/role/department).
 * General ORG_WIDE or DEPARTMENT visibility does NOT grant access to personal documents.
 *
 * This is enforced server-side on document metadata endpoints so that
 * authorization never depends on the client or on LLM instruction.
 */
export class DocumentAccessPolicy {
  public static canAccess(subject: AccessSubject, doc: AccessControlledDocument): boolean {
    if (!doc) return false;

    // 1. Tenant boundary
    if (doc.organizationId !== subject.organizationId) return false;

    // 2. Explicit deny wins — across all dimensions
    if (doc.deniedUsers && doc.deniedUsers.includes(subject.id)) return false;
    if (doc.deniedRoles && subject.roles.some((r) => doc.deniedRoles!.includes(r))) return false;
    if (doc.deniedDepartments && subject.departments.some((d) => doc.deniedDepartments!.includes(d))) return false;

    // 3. Super Admin of the same organization
    if (subject.isSuperAdmin) return true;

    // 4. Ownership
    if (doc.ownerId === subject.id) return true;

    // 5. Explicit user allow
    if (doc.allowedUsers && doc.allowedUsers.includes(subject.id)) return true;

    // 6. Explicit role allow
    if (doc.allowedRoles && subject.roles.some((r) => doc.allowedRoles!.includes(r))) return true;

    // 7. Explicit department allow
    if (doc.allowedDepartments && subject.departments.some((d) => doc.allowedDepartments!.includes(d))) return true;

    // 8. Scope Check: PERSONAL documents do NOT grant access via general visibility
    if (doc.scope === 'PERSONAL') {
      return false;
    }

    // 9. Visibility-based grant (ORGANIZATION scope)
    if (doc.visibility === 'ORG_WIDE') return true;
    if (doc.visibility === 'DEPARTMENT' && doc.departmentId && subject.departments.includes(doc.departmentId)) return true;

    // PRIVATE documents require explicit allowance (handled above) or ownership.
    return false;
  }
}