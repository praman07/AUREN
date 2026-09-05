import { prisma } from '../infrastructure/database/prisma';

async function main() {
  console.log('=== ORGANIZATIONS ===');
  const orgs = await prisma.organization.findMany();
  console.log(JSON.stringify(orgs, null, 2));

  console.log('\n=== USERS ===');
  const users = await prisma.user.findMany();
  console.log(users.map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    orgId: u.organizationId,
    roles: u.roles,
    departments: u.departmentId
  })));

  console.log('\n=== DOCUMENTS ===');
  const docs = await prisma.document.findMany({
    include: {
      versions: true
    }
  });
  console.log(docs.map((d: any) => ({
    id: d.id,
    title: d.title,
    orgId: d.organizationId,
    ownerId: d.ownerId,
    visibility: d.visibility,
    scope: d.scope,
    sourceProvider: d.sourceProvider,
    sourceUrl: d.sourceUrl,
    versionsCount: d.versions.length,
    latestVersionS3Key: d.versions[d.versions.length - 1]?.s3Key
  })));

  console.log('\n=== CONNECTOR POLICIES ===');
  const policies = await prisma.connectorPolicy.findMany();
  console.log(JSON.stringify(policies, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
