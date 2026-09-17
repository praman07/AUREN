import { prisma } from '../infrastructure/database/prisma';

async function main() {
  console.log('=== ALL DOCUMENTS IN DATABASE ORDERED BY CREATED AT ===');
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      versions: true,
      jobs: true,
    }
  });

  console.log(`Total docs fetched: ${docs.length}`);

  for (const rawDoc of docs) {
    const doc = rawDoc as any;
    console.log(`\n----------------------------------------`);
    console.log(`Doc ID: ${doc.id}`);
    console.log(`  Title: ${doc.title}`);
    console.log(`  MimeType: ${doc.mimeType}`);
    console.log(`  SourceType: ${doc.sourceType}`);
    console.log(`  Scope: ${doc.scope}`);
    console.log(`  Visibility: ${doc.visibility}`);
    console.log(`  OrgID: ${doc.organizationId}`);
    console.log(`  OwnerID: ${doc.ownerId}`);
    console.log(`  CreatedAt: ${doc.createdAt}`);
    console.log(`  DeletedAt: ${doc.deletedAt}`);
    console.log(`  Jobs: ${JSON.stringify(doc.jobs.map((j: any) => ({ id: j.id, status: j.status, type: j.type, failedAt: j.failedAt })))}`);
    console.log(`  Versions: ${doc.versions.length}`);
    for (const v of doc.versions) {
      console.log(`    Ver ID: ${v.id}, s3Key: ${v.s3Key}`);
      const chunkCount = await prisma.documentChunk.count({ where: { versionId: v.id } });
      const completedEmbed = await prisma.documentChunk.count({ where: { versionId: v.id, embeddingStatus: 'COMPLETED' } });
      const completedIndex = await prisma.documentChunk.count({ where: { versionId: v.id, indexingStatus: 'COMPLETED' } });
      console.log(`    Chunks: ${chunkCount}, Embed Done: ${completedEmbed}, Index Done: ${completedIndex}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
