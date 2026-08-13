import { SearchRequest } from '../../domain/retrieval/types';

export class PermissionFilter {
  public buildVectorFilter(request: SearchRequest): any {
    // Zero-Trust Fusion: 
    // 1. MUST NOT match deniedUsers or deniedRoles
    // 2. MUST match organizationId
    // 3. SHOULD match Ownership OR explicitly allowed users/roles OR Department OR Org-Wide

    const shouldConditions: any[] = [
      { key: 'visibility', match: { value: 'ORG_WIDE' } }
    ];

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

    if (request.departmentIds && request.departmentIds.length > 0) {
      shouldConditions.push({
        must: [
          { key: 'visibility', match: { value: 'DEPARTMENT' } },
          { key: 'departmentId', match: { any: request.departmentIds } }
        ]
      });
    }

    const mustConditions: any[] = [
      { key: 'organizationId', match: { value: request.organizationId } }
    ];

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
    // Translates RBAC context into a PostgreSQL WHERE clause for BM25
    // PostgreSQL array operators: && (overlap), @> (contains)
    const conditions = [`"organizationId" = $1`];
    const values: any[] = [request.organizationId];
    
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

    // SHOULD conditions (visibility OR ownership OR allowed lists)
    let visibilityClauses = [`"visibility" = 'ORG_WIDE'`];
    
    if (request.userId) {
      values.push(request.userId);
      const userParam = `$${values.length}`;
      visibilityClauses.push(`"ownerId" = ${userParam}`);
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
      visibilityClauses.push(`("visibility" = 'DEPARTMENT' AND "departmentId" IN (${placeholders}))`);
    }

    conditions.push(`(${visibilityClauses.join(' OR ')})`);
    
    return {
      sql: conditions.join(' AND '),
      values
    };
  }
}
