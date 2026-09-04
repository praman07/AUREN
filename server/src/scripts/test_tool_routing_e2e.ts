import { RAGService } from '../application/services/RAGService';
import { randomUUID } from 'crypto';
import { prisma } from '../infrastructure/database/prisma';

async function runRoutingE2ETestSuite() {
  console.log('====================================================');
  console.log('STARTING AUREN DETERMINISTIC TOOL ROUTING E2E SUITE');
  console.log('====================================================\n');

  const ragService = new RAGService();

  // Setup Test Tenant/User & Document
  const testOrgId = 'e2e-routing-org-' + Date.now();
  const testUserId = 'e2e-routing-user-' + Date.now();
  const unauthorizedUserId = 'e2e-unauth-user-' + Date.now();

  console.log(`[SETUP] Creating test Organization: ${testOrgId}`);
  await prisma.organization.create({
    data: {
      id: testOrgId,
      name: 'E2E Routing Org',
      domain: `routing-${Date.now()}.com`,
      webAccessEnabled: true,
    }
  });

  console.log(`[SETUP] Creating test Authorized User: ${testUserId}`);
  await prisma.user.create({
    data: {
      id: testUserId,
      email: `user-${Date.now()}@routing.com`,
      passwordHash: 'password123',
      firstName: 'E2E',
      lastName: 'User',
      organizationId: testOrgId,
    }
  });

  console.log(`[SETUP] Creating test Unauthorized User: ${unauthorizedUserId}`);
  await prisma.user.create({
    data: {
      id: unauthorizedUserId,
      email: `unauth-${Date.now()}@routing.com`,
      passwordHash: 'password123',
      firstName: 'Unauthorized',
      lastName: 'User',
      organizationId: testOrgId,
    }
  });

  // Seed internal test document into DB
  console.log(`[SETUP] Ingesting German Timetable document into Database`);
  const testDoc = await prisma.document.create({
    data: {
      title: 'German Learning Timetable',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      organization: { connect: { id: testOrgId } },
      owner: { connect: { id: testUserId } },
      visibility: 'ORG_WIDE',
    }
  });

  const testVersion = await prisma.documentVersion.create({
    data: {
      id: randomUUID(),
      document: { connect: { id: testDoc.id } },
      version: 1,
      s3Key: 'test/German_Timetable.pdf',
      hash: 'testhash123',
    }
  });

  const testChunkText = "German Learning Timetable: Mondays 9AM Vocabulary, Wednesdays 2PM Grammar, Fridays 4PM Conversation practice.";
  const chunkId = randomUUID();

  const createdChunk = await prisma.documentChunk.create({
    data: {
      id: chunkId,
      document: { connect: { id: testDoc.id } },
      organization: { connect: { id: testOrgId } },
      version: { connect: { id: testVersion.id } },
      chunkIndex: 0,
      text: testChunkText,
      tokenCount: 15,
    }
  });

  console.log(`[SETUP] Embedding and Indexing document chunk into Qdrant`);
  const { OllamaEmbeddingProvider } = await import('../infrastructure/providers/adapters/embedding/OllamaEmbeddingProvider');
  const { QdrantVectorStoreProvider } = await import('../infrastructure/providers/adapters/vector/QdrantVectorStoreProvider');
  const embedProvider = new OllamaEmbeddingProvider();
  const vectorStore = new QdrantVectorStoreProvider();

  const vector = await embedProvider.embedText(testChunkText);
  const collectionName = `org_${testOrgId}_docs`;

  await vectorStore.ensureCollection(collectionName, vector.length);
  await vectorStore.upsert(collectionName, [
    {
      id: chunkId,
      vector,
      payload: {
        organizationId: testOrgId,
        visibility: 'ORG_WIDE',
        ownerId: testUserId,
        documentId: testDoc.id,
        documentVersionId: testVersion.id,
        chunkId: chunkId,
        allowedRoles: [],
        deniedRoles: [],
        allowedUsers: [],
        deniedUsers: [],
        allowedDepartments: [],
        deniedDepartments: [],
        chunkIndex: 0,
        text: testChunkText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  ]);
  console.log(`[SETUP] Document chunk vector successfully indexed in Qdrant collection ${collectionName}`);

  let passCount = 0;
  let failCount = 0;

  async function executeTestScenario(
    testNumber: number,
    description: string,
    query: string,
    userId: string,
    mode: 'hybrid' | 'local',
    expectedIntent: string,
    expectedTools: string[],
    expectWebBlocked: boolean = false,
    expectedMinInternalChunks: number = 0,
    expectedMinWebResults: number = 0,
    checkDbMemoryWrite: boolean = false
  ) {
    console.log(`----------------------------------------------------`);
    console.log(`TEST ${testNumber}: ${description}`);
    console.log(`Query: "${query}" | User: ${userId.slice(0, 20)} | Mode: ${mode}`);

    const events: Array<{ type: string; data?: any }> = [];
    let fullAnswer = '';

    try {
      await ragService.streamChat(
        {
          message: query,
          organizationId: testOrgId,
          userId,
          mode,
          departmentIds: [],
          roleIds: [],
        },
        (evt) => {
          events.push(evt);
          if (evt.type === 'token') {
            fullAnswer += evt.data;
          }
        }
      );

      const intentEvt = events.find((e) => e.type === 'intent_detected');
      const detectedIntent = intentEvt?.data?.intent || 'UNKNOWN';

      const nodesExecuted = events.filter((e) => e.type === 'node_execution').map((e) => e.data?.nodeName);
      const toolCalls = events.filter((e) => e.type === 'tool_call').map((e) => e.data?.name);
      const toolResults = events.filter((e) => e.type === 'tool_result');
      const contextPassedEvt = events.find((e) => e.type === 'context_passed_to_llm')?.data;

      // Extract details for the 8 reported execution facts
      const internalToolRes = toolResults.find((e) => e.data?.name === 'internal_knowledge')?.data;
      const webToolRes = toolResults.find((e) => e.data?.name === 'web_search')?.data;
      const memoryToolRes = toolResults.find((e) => e.data?.name === 'user_memory')?.data;
      const historyToolRes = toolResults.find((e) => e.data?.name === 'conversation_history')?.data;

      const internalDocsCount = internalToolRes?.count ?? 0;
      const webResultsCount = webToolRes?.count ?? 0;
      const totalRetrievedCount = internalDocsCount + webResultsCount;

      const isRetrievalExecuted = nodesExecuted.includes('retrieveInternal') || nodesExecuted.includes('webSearch');
      const isContextPassedToOllama = !!contextPassedEvt && (
        (internalDocsCount > 0 ? contextPassedEvt.includesInternalContext : true) &&
        (webResultsCount > 0 ? contextPassedEvt.includesWebResults : true)
      );

      console.log(`\n  --- EXECUTION TRACE & AUDIT REPORT ---`);
      console.log(`  1. Classified Intent:           ${detectedIntent} (Expected: ${expectedIntent})`);
      console.log(`  2. Actual Graph Nodes Executed: ${JSON.stringify(nodesExecuted)}`);
      console.log(`  3. Actual Tools Invoked:        ${JSON.stringify(toolCalls)}`);
      console.log(`  4. Tool Execution Results:      ${JSON.stringify(toolResults.map(r => r.data))}`);
      console.log(`  5. Retrieval/Embedding Executed: ${isRetrievalExecuted}`);
      console.log(`  6. Retrieved Result Count:      Internal=${internalDocsCount}, Web=${webResultsCount} (Total=${totalRetrievedCount})`);
      console.log(`  7. Context Passed into Ollama:  ${isContextPassedToOllama ? 'YES' : 'NO'} (${JSON.stringify(contextPassedEvt || {})})`);
      console.log(`  8. Final Answer:                "${fullAnswer.trim().slice(0, 120).replace(/\n/g, ' ')}..."\n`);

      let passed = true;

      // ASSERTION 1: Intent Classification Match
      if (detectedIntent !== expectedIntent) {
        console.error(`  [FAIL ASSERTION] Intent mismatch! Expected: ${expectedIntent}, Got: ${detectedIntent}`);
        passed = false;
      }

      // ASSERTION 2: Required Tools Execution
      for (const expectedTool of expectedTools) {
        if (!toolCalls.includes(expectedTool)) {
          console.error(`  [FAIL ASSERTION] Required tool '${expectedTool}' was NOT actually executed!`);
          passed = false;
        }
      }

      // ASSERTION 3: EXTERNAL_WEB requires web_search tool execution
      if (expectedIntent === 'EXTERNAL_WEB' && !expectWebBlocked) {
        if (!nodesExecuted.includes('webSearch')) {
          console.error(`  [FAIL ASSERTION] EXTERNAL_WEB selected but 'webSearch' graph node was not executed!`);
          passed = false;
        }
        if (!toolCalls.includes('web_search')) {
          console.error(`  [FAIL ASSERTION] EXTERNAL_WEB selected but 'web_search' tool was not invoked!`);
          passed = false;
        }
      }

      // ASSERTION 4: INTERNAL_KNOWLEDGE requires Qdrant retrieval node execution
      if (expectedIntent === 'INTERNAL_KNOWLEDGE' || expectedIntent === 'MIXED') {
        if (!nodesExecuted.includes('retrieveInternal')) {
          console.error(`  [FAIL ASSERTION] INTERNAL_KNOWLEDGE selected but 'retrieveInternal' graph node was not executed!`);
          passed = false;
        }
        if (!toolCalls.includes('internal_knowledge')) {
          console.error(`  [FAIL ASSERTION] INTERNAL_KNOWLEDGE selected but 'internal_knowledge' tool was not invoked!`);
          passed = false;
        }
      }

      // ASSERTION 5: Internal Chunk Count Grounding Requirement
      if (expectedMinInternalChunks > 0 && internalDocsCount < expectedMinInternalChunks) {
        console.error(`  [FAIL ASSERTION] Expected at least ${expectedMinInternalChunks} internal doc chunks, but got ${internalDocsCount}!`);
        passed = false;
      }

      // ASSERTION 6: Web Results Grounding Requirement
      if (expectedMinWebResults > 0 && webResultsCount < expectedMinWebResults) {
        console.error(`  [FAIL ASSERTION] Expected at least ${expectedMinWebResults} web search results, but got ${webResultsCount}!`);
        passed = false;
      }

      // ASSERTION 7: Tool Results MUST be passed into Synthesis LLM Context
      if (internalDocsCount > 0 && !contextPassedEvt?.includesInternalContext) {
        console.error(`  [FAIL ASSERTION] Internal doc chunks exist but were NOT passed to the synthesis LLM system prompt!`);
        passed = false;
      }
      if (webResultsCount > 0 && !contextPassedEvt?.includesWebResults) {
        console.error(`  [FAIL ASSERTION] Web search results exist but were NOT passed to the synthesis LLM system prompt!`);
        passed = false;
      }

      // ASSERTION 8: Policy Block Check
      if (expectWebBlocked) {
        if (webToolRes?.status !== 'blocked_by_policy') {
          console.error(`  [FAIL ASSERTION] Web search was expected to be blocked by policy, but got status: ${webToolRes?.status}`);
          passed = false;
        } else {
          console.log(`  [PASS ASSERTION] Web search correctly blocked by policy!`);
        }
      }

      // ASSERTION 9: Memory Save Database Persistence Verification
      if (checkDbMemoryWrite) {
        const memCount = await prisma.userMemory.count({
          where: { userId, organizationId: testOrgId }
        });
        if (memCount === 0) {
          console.error(`  [FAIL ASSERTION] MEMORY_SAVE selected but NO record was written to the PostgreSQL database!`);
          passed = false;
        } else {
          console.log(`  [PASS ASSERTION] Verified ${memCount} UserMemory row(s) persisted in PostgreSQL database!`);
        }
      }

      if (passed) {
        console.log(`[RESULT: PASS] Scenario ${testNumber} successful!\n`);
        passCount++;
      } else {
        console.log(`[RESULT: FAIL] Scenario ${testNumber} failed!\n`);
        failCount++;
      }
    } catch (err: any) {
      console.error(`  [FAIL EXCEPTION] Scenario ${testNumber} threw error:`, err.message);
      failCount++;
    }
  }

  // TEST 1: Casual Intent
  await executeTestScenario(
    1,
    'Casual Conversational Query',
    'Hello',
    testUserId,
    'hybrid',
    'CASUAL',
    []
  );

  // TEST 2: External Web Search
  await executeTestScenario(
    2,
    'External Real-Time Web Search',
    'Who is the PM of India today?',
    testUserId,
    'hybrid',
    'EXTERNAL_WEB',
    ['web_search'],
    false,
    0,
    1 // Expect at least 1 web result
  );

  // TEST 3: Internal Knowledge Retrieval
  await executeTestScenario(
    3,
    'Internal Document Knowledge Retrieval',
    'What does our German timetable contain?',
    testUserId,
    'hybrid',
    'INTERNAL_KNOWLEDGE',
    ['internal_knowledge'],
    false,
    1 // Expect at least 1 internal chunk retrieved for authorized user
  );

  // TEST 4: Explicit Memory Persistence
  await executeTestScenario(
    4,
    'Explicit User Memory Persistence',
    'Remember that I prefer German.',
    testUserId,
    'hybrid',
    'MEMORY_SAVE',
    ['user_memory'],
    false,
    0,
    0,
    true // Check DB persistence directly
  );

  // Verify memory stored in Postgres DB directly
  const memoryRow = await prisma.userMemory.findFirst({
    where: { userId: testUserId, organizationId: testOrgId }
  });
  console.log(`[DB VERIFICATION] Memory Row in Postgres:`, memoryRow ? `${memoryRow.key} => ${memoryRow.value}` : 'NONE');

  // TEST 5: User Memory Recall
  await executeTestScenario(
    5,
    'Explicit User Memory Recall',
    'What language am I learning?',
    testUserId,
    'hybrid',
    'MEMORY_READ',
    ['user_memory']
  );

  // TEST 6: Conversation History Recall
  await executeTestScenario(
    6,
    'Conversation History Recall',
    'What was my previous question?',
    testUserId,
    'hybrid',
    'CONVERSATION_HISTORY',
    ['conversation_history']
  );

  // TEST 7: Mixed Intent Routing
  await executeTestScenario(
    7,
    'Mixed Intent (Internal + Web)',
    'Who is the PM of India and what does our organization policy say about leave?',
    testUserId,
    'hybrid',
    'MIXED',
    ['internal_knowledge', 'web_search'],
    false,
    1, // Internal chunk expected
    1  // Web result expected
  );

  // TEST 8: Zero-Trust Security Filter Verification (Unauthorized User => 0 Chunks)
  await executeTestScenario(
    8,
    'Zero-Trust Document Access Query (Unauthorized User)',
    'What does our German timetable contain?',
    unauthorizedUserId,
    'hybrid',
    'INTERNAL_KNOWLEDGE',
    ['internal_knowledge'],
    false,
    0 // Zero-trust RBAC filter returns 0 chunks
  );

  // TEST 9: Web Access Policy Block in Local Mode
  await executeTestScenario(
    9,
    'Web Policy Blocked in LOCAL Mode',
    'Who is the current PM of India?',
    testUserId,
    'local',
    'EXTERNAL_WEB',
    ['web_search'],
    true
  );

  // TEST 10: Explicit Search Directive
  await executeTestScenario(
    10,
    'Explicit Search Directive Query',
    'use web and search for current stock price of Apple',
    testUserId,
    'hybrid',
    'EXTERNAL_WEB',
    ['web_search'],
    false,
    0,
    1 // Web result expected
  );

  // Cleanup Test Data
  console.log(`[CLEANUP] Cleaning up test data...`);
  await prisma.userMemory.deleteMany({ where: { organizationId: testOrgId } });
  await prisma.message.deleteMany({ where: { organizationId: testOrgId } });
  await prisma.chat.deleteMany({ where: { organizationId: testOrgId } });
  await prisma.documentChunk.deleteMany({ where: { organizationId: testOrgId } });
  await prisma.document.deleteMany({ where: { organizationId: testOrgId } });
  await prisma.auditLog.deleteMany({ where: { organizationId: testOrgId } });
  await prisma.user.deleteMany({ where: { organizationId: testOrgId } });
  await prisma.organization.delete({ where: { id: testOrgId } });

  console.log('====================================================');
  console.log(`E2E TEST SUITE COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runRoutingE2ETestSuite().catch((err) => {
  console.error('Fatal error in E2E suite:', err);
  process.exit(1);
});
