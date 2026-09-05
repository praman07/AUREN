import { prisma } from '../infrastructure/database/prisma';

async function main() {
  const users = await prisma.user.findMany({
    where: {
      organizationId: {
        in: ['f01a4480-d1d2-4650-8ade-ad8ac1b1760c', '24315b39-3b3a-482f-8c59-e9b552d0d070', '06f9fbd1-3071-4150-8c70-00610074a4bf']
      }
    }
  });

  console.log('=== USERS IN TARGET ORGS ===');
  users.forEach(u => console.log(`- ${u.firstName} ${u.lastName} (${u.email}) [ID: ${u.id}] | Org: ${u.organizationId}`));

  const docs = await prisma.document.findMany({
    where: {
      organizationId: 'f01a4480-d1d2-4650-8ade-ad8ac1b1760c'
    },
    take: 10
  });
  console.log('\n=== DOCS IN ORG f01a4480 ===');
  docs.forEach(d => console.log(`- [${d.id}] "${d.title}" | Scope: ${d.scope} | Vis: ${d.visibility}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
