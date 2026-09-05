import { prisma } from '../infrastructure/database/prisma';

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log('=== ORGANIZATIONS (' + orgs.length + ') ===');
  orgs.forEach(o => console.log(`- ${o.name} | ID: ${o.id}`));

  const users = await prisma.user.findMany();
  console.log('\n=== USERS (' + users.length + ') ===');
  users.forEach(u => console.log(`- ${u.firstName} ${u.lastName} (${u.email}) | ID: ${u.id} | OrgID: ${u.organizationId} | SuperAdmin: ${u.isSuperAdmin}`));

  const docs = await prisma.document.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      organizationId: true,
      visibility: true,
      scope: true,
      ownerId: true
    }
  });
  console.log('\n=== RECENT 15 DOCUMENTS ===');
  docs.forEach(d => {
    console.log(`- [${d.id}] "${d.title}" | Org: ${d.organizationId} | Scope: ${d.scope} | Vis: ${d.visibility} | Owner: ${d.ownerId}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
