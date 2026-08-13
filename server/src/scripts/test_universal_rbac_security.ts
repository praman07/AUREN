import { PrismaClient, DocumentVisibility } from '@prisma/client';
import { randomUUID } from 'crypto';
import { RAGService } from '../application/services/RAGService';
import { ProviderFactory } from '../infrastructure/providers/registry/ProviderFactory';
import { AIGateway } from '../infrastructure/gateway/AIGateway';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantIndexingService } from '../application/services/QdrantIndexingService';
import { PermissionFilter } from '../infrastructure/search/PermissionFilter';
import { VectorSearchProvider } from '../infrastructure/search/VectorSearchProvider';
import { BM25SearchProvider } from '../infrastructure/search/BM25SearchProvider';
import { HybridRanker } from '../domain/retrieval/HybridRanker';
import { ContextBuilder } from '../domain/retrieval/ContextBuilder';
import { PromptBuilder } from '../domain/retrieval/PromptBuilder';
import { RetrievalEngine } from '../application/services/RetrievalEngine';

const prisma = new PrismaClient();

async function runAdversarialTest() {
  console.log('==================================================');
  console.log('UNIVERSAL POLICY ENGINE: ADVERSARIAL SECURITY TEST');
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

    // 2. ORG A SETUP
    const orgAId = randomUUID();
    const orgBId = randomUUID();

    const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });
    try { await qdrant.createCollection(`org_${orgAId}_docs`, { vectors: { size: 768, distance: 'Cosine' } }); } catch (e: any) {}
    try { await qdrant.createCollection(`org_${orgBId}_docs`, { vectors: { size: 768, distance: 'Cosine' } }); } catch (e: any) {}

    await prisma.organization.create({
      data: { id: orgAId, name: 'Organization A', domain: 'orga.example.com' }
    });

    await prisma.organization.create({
      data: { id: orgBId, name: 'Organization B', domain: 'orgb.example.com' }
    });

    // 3. DEPARTMENTS
    const deptEngId = randomUUID();
    const deptHRId = randomUUID();
    const deptFinId = randomUUID();
    const deptMgmtId = randomUUID();

    await prisma.department.createMany({
      data: [
        { id: deptEngId, organizationId: orgAId, name: 'Engineering' },
        { id: deptHRId, organizationId: orgAId, name: 'HR' },
        { id: deptFinId, organizationId: orgAId, name: 'Finance' },
        { id: deptMgmtId, organizationId: orgAId, name: 'Management' }
      ]
    });

    // 4. ROLES
    const roleEngId = randomUUID();
    const roleHRManagerId = randomUUID();
    const roleFinanceId = randomUUID();
    const roleInternId = randomUUID();
    const roleExecId = randomUUID();

    await prisma.role.createMany({
      data: [
        { id: roleEngId, organizationId: orgAId, name: 'Engineer' },
        { id: roleHRManagerId, organizationId: orgAId, name: 'HR Manager' },
        { id: roleFinanceId, organizationId: orgAId, name: 'Finance' },
        { id: roleInternId, organizationId: orgAId, name: 'Intern' },
        { id: roleExecId, organizationId: orgAId, name: 'Executive' }
      ]
    });

    // 5. USERS
    const aliceId = randomUUID();
    const bobId = randomUUID();
    const carolId = randomUUID();
    const davidId = randomUUID();
    const eveId = randomUUID();
    const malloryOrgBId = randomUUID();

    await prisma.user.createMany({
      data: [
        { id: aliceId, organizationId: orgAId, departmentId: deptEngId, email: 'alice@orga.example.com' },
        { id: bobId, organizationId: orgAId, departmentId: deptHRId, email: 'bob@orga.example.com' },
        { id: carolId, organizationId: orgAId, departmentId: deptFinId, email: 'carol@orga.example.com' },
        { id: davidId, organizationId: orgAId, departmentId: deptEngId, email: 'david@orga.example.com' },
        { id: eveId, organizationId: orgAId, departmentId: deptMgmtId, email: 'eve@orga.example.com' },
        { id: malloryOrgBId, organizationId: orgBId, email: 'mallory@orgb.example.com' }
      ]
    });

    await prisma.userRole.createMany({
      data: [
        { userId: aliceId, roleId: roleEngId },
        { userId: bobId, roleId: roleHRManagerId },
        { userId: carolId, roleId: roleFinanceId },
        { userId: davidId, roleId: roleInternId },
        { userId: eveId, roleId: roleExecId }
      ]
    });

    // 6. DOCUMENTS WITH SECRETS
    const documents = [
      {
        id: randomUUID(),
        title: 'Engineering Architecture',
        content: 'Engineering standard practices. \nENGINEERING_SECRET_7842 is the master DB password.',
        ownerId: aliceId,
        visibility: DocumentVisibility.DEPARTMENT,
        departmentId: deptEngId,
        allowedRoles: [], allowedUsers: [], allowedDepartments: [], deniedRoles: [], deniedUsers: [], deniedDepartments: []
      },
      {
        id: randomUUID(),
        title: 'HR Salaries',
        content: 'HR guidelines. \nHR_SECRET_9281 contains salary details.',
        ownerId: bobId,
        visibility: DocumentVisibility.DEPARTMENT,
        departmentId: deptHRId,
        allowedRoles: [], allowedUsers: [], allowedDepartments: [], deniedRoles: [], deniedUsers: [], deniedDepartments: []
      },
      {
        id: randomUUID(),
        title: 'Q3 Financials',
        content: 'Finance planning. \nFINANCE_SECRET_4421 is the bank routing number.',
        ownerId: carolId,
        visibility: DocumentVisibility.DEPARTMENT,
        departmentId: deptFinId,
        allowedRoles: [], allowedUsers: [], allowedDepartments: [], deniedRoles: [], deniedUsers: [], deniedDepartments: []
      },
      {
        id: randomUUID(),
        title: 'Executive Roadmap',
        content: 'Board roadmap. \nEXECUTIVE_SECRET_7719 is the acquisition target.',
        ownerId: eveId,
        visibility: DocumentVisibility.DEPARTMENT,
        departmentId: deptMgmtId,
        allowedRoles: [roleExecId], allowedUsers: [], allowedDepartments: [], deniedRoles: [], deniedUsers: [], deniedDepartments: []
      },
      {
        id: randomUUID(),
        title: 'Alice Private Notes',
        content: 'Personal notes. \nALICE_PRIVATE_SECRET_1193 is my locker combo.',
        ownerId: aliceId,
        visibility: DocumentVisibility.PRIVATE,
        departmentId: null,
        allowedRoles: [], allowedUsers: [aliceId], allowedDepartments: [], deniedRoles: [], deniedUsers: [], deniedDepartments: []
      },
      {
        id: randomUUID(),
        title: 'Role Allow Only',
        content: 'ROLE_SECRET_5555. Available to Engineers.',
        ownerId: aliceId,
        visibility: DocumentVisibility.PRIVATE,
        departmentId: null,
        allowedRoles: [roleEngId], allowedUsers: [], allowedDepartments: [], deniedRoles: [], deniedUsers: [], deniedDepartments: []
      },
      {
        id: randomUUID(),
        title: 'User Allow Only',
        content: 'USER_SECRET_4444. Available to David.',
        ownerId: aliceId,
        visibility: DocumentVisibility.PRIVATE,
        departmentId: null,
        allowedRoles: [], allowedUsers: [davidId], allowedDepartments: [], deniedRoles: [], deniedUsers: [], deniedDepartments: []
      },
      {
        id: randomUUID(),
        title: 'Explicit User Deny',
        content: 'NO_DAVID_SECRET_3333. Organization wide, but David is denied.',
        ownerId: aliceId,
        visibility: DocumentVisibility.ORG_WIDE,
        departmentId: null,
        allowedRoles: [], allowedUsers: [], allowedDepartments: [], deniedRoles: [], deniedUsers: [davidId], deniedDepartments: []
      },
      {
        id: randomUUID(),
        title: 'Role Allow + User Deny',
        content: 'CONFLICT_SECRET_2222. Engineers allowed, but Alice explicitly denied.',
        ownerId: eveId,
        visibility: DocumentVisibility.PRIVATE,
        departmentId: null,
        allowedRoles: [roleEngId], allowedUsers: [], allowedDepartments: [], deniedRoles: [], deniedUsers: [aliceId], deniedDepartments: []
      }
    ];

    const providerFactory = new ProviderFactory();
    const aiGateway = new AIGateway(providerFactory);
    const permissionFilter = new PermissionFilter();
    const vectorProvider = new VectorSearchProvider(permissionFilter, providerFactory);
    const keywordSearch = new BM25SearchProvider(permissionFilter);
    const ranker = new HybridRanker();
    const contextBuilder = new ContextBuilder();
    const promptBuilder = new PromptBuilder();
    const retrievalEngine = new RetrievalEngine(vectorProvider, keywordSearch, ranker, contextBuilder, promptBuilder);
    const ragService = new RAGService(retrievalEngine, aiGateway);

    // 7. INGEST DOCUMENTS
    console.log('--- PHASE 2: INGESTION & CHUNKING ---');
    for (const doc of documents) {
      const createdDoc = await prisma.document.create({
        data: {
          id: doc.id,
          organizationId: orgAId,
          ownerId: doc.ownerId,
          title: doc.title,
          mimeType: 'text/plain',
          sizeBytes: Buffer.byteLength(doc.content, 'utf8'),
          visibility: doc.visibility,
          departmentId: doc.departmentId,
          allowedRoles: doc.allowedRoles,
          allowedUsers: doc.allowedUsers,
          allowedDepartments: doc.allowedDepartments,
          deniedRoles: doc.deniedRoles,
          deniedUsers: doc.deniedUsers,
          deniedDepartments: doc.deniedDepartments
        } as any
      });

      const versionId = randomUUID();
      await prisma.documentVersion.create({
        data: { id: versionId, documentId: createdDoc.id, version: 1, s3Key: `test-${createdDoc.id}`, hash: 'testhash' }
      });

      // Manual chunking and embedding
      const chunkId = randomUUID();
      await prisma.documentChunk.create({
        data: {
          id: chunkId,
          organizationId: orgAId,
          documentId: createdDoc.id,
          versionId: versionId,
          chunkIndex: 0,
          text: doc.content,
          tokenCount: 10,
          embeddingStatus: 'COMPLETED',
          indexingStatus: 'COMPLETED'
        }
      });
      
      const result = await aiGateway.embed({ texts: [doc.content], context: {} });
      const vector = result.embeddings[0];
      
      await prisma.documentChunk.update({
        where: { id: chunkId },
        data: { vectorData: vector }
      });

      await qdrant.upsert(`org_${orgAId}_docs`, {
        wait: true,
        points: [{
          id: chunkId,
          vector: vector,
          payload: {
            documentId: doc.id,
            chunkId: chunkId,
            organizationId: orgAId,
            departmentId: doc.departmentId,
            ownerId: doc.ownerId,
            visibility: doc.visibility,
            content: doc.content,
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
    }

    console.log('All documents ingested and embedded.');

    // 8. ADVERSARIAL TESTING
    console.log('\n--- PHASE 3: PRECEDENCE & ISOLATION TESTING ---');
    let passCount = 0;
    let failCount = 0;

    async function testCase(name: string, query: string, userId: string, roleIds: string[], departmentIds: string[], orgId: string, shouldFindSecret: string | null, forbiddenSecret: string | null = null) {
      try {
        const results = await retrievalEngine.search({
          query,
          organizationId: orgId,
          userId,
          roleIds,
          departmentIds,
          limit: 5
        });

        const foundText = results.chunks.map(r => r.content).join(' ');
        
        let passed = false;
        if (shouldFindSecret) {
          passed = foundText.includes(shouldFindSecret);
        } else if (forbiddenSecret) {
          passed = results.chunks.length === 0 || !foundText.includes(forbiddenSecret);
        } else {
          passed = results.chunks.length === 0;
        }

        if (passed) {
          console.log(`[✅ PASS] ${name}`);
          passCount++;
        } else {
          console.log(`[❌ FAIL] ${name}`);
          console.log(`   Expected secret: ${shouldFindSecret || 'NONE'}`);
          console.log(`   Found text: ${foundText || 'NONE'}`);
          failCount++;
        }
      } catch (e: any) {
         console.log(`[❌ FAIL] ${name} (Exception: ${e.message})`);
         failCount++;
      }
    }

    // 1. Authorized department
    await testCase('Alice (Eng) can access Eng docs', 'What is the engineering secret?', aliceId, [roleEngId], [deptEngId], orgAId, 'ENGINEERING_SECRET_7842');
    
    // 2. Unauthorized department
    await testCase('Bob (HR) CANNOT access Eng docs', 'What is the engineering secret?', bobId, [roleHRManagerId], [deptHRId], orgAId, null, 'ENGINEERING_SECRET_7842');
    
    // 3. Authorized user
    await testCase('Alice can access her private notes', 'What is Alice private secret?', aliceId, [roleEngId], [deptEngId], orgAId, 'ALICE_PRIVATE_SECRET_1193');
    
    // 4. Cross-user private data
    await testCase('David CANNOT access Alice private notes', 'What is Alice private secret?', davidId, [roleInternId], [deptEngId], orgAId, null, 'ALICE_PRIVATE_SECRET_1193');
    
    // 5. Authorized role access
    await testCase('Alice (Engineer) can access Role Allow Only doc', 'What is the role secret?', aliceId, [roleEngId], [deptEngId], orgAId, 'ROLE_SECRET_5555');
    
    // 6. Unauthorized role
    await testCase('Bob (HR) CANNOT access Role Allow Only doc', 'What is the role secret?', bobId, [roleHRManagerId], [deptHRId], orgAId, null, 'ROLE_SECRET_5555');
    
    // 7. Explicit User Allow
    await testCase('David (Intern) can access User Allow Only doc', 'What is the user secret?', davidId, [roleInternId], [deptEngId], orgAId, 'USER_SECRET_4444');
    
    // 8. Explicit User Deny
    await testCase('Alice can access org wide doc', 'What is the no david secret?', aliceId, [roleEngId], [deptEngId], orgAId, 'NO_DAVID_SECRET_3333');
    await testCase('David CANNOT access Explicit User Deny doc (Precedence over Org Wide)', 'What is the no david secret?', davidId, [roleInternId], [deptEngId], orgAId, null, 'NO_DAVID_SECRET_3333');
    
    // 9. Role Allow + User Deny Precedence
    await testCase('Bob CANNOT access conflict doc (Not Engineer)', 'What is the conflict secret?', bobId, [roleHRManagerId], [deptHRId], orgAId, null, 'CONFLICT_SECRET_2222');
    await testCase('David (Engineer role spoofed) CAN access conflict doc', 'What is the conflict secret?', davidId, [roleEngId], [deptEngId], orgAId, 'CONFLICT_SECRET_2222');
    await testCase('Alice (Engineer) CANNOT access conflict doc (Explicit User Deny wins over Role Allow)', 'What is the conflict secret?', aliceId, [roleEngId], [deptEngId], orgAId, null, 'CONFLICT_SECRET_2222');

    // 10. Cross Organization
    await testCase('Mallory (Org B) CANNOT access Org A Eng docs', 'What is the engineering secret?', malloryOrgBId, [], [], orgBId, null, 'ENGINEERING_SECRET_7842');

    console.log(`\nTOTAL: ${passCount + failCount}`);
    console.log(`PASS:  ${passCount}`);
    console.log(`FAIL:  ${failCount}`);
  } catch (err: any) {
    console.error('Fatal Test Error:', err);
  }
}

runAdversarialTest().catch(console.error).finally(() => process.exit(0));
