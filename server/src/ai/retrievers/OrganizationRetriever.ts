import { BaseRetriever, type BaseRetrieverInput } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { CallbackManagerForRetrieverRun } from '@langchain/core/callbacks/manager';
import { QdrantVectorStoreProvider } from '../../infrastructure/providers/adapters/vector/QdrantVectorStoreProvider';
import { ProviderFactory } from '../../infrastructure/providers/registry/ProviderFactory';
import { IEmbeddingProvider } from '../../infrastructure/providers/interfaces/IEmbeddingProvider';
import { PermissionFilter } from '../../infrastructure/search/PermissionFilter';
import { DocumentAccessPolicy, AccessSubject, AccessControlledDocument } from '../../domain/security/DocumentAccessPolicy';
import { ConnectorPolicyService } from '../../domain/security/ConnectorPolicyService';
import { prisma } from '../../infrastructure/database/prisma';

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
  embeddingProvider?: IEmbeddingProvider;
  targetDocumentIds?: string[];
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
  private targetDocumentIds?: string[];
  private qdrantProvider: QdrantVectorStoreProvider;
  private embeddingProvider: IEmbeddingProvider;

  constructor(fields: OrganizationRetrieverInput) {
    super(fields);
    this.authContext = fields.authContext;
    this.topK = fields.topK || 10;
    this.similarityThreshold = fields.similarityThreshold ?? 0.0;
    this.overrideScope = fields.overrideScope;
    this.targetDocumentIds = fields.targetDocumentIds;
    this.qdrantProvider = new QdrantVectorStoreProvider();
    this.embeddingProvider = fields.embeddingProvider || new ProviderFactory().getEmbeddingProvider();
  }

  private detectQueryScope(query: string): 'PERSONAL' | 'ORGANIZATION' | undefined {
    if (/\b(my resume|my personal|my private|my uploaded|in my docs|in my files|my notes|my projects|projects have i worked on|what projects have i)\b/i.test(query)) {
      return 'PERSONAL';
    }
    if (/\b(organization docs|company docs|org knowledge|company policy|org documents|our deployment policy|company deployment policy|organization knowledge)\b/i.test(query)) {
      return 'ORGANIZATION';
    }
    return undefined; // Unified default (searches across both personal and organization documents)
  }

  async _getRelevantDocuments(
    query: string,
    runManager?: CallbackManagerForRetrieverRun
  ): Promise<Document[]> {
    const embeddingProviderName = process.env.EMBEDDING_PROVIDER || 'llamacpp';
    const effectiveScope = this.overrideScope || this.detectQueryScope(query);

    console.log(`\n[OrganizationRetriever Diagnostic]`);
    console.log(` -> Query Received: "${query}"`);
    console.log(` -> Scope Mode: ${effectiveScope ? `EXPLICIT (${effectiveScope})` : 'UNIFIED (PERSONAL + ORGANIZATION)'}`);
    console.log(` -> Auth Context: orgId=${this.authContext.organizationId}, userId=${this.authContext.userId}, roles=${JSON.stringify(this.authContext.roles)}, dept=${this.authContext.departmentId ?? 'none'}`);
    console.log(` -> Embedding Provider Used: ${embeddingProviderName}`);

    let vector: number[];
    try {
      vector = await this.embeddingProvider.embedText(query);
      console.log(` -> Query Embedding Generated: Dimensions = ${vector.length}`);
    } catch (embeddingErr: any) {
      console.error(`[OrganizationRetriever] ✗ Embedding failed (${embeddingProviderName}): ${embeddingErr.message}`);
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
      targetDocumentIds: this.targetDocumentIds,
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

    // Defense-in-Depth Post-Filtering with DocumentAccessPolicy and ConnectorPolicyService
    const accessSubject: AccessSubject = {
      id: this.authContext.userId,
      organizationId: this.authContext.organizationId,
      roles: this.authContext.roles || [],
      departments: this.authContext.departmentId ? [this.authContext.departmentId] : [],
      isSuperAdmin: !!this.authContext.isSuperAdmin
    };

    // Pre-fetch active connector policies for this organization to perform instant dynamic evaluation
    const activeConnectorPolicies = await prisma.connectorPolicy.findMany({
      where: { organizationId: this.authContext.organizationId }
    });

    const authorizedCandidates: any[] = [];
    for (const res of searchResults) {
      const payload = res.payload || {};

      // 1. Authoritative AUREN Connector Policy Check
      const isConnectorDoc = payload.sourceProvider && payload.sourceProvider !== 'UPLOAD';
      if (isConnectorDoc) {
        const connPolicyResult = await ConnectorPolicyService.evaluateAccess(
          accessSubject,
          {
            organizationId: payload.organizationId || this.authContext.organizationId,
            provider: payload.sourceProvider,
            sourceUrl: payload.sourceUrl,
            externalId: payload.externalId,
          },
          activeConnectorPolicies
        );

        if (connPolicyResult === 'DENY') {
          console.warn(`[OrganizationRetriever] 🛑 ConnectorPolicy DENIED chunk ${res.id} (resource: ${payload.externalId || payload.sourceUrl}) for user ${this.authContext.userId}`);
          continue;
        }
      }

      // 2. Existing DocumentAccessPolicy Check
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
        continue;
      }

      authorizedCandidates.push(res);
    }

    console.log(` -> Post-Policy Authorized Candidates: ${authorizedCandidates.length}`);

    // Helper: Normalize strings for document identity matching (case, extension, separator insensitive)
    const normalizeForIdentity = (str: string): string => {
      if (!str) return '';
      return str
        .toLowerCase()
        .replace(/\.[a-z0-9]+$/i, '')       // Strip extensions (.png, .pdf, .md, .ts, .json)
        .replace(/[_.\-\/\\:]/g, ' ')        // Replace separators with spaces
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normQuery = normalizeForIdentity(query);
    
    // Generic words that should not trigger identity boost by themselves
    const genericTokens = new Set(['image', 'report', 'architecture', 'security', 'test', 'document', 'file', 'guide', 'notes', 'data', 'info', 'pdf', 'doc', 'docs', 'design', 'designs', 'chart', 'charts']);
    const queryWords = normQuery.split(' ').filter(w => w.length > 2);
    const nonGenericQueryWords = queryWords.filter(w => !genericTokens.has(w));

    // Minimum raw relevance gate: if explicit target document IDs are resolved, relax gate to preserve target chunks
    const hasTargetDocIds = Array.isArray(this.targetDocumentIds) && this.targetDocumentIds.length > 0;
    const gateThreshold = hasTargetDocIds ? 0.25 : 0.52;
    const MIN_RELEVANCE_SCORE = hasTargetDocIds ? 0.25 : 0.55;

    const topRawScore = authorizedCandidates.reduce((max, c) => Math.max(max, c.score ?? 0), 0);
    if (topRawScore < gateThreshold) {
      console.log(` -> Top candidate raw score (${topRawScore.toFixed(4)}) below relevance gate (${gateThreshold}). Returning no evidence.`);
      return [];
    }

    const validCandidates = authorizedCandidates.filter((res: any) => (res.score ?? 0) >= MIN_RELEVANCE_SCORE);

    if (validCandidates.length === 0) {
      console.log(` -> Candidates Remaining Post-Quality Filtering: 0`);
      return [];
    }

    // Detect if user query is multi-document comparison
    const isMultiDocQuery = /\b(compare|versus|vs|between|both|difference|and|all|across)\b/i.test(query) || queryWords.length > 8;

    // Score ranking with Document Identity Awareness and Ownership Priority
    const scoredCandidates = validCandidates.map((res: any) => {
      const rawScore = res.score ?? 0;
      const rawDocName = res.payload?.documentName || res.payload?.title || res.payload?.externalId || '';
      const normDocName = normalizeForIdentity(rawDocName);
      
      // Clean trailing timestamps/UUID numbers from normalized document name for exact sequence matching
      const cleanDocName = normDocName.replace(/\b\d{6,}\b/g, '').replace(/\s+/g, ' ').trim();
      const docWords = cleanDocName.split(' ').filter(w => w.length > 2);
      const nonGenericDocWords = docWords.filter(w => !genericTokens.has(w));

      // Identity Matching: Check if query contains cleanDocName OR cleanDocName contains normQuery
      let isIdentityMatch = false;
      
      if (cleanDocName.length >= 3 && normQuery.length >= 3) {
        if (normQuery.includes(cleanDocName) || cleanDocName.includes(normQuery)) {
          // Verify that the match isn't purely composed of a single generic token
          const matchingNonGeneric = nonGenericQueryWords.filter(w => cleanDocName.includes(w));
          if (nonGenericQueryWords.length === 0 || matchingNonGeneric.length > 0 || cleanDocName === normQuery) {
            isIdentityMatch = true;
          }
        } else {
          // Token sequence overlap matching
          const matchingWords = docWords.filter(w => queryWords.includes(w));
          const matchingNonGenericWords = nonGenericDocWords.filter(w => nonGenericQueryWords.includes(w));
          if (matchingWords.length >= 2 && matchingNonGenericWords.length > 0) {
            isIdentityMatch = true;
          }
        }
      }

      const isOwner = res.payload?.ownerId && this.authContext.userId && res.payload.ownerId === this.authContext.userId;
      const isPrivate = res.payload?.visibility === 'PRIVATE' || res.payload?.scope === 'PERSONAL';
      const docScope = res.payload?.scope || 'ORGANIZATION';
      const classification = res.payload?.classification || 'UNCLASSIFIED';
      
      // Objective 9: Source Authority & Conflict Management Calculation
      // Official HR/Policy/Governance > Approved Internal Document > Personal Document > External/Imported
      let authorityBoost = 0;
      const lowerDocName = rawDocName.toLowerCase();
      if (/\b(policy|handbook|sop|official|governance|guideline|contract|compliance|terms)\b/i.test(lowerDocName) || classification === 'RESTRICTED' || classification === 'CONFIDENTIAL') {
        authorityBoost = 0.12; // Official Policy / Governance Document
      } else if (docScope === 'ORGANIZATION') {
        authorityBoost = 0.06; // Approved Internal Org Document
      } else if (docScope === 'PERSONAL') {
        authorityBoost = effectiveScope === 'PERSONAL' ? 0.08 : 0.02; // Personal User Document
      }
      
      let adjustedScore = rawScore + authorityBoost;
      if (isIdentityMatch) {
        adjustedScore += 0.15; // Document Identity Signal Boost
      }
      if (isOwner) {
        adjustedScore += isPrivate ? 0.08 : 0.04;
      }

      return { res, rawScore, adjustedScore, isIdentityMatch, authorityBoost };
    });

    // Sort by adjustedScore descending
    scoredCandidates.sort((a, b) => b.adjustedScore - a.adjustedScore);

    const hasAnyIdentityMatch = scoredCandidates.some(c => c.isIdentityMatch);
    const topCandidate = scoredCandidates[0];

    // Filter out candidates that are noise relative to an explicit identity or high top-score match
    const retainedCandidates = scoredCandidates.filter(item => {
      // 1. If explicit identity match exists, reject candidates without identity match unless multi-doc query
      if (hasAnyIdentityMatch && !item.isIdentityMatch && !isMultiDocQuery) {
        return false;
      }
      // 2. Reject candidates whose raw score falls significantly below top candidate unless multi-doc query
      if (!isMultiDocQuery && (topCandidate.rawScore - item.rawScore) > 0.10 && !item.isIdentityMatch) {
        return false;
      }
      return true;
    });

    // 3. Smart Deduplication: limit to max 2 chunks per documentId (topK is a MAXIMUM capacity, not a quota)
    const docChunkCounts: Record<string, number> = {};
    const selectedCandidates: typeof retainedCandidates = [];

    for (const item of retainedCandidates) {
      const docId = item.res.payload?.documentId || 'unknown';
      const currentCount = docChunkCounts[docId] || 0;
      if (currentCount < 2) {
        docChunkCounts[docId] = currentCount + 1;
        selectedCandidates.push(item);
        if (selectedCandidates.length >= this.topK) break;
      }
    }

    const finalCandidates = selectedCandidates.slice(0, this.topK);
    console.log(` -> Candidates Selected for Context (${finalCandidates.length}):`);
    finalCandidates.forEach(c => {
      console.log(`    - doc: "${c.res.payload?.documentName || c.res.payload?.documentId}" | scope: ${c.res.payload?.scope} | idMatch: ${c.isIdentityMatch} | rawScore: ${c.rawScore.toFixed(4)} | adjScore: ${c.adjustedScore.toFixed(4)}`);
    });

    return finalCandidates.map(({ res, rawScore }) => new Document({
      pageContent: res.payload?.text || res.payload?.content || '',
      metadata: {
        documentId: res.payload?.documentId,
        documentName: res.payload?.documentName || null,
        documentVersionId: res.payload?.documentVersionId || null,
        chunkId: res.id,
        chunkIndex: res.payload?.chunkIndex,
        ownerId: res.payload?.ownerId || null,
        visibility: res.payload?.visibility || null,
        scope: res.payload?.scope || null,
        isVisual: !!res.payload?.isVisual,
        mimeType: res.payload?.mimeType || null,
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
        sourceType: res.payload?.sourceProvider || 'UPLOAD',
        sourceProvider: res.payload?.sourceProvider || 'UPLOAD',
        sourceUrl: res.payload?.sourceUrl || null,
        externalId: res.payload?.externalId || null,
      }
    }));
  }

  async getRelevantDocuments(query: string): Promise<Document[]> {
    return this._getRelevantDocuments(query);
  }
}
