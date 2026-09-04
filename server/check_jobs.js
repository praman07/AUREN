const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doc = await prisma.document.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!doc) {
    console.log('No doc');
    return;
  }

  console.log('DOC_ID:', doc.id);

  const jobs = await prisma.processingJob.findMany({
    where: { documentId: doc.id },
    orderBy: { createdAt: 'asc' }
  });

  console.log('\nJOBS:');
  console.log(JSON.stringify(jobs, null, 2));

  const audit = await prisma.auditLog.findMany({
    where: { resourceId: doc.id },
    orderBy: { createdAt: 'asc' }
  });

  console.log('\nAUDIT:');
  console.log(JSON.stringify(audit.map(a => ({ action: a.action, meta: a.metadata, at: a.createdAt })), null, 2));
}

main().then(() => prisma.$disconnect()).catch(err => {
  console.error(err);
  prisma.$disconnect();
});
