import { SearchRequest } from '../../domain/retrieval/types';

export class PermissionFilter {
  public buildVectorFilter(request: SearchRequest): any {
    // Zero-Trust Fusion: User must have access based on Ownership OR Department OR Org-Wide
    
    // We construct a 'should' (OR) array for the access conditions
    const accessConditions: any[] = [
      { key: 'visibility', match: { value: 'ORG_WIDE' } }
    ];

    if (request.userId) {
      accessConditions.push({ key: 'ownerId', match: { value: request.userId } });
    }

    if (request.departmentIds && request.departmentIds.length > 0) {
      accessConditions.push({
        must: [
          { key: 'visibility', match: { value: 'DEPARTMENT' } },
          { key: 'departmentId', match: { any: request.departmentIds } }
        ]
      });
    }

    const filter: any = {
      must: [
        { key: 'organizationId', match: { value: request.organizationId } }
      ],
      should: accessConditions
    };

    return filter;
  }

  public buildSqlFilter(request: SearchRequest): { sql: string, values: any[] } {
    // Translates RBAC context into a PostgreSQL WHERE clause for BM25
    const conditions = [`"organizationId" = $1`];
    const values: any[] = [request.organizationId];
    
    let visibilityClauses = [`"visibility" = 'ORG_WIDE'`];
    
    if (request.userId) {
      values.push(request.userId);
      visibilityClauses.push(`"ownerId" = $${values.length}`);
    }
    
    if (request.departmentIds && request.departmentIds.length > 0) {
      // Need a way to match arrays in PostgreSQL, assuming departmentId is text array or we use IN. 
      // If document is tied to a single departmentId:
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
