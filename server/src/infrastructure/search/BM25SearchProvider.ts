import { RetrievedChunk, SearchRequest } from '../../domain/retrieval/types';
import { PermissionFilter } from './PermissionFilter';

export class BM25SearchProvider {
  constructor(private permissionFilter: PermissionFilter) {}

  public async search(request: SearchRequest): Promise<RetrievedChunk[]> {
    // Stub: In reality, execute Postgres WebSearch or ElasticSearch BM25
    // using this.permissionFilter.buildSqlFilter(request)
    return [];
  }
}
