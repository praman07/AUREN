import { PrismaClient, DocumentVisibility } from '@prisma/client';
import { randomUUID } from 'crypto';
import { RAGService } from '../application/services/RAGService';
import { ProviderFactory } from '../infrastructure/providers/registry/ProviderFactory';
import { AIGateway } from '../infrastructure/gateway/AIGateway';
import { QdrantClient } from '@qdrant/js-client-rest';
import { PermissionFilter } from '../infrastructure/search/PermissionFilter';
import { VectorSearchProvider } from '../infrastructure/search/VectorSearchProvider';
import { BM25SearchProvider } from '../infrastructure/search/BM25SearchProvider';
import { HybridRanker } from '../domain/retrieval/HybridRanker';
import { ContextBuilder } from '../domain/retrieval/ContextBuilder';
import { PromptBuilder } from '../domain/retrieval/PromptBuilder';
import { RetrievalEngine } from '../application/services/RetrievalEngine';
import { SuperAdminService } from '../domain/security/SuperAdminService';

const prisma = new PrismaClient();

async function runSuperAdminTest() {
  console.log('==================================================');
  console.log('SUPER ADMIN POLICY ENGINE: ADVERSARIAL SECURITY TEST');
  console.log('==================================================\n');

  try {
    // 1. CLEANUP
    console.log('--- PHASE 1: DB SEEDING ---');
    await prisma.connectedAccount.deleteMany();
    await prisma.documentChunk.deleteMany();
    await prisma.documentVersion.deleteMany();
    await prisma.document.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.department.deleteMany();
    await prisma.organization.deleteMany();

    const orgId = randomUUID();
    const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });
    try { await qdrant.createCollection(`org_${orgId}_docs`, { vectors: { size: 768, distance: 'Cosine' } }); } catch (e: any) {}

    await prisma.organization.create({
      data: { id: orgId, name: 'Organization Super', domain: 'super.example.com' }
    });

    const superAdminService = new SuperAdminService(prisma);
    
    const superAdminId = randomUUID();
    const normalUserId = randomUUID();
    
    await prisma.user.createMany({
      data: [
        { id: superAdminId, organizationId: orgId, email: 'admin@super.example.com', isSuperAdmin: true },
        { id: normalUserId, organizationId: orgId, email: 'normal@super.example.com', isSuperAdmin: false }
      ]
    });

    // We will test the SuperAdminService directly for administrative actions.
    console.log('--- PHASE 2: ADMINISTRATIVE ACTIONS ---');
    
    const deptEngineering = await superAdminService.createDepartment(orgId, 'Engineering', 'Eng Dept');
    const roleDev = await superAdminService.createRole(orgId, 'Developer', 'Dev Role');
    
    await superAdminService.assignDepartment(normalUserId, deptEngineering.id);
    await superAdminService.assignRoleToUser(normalUserId, roleDev.id);

    // Create a document
    const docId = randomUUID();
    const doc = await prisma.document.create({
      data: {
        id: docId,
        organizationId: orgId,
        ownerId: superAdminId,
        title: 'Top Secret Plans',
        mimeType: 'text/plain',
        sizeBytes: 100,
        visibility: DocumentVisibility.ORG_WIDE,
      } as any
    });

    const versionId = randomUUID();
    await prisma.documentVersion.create({
      data: { id: versionId, documentId: doc.id, version: 1, s3Key: `test-${doc.id}`, hash: 'testhash' }
    });

    const chunkId = randomUUID();
    await prisma.documentChunk.create({
      data: {
        id: chunkId,
        organizationId: orgId,
        documentId: doc.id,
        versionId: versionId,
        chunkIndex: 0,
        text: 'The secret is 42',
        tokenCount: 10,
        embeddingStatus: 'COMPLETED',
        indexingStatus: 'COMPLETED',
        qdrantPointId: chunkId
      }
    });

    const providerFactory = new ProviderFactory();
    const aiGateway = new AIGateway(providerFactory);
    const result = await aiGateway.embed({ texts: ['The secret is 42'], context: {} });
    const vector = result.embeddings[0];

    await prisma.documentChunk.update({
      where: { id: chunkId },
      data: { vectorData: vector }
    });

    await qdrant.upsert(`org_${orgId}_docs`, {
      wait: true,
      points: [{
        id: chunkId,
        vector: vector,
        payload: {
          documentId: doc.id,
          chunkId: chunkId,
          organizationId: orgId,
          departmentId: doc.departmentId,
          ownerId: doc.ownerId,
          visibility: doc.visibility,
          content: doc.title,
          title: doc.title,
          allowedRoles: doc.allowedRoles,
          allowedUsers: doc.allowedUsers,
          allowedDepartments: doc.allowedDepartments,
          deniedRoles: doc.deniedRoles,
          deniedUsers: doc.deniedUsers,
          deniedDepartments: doc.deniedDepartments
        }
      }]
    });

    const permissionFilter = new PermissionFilter();
    const vectorProvider = new VectorSearchProvider(permissionFilter, providerFactory);
    const keywordSearch = new BM25SearchProvider(permissionFilter);
    const ranker = new HybridRanker();
    const contextBuilder = new ContextBuilder();
    const promptBuilder = new PromptBuilder();
    const retrievalEngine = new RetrievalEngine(vectorProvider, keywordSearch, ranker, contextBuilder, promptBuilder);

    async function searchSecret(userId: string, roleIds: string[], departmentIds: string[]) {
      const results = await retrievalEngine.search({
        query: 'What is the secret?',
        organizationId: orgId,
        userId,
        roleIds,
        departmentIds,
        limit: 5
      });
      return results.chunks.length > 0;
    }

    console.log('\n--- PHASE 3: POLICY ENFORCEMENT ---');
    
    // Org wide, normal user should see it
    let found = await searchSecret(normalUserId, [roleDev.id], [deptEngineering.id]);
    console.log(`[${found ? '✅ PASS' : '❌ FAIL'}] Normal user can see Org-Wide doc`);

    // Super Admin applies explicit deny for department
    await superAdminService.defineDepartmentAccess(docId, [], [deptEngineering.id]);
    
    // Need to wait for Qdrant payload to update
    await new Promise(r => setTimeout(r, 1000));
    
    found = await searchSecret(normalUserId, [roleDev.id], [deptEngineering.id]);
    console.log(`[${!found ? '✅ PASS' : '❌ FAIL'}] Normal user CANNOT see doc after explicit Department Deny`);

    // Super Admin explicitly allows user, but user is in denied department
    // In our Zero Trust architecture, EXPLICIT DENY ALWAYS WINS. So Department Deny wins over User Allow.
    await superAdminService.defineUserExceptions(docId, [normalUserId], []);
    await new Promise(r => setTimeout(r, 1000));
    
    found = await searchSecret(normalUserId, [roleDev.id], [deptEngineering.id]);
    console.log(`[${!found ? '✅ PASS' : '❌ FAIL'}] Normal user CANNOT see doc after explicit User Allow (Deny Wins All)`);

    // Super Admin explicitly denies user
    await superAdminService.defineUserExceptions(docId, [], [normalUserId]);
    await new Promise(r => setTimeout(r, 1000));
    
    found = await searchSecret(normalUserId, [roleDev.id], [deptEngineering.id]);
    console.log(`[${!found ? '✅ PASS' : '❌ FAIL'}] Normal user CANNOT see doc after explicit User Deny`);
    
    console.log('\nTesting completed.');

  } catch (err: any) {
    console.error('Fatal Test Error:', err);
  }
}

runSuperAdminTest().catch(console.error).finally(() => process.exit(0));
