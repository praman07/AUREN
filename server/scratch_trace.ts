import { PrismaClient } from '@prisma/client';
import { OrganizationRetriever } from './src/ai/retrievers/OrganizationRetriever';
import { KnowledgeGraph } from './src/ai/graph/KnowledgeGraph';

const prisma = new PrismaClient();

async function main() {
  const latestDoc = await prisma.document.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!latestDoc) {
    console.log('No document found');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { id: latestDoc.ownerId },
    include: { userRoles: true }
  });

  if (!user) {
    console.log('No user found');
    return;
  }

  const authContext = {
    organizationId: latestDoc.organizationId,
    userId: user.id,
    roles: user.userRoles.map(r => r.roleId),
    departmentId: user.departmentId || undefined,
    isSuperAdmin: user.isSuperAdmin || false,
  };

  const userQuery = "What projects are mentioned in my resume?";

  console.log("=== 1. OrganizationRetriever DIRECTLY ===");
  const retriever = new OrganizationRetriever({ authContext, topK: 5 });
  const retrievedDocs = await retriever.getRelevantDocuments(userQuery);

  console.log(`Retrieved ${retrievedDocs.length} chunks from OrganizationRetriever.`);

  console.log("\n=== 2. KnowledgeGraph WITH useKnowledgeBase=true ===");
  const events: any[] = [];
  const compiledGraph = KnowledgeGraph.buildGraph({
    onEvent: (evt) => {
      events.push(evt);
      if (evt.type === 'context_passed_to_llm' || evt.type === 'sources' || evt.type === 'synthesis_started') {
        console.log(`[GRAPH EVENT] ${evt.type}:`, JSON.stringify(evt.data || {}));
      }
    }
  });

  const stateResult: any = await compiledGraph.invoke({
    messages: [],
    userQuery: userQuery,
    authContext,
    mode: 'HYBRID',
    isWebAccessEnabled: true,
    useKnowledgeBase: true,
    internalDocs: [],
    webResults: [],
    userMemories: [],
    citations: [],
    finalAnswer: '',
    executionMode: 'FAST'
  });

  console.log("\n=== GRAPH FINAL STATE (useKnowledgeBase=true) ===");
  console.log("Intent Category:", stateResult.intentCategory);
  console.log("Internal Docs Count in state:", stateResult.internalDocs ? stateResult.internalDocs.length : 0);
  if (stateResult.internalDocs && stateResult.internalDocs.length > 0) {
    console.log("First doc name:", stateResult.internalDocs[0].metadata?.documentName);
    console.log("First doc score:", stateResult.internalDocs[0].metadata?.score);
    console.log("First doc text snippet:", stateResult.internalDocs[0].pageContent?.slice(0, 150));
  }
  console.log("Citations:", JSON.stringify(stateResult.citations));
  console.log("\n--- Final Answer ---");
  console.log(stateResult.finalAnswer);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
