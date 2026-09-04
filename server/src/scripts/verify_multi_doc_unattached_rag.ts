import { PrismaClient } from '@prisma/client';
import { RAGService } from '../application/services/RAGService';
import { QdrantVectorStoreProvider } from '../infrastructure/providers/adapters/vector/QdrantVectorStoreProvider';
import { OllamaEmbeddingProvider } from '../infrastructure/providers/adapters/embedding/OllamaEmbeddingProvider';

const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('MULTIPLE ORGANIZATIONAL DOCUMENTS UNATTACHED RAG AUDIT');
  console.log('==================================================');

  // 1. Create Test Organization & Users
  const orgA = await prisma.organization.create({
    data: {
      name: `Multi-Doc RAG Test Org ${Date.now()}`,
      industry: 'CORPORATE',
      webAccessEnabled: false,
    },
  });

  const department = await prisma.department.create({
    data: {
      organizationId: orgA.id,
      name: 'Engineering',
      description: 'Tech Team',
    },
  });

  const userA = await prisma.user.create({
    data: {
      organizationId: orgA.id,
      departmentId: department.id,
      email: `allowed_user_${Date.now()}@orga.com`,
      firstName: 'Alice',
      lastName: 'Authorized',
      passwordHash: 'hashed',
    },
  });

  const userB = await prisma.user.create({
    data: {
      organizationId: orgA.id,
      email: `unauthorized_user_${Date.now()}@orga.com`,
      firstName: 'Bob',
      lastName: 'Restricted',
      passwordHash: 'hashed',
    },
  });

  console.log(`✅ Created Org A: ${orgA.id}`);
  console.log(`   User A (Allowed): ${userA.id}`);
  console.log(`   User B (Restricted): ${userB.id}`);

  // 2. Ingest 3 Organizational Documents into Qdrant & Prisma
  const qdrant = new QdrantVectorStoreProvider();
  const embeddings = new OllamaEmbeddingProvider();
  const collectionName = `org_${orgA.id.replace(/[^a-zA-Z0-9]/g, '_')}_docs`;
  await qdrant.ensureCollection(collectionName, 4096);

  // Document 1: Leave Policy (Public within Org)
  const doc1Id = `doc1_${Date.now()}`;
  const doc1Title = 'AUREN HR Leave Policy 2026';
  const doc1Content = 'AUREN HR LEAVE POLICY: Employees are entitled to 28 paid vacation days annually. Sick leave is unlimited with medical proof.';
  await prisma.document.create({
    data: {
      id: doc1Id,
      organizationId: orgA.id,
      ownerId: userA.id,
      title: doc1Title,
      classification: 'UNCLASSIFIED',
      mimeType: 'text/plain',
      sizeBytes: doc1Content.length,
      visibility: 'ORG_WIDE',
      sourceType: 'UPLOAD',
    },
  });
  const vector1 = await embeddings.embedText(doc1Content);
  await qdrant.upsert(collectionName, [
    {
      id: `11111111-1111-4111-8111-111111111111`,
      vector: vector1,
      payload: {
        documentId: doc1Id,
        content: doc1Content,
        chunkIndex: 0,
        title: doc1Title,
        organizationId: orgA.id,
        visibility: 'ORG_WIDE',
      },
    },
  ]);

  // Document 2: Equipment Requisition (Public within Org)
  const doc2Id = `doc2_${Date.now()}`;
  const doc2Title = 'AUREN Equipment Requisition Policy';
  const doc2Content = 'AUREN EQUIPMENT POLICY: All engineers are eligible for M3 Pro MacBooks after 90 days of employment.';
  await prisma.document.create({
    data: {
      id: doc2Id,
      organizationId: orgA.id,
      ownerId: userA.id,
      title: doc2Title,
      classification: 'UNCLASSIFIED',
      mimeType: 'text/plain',
      sizeBytes: doc2Content.length,
      visibility: 'ORG_WIDE',
      sourceType: 'UPLOAD',
    },
  });
  const vector2 = await embeddings.embedText(doc2Content);
  await qdrant.upsert(collectionName, [
    {
      id: `22222222-2222-4222-8222-222222222222`,
      vector: vector2,
      payload: {
        documentId: doc2Id,
        content: doc2Content,
        chunkIndex: 0,
        title: doc2Title,
        organizationId: orgA.id,
        visibility: 'ORG_WIDE',
      },
    },
  ]);

  // Document 3: Confidential Executive Payroll (RESTRICTED to User A only)
  const doc3Id = `doc3_${Date.now()}`;
  const doc3Title = 'Confidential Executive Compensation';
  const doc3Content = 'CONFIDENTIAL EXECUTIVE PAYROLL POLICY: Executive C-Level bonuses are capped at 50% of annual base salary.';
  await prisma.document.create({
    data: {
      id: doc3Id,
      organizationId: orgA.id,
      ownerId: userA.id,
      title: doc3Title,
      classification: 'RESTRICTED',
      mimeType: 'text/plain',
      sizeBytes: doc3Content.length,
      visibility: 'PRIVATE',
      sourceType: 'UPLOAD',
      allowedUsers: [userA.id],
      deniedUsers: [userB.id],
    },
  });
  const vector3 = await embeddings.embedText(doc3Content);
  await qdrant.upsert(collectionName, [
    {
      id: `33333333-3333-4333-8333-333333333333`,
      vector: vector3,
      payload: {
        documentId: doc3Id,
        content: doc3Content,
        chunkIndex: 0,
        title: doc3Title,
        organizationId: orgA.id,
        visibility: 'PRIVATE',
        allowedUsers: [userA.id],
        deniedUsers: [userB.id],
      },
    },
  ]);

  console.log(`✅ Uploaded & Vector Indexed 3 Documents into Org Knowledge Base:`);
  console.log(`   1. ${doc1Title} (${doc1Id}) - Visibility: ORGANIZATION`);
  console.log(`   2. ${doc2Title} (${doc2Id}) - Visibility: ORGANIZATION`);
  console.log(`   3. ${doc3Title} (${doc3Id}) - Visibility: RESTRICTED (Denied to User B)`);

  const ragService = new RAGService();

  // 6. Test Unattached Query from User A (Authorized)
  console.log('\n--- TEST 1: User A Unattached Query ("What is our leave policy?") ---');
  let toolCalled = false;
  let retrievedSources: any[] = [];
  let answerText = '';

  await ragService.streamChat(
    {
      message: 'What is our leave policy?',
      organizationId: orgA.id,
      userId: userA.id,
      departmentIds: [department.id],
      roleIds: [],
      mode: 'local',
    },
    (event: any) => {
      if (event.type === 'token') answerText += event.data;
      if (event.type === 'tool_call') {
        toolCalled = true;
        console.log(`   [Tool Executed]: ${event.data.name} with query: "${event.data.query}"`);
      }
      if (event.type === 'sources') retrievedSources = event.data;
    }
  );

  console.log(`   LLM Answer: "${answerText.trim()}"`);
  console.log(`   Sources Cited: ${retrievedSources.map((s) => s.title).join(', ')}`);

  if (toolCalled && retrievedSources.some((s) => s.title.includes('Leave')) && answerText.includes('28')) {
    console.log('✅ TEST 1 PASSED: Unattached normal chat retrieved Leave Policy correctly!');
  } else {
    console.error('❌ TEST 1 FAILED!');
  }

  // 4. Test 2: User B asks for confidential payroll info (NO ATTACHMENTS - RESTRICTED ACCESS TEST)
  console.log('\n--- TEST 2: User B Unattached Query ("What is the C-Level bonus policy?") ---');
  let userBAnswer = '';
  let userBSources: any[] = [];

  await ragService.streamChat(
    {
      message: 'What is the C-Level bonus policy?',
      organizationId: orgA.id,
      userId: userB.id,
      departmentIds: [],
      roleIds: [],
      mode: 'local',
    },
    (event: any) => {
      if (event.type === 'token') userBAnswer += event.data;
      if (event.type === 'sources') userBSources = event.data;
    }
  );

  console.log(`   LLM Answer for User B: "${userBAnswer.trim()}"`);
  console.log(`   Sources Cited for User B: ${userBSources.map((s) => s.title).join(', ')}`);

  const containsConfidential = userBSources.some((s) => s.title.includes('Compensation')) || userBAnswer.includes('50%');

  if (!containsConfidential) {
    console.log('✅ TEST 2 PASSED: Restricted document was successfully filtered out from User B!');
  } else {
    console.error('❌ TEST 2 FAILED: Confidential document leaked to unauthorized User B!');
  }

  // Clean up test data
  await prisma.document.deleteMany({ where: { organizationId: orgA.id } });
  await prisma.department.deleteMany({ where: { organizationId: orgA.id } });
  await prisma.user.deleteMany({ where: { organizationId: orgA.id } });
  await prisma.organization.delete({ where: { id: orgA.id } });

  console.log('\n==================================================');
  console.log('ORGANIZATION RAG AUDIT COMPLETED SUCCESSFULLY');
  console.log('==================================================');
}

main().catch((err) => {
  console.error('Error running audit:', err);
  process.exit(1);
});
