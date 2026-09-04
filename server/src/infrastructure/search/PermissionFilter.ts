import { SearchRequest } from '../../domain/retrieval/types';

export class PermissionFilter {
  public buildVectorFilter(request: SearchRequest): any {
    // Zero-Trust Fusion: 
    // 1. MUST NOT match deniedUsers, deniedRoles, or deniedDepartments
    // 2. MUST match organizationId
    // 3. Scope handling (PERSONAL vs ORGANIZATION)

    const mustConditions: any[] = [
      { key: 'organizationId', match: { value: request.organizationId } }
    ];

    if (request.scope) {
      mustConditions.push({ key: 'scope', match: { value: request.scope } });
    }

    const shouldConditions: any[] = [];

    if (request.scope === 'PERSONAL') {
      // PERSONAL Scope: strictly restricted to Owner OR Explicit ACL shares
      if (request.userId) {
        shouldConditions.push({ key: 'ownerId', match: { value: request.userId } });
        shouldConditions.push({ key: 'allowedUsers', match: { any: [request.userId] } });
      }
      if (request.roleIds && request.roleIds.length > 0) {
        shouldConditions.push({ key: 'allowedRoles', match: { any: request.roleIds } });
      }
      if (request.departmentIds && request.departmentIds.length > 0) {
        shouldConditions.push({ key: 'allowedDepartments', match: { any: request.departmentIds } });
      }
    } else {
      // ORGANIZATION Scope (or default/unified): standard RBAC visibility & explicit grants
      // General ORG_WIDE visibility grant (only applies to ORGANIZATION documents, never PERSONAL)
      shouldConditions.push({
        must: [
          { key: 'visibility', match: { value: 'ORG_WIDE' } }
        ],
        must_not: [
          { key: 'scope', match: { value: 'PERSONAL' } }
        ]
      });

      if (request.isSuperAdmin) {
        shouldConditions.push({ key: 'organizationId', match: { value: request.organizationId } });
      }

      if (request.userId) {
        shouldConditions.push({ key: 'ownerId', match: { value: request.userId } });
        shouldConditions.push({ key: 'allowedUsers', match: { any: [request.userId] } });
      }

      if (request.roleIds && request.roleIds.length > 0) {
        shouldConditions.push({ key: 'allowedRoles', match: { any: request.roleIds } });
      }

      if (request.departmentIds && request.departmentIds.length > 0) {
        shouldConditions.push({ key: 'allowedDepartments', match: { any: request.departmentIds } });
        shouldConditions.push({
          must: [
            { key: 'visibility', match: { value: 'DEPARTMENT' } },
            { key: 'departmentId', match: { any: request.departmentIds } }
          ],
          must_not: [
            { key: 'scope', match: { value: 'PERSONAL' } }
          ]
        });
      }
    }

    const mustNotConditions: any[] = [];
    if (request.userId) {
      mustNotConditions.push({ key: 'deniedUsers', match: { any: [request.userId] } });
    }
    if (request.roleIds && request.roleIds.length > 0) {
      mustNotConditions.push({ key: 'deniedRoles', match: { any: request.roleIds } });
    }
    if (request.departmentIds && request.departmentIds.length > 0) {
      mustNotConditions.push({ key: 'deniedDepartments', match: { any: request.departmentIds } });
    }

    const filter: any = {
      must: mustConditions,
      should: shouldConditions
    };

    if (mustNotConditions.length > 0) {
      filter.must_not = mustNotConditions;
    }

    return filter;
  }

  public buildSqlFilter(request: SearchRequest): { sql: string, values: any[] } {
    const conditions = [`"organizationId" = $1`];
    const values: any[] = [request.organizationId];
    
    if (request.scope) {
      values.push(request.scope);
      conditions.push(`"scope" = $${values.length}`);
    }

    // Explicit DENY conditions
    if (request.userId) {
      values.push(`{${request.userId}}`);
      conditions.push(`NOT ("deniedUsers" && $${values.length}::text[])`);
    }
    if (request.roleIds && request.roleIds.length > 0) {
      const rolesStr = `{${request.roleIds.join(',')}}`;
      values.push(rolesStr);
      conditions.push(`NOT ("deniedRoles" && $${values.length}::text[])`);
    }
    if (request.departmentIds && request.departmentIds.length > 0) {
      const deptsStr = `{${request.departmentIds.join(',')}}`;
      values.push(deptsStr);
      conditions.push(`NOT ("deniedDepartments" && $${values.length}::text[])`);
    }

    // SHOULD conditions
    let visibilityClauses: string[] = [];

    if (request.scope === 'PERSONAL') {
      if (request.userId) {
        values.push(request.userId);
        visibilityClauses.push(`"ownerId" = $${values.length}`);
        values.push(`{${request.userId}}`);
        visibilityClauses.push(`("allowedUsers" && $${values.length}::text[])`);
      }
      if (request.roleIds && request.roleIds.length > 0) {
        const rolesStr = `{${request.roleIds.join(',')}}`;
        values.push(rolesStr);
        visibilityClauses.push(`("allowedRoles" && $${values.length}::text[])`);
      }
      if (request.departmentIds && request.departmentIds.length > 0) {
        const deptsStr = `{${request.departmentIds.join(',')}}`;
        values.push(deptsStr);
        visibilityClauses.push(`("allowedDepartments" && $${values.length}::text[])`);
      }
    } else {
      visibilityClauses.push(`("visibility" = 'ORG_WIDE' AND "scope" != 'PERSONAL')`);
      
      if (request.isSuperAdmin) {
        visibilityClauses.push(`1=1`);
      }
      
      if (request.userId) {
        values.push(request.userId);
        visibilityClauses.push(`"ownerId" = $${values.length}`);
        values.push(`{${request.userId}}`);
        visibilityClauses.push(`("allowedUsers" && $${values.length}::text[])`);
      }

      if (request.roleIds && request.roleIds.length > 0) {
        const rolesStr = `{${request.roleIds.join(',')}}`;
        values.push(rolesStr);
        visibilityClauses.push(`("allowedRoles" && $${values.length}::text[])`);
      }

      if (request.departmentIds && request.departmentIds.length > 0) {
        const deptsStr = `{${request.departmentIds.join(',')}}`;
        values.push(deptsStr);
        visibilityClauses.push(`("allowedDepartments" && $${values.length}::text[])`);
      }
      
      if (request.departmentIds && request.departmentIds.length > 0) {
        const placeholders = request.departmentIds.map(id => {
          values.push(id);
          return `$${values.length}`;
        }).join(', ');
        visibilityClauses.push(`("visibility" = 'DEPARTMENT' AND "departmentId" IN (${placeholders}) AND "scope" != 'PERSONAL')`);
      }
    }

    if (visibilityClauses.length > 0) {
      conditions.push(`(${visibilityClauses.join(' OR ')})`);
    }
    
    return {
      sql: conditions.join(' AND '),
      values
    };
  }
}
