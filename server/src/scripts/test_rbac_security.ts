import { prisma } from '../infrastructure/database/prisma';
import { PermissionFilter } from '../infrastructure/search/PermissionFilter';
import { QdrantClient } from '@qdrant/js-client-rest';
import { VectorSearchProvider } from '../infrastructure/search/VectorSearchProvider';
import { RetrievalEngine } from '../application/services/RetrievalEngine';
import { BM25SearchProvider } from '../infrastructure/search/BM25SearchProvider';
import { HybridRanker } from '../domain/retrieval/HybridRanker';
import { ContextBuilder } from '../domain/retrieval/ContextBuilder';
import { PromptBuilder } from '../domain/retrieval/PromptBuilder';
import { ProviderFactory } from '../infrastructure/providers/registry/ProviderFactory';
import { DocumentVisibility, SourceType } from '@prisma/client';
import dotenv from 'dotenv';
import { ChunkStrategy } from '../domain/chunking/ChunkStrategy';

dotenv.config({ path: '.env' });

async function seedData() {
  console.log('Seeding RBAC Matrix...');

  // Create Organizations
  const orgAcme = await prisma.organization.create({ data: { name: 'ACME Corp', industry: 'CORPORATE' } });
  const orgSpy = await prisma.organization.create({ data: { name: 'Spy Corp', industry: 'CORPORATE' } });

  // Create Departments
  const deptEng = await prisma.department.create({ data: { name: 'Engineering', organizationId: orgAcme.id } });
  const deptHR = await prisma.department.create({ data: { name: 'HR', organizationId: orgAcme.id } });

  // Create Roles
  const roleCeo = await prisma.role.create({ data: { name: 'CEO', organizationId: orgAcme.id } });
  const roleSeniorEng = await prisma.role.create({ data: { name: 'Senior Engineer', organizationId: orgAcme.id } });
  const roleJuniorEng = await prisma.role.create({ data: { name: 'Junior Engineer', organizationId: orgAcme.id } });
  const roleHrManager = await prisma.role.create({ data: { name: 'HR Manager', organizationId: orgAcme.id } });

  // Create Users
  const userAlice = await prisma.user.create({ data: { email: 'alice@acme.com', organizationId: orgAcme.id, departmentId: deptEng.id } }); // Senior Eng
  const userBob = await prisma.user.create({ data: { email: 'bob@acme.com', organizationId: orgAcme.id, departmentId: deptEng.id } }); // Junior Eng
  const userCharlie = await prisma.user.create({ data: { email: 'charlie@acme.com', organizationId: orgAcme.id, departmentId: deptHR.id } }); // HR
  const userDave = await prisma.user.create({ data: { email: 'dave@acme.com', organizationId: orgAcme.id } }); // CEO
  const userEve = await prisma.user.create({ data: { email: 'eve@spy.com', organizationId: orgSpy.id } }); // Spy

  // Assign Roles
  await prisma.userRole.createMany({
    data: [
      { userId: userAlice.id, roleId: roleSeniorEng.id },
      { userId: userBob.id, roleId: roleJuniorEng.id },
      { userId: userCharlie.id, roleId: roleHrManager.id },
      { userId: userDave.id, roleId: roleCeo.id }
    ]
  });

  // Helper to create Doc + Version + Chunk
  async function createDoc(title: string, visibility: DocumentVisibility, deptId: string | null, allowedRoles: string[], deniedUsers: string[] = [], ownerId: string, allowedUsers: string[] = [], orgId: string = orgAcme.id) {
    const doc = await prisma.document.create({
      data: {
        title,
        organizationId: orgId,
        ownerId,
        departmentId: deptId,
        visibility,
        mimeType: 'text/plain',
        sizeBytes: 100,
        allowedRoles,
        deniedUsers,
        allowedUsers
      }
    });

    const version = await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        version: 1,
        s3Key: `fake-${doc.id}.txt`,
        hash: 'fakehash'
      }
    });

    const rbacMetadata = {
      visibility, ownerId, departmentId: deptId, allowedRoles, allowedUsers, deniedRoles: [], deniedUsers
    };

    const strategy = new ChunkStrategy({ maxTokens: 500, overlapTokens: 50, semanticBoundaries: true });
    const chunks = strategy.generateChunks([
      { title: 'Full Document', content: `This is the restricted content for ${title}. SECRET: ${Math.random()}`, pageNumbers: '1' }
    ], doc.id, version.id, orgId, rbacMetadata);

    await prisma.documentChunk.createMany({ data: chunks });

    const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });
    const collectionName = `org_${orgId}_docs`;
    
    // Ensure collection exists
    try {
      await qdrant.getCollection(collectionName);
    } catch {
      await qdrant.createCollection(collectionName, { vectors: { size: 768, distance: 'Cosine' } });
    }

    const points = chunks.map(chunk => ({
      id: chunk.id,
      vector: Array(768).fill(0.01),
      payload: {
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        organizationId: chunk.organizationId,
        ...chunk.metadata
      }
    }));

    await qdrant.upsert(collectionName, { wait: true, points });
  }

  // Document A: Engineering + Junior Engineer (Bob & Alice & Dave since ORG_WIDE or they have the role)
  // Let's just use DEPARTMENT + allowedRoles
  await createDoc('Doc A (Junior Eng)', DocumentVisibility.DEPARTMENT, deptEng.id, [roleJuniorEng.id, roleSeniorEng.id, roleCeo.id], [], userDave.id);

  // Document B: Engineering + Senior Engineer (Alice & Dave)
  await createDoc('Doc B (Senior Eng)', DocumentVisibility.PRIVATE, null, [roleSeniorEng.id, roleCeo.id], [], userDave.id);

  // Document C: HR + HR Role (Charlie)
  await createDoc('Doc C (HR Only)', DocumentVisibility.DEPARTMENT, deptHR.id, [roleHrManager.id, roleCeo.id], [], userDave.id);

  // Document D: Explicitly shared with Alice (Private but Alice is in allowedUsers)
  await createDoc('Doc D (Alice Explicit)', DocumentVisibility.PRIVATE, null, [], [], userDave.id, [userAlice.id]);

  // Document E: Different organization (Spy Corp)
  await createDoc('Doc E (Spy Corp)', DocumentVisibility.ORG_WIDE, null, [], [], userEve.id, [], orgSpy.id);

  // Document F: Correct designation but explicitly denied user (Bob is denied)
  await createDoc('Doc F (Bob Denied)', DocumentVisibility.ORG_WIDE, null, [], [userBob.id], userDave.id);

  return {
    orgAcme, orgSpy,
    deptEng, deptHR,
    roleCeo, roleSeniorEng, roleJuniorEng, roleHrManager,
    userAlice, userBob, userCharlie, userDave, userEve
  };
}

async function runTests() {
  const data = await seedData();
  const providerFactory = new ProviderFactory();
  // Override embedding to avoid needing real Ollama for this DB/Qdrant logic test
  providerFactory.getEmbeddingProvider = () => ({
    embedText: async (text: string) => Array(768).fill(0.01)
  }) as any;
  
  const vectorSearch = new VectorSearchProvider(new PermissionFilter(), providerFactory);
  const keywordSearch = new BM25SearchProvider(new PermissionFilter());
  const retrievalEngine = new RetrievalEngine(vectorSearch, keywordSearch, new HybridRanker(), new ContextBuilder(), new PromptBuilder());
  
  let passed = 0;
  let failed = 0;

  async function test(name: string, userId: string, orgId: string, deptId: string | null, roleIds: string[], query: string, expectFound: boolean) {
    try {
      const res = await retrievalEngine.search({
        query,
        userId,
        organizationId: orgId,
        departmentIds: deptId ? [deptId] : [],
        roleIds,
        limit: 10
      });

      const found = res.chunks.some(c => c.content.includes(query));
      if (found === expectFound) {
        console.log(`✅ PASS: ${name}`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${name} (Expected: ${expectFound}, Got: ${found})`);
        failed++;
      }
    } catch (e: any) {
      console.log(`❌ FAIL: ${name} (Error: ${e.message})`);
      failed++;
    }
  }

  // A. Same organization + correct department + correct designation -> PASS
  await test('Case A: Junior Eng access Doc A', data.userBob.id, data.orgAcme.id, data.deptEng.id, [data.roleJuniorEng.id], 'Doc A', true);
  
  // B. Same organization + correct department + insufficient designation -> DENY
  await test('Case B: Junior Eng access Doc B (Senior)', data.userBob.id, data.orgAcme.id, data.deptEng.id, [data.roleJuniorEng.id], 'Doc B', false);
  
  // C. Same organization + wrong department -> DENY
  await test('Case C: Engineering access Doc C (HR)', data.userAlice.id, data.orgAcme.id, data.deptEng.id, [data.roleSeniorEng.id], 'Doc C', false);
  
  // D. Explicitly denied user -> DENY
  await test('Case D: Bob denied Doc F', data.userBob.id, data.orgAcme.id, data.deptEng.id, [data.roleJuniorEng.id], 'Doc F', false);
  
  // E. Different organization -> DENY
  await test('Case E: Alice access Spy Corp', data.userAlice.id, data.orgAcme.id, data.deptEng.id, [data.roleSeniorEng.id], 'Doc E', false);
  await test('Case E2: Spy access Acme Corp', data.userEve.id, data.orgSpy.id, null, [], 'Doc A', false);

  // F. Explicitly shared document -> PASS
  await test('Case F: Alice explicit access Doc D', data.userAlice.id, data.orgAcme.id, data.deptEng.id, [data.roleSeniorEng.id], 'Doc D', true);
  
  // G. Owner access -> PASS
  await test('Case G: Dave (owner) access Doc D', data.userDave.id, data.orgAcme.id, null, [data.roleCeo.id], 'Doc D', true);

  console.log(`\n==================================================`);
  console.log(`RBAC SECURITY TEST RESULTS`);
  console.log(`==================================================`);
  console.log(`TOTAL:   ${passed + failed}`);
  console.log(`PASS:    ${passed}`);
  console.log(`FAIL:    ${failed}`);

  if (failed > 0) process.exit(1);
}

// Ensure clean DB
prisma.$executeRawUnsafe(`TRUNCATE TABLE "Organization" CASCADE`)
  .then(() => runTests())
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
