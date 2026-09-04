import { isEllipticalFollowUp, KnowledgeGraph } from '../ai/graph/KnowledgeGraph';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { prisma } from '../infrastructure/database/prisma';
import { RAGService } from '../application/services/RAGService';

type TestResult = { name: string; pass: boolean; reason?: string };
const RESULTS: TestResult[] = [];

function assert(name: string, condition: boolean, reason?: string) {
  RESULTS.push({ name, pass: condition, reason });
  const icon = condition ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${icon} ${name}${reason ? ` — ${reason}` : ''}`);
}

async function testUnitEllipticalHeuristics() {
  console.log('\n══════════════════════════════════════════════');
  console.log('1. UNIT TEST: isEllipticalFollowUp Detection Logic');
  console.log('══════════════════════════════════════════════\n');

  const dummyHistory = [
    new HumanMessage("What is Apple's current stock price?"),
    new AIMessage("Apple's current stock price is $242.50.")
  ];

  // Cases that MUST be classified as Elliptical Follow-ups (true)
  const ellipticalCases = [
    "Tata?",
    "Tata",
    "Microsoft?",
    "Paris?",
    "Germany?",
    "Apple?",
    "What about Microsoft?",
    "And Paris?",
    "How about Germany?",
    "Same for Apple",
    "What is its market cap?",
    "Who is their CEO?",
    "What is Microsoft's?"
  ];

  for (const q of ellipticalCases) {
    const isElliptical = isEllipticalFollowUp(q, dummyHistory);
    assert(`Elliptical Detection: "${q}" -> true`, isElliptical === true, `got ${isElliptical}`);
  }

  // Cases that MUST be classified as Standalone Explicit Queries (false)
  const standaloneCases = [
    "What is Tata?",
    "Tell me about Tata's history.",
    "Who founded Tata?",
    "What is the stock price of Microsoft?",
    "What is the tallest building in Springfield?",
    "How does Tata compare to Apple?",
    "Who is the current president of France?",
    "What is the capital of France?",
    "Who won the World Cup in 2022?",
    "How tall is Mount Everest?",
    "How tall is Everest?",
    "What is quantum computing?",
    "Why is the sky blue?",
    "When was Google founded?",
    "Where is Tokyo located?"
  ];

  for (const q of standaloneCases) {
    const isElliptical = isEllipticalFollowUp(q, dummyHistory);
    assert(`Standalone Detection: "${q}" -> false`, isElliptical === false, `got ${isElliptical}`);
  }

  // Edge case: No history -> MUST be false
  assert('No history -> false', isEllipticalFollowUp("Tata?", []) === false);
}

async function testIntegrationGraphResolution() {
  console.log('\n══════════════════════════════════════════════');
  console.log('2. INTEGRATION TEST: KnowledgeGraph Query Resolution');
  console.log('══════════════════════════════════════════════\n');

  const org = await prisma.organization.create({
    data: { name: `EllipticalReg_${Date.now()}`, domain: `ellipticalreg_${Date.now()}.com`, industry: 'CORPORATE', webAccessEnabled: true }
  });
  const user = await prisma.user.create({
    data: { organizationId: org.id, email: `tester_${Date.now()}@elliptical.com`, firstName: 'Test', lastName: 'User', passwordHash: 'dummy' }
  });

  const ragService = new RAGService();
  const makeReq = (message: string, chatId?: string) => ({
    message,
    conversationId: chatId,
    organizationId: org.id,
    userId: user.id,
    departmentIds: [],
    roleIds: [],
    mode: 'hybrid' as const
  });

  // Test Sequence 1: Financial Elliptical Follow-up ("What is Apple's current stock price?" -> "Tata?")
  console.log('\n--- Scenario 1: "What is Apple\'s current stock price?" -> "Tata?" ---');
  const chat1 = await prisma.chat.create({
    data: { title: 'Test Chat 1', organizationId: org.id, userId: user.id }
  });

  // Turn 1
  console.log('Executing Turn 1: "What is Apple\'s current stock price?"');
  const events1: any[] = [];
  await ragService.streamChat(makeReq("What is Apple's current stock price?", chat1.id), e => events1.push(e));

  // Turn 2: Follow-up "Tata?"
  console.log('Executing Turn 2: "Tata?"');
  const events2: any[] = [];
  await ragService.streamChat(makeReq("Tata?", chat1.id), e => events2.push(e));

  const contextualizedEvt2 = events2.find(e => e.type === 'query_contextualized');
  const intentEvt2 = events2.find(e => e.type === 'intent_detected');
  const researchBriefEvt2 = events2.find(e => e.type === 'research_brief_generated');

  console.log(`  Raw Query: "${contextualizedEvt2?.data?.rawQuery}"`);
  console.log(`  Resolved Query: "${contextualizedEvt2?.data?.resolvedQuery}"`);
  console.log(`  Detected Intent: ${intentEvt2?.data?.intent}`);
  console.log(`  Research Brief: "${researchBriefEvt2?.data?.brief}"`);

  assert('Scenario 1: query_contextualized event emitted', contextualizedEvt2 !== undefined);
  assert('Scenario 1: Resolved query contains "Tata"', contextualizedEvt2?.data?.resolvedQuery?.toLowerCase().includes('tata'));
  assert('Scenario 1: Resolved query inherits stock price intent', contextualizedEvt2?.data?.resolvedQuery?.toLowerCase().includes('stock price') || contextualizedEvt2?.data?.resolvedQuery?.toLowerCase().includes('price'));
  assert('Scenario 1: Intent classified as DYNAMIC_DATA', intentEvt2?.data?.intent === 'DYNAMIC_DATA');


  // Test Sequence 2: Explicit Standalone Query ("What is Apple's current stock price?" -> "What is Tata?")
  console.log('\n--- Scenario 2: "What is Apple\'s current stock price?" -> "What is Tata?" ---');
  const chat2 = await prisma.chat.create({
    data: { title: 'Test Chat 2', organizationId: org.id, userId: user.id }
  });

  // Turn 1
  await ragService.streamChat(makeReq("What is Apple's current stock price?", chat2.id), () => {});

  // Turn 2: Explicit "What is Tata?"
  const eventsSeq2: any[] = [];
  await ragService.streamChat(makeReq("What is Tata?", chat2.id), e => eventsSeq2.push(e));

  const contextualizedEvtSeq2 = eventsSeq2.find(e => e.type === 'query_contextualized');
  const intentEvtSeq2 = eventsSeq2.find(e => e.type === 'intent_detected');

  console.log(`  Raw Query: "${contextualizedEvtSeq2?.data?.rawQuery}"`);
  console.log(`  Resolved Query: "${contextualizedEvtSeq2?.data?.resolvedQuery}"`);
  console.log(`  Detected Intent: ${intentEvtSeq2?.data?.intent}`);

  assert('Scenario 2: Resolved query remains unchanged ("What is Tata?")', contextualizedEvtSeq2?.data?.resolvedQuery?.trim() === 'What is Tata?');
  assert('Scenario 2: Intent classified as EXTERNAL_WEB', intentEvtSeq2?.data?.intent === 'EXTERNAL_WEB');


  // Test Sequence 3: Executive Leadership Follow-up ("Who is the CEO of Google?" -> "Microsoft?")
  console.log('\n--- Scenario 3: "Who is the CEO of Google?" -> "Microsoft?" ---');
  const chat3 = await prisma.chat.create({
    data: { title: 'Test Chat 3', organizationId: org.id, userId: user.id }
  });

  await ragService.streamChat(makeReq("Who is the CEO of Google?", chat3.id), () => {});

  const eventsSeq3: any[] = [];
  await ragService.streamChat(makeReq("Microsoft?", chat3.id), e => eventsSeq3.push(e));

  const contextualizedEvtSeq3 = eventsSeq3.find(e => e.type === 'query_contextualized');
  console.log(`  Raw Query: "${contextualizedEvtSeq3?.data?.rawQuery}"`);
  console.log(`  Resolved Query: "${contextualizedEvtSeq3?.data?.resolvedQuery}"`);

  assert('Scenario 3: Resolved query contains "Microsoft" and "CEO"',
    contextualizedEvtSeq3?.data?.resolvedQuery?.toLowerCase().includes('microsoft') &&
    contextualizedEvtSeq3?.data?.resolvedQuery?.toLowerCase().includes('ceo')
  );


  // Test Sequence 4: Unrelated Consecutive Standalone Queries ("What is Apple's stock price?" -> "What is the capital of France?" -> "Who won the World Cup in 2022?")
  console.log('\n--- Scenario 4: Unrelated Consecutive Standalone Queries ---');
  const chat4 = await prisma.chat.create({
    data: { title: 'Test Chat 4', organizationId: org.id, userId: user.id }
  });

  // Turn 1
  await ragService.streamChat(makeReq("What is Apple's current stock price?", chat4.id), () => {});

  // Turn 2: Unrelated Standalone 1
  const eventsSeq4Turn2: any[] = [];
  await ragService.streamChat(makeReq("What is the capital of France?", chat4.id), e => eventsSeq4Turn2.push(e));
  const contextualized4T2 = eventsSeq4Turn2.find(e => e.type === 'query_contextualized');

  console.log(`  Turn 2 Raw: "${contextualized4T2?.data?.rawQuery}" -> Resolved: "${contextualized4T2?.data?.resolvedQuery}"`);
  assert('Scenario 4 (Turn 2): Resolved query remains "What is the capital of France?"',
    contextualized4T2?.data?.resolvedQuery?.trim() === 'What is the capital of France?'
  );

  // Turn 3: Unrelated Standalone 2
  const eventsSeq4Turn3: any[] = [];
  await ragService.streamChat(makeReq("Who won the World Cup in 2022?", chat4.id), e => eventsSeq4Turn3.push(e));
  const contextualized4T3 = eventsSeq4Turn3.find(e => e.type === 'query_contextualized');

  console.log(`  Turn 3 Raw: "${contextualized4T3?.data?.rawQuery}" -> Resolved: "${contextualized4T3?.data?.resolvedQuery}"`);
  assert('Scenario 4 (Turn 3): Resolved query remains "Who won the World Cup in 2022?"',
    contextualized4T3?.data?.resolvedQuery?.trim() === 'Who won the World Cup in 2022?'
  );

  // Test Sequence 5: Financial Intent Preservation ("What is Apple's current stock price?" -> "What happened to NVIDIA's stock price after its latest earnings report?")
  console.log('\n--- Scenario 5: Financial Intent Preservation (NVIDIA Earnings Report) ---');
  const chat5 = await prisma.chat.create({
    data: { title: 'Test Chat 5', organizationId: org.id, userId: user.id }
  });

  await ragService.streamChat(makeReq("What is Apple's current stock price?", chat5.id), () => {});

  const eventsSeq5: any[] = [];
  await ragService.streamChat(makeReq("What happened to NVIDIA's stock price after its latest earnings report?", chat5.id), e => eventsSeq5.push(e));

  const contextualizedEvtSeq5 = eventsSeq5.find(e => e.type === 'query_contextualized');
  console.log(`  Raw Query: "${contextualizedEvtSeq5?.data?.rawQuery}"`);
  console.log(`  Resolved Query: "${contextualizedEvtSeq5?.data?.resolvedQuery}"`);

  assert('Scenario 5: Resolved query preserves "NVIDIA"', contextualizedEvtSeq5?.data?.resolvedQuery?.includes('NVIDIA'));
  assert('Scenario 5: Resolved query preserves "earnings report"', contextualizedEvtSeq5?.data?.resolvedQuery?.toLowerCase().includes('earnings report'));
  assert('Scenario 5: Resolved query does NOT hallucinate "market capitalization"', !contextualizedEvtSeq5?.data?.resolvedQuery?.toLowerCase().includes('market capitalization'));
  assert('Scenario 5: Resolved query equals raw query exactly', contextualizedEvtSeq5?.data?.resolvedQuery?.trim() === "What happened to NVIDIA's stock price after its latest earnings report?");


  // Cleanup
  await prisma.message.deleteMany({ where: { organizationId: org.id } });
  await prisma.chat.deleteMany({ where: { organizationId: org.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.organization.delete({ where: { id: org.id } });
}

async function main() {
  try {
    await testUnitEllipticalHeuristics();
    await testIntegrationGraphResolution();
  } catch (err: any) {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  }

  console.log('\n══════════════════════════════════════════════');
  console.log('SUMMARY OF TEST RESULTS');
  console.log('══════════════════════════════════════════════');
  const failed = RESULTS.filter(r => !r.pass);
  console.log(`Total: ${RESULTS.length} | Passed: ${RESULTS.length - failed.length} | Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.error('Failed tests:');
    failed.forEach(f => console.error(`  ❌ ${f.name} (${f.reason})`));
    process.exit(1);
  } else {
    console.log('🎉 ALL REGRESSION TESTS PASSED SUCCESSFULLY!');
  }
}

main();
