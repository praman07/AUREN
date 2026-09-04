import { BaseRetriever, type BaseRetrieverInput } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { CallbackManagerForRetrieverRun } from '@langchain/core/callbacks/manager';
import { QdrantVectorStoreProvider } from '../../infrastructure/providers/adapters/vector/QdrantVectorStoreProvider';
import { OllamaEmbeddingProvider } from '../../infrastructure/providers/adapters/embedding/OllamaEmbeddingProvider';
import { PermissionFilter } from '../../infrastructure/search/PermissionFilter';
import { DocumentAccessPolicy, AccessSubject, AccessControlledDocument } from '../../domain/security/DocumentAccessPolicy';

export interface UserAuthContext {
  organizationId: string;
  userId: string;
  userName?: string;
  email?: string;
  roles: string[];
  departmentId?: string;
  isSuperAdmin?: boolean;
}

export interface OrganizationRetrieverInput extends BaseRetrieverInput {
  authContext: UserAuthContext;
  topK?: number;
  similarityThreshold?: number;
  overrideScope?: 'PERSONAL' | 'ORGANIZATION';
}

export class OrganizationRetriever extends BaseRetriever {
  static lc_name() {
    return 'OrganizationRetriever';
  }

  lc_namespace = ['auren', 'retrievers'];

  private authContext: UserAuthContext;
  private topK: number;
  private similarityThreshold: number;
  private overrideScope?: 'PERSONAL' | 'ORGANIZATION';
  private qdrantProvider: QdrantVectorStoreProvider;
  private embeddingProvider: OllamaEmbeddingProvider;

  constructor(fields: OrganizationRetrieverInput) {
    super(fields);
    this.authContext = fields.authContext;
    this.topK = fields.topK || 10;
    this.similarityThreshold = fields.similarityThreshold ?? 0.0;
    this.overrideScope = fields.overrideScope;
    this.qdrantProvider = new QdrantVectorStoreProvider();
    this.embeddingProvider = new OllamaEmbeddingProvider();
  }

  private detectQueryScope(query: string): 'PERSONAL' | 'ORGANIZATION' | undefined {
    if (/\b(my personal|my private|my uploaded|in my docs|in my files|my notes)\b/i.test(query)) {
      return 'PERSONAL';
    }
    if (/\b(organization docs|company docs|org knowledge|company policy|org documents)\b/i.test(query)) {
      return 'ORGANIZATION';
    }
    return undefined; // Unified default (searches across both personal and organization documents)
  }

  async _getRelevantDocuments(
    query: string,
    runManager?: CallbackManagerForRetrieverRun
  ): Promise<Document[]> {
    const embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || 'qwen3-embedding:8b';
    const effectiveScope = this.overrideScope || this.detectQueryScope(query);

    console.log(`\n[OrganizationRetriever Diagnostic]`);
    console.log(` -> Query Received: "${query}"`);
    console.log(` -> Scope Mode: ${effectiveScope ? `EXPLICIT (${effectiveScope})` : 'UNIFIED (PERSONAL + ORGANIZATION)'}`);
    console.log(` -> Auth Context: orgId=${this.authContext.organizationId}, userId=${this.authContext.userId}, roles=${JSON.stringify(this.authContext.roles)}, dept=${this.authContext.departmentId ?? 'none'}`);
    console.log(` -> Embedding Model Used: ${embeddingModel}`);

    let vector: number[];
    try {
      vector = await this.embeddingProvider.embedText(query);
      console.log(` -> Query Embedding Generated: Dimensions = ${vector.length}`);
    } catch (embeddingErr: any) {
      console.error(`[OrganizationRetriever] ✗ Embedding failed — Ollama may be offline: ${embeddingErr.message}`);
      // Return empty — synthesizeAnswer will use LLM knowledge as fallback
      return [];
    }

    const collectionName = `org_${this.authContext.organizationId.replace(/[^a-zA-Z0-9]/g, '_')}_docs`;
    console.log(` -> Qdrant Collection Queried: ${collectionName}`);

    const candidateLimit = Math.max(this.topK * 4, 20);

    const filter = new PermissionFilter().buildVectorFilter({
      query,
      organizationId: this.authContext.organizationId,
      userId: this.authContext.userId,
      roleIds: this.authContext.roles,
      departmentIds: this.authContext.departmentId ? [this.authContext.departmentId] : [],
      isSuperAdmin: this.authContext.isSuperAdmin,
      scope: effectiveScope,
      limit: candidateLimit,
    });

    console.log(` -> PermissionFilter Output:\n${JSON.stringify(filter, null, 2)}`);

    let searchResults: any[] = [];
    try {
      searchResults = await this.qdrantProvider.search(
        collectionName,
        vector,
        candidateLimit,
        filter
      );
    } catch (err) {
      try {
        searchResults = await this.qdrantProvider.search(
          'auren_knowledge',
          vector,
          candidateLimit,
          filter
        );
      } catch (err2) {
        searchResults = [];
      }
    }

    console.log(` -> Raw Candidates Retrieved from Qdrant: ${searchResults.length}`);

    // Defense-in-Depth Post-Filtering with DocumentAccessPolicy
    const accessSubject: AccessSubject = {
      id: this.authContext.userId,
      organizationId: this.authContext.organizationId,
      roles: this.authContext.roles || [],
      departments: this.authContext.departmentId ? [this.authContext.departmentId] : [],
      isSuperAdmin: !!this.authContext.isSuperAdmin
    };

    const authorizedCandidates = searchResults.filter((res: any) => {
      const payload = res.payload || {};
      const doc: AccessControlledDocument = {
        id: payload.documentId || String(res.id),
        organizationId: payload.organizationId || this.authContext.organizationId,
        ownerId: payload.ownerId || '',
        departmentId: payload.departmentId || null,
        visibility: payload.visibility || 'ORG_WIDE',
        scope: payload.scope || (payload.visibility === 'PRIVATE' ? 'PERSONAL' : 'ORGANIZATION'),
        allowedRoles: payload.allowedRoles,
        deniedRoles: payload.deniedRoles,
        allowedUsers: payload.allowedUsers,
        deniedUsers: payload.deniedUsers,
        allowedDepartments: payload.allowedDepartments,
        deniedDepartments: payload.deniedDepartments,
      };

      const canAccess = DocumentAccessPolicy.canAccess(accessSubject, doc);
      if (!canAccess) {
        console.warn(`[OrganizationRetriever] 🛑 Defense-in-depth DENIED chunk ${res.id} (doc: ${payload.documentName || payload.documentId}) for user ${this.authContext.userId}`);
      }
      return canAccess;
    });

    console.log(` -> Post-Policy Authorized Candidates: ${authorizedCandidates.length}`);

    // 1. Min quality cutoff (filters out pure noise / negative similarity)
    const MIN_RELEVANCE_SCORE = 0.25;
    const validCandidates = authorizedCandidates.filter((res: any) => (res.score ?? 0) >= MIN_RELEVANCE_SCORE);

    if (validCandidates.length === 0) {
      console.log(` -> Candidates Remaining Post-Quality Filtering: 0`);
      return [];
    }

    // 2. Score ranking with Ownership Priority
    // Give user's own documents (matching authContext.userId) a rank boost so personal docs (e.g. uploaded resume)
    // are prioritized over generic ORG_WIDE docs when relevance is close.
    const scoredCandidates = validCandidates.map((res: any) => {
      const rawScore = res.score ?? 0;
      const isOwner = res.payload?.ownerId && this.authContext.userId && res.payload.ownerId === this.authContext.userId;
      const isPrivate = res.payload?.visibility === 'PRIVATE' || res.payload?.scope === 'PERSONAL';
      
      let adjustedScore = rawScore;
      if (isOwner) {
        adjustedScore += isPrivate ? 0.20 : 0.10;
      }

      return { res, rawScore, adjustedScore };
    });

    // Sort by adjustedScore descending
    scoredCandidates.sort((a, b) => b.adjustedScore - a.adjustedScore);

    // 3. Smart Deduplication: limit to max 2 chunks per documentId to ensure context diversity
    const docChunkCounts: Record<string, number> = {};
    const selectedCandidates: typeof scoredCandidates = [];

    for (const item of scoredCandidates) {
      const docId = item.res.payload?.documentId || 'unknown';
      const currentCount = docChunkCounts[docId] || 0;
      if (currentCount < 2 || selectedCandidates.length < this.topK) {
        docChunkCounts[docId] = currentCount + 1;
        selectedCandidates.push(item);
        if (selectedCandidates.length >= this.topK) break;
      }
    }

    const finalCandidates = selectedCandidates.slice(0, this.topK);
    console.log(` -> Candidates Selected for Context (${finalCandidates.length}):`);
    finalCandidates.forEach(c => {
      console.log(`    - doc: "${c.res.payload?.documentName || c.res.payload?.documentId}" | scope: ${c.res.payload?.scope} | ownerId: ${c.res.payload?.ownerId} | vis: ${c.res.payload?.visibility} | rawScore: ${c.rawScore.toFixed(4)} | adjScore: ${c.adjustedScore.toFixed(4)}`);
    });

    return finalCandidates.map(({ res, rawScore }) => new Document({
      pageContent: res.payload?.text || res.payload?.content || '',
      metadata: {
        documentId: res.payload?.documentId,
        documentName: res.payload?.documentName || null,
        chunkId: res.id,
        chunkIndex: res.payload?.chunkIndex,
        ownerId: res.payload?.ownerId || null,
        visibility: res.payload?.visibility || null,
        scope: res.payload?.scope || null,
        pageNumbers: res.payload?.pageNumbers || [],
        sectionTitle: res.payload?.sectionTitle || null,
        score: rawScore,
        // Best available title: documentName > section heading (if not 'Full Document') > title fallback
        title: (res.payload?.documentName && res.payload?.documentName !== 'Full Document')
          ? res.payload.documentName
          : (res.payload?.sectionTitle && res.payload?.sectionTitle !== 'Full Document')
            ? res.payload.sectionTitle
            : (res.payload?.title && res.payload?.title !== 'Full Document')
              ? res.payload.title
              : 'Org Document',
        organizationId: this.authContext.organizationId,
        sourceType: 'internal',
      }
    }));
  }

  async getRelevantDocuments(query: string): Promise<Document[]> {
    return this._getRelevantDocuments(query);
  }
}
