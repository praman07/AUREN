import { prisma } from '../infrastructure/database/prisma';
import { RAGService } from '../application/services/RAGService';

type TestResult = { name: string; pass: boolean; reason?: string };
const RESULTS: TestResult[] = [];

function assert(name: string, condition: boolean, reason?: string) {
  RESULTS.push({ name, pass: condition, reason });
  const icon = condition ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${icon} ${name}${reason ? ` — ${reason}` : ''}`);
}

async function runRegressionMatrix() {
  console.log('\n══════════════════════════════════════════════');
  console.log('INTEGRATION: Scope Assessment Regression Matrix');
  console.log('══════════════════════════════════════════════\n');

  const org = await prisma.organization.create({
    data: { name: `AmbigReg_${Date.now()}`, domain: `ambigreg_${Date.now()}.com`, industry: 'CORPORATE', webAccessEnabled: true }
  });
  const user = await prisma.user.create({
    data: { organizationId: org.id, email: `tester_${Date.now()}@ambigreg.com`, firstName: 'Test', lastName: 'User', passwordHash: 'dummy' }
  });

  const ragService = new RAGService();
  const makeReq = (message: string) => ({ message, organizationId: org.id, userId: user.id, departmentIds: [], roleIds: [], mode: 'hybrid' as const });

  const tests = [
    { label: 'A', query: 'What is the population of Springfield?', expectClarification: true },
    { label: 'B', query: 'Who is the current leader of Korea?', expectClarification: false },
    { label: 'C', query: 'What is the current population of London?', expectClarification: false },
    { label: 'D', query: 'What is the population of Portland?', expectClarification: false },
    { label: 'E', query: 'What is the capital of Georgia?', expectClarification: false },
    { label: 'F', query: 'Who is the president of Congo?', expectClarification: false },
    { label: 'G', query: 'What is the population of Cambridge?', expectClarification: false },
    { label: 'H', query: 'What is the population of Cambridge, England?', expectClarification: false },
    { label: 'I', query: 'What is Apple\'s stock price today?', expectClarification: false },
  ];

  for (const t of tests) {
    console.log(`\n--- ${t.label}: "${t.query}" ---`);
    const events: any[] = [];
    await ragService.streamChat(makeReq(t.query), (evt) => events.push(evt));
    
    const clarification = events.find(e => e.type === 'clarification_required');
    const tokens = events.filter(e => e.type === 'token');
    
    console.log(`  Emitted events: ${events.map(e => e.type).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`);
    if (clarification) {
      console.log(`  Clarification options: ${clarification.data?.options?.map((o: any) => o.label).join(', ')}`);
    }

    if (t.expectClarification) {
      assert(`${t.label}: emitted clarification_required`, clarification !== undefined);
      assert(`${t.label}: did NOT emit tokens (graph terminated)`, tokens.length === 0, `tokens emitted: ${tokens.length}`);
    } else {
      assert(`${t.label}: did NOT emit clarification_required`, clarification === undefined);
      assert(`${t.label}: emitted tokens (synthesis occurred)`, tokens.length > 0, `tokens emitted: ${tokens.length}`);
    }
  }

  await prisma.message.deleteMany({ where: { organizationId: org.id } });
  await prisma.chat.deleteMany({ where: { organizationId: org.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.organization.delete({ where: { id: org.id } });
}

async function main() {
  try { await runRegressionMatrix(); } catch (err: any) { console.error(err); process.exit(1); }
  const failed = RESULTS.filter(r => !r.pass);
  if (failed.length > 0) process.exit(1);
}
main();
