const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const org = await prisma.organization.upsert({
    where: { id: 'mock-org-id' },
    update: {},
    create: {
      id: 'mock-org-id',
      name: 'Mock Organization'
    }
  });

  const user = await prisma.user.upsert({
    where: { id: 'mock-user-id' },
    update: {},
    create: {
      id: 'mock-user-id',
      email: 'mock@example.com',
      firstName: 'Mock',
      lastName: 'User',
      organizationId: org.id
    }
  });

  console.log('Seeded DB', { org, user });
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
