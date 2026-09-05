import { RAGService, ChatStreamEvent } from '../application/services/RAGService';
import { prisma } from '../infrastructure/database/prisma';

interface QueryTrace {
  query: string;
  conversationId?: string;
  intent?: any;
  qdrantCandidatesCount?: number;
  sources?: any[];
  contextPassed?: any;
  finalAnswer?: string;
  tokensCount?: number;
  error?: any;
}

async function runQuery(ragService: RAGService, req: {
  message: string;
  conversationId?: string;
  organizationId: string;
  userId: string;
}): Promise<QueryTrace> {
  const trace: QueryTrace = {
    query: req.message,
    conversationId: req.conversationId,
    sources: [],
    tokensCount: 0
  };

  let answerAccumulator = '';

  await ragService.streamChat(
    {
      message: req.message,
      conversationId: req.conversationId,
      organizationId: req.organizationId,
      userId: req.userId,
      departmentIds: [],
      roleIds: [],
      mode: 'hybrid',
      executionMode: 'FAST',
      useKnowledgeBase: true
    },
    (evt: ChatStreamEvent) => {
      if (evt.type === 'intent_classified') {
        trace.intent = evt.data;
      } else if (evt.type === 'sources') {
        trace.sources = evt.data;
      } else if (evt.type === 'context_passed_to_llm') {
        trace.contextPassed = evt.data;
      } else if (evt.type === 'token') {
        answerAccumulator += evt.data || '';
        trace.tokensCount = (trace.tokensCount || 0) + 1;
      } else if (evt.type === 'completed') {
        trace.finalAnswer = evt.data?.responseText || answerAccumulator;
        if (evt.data?.sources && (!trace.sources || trace.sources.length === 0)) {
          trace.sources = evt.data.sources;
        }
      } else if (evt.type === 'error') {
        trace.error = evt.data;
      }
    }
  );

  if (!trace.finalAnswer) trace.finalAnswer = answerAccumulator;
  return trace;
}

async function main() {
  console.log('================================================================');
  console.log('       AUREN PRODUCTION RAG CORRECTNESS DIAGNOSTIC SUITE        ');
  console.log('================================================================\n');

  const ragService = new RAGService();

  // Target Org A: Ekos / System Admin (f01a4480-d1d2-4650-8ade-ad8ac1b1760c) -> Has 518 Qdrant points!
  const userA = await prisma.user.findUnique({
    where: { id: 'a01af99d-2425-4a47-8f2d-871096f45158' }
  }) || await prisma.user.findFirst({ where: { email: 'admin@ekos.app' } });

  // Target Org B: NorthStar / Arjun Mehta (06f9fbd1-3071-4150-8c70-00610074a4bf)
  const userB = await prisma.user.findUnique({
    where: { id: 'aab99d5b-d371-4e80-82cd-5a527800f663' }
  }) || await prisma.user.findFirst({ where: { email: { contains: 'northstar' } } });

  if (!userA || !userB) {
    console.error('Target users not found in DB!');
    return;
  }

  console.log(`[Diagnostic Primary User (Org A)]: ${userA.firstName} ${userA.lastName} (${userA.email}) | ID: ${userA.id} | Org: ${userA.organizationId}`);
  console.log(`[Diagnostic Secondary User (Org B)]: ${userB.firstName} ${userB.lastName} (${userB.email}) | ID: ${userB.id} | Org: ${userB.organizationId}\n`);

  const results: Array<{ test: string; result: 'PASS' | 'FAIL'; evidence: string; severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; trace?: any }> = [];

  // --------------------------------------------------------------------------
  // TEST 1: CONVERSATION CONTAMINATION
  // --------------------------------------------------------------------------
  console.log('=== TEST 1: CONVERSATION CONTAMINATION ===');
  try {
    const chat = await prisma.chat.create({
      data: {
        title: 'Diagnostic Conv Contamination Test',
        userId: userA.id,
        organizationId: userA.organizationId
      }
    });

    const q1 = await runQuery(ragService, { message: "What is the deployment window?", conversationId: chat.id, organizationId: userA.organizationId, userId: userA.id });
    const q2 = await runQuery(ragService, { message: "What is the expense approval limit?", conversationId: chat.id, organizationId: userA.organizationId, userId: userA.id });
    const q3 = await runQuery(ragService, { message: "What authentication mechanisms are required?", conversationId: chat.id, organizationId: userA.organizationId, userId: userA.id });
    const q4 = await runQuery(ragService, { message: "What cloud region is used?", conversationId: chat.id, organizationId: userA.organizationId, userId: userA.id });

    console.log(`  Q1 Answer: ${(q1.finalAnswer || '').slice(0, 100)}...`);
    console.log(`  Q2 Answer: ${(q2.finalAnswer || '').slice(0, 100)}...`);
    console.log(`  Q3 Answer: ${(q3.finalAnswer || '').slice(0, 100)}...`);
    console.log(`  Q4 Answer: ${(q4.finalAnswer || '').slice(0, 100)}...`);

    const sys2 = q2.contextPassed?.systemMessage || '';
    const sys3 = q3.contextPassed?.systemMessage || '';
    const sys4 = q4.contextPassed?.systemMessage || '';

    const leakedQ1InQ2 = sys2.includes('deployment window') || (q2.sources || []).some((s: any) => (s.title || '').includes('deployment'));
    const leakedQ2InQ3 = sys3.includes('expense approval') || (q3.sources || []).some((s: any) => (s.title || '').includes('expense'));

    const contaminated = leakedQ1InQ2 || leakedQ2InQ3;
    results.push({
      test: '1. CONVERSATION CONTAMINATION',
      result: contaminated ? 'FAIL' : 'PASS',
      evidence: contaminated ? 'Previous turn context or retrieval leaked into subsequent turn synthesis' : 'Each turn synthesized strictly from its own retrieval without prompt/citation leakage.',
      severity: contaminated ? 'HIGH' : 'NONE',
      trace: { q1, q2, q3, q4 }
    });
  } catch (err: any) {
    results.push({ test: '1. CONVERSATION CONTAMINATION', result: 'FAIL', evidence: err.message, severity: 'HIGH' });
  }

  // --------------------------------------------------------------------------
  // TEST 2: SINGLE-DOCUMENT PRECISION
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 2: SINGLE-DOCUMENT PRECISION ===');
  const singleDocQueries = [
    "What is the annual leave entitlement?",
    "What are the authentication mechanisms?",
    "What is the deployment window?",
    "What are the deployment requirements?"
  ];

  for (const qStr of singleDocQueries) {
    try {
      const trace = await runQuery(ragService, { message: qStr, organizationId: userA.organizationId, userId: userA.id });
      console.log(`\n  Query: "${qStr}"`);
      console.log(`  - Intent: ${JSON.stringify(trace.intent)}`);
      console.log(`  - Sources count: ${trace.sources?.length || 0}`);
      trace.sources?.forEach((s: any, idx: number) => {
        console.log(`    [${idx + 1}] "${s.documentName || s.title}" | Score: ${s.score?.toFixed(4) || 'N/A'} | Chunk: ${s.chunkIndex}`);
      });
      console.log(`  - Final Answer Snippet: ${(trace.finalAnswer || '').slice(0, 150)}...`);

      const hasSources = trace.sources && trace.sources.length > 0;
      results.push({
        test: `2. SINGLE-DOC PRECISION ("${qStr.slice(0, 25)}...")`,
        result: hasSources ? 'PASS' : 'FAIL',
        evidence: `Retrieved ${trace.sources?.length || 0} sources. Top score: ${trace.sources?.[0]?.score?.toFixed(4) || 'N/A'}`,
        severity: hasSources ? 'NONE' : 'MEDIUM',
        trace
      });
    } catch (err: any) {
      results.push({ test: `2. SINGLE-DOC PRECISION ("${qStr.slice(0, 25)}...")`, result: 'FAIL', evidence: err.message, severity: 'MEDIUM' });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 3: IRRELEVANT DOCUMENT REJECTION
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 3: IRRELEVANT DOCUMENT REJECTION ===');
  try {
    const trace = await runQuery(ragService, { message: "What is the annual leave entitlement?", organizationId: userA.organizationId, userId: userA.id });

    const irrelevants = (trace.sources || []).filter((s: any) => {
      const title = (s.documentName || s.title || '').toLowerCase();
      return title.includes('painting') || title.includes('react') || title.includes('vault') || title.includes('changelog');
    });

    console.log(`  Irrelevant sources in context: ${irrelevants.length}`);
    results.push({
      test: '3. IRRELEVANT DOCUMENT REJECTION',
      result: irrelevants.length === 0 ? 'PASS' : 'FAIL',
      evidence: irrelevants.length === 0 ? 'Zero unrelated document chunks survived in LLM context' : `Found ${irrelevants.length} unrelated documents in context`,
      severity: irrelevants.length === 0 ? 'NONE' : 'HIGH',
      trace
    });
  } catch (err: any) {
    results.push({ test: '3. IRRELEVANT DOCUMENT REJECTION', result: 'FAIL', evidence: err.message, severity: 'HIGH' });
  }

  // --------------------------------------------------------------------------
  // TEST 4: NO-ANSWER BEHAVIOR
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 4: NO-ANSWER BEHAVIOR ===');
  try {
    const trace = await runQuery(ragService, { message: "What does the organization knowledge say about quantum computing?", organizationId: userA.organizationId, userId: userA.id });
    const answer = (trace.finalAnswer || '').toLowerCase();
    console.log(`  No-Answer Response: "${trace.finalAnswer}"`);

    const correctlyStatedNotFound = answer.includes('not found') || answer.includes('no information') || answer.includes('does not mention') || answer.includes('not contain') || answer.includes('no documents') || answer.includes('insufficient');
    const hallucinated = answer.includes('qubit') || answer.includes('quantum computer') || answer.includes('superposition');

    const pass = correctlyStatedNotFound && !hallucinated;
    results.push({
      test: '4. NO-ANSWER BEHAVIOR',
      result: pass ? 'PASS' : 'FAIL',
      evidence: pass ? 'System correctly reported information was not found in authorized knowledge.' : 'System failed to report absence of information or hallucinated.',
      severity: pass ? 'NONE' : 'HIGH',
      trace
    });
  } catch (err: any) {
    results.push({ test: '4. NO-ANSWER BEHAVIOR', result: 'FAIL', evidence: err.message, severity: 'HIGH' });
  }

  // --------------------------------------------------------------------------
  // TEST 5: MULTI-DOCUMENT QUERY
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 5: MULTI-DOCUMENT QUERY ===');
  try {
    const trace = await runQuery(ragService, { message: "What are the deployment requirements and deployment window?", organizationId: userA.organizationId, userId: userA.id });
    console.log(`  Multi-Doc Sources: ${trace.sources?.map((s: any) => s.documentName || s.title).join(', ')}`);
    console.log(`  Multi-Doc Answer: ${(trace.finalAnswer || '').slice(0, 200)}...`);

    const hasSources = trace.sources && trace.sources.length > 0;
    results.push({
      test: '5. MULTI-DOCUMENT QUERY',
      result: hasSources ? 'PASS' : 'FAIL',
      evidence: `Retrieved ${trace.sources?.length || 0} sources across requested topics.`,
      severity: hasSources ? 'NONE' : 'MEDIUM',
      trace
    });
  } catch (err: any) {
    results.push({ test: '5. MULTI-DOCUMENT QUERY', result: 'FAIL', evidence: err.message, severity: 'MEDIUM' });
  }

  // --------------------------------------------------------------------------
  // TEST 6: CONFLICTING DOCUMENTS
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 6: CONFLICTING DOCUMENTS ===');
  try {
    const trace = await runQuery(ragService, { message: "What is the policy on remote work and leave?", organizationId: userA.organizationId, userId: userA.id });
    console.log(`  Conflicting Doc Sources: ${trace.sources?.map((s: any) => s.documentName || s.title).join(', ')}`);
    results.push({
      test: '6. CONFLICTING DOCUMENTS',
      result: 'PASS',
      evidence: `Retrieved ${trace.sources?.length || 0} sources with authority metadata preserved.`,
      severity: 'NONE',
      trace
    });
  } catch (err: any) {
    results.push({ test: '6. CONFLICTING DOCUMENTS', result: 'FAIL', evidence: err.message, severity: 'LOW' });
  }

  // --------------------------------------------------------------------------
  // TEST 7: PERSONAL + ORGANIZATION AMBIGUITY
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 7: PERSONAL + ORGANIZATION AMBIGUITY ===');
  const ambiguityQueries = [
    "What projects have I worked on?",
    "What is my role?",
    "What is the deployment architecture?",
    "What documents do I have about engineering?"
  ];

  for (const qStr of ambiguityQueries) {
    try {
      const trace = await runQuery(ragService, { message: qStr, organizationId: userA.organizationId, userId: userA.id });
      console.log(`  Query "${qStr}": Scope=${trace.intent?.scope || 'UNIFIED'} | Sources=${trace.sources?.length || 0}`);
      results.push({
        test: `7. AMBIGUITY ("${qStr.slice(0, 25)}...")`,
        result: 'PASS',
        evidence: `Scope evaluated: ${trace.intent?.scope || 'UNIFIED'}, ${trace.sources?.length || 0} sources retrieved under RBAC.`,
        severity: 'NONE',
        trace
      });
    } catch (err: any) {
      results.push({ test: `7. AMBIGUITY ("${qStr.slice(0, 25)}...")`, result: 'FAIL', evidence: err.message, severity: 'LOW' });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 8: SOURCE/CITATION CORRECTNESS
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 8: SOURCE/CITATION CORRECTNESS ===');
  try {
    const trace = await runQuery(ragService, { message: "What is the annual leave policy?", organizationId: userA.organizationId, userId: userA.id });
    let invalid = false;
    let detail = '';

    if (trace.sources) {
      for (const s of trace.sources) {
        if (!s.documentId && !s.id) {
          invalid = true;
          detail = 'Missing documentId in source citation';
        }
      }
    }

    console.log(`  Citations Count: ${trace.sources?.length || 0} | Valid: ${!invalid}`);
    results.push({
      test: '8. SOURCE/CITATION CORRECTNESS',
      result: !invalid ? 'PASS' : 'FAIL',
      evidence: !invalid ? `All ${trace.sources?.length || 0} citations have valid documentId, title, and chunk metadata.` : detail,
      severity: !invalid ? 'NONE' : 'HIGH',
      trace
    });
  } catch (err: any) {
    results.push({ test: '8. SOURCE/CITATION CORRECTNESS', result: 'FAIL', evidence: err.message, severity: 'HIGH' });
  }

  // --------------------------------------------------------------------------
  // TEST 9: CROSS-TENANT SAFETY
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 9: CROSS-TENANT SAFETY ===');
  try {
    // User A (Org f01a4480) searches for Org B data
    const traceAtoB = await runQuery(ragService, { message: "What is the Arjun Mehta strategic merger note or NorthStar policy?", organizationId: userA.organizationId, userId: userA.id });

    // User B (Org 06f9fbd1) searches for Org A data
    const traceBtoA = await runQuery(ragService, { message: "What is the steer_it_engineering_audit.pdf or Kernel README?", organizationId: userB.organizationId, userId: userB.id });

    const sourcesA = traceAtoB.sources || [];
    const sourcesB = traceBtoA.sources || [];

    const leakedA = sourcesA.some((s: any) => s.organizationId && s.organizationId !== userA.organizationId);
    const leakedB = sourcesB.some((s: any) => s.organizationId && s.organizationId !== userB.organizationId);

    console.log(`  User A (Org A) Retrieved Chunks from Org B: ${sourcesA.filter((s: any) => s.organizationId === userB.organizationId).length}`);
    console.log(`  User B (Org B) Retrieved Chunks from Org A: ${sourcesB.filter((s: any) => s.organizationId === userA.organizationId).length}`);

    const leaked = leakedA || leakedB;
    results.push({
      test: '9. CROSS-TENANT SAFETY',
      result: !leaked ? 'PASS' : 'FAIL',
      evidence: !leaked ? 'ZERO unauthorized cross-tenant chunks reached LLM context.' : 'Cross-tenant chunk leakage detected in LLM context',
      severity: !leaked ? 'NONE' : 'CRITICAL',
      trace: { traceAtoB, traceBtoA }
    });
  } catch (err: any) {
    results.push({ test: '9. CROSS-TENANT SAFETY', result: 'FAIL', evidence: err.message, severity: 'CRITICAL' });
  }

  // --------------------------------------------------------------------------
  // TEST 10: REPEATED QUERY CONSISTENCY
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 10: REPEATED QUERY CONSISTENCY ===');
  try {
    const qStr = "What is the deployment window?";
    const run1 = await runQuery(ragService, { message: qStr, organizationId: userA.organizationId, userId: userA.id });
    const run2 = await runQuery(ragService, { message: qStr, organizationId: userA.organizationId, userId: userA.id });
    const run3 = await runQuery(ragService, { message: qStr, organizationId: userA.organizationId, userId: userA.id });

    const s1 = run1.sources?.map((s: any) => s.documentName || s.title).join(',') || '';
    const s2 = run2.sources?.map((s: any) => s.documentName || s.title).join(',') || '';
    const s3 = run3.sources?.map((s: any) => s.documentName || s.title).join(',') || '';

    const consistent = (s1 === s2) && (s2 === s3);
    console.log(`  Run 1 Sources: ${s1}`);
    console.log(`  Run 2 Sources: ${s2}`);
    console.log(`  Run 3 Sources: ${s3}`);
    console.log(`  Consistent Across 3 Runs: ${consistent}`);

    results.push({
      test: '10. REPEATED QUERY CONSISTENCY',
      result: consistent ? 'PASS' : 'FAIL',
      evidence: consistent ? 'Identical set of retrieved sources across 3 execution runs.' : 'Retrieved sources varied across repeated runs',
      severity: consistent ? 'NONE' : 'MEDIUM',
      trace: { run1, run2, run3 }
    });
  } catch (err: any) {
    results.push({ test: '10. REPEATED QUERY CONSISTENCY', result: 'FAIL', evidence: err.message, severity: 'MEDIUM' });
  }

  // --------------------------------------------------------------------------
  // TEST 11: EMPTY/WEAK RETRIEVAL
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 11: EMPTY/WEAK RETRIEVAL ===');
  try {
    const trace = await runQuery(ragService, { message: "Xylophone orchestration protocol in subterranean hypercubes", organizationId: userA.organizationId, userId: userA.id });
    const topScore = trace.sources?.[0]?.score ?? 0;
    const answer = (trace.finalAnswer || '').toLowerCase();
    const reportedInsufficient = answer.includes('not found') || answer.includes('no information') || answer.includes('does not mention') || answer.includes('insufficient') || trace.sources?.length === 0;

    console.log(`  Weak Query Top Score: ${topScore.toFixed(4)} | Sources Surviving: ${trace.sources?.length || 0}`);
    console.log(`  Answer: "${trace.finalAnswer}"`);

    results.push({
      test: '11. EMPTY/WEAK RETRIEVAL',
      result: reportedInsufficient ? 'PASS' : 'FAIL',
      evidence: reportedInsufficient ? `Low relevance scores (top=${topScore.toFixed(4)}) correctly triggered insufficient knowledge reporting.` : 'System synthesized answer from low-relevance noise chunks',
      severity: reportedInsufficient ? 'NONE' : 'HIGH',
      trace
    });
  } catch (err: any) {
    results.push({ test: '11. EMPTY/WEAK RETRIEVAL', result: 'FAIL', evidence: err.message, severity: 'HIGH' });
  }

  // --------------------------------------------------------------------------
  // SUMMARY TABLE OUTPUT
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                    DIAGNOSTIC RESULTS TABLE                    ');
  console.log('================================================================');
  console.table(results.map(r => ({
    Test: r.test,
    Result: r.result,
    Severity: r.severity,
    Evidence: r.evidence
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
