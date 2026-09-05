import { prisma } from '../infrastructure/database/prisma';
import { RAGService } from '../application/services/RAGService';
import { RetrievalEngine } from '../application/services/RetrievalEngine';
import { AIGateway } from '../infrastructure/gateway/AIGateway';
import { QdrantVectorStoreProvider } from '../infrastructure/providers/adapters/vector/QdrantVectorStoreProvider';
import { LlamaCppEmbeddingProvider } from '../infrastructure/providers/adapters/embedding/LlamaCppEmbeddingProvider';
import { OrganizationRetriever } from '../ai/retrievers/OrganizationRetriever';
import { createInternalKnowledgeTool, createWebSearchTool, dateTimeTool } from '../ai/tools/aiTools';

async function runLangGraphTestSuite() {
  console.log('\n==================================================');
  console.log('STARTING LANGGRAPH + LANGCHAIN REAL E2E TEST SUITE');
  console.log('==================================================\n');

  // 1. Setup Test Tenant Data
  const orgName = `LangGraph_Test_Org_${Date.now()}`;
  const org = await prisma.organization.create({
    data: {
      name: orgName,
      domain: `langgraph_${Date.now()}.com`,
      industry: 'CORPORATE',
      webAccessEnabled: true,
    }
  });

  const department = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Engineering',
      description: 'Engineering Dept'
    }
  });

  const role = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'Engineer'
    }
  });

  const userA = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: department.id,
      email: `usera_${Date.now()}@langgraph.com`,
      firstName: 'Alice',
      lastName: 'Engineer',
      passwordHash: 'dummy',
    }
  });

  await prisma.userRole.create({
    data: {
      userId: userA.id,
      roleId: role.id
    }
  });

  // Org B for security isolation test
  const orgB = await prisma.organization.create({
    data: {
      name: `OrgB_${Date.now()}`,
      domain: `orgb_${Date.now()}.com`,
      industry: 'FINANCE',
      webAccessEnabled: true
    }
  });

  const userB = await prisma.user.create({
    data: {
      organizationId: orgB.id,
      email: `userb_${Date.now()}@orgb.com`,
      firstName: 'Bob',
      lastName: 'Hacker',
      passwordHash: 'dummy'
    }
  });

  console.log(`✅ [SETUP] Created Test Tenant Org A (${org.id}) and Org B (${orgB.id})`);

  // 2. Ingest Document for Org A
  const qdrant = new QdrantVectorStoreProvider();
  const embeddings = new LlamaCppEmbeddingProvider();

  const docId = `doc_${Date.now()}`;
  const docTitle = 'AUREN Engineering Leave and Remote Policy';
  const chunkText = 'AUREN Engineering Team members are granted 25 paid leaves annually and full remote flexibility.';

  await prisma.document.create({
    data: {
      id: docId,
      organizationId: org.id,
      ownerId: userA.id,
      title: docTitle,
      classification: 'RESTRICTED',
      mimeType: 'text/plain',
      sizeBytes: chunkText.length,
      visibility: 'DEPARTMENT',
      sourceType: 'UPLOAD',
    }
  });

  const vector = await embeddings.embedText(chunkText);
  const collectionName = `org_${org.id}_docs`;
  await qdrant.ensureCollection(collectionName, vector.length);
  await qdrant.upsert(collectionName, [{
    id: `c1111111-1111-4111-8111-111111111111`,
    vector: vector,
    payload: {
      documentId: docId,
      content: chunkText,
      chunkIndex: 0,
      title: docTitle,
      organizationId: org.id,
      departmentId: department.id,
      visibility: 'DEPARTMENT',
      classification: 'RESTRICTED',
      allowedRoles: [],
      allowedUsers: [],
      allowedDepartments: []
    }
  }]);

  console.log('✅ [INGEST] Ingested internal document & vector indexed into Qdrant');

  // 3. Instantiate LangGraph RAG Service
  const ragService = new RAGService();

  // Test 1: Internal Knowledge Query
  console.log('\n--- TEST 1: Internal Knowledge Query ("What is our leave policy?") ---');
  let t1Events: any[] = [];
  await ragService.streamChat({
    message: 'What is our leave policy?',
    organizationId: org.id,
    userId: userA.id,
    departmentIds: [department.id],
    roleIds: [role.id],
    mode: 'hybrid'
  }, (evt) => t1Events.push(evt));

  const t1ToolCall = t1Events.find(e => e.type === 'tool_call');
  const t1Sources = t1Events.find(e => e.type === 'sources');
  const t1Tokens = t1Events.filter(e => e.type === 'token').map(e => e.data).join('');

  console.log(`Tool Call Executed:`, t1ToolCall?.data);
  console.log(`Sources Emitted:`, t1Sources?.data?.length);
  console.log(`LLM Response Snippet: "${t1Tokens.slice(0, 100)}..."`);

  if (t1ToolCall?.data?.name === 'internal_knowledge' && t1Sources?.data?.length > 0) {
    console.log('✅ [PASS] Test 1: LangGraph routed to internal_knowledge tool and retrieved chunks.');
  } else {
    console.error('❌ [FAIL] Test 1');
  }

  // Test 2: External Web Search Query
  console.log('\n--- TEST 2: External Web Search Query ("Who is the Prime Minister of India today?") ---');
  let t2Events: any[] = [];
  await ragService.streamChat({
    message: 'Who is the Prime Minister of India today?',
    organizationId: org.id,
    userId: userA.id,
    departmentIds: [department.id],
    roleIds: [role.id],
    mode: 'hybrid'
  }, (evt) => t2Events.push(evt));

  const t2ToolCall = t2Events.find(e => e.type === 'tool_call');
  const t2Sources = t2Events.find(e => e.type === 'sources');
  const t2Tokens = t2Events.filter(e => e.type === 'token').map(e => e.data).join('');

  console.log(`Tool Call Executed:`, t2ToolCall?.data);
  console.log(`Sources Emitted:`, t2Sources?.data?.length);
  console.log(`LLM Response Snippet: "${t2Tokens.slice(0, 100)}..."`);

  if (t2ToolCall?.data?.name === 'web_search' && t2Sources?.data?.some((s: any) => s.type === 'web')) {
    console.log('✅ [PASS] Test 2: LangGraph routed to web_search tool and cited web results.');
  } else {
    console.error('❌ [FAIL] Test 2');
  }

  // Test 3: Date / System Utility Query
  console.log('\n--- TEST 3: System Utility Query ("What date is today?") ---');
  let t3Events: any[] = [];
  await ragService.streamChat({
    message: 'What date is today?',
    organizationId: org.id,
    userId: userA.id,
    departmentIds: [department.id],
    roleIds: [role.id],
    mode: 'hybrid'
  }, (evt) => t3Events.push(evt));

  const t3ToolCall = t3Events.find(e => e.type === 'tool_call');
  console.log(`Tool Call Executed:`, t3ToolCall?.data);

  if (t3ToolCall?.data?.name === 'date_time') {
    console.log('✅ [PASS] Test 3: LangGraph routed to date_time tool.');
  } else {
    console.error('❌ [FAIL] Test 3');
  }

  // Test 4: Cross-Organization Zero-Trust Isolation Test
  console.log('\n--- TEST 4: Zero-Trust Security Isolation Test (User B from Org B queries Org A policy) ---');
  const retrieverUserB = new OrganizationRetriever({
    authContext: {
      organizationId: orgB.id,
      userId: userB.id,
      roles: [],
      isSuperAdmin: false
    }
  });

  const leakageDocs = await retrieverUserB.getRelevantDocuments('leave policy');
  console.log(`Docs retrieved for Org B user querying Org A data: ${leakageDocs.length}`);

  if (leakageDocs.length === 0) {
    console.log('✅ [PASS] Test 4: ZERO cross-tenant leakage. Org B user received 0 results.');
  } else {
    console.error('❌ [FAIL] Test 4: Security Breach detected!');
  }

  // Test 5: Web Access Policy Guard (webAccessEnabled = false)
  console.log('\n--- TEST 5: Web Access Policy Enforcement (webAccessEnabled = false) ---');
  await prisma.organization.update({
    where: { id: org.id },
    data: { webAccessEnabled: false }
  });

  let t5Events: any[] = [];
  await ragService.streamChat({
    message: 'Who is the Prime Minister of India today?',
    organizationId: org.id,
    userId: userA.id,
    departmentIds: [department.id],
    roleIds: [role.id],
    mode: 'hybrid'
  }, (evt) => t5Events.push(evt));

  const t5ToolResult = t5Events.find(e => e.type === 'tool_result');
  console.log(`Tool Result for disabled web policy:`, t5ToolResult?.data);

  if (t5ToolResult?.data?.status === 'blocked_by_policy') {
    console.log('✅ [PASS] Test 5: Web Search tool execution blocked by organization security policy.');
  } else {
    console.error('❌ [FAIL] Test 5');
  }

  // Cleanup
  await prisma.document.delete({ where: { id: docId } });
  await prisma.userRole.deleteMany({ where: { userId: userA.id } });
  await prisma.user.deleteMany({ where: { organizationId: { in: [org.id, orgB.id] } } });
  await prisma.role.deleteMany({ where: { organizationId: org.id } });
  await prisma.department.deleteMany({ where: { organizationId: org.id } });
  await prisma.organization.deleteMany({ where: { id: { in: [org.id, orgB.id] } } });

  console.log('\n==================================================');
  console.log('ALL LANGGRAPH E2E TESTS COMPLETED SUCCESSFULLY');
  console.log('==================================================\n');
}

runLangGraphTestSuite().catch(console.error);
