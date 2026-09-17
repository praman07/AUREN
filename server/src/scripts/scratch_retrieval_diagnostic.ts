import { OrganizationRetriever } from '../ai/retrievers/OrganizationRetriever';
import { prisma } from '../infrastructure/database/prisma';

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) return;

  const retriever = new OrganizationRetriever({
    authContext: {
      organizationId: user.organizationId,
      userId: user.id,
      roles: [],
      departmentId: user.departmentId || undefined,
      isSuperAdmin: !!user.isSuperAdmin
    }
  });

  const query = "what is test upload image consist of ??";
  console.log(`=== RUNNING RETRIEVAL DIAGNOSTIC FOR QUERY: "${query}" ===`);
  const docs = await retriever.getRelevantDocuments(query);
  console.log(`\nFinal Docs Returned (${docs.length}):`);
  docs.forEach((d, i) => {
    console.log(`  [${i + 1}] Title: "${d.metadata.title || d.metadata.documentName}" | Score: ${d.metadata.score} | ChunkID: ${d.metadata.chunkId}`);
  });

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
