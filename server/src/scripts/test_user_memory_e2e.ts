import { prisma } from '../infrastructure/database/prisma';
import { RAGService, RAGRequest } from '../application/services/RAGService';

async function runMemoryE2ETest() {
  console.log('====================================================');
  console.log('AUREN EXPLICIT USER MEMORY & ISOLATION E2E TEST');
  console.log('====================================================\n');

  // 1. Setup Test Organizations & Users
  console.log('[Setup] Verifying test tenants and users...');
  
  // Org A & Users
  let orgA = await prisma.organization.findFirst({ where: { domain: 'ekos.app' } });
  if (!orgA) {
    orgA = await prisma.organization.create({
      data: { name: 'Ekos Org A', domain: 'ekos.app' }
    });
  }

  let userA1 = await prisma.user.findFirst({ where: { email: 'admin@ekos.app' } });
  if (!userA1) {
    userA1 = await prisma.user.create({
      data: { email: 'admin@ekos.app', passwordHash: 'hash', organizationId: orgA.id }
    });
  }

  let userA2 = await prisma.user.findFirst({ where: { email: 'user2@ekos.app' } });
  if (!userA2) {
    userA2 = await prisma.user.create({
      data: { email: 'user2@ekos.app', passwordHash: 'hash', organizationId: orgA.id }
    });
  }

  // Org B & User
  let orgB = await prisma.organization.findFirst({ where: { domain: 'otherorg.app' } });
  if (!orgB) {
    orgB = await prisma.organization.create({
      data: { name: 'Other Org B', domain: 'otherorg.app' }
    });
  }

  let userB1 = await prisma.user.findFirst({ where: { email: 'user@otherorg.app' } });
  if (!userB1) {
    userB1 = await prisma.user.create({
      data: { email: 'user@otherorg.app', passwordHash: 'hash', organizationId: orgB.id }
    });
  }

  // Clear existing memories for test setup
  await prisma.userMemory.deleteMany({
    where: { userId: { in: [userA1.id, userA2.id, userB1.id] } }
  });

  const ragService = new RAGService();

  // ----------------------------------------------------
  // TEST A: EXPLICIT MEMORY SAVE
  // ----------------------------------------------------
  console.log('\n--- TEST A: Explicit Memory Save ---');
  console.log('Sending message: "Remember that I prefer German."');

  let savedEvents: any[] = [];
  let responseTextA = '';

  const reqA: RAGRequest = {
    message: 'Remember that I prefer German.',
    organizationId: orgA.id,
    userId: userA1.id,
    departmentIds: [],
    roleIds: [],
    mode: 'local'
  };

  await ragService.streamChat(reqA, (event) => {
    savedEvents.push(event);
    if (event.type === 'token') responseTextA += event.data;
  });

  console.log(`[Assistant Response]: ${responseTextA.trim()}`);

  // Direct PostgreSQL DB Verification
  const memA1 = await prisma.userMemory.findFirst({
    where: { userId: userA1.id, organizationId: orgA.id }
  });

  if (!memA1) {
    throw new Error('FAIL: UserMemory row was NOT created in PostgreSQL!');
  }
  console.log(`[DB Verified] PostgreSQL Row ID: ${memA1.id} | Key: ${memA1.key} | Value: ${memA1.value}`);
  console.log('✅ TEST A PASSED: Memory explicitly persisted to PostgreSQL database!');


  // ----------------------------------------------------
  // TEST B: NEW CHAT RECALL
  // ----------------------------------------------------
  console.log('\n--- TEST B: New Chat Recall ---');
  console.log('Starting NEW chat session without conversationId history...');
  console.log('Asking: "What language do I prefer?"');

  let responseTextB = '';
  const reqB: RAGRequest = {
    message: 'What language do I prefer?',
    organizationId: orgA.id,
    userId: userA1.id,
    departmentIds: [],
    roleIds: [],
    mode: 'local'
  };

  await ragService.streamChat(reqB, (event) => {
    if (event.type === 'token') responseTextB += event.data;
  });

  console.log(`[Assistant Response]: ${responseTextB.trim()}`);

  if (!/(german|deutsch)/i.test(responseTextB)) {
    throw new Error(`FAIL: Assistant failed to recall "German". Response: "${responseTextB}"`);
  }
  console.log('✅ TEST B PASSED: Grounded in persisted long-term user memory!');


  // ----------------------------------------------------
  // TEST C: PERSISTENCE ACROSS RE-LOGIN
  // ----------------------------------------------------
  console.log('\n--- TEST C: Persistence Across Sessions ---');
  const allMemoriesUserA1 = await prisma.userMemory.findMany({
    where: { userId: userA1.id, organizationId: orgA.id }
  });
  console.log(`[DB Verified] Count of UserA1 memories: ${allMemoriesUserA1.length}`);
  if (allMemoriesUserA1.length === 0) {
    throw new Error('FAIL: Memories disappeared from database!');
  }
  console.log('✅ TEST C PASSED: Memory persists across re-queries!');


  // ----------------------------------------------------
  // TEST D: EXPLICIT MEMORY DELETION
  // ----------------------------------------------------
  console.log('\n--- TEST D: Explicit Memory Deletion ---');
  console.log('Sending message: "Forget that I prefer German."');

  let responseTextD = '';
  const reqD: RAGRequest = {
    message: 'Forget that I prefer German.',
    organizationId: orgA.id,
    userId: userA1.id,
    departmentIds: [],
    roleIds: [],
    mode: 'local'
  };

  await ragService.streamChat(reqD, (event) => {
    if (event.type === 'token') responseTextD += event.data;
  });

  console.log(`[Assistant Response]: ${responseTextD.trim()}`);

  // Direct PostgreSQL DB Verification
  const memA1AfterDelete = await prisma.userMemory.findFirst({
    where: { userId: userA1.id, organizationId: orgA.id, key: 'preferred_language' }
  });

  if (memA1AfterDelete) {
    throw new Error('FAIL: UserMemory row was NOT deleted from PostgreSQL!');
  }
  console.log('[DB Verified] PostgreSQL Row was successfully deleted!');
  console.log('✅ TEST D PASSED: Explicit memory deletion completed!');


  // ----------------------------------------------------
  // TEST E: MULTI-USER ISOLATION (SAME ORG)
  // ----------------------------------------------------
  console.log('\n--- TEST E: Multi-User Isolation (Same Org) ---');
  console.log('1. Saving memory for User A1...');
  await ragService.streamChat({
    message: 'Remember that I prefer German.',
    organizationId: orgA.id,
    userId: userA1.id,
    departmentIds: [],
    roleIds: [],
    mode: 'local'
  }, () => {});

  console.log('2. Querying as User A2 (Same Org)...');
  let responseTextE = '';
  await ragService.streamChat({
    message: 'What language do I prefer?',
    organizationId: orgA.id,
    userId: userA2.id,
    departmentIds: [],
    roleIds: [],
    mode: 'local'
  }, (event) => {
    if (event.type === 'token') responseTextE += event.data;
  });

  console.log(`[User A2 Response]: ${responseTextE.trim()}`);
  const userA2Mems = await prisma.userMemory.findMany({ where: { userId: userA2.id } });
  console.log(`[DB Verified] User A2 memory count in DB: ${userA2Mems.length}`);

  if (userA2Mems.length > 0 || /(german|deutsch)/i.test(responseTextE)) {
    throw new Error('FAIL: User A2 accessed User A1 memory!');
  }
  console.log('✅ TEST E PASSED: Strict multi-user isolation within same organization!');


  // ----------------------------------------------------
  // TEST F: MULTI-TENANT ISOLATION (DIFFERENT ORGS)
  // ----------------------------------------------------
  console.log('\n--- TEST F: Multi-Tenant Isolation (Different Orgs) ---');
  console.log('Querying as User B1 (Org B)...');
  let responseTextF = '';
  await ragService.streamChat({
    message: 'What language do I prefer?',
    organizationId: orgB.id,
    userId: userB1.id,
    departmentIds: [],
    roleIds: [],
    mode: 'local'
  }, (event) => {
    if (event.type === 'token') responseTextF += event.data;
  });

  console.log(`[User B1 Response]: ${responseTextF.trim()}`);
  const userB1Mems = await prisma.userMemory.findMany({ where: { organizationId: orgB.id } });
  console.log(`[DB Verified] Org B memory count in DB: ${userB1Mems.length}`);

  if (userB1Mems.length > 0 || /(german|deutsch)/i.test(responseTextF)) {
    throw new Error('FAIL: Org B user accessed Org A memory!');
  }
  console.log('✅ TEST F PASSED: Strict multi-tenant isolation across organizations!');

  console.log('\n====================================================');
  console.log('ALL E2E MEMORY TESTS PASSED SUCCESSFULLY! (100%)');
  console.log('====================================================');
}

runMemoryE2ETest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ E2E TEST FAILED:', err);
    process.exit(1);
  });
