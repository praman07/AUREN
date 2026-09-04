import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inserting test entities for E2E tests...');

  // 1. Create Organization: mock-org-id
  await prisma.organization.upsert({
    where: { id: 'mock-org-id' },
    update: {},
    create: {
      id: 'mock-org-id',
      name: 'Mock Org',
      domain: 'mock.org',
      industry: 'CORPORATE',
    },
  });

  // 2. Create User: mock-user-id
  await prisma.user.upsert({
    where: { id: 'mock-user-id' },
    update: {},
    create: {
      id: 'mock-user-id',
      organizationId: 'mock-org-id',
      email: 'mock-user@mock.org',
      firstName: 'Mock',
      lastName: 'User',
      isSuperAdmin: true,
    },
  });

  // 3. Create Organization: evil-corp
  await prisma.organization.upsert({
    where: { id: 'evil-corp' },
    update: {},
    create: {
      id: 'evil-corp',
      name: 'Evil Corp',
      domain: 'evil.corp',
      industry: 'CORPORATE',
    },
  });

  // 4. Create User: diff-user
  await prisma.user.upsert({
    where: { id: 'diff-user' },
    update: {},
    create: {
      id: 'diff-user',
      organizationId: 'evil-corp',
      email: 'diff-user@evil.corp',
      firstName: 'Diff',
      lastName: 'User',
      isSuperAdmin: false,
    },
  });

  console.log('Test entities inserted successfully!');
}

main()
  .catch((e) => {
    console.error('Failed inserting test entities:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
