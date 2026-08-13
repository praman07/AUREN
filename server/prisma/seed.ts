import { PrismaClient } from '@prisma/client';
import { PasswordService } from '../src/shared/security/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create System Organization
  const org = await prisma.organization.upsert({
    where: { domain: 'ekos.app' },
    update: {},
    create: {
      name: 'EKOS Enterprise',
      domain: 'ekos.app',
      industry: 'CORPORATE',
    },
  });

  console.log(`✅ Organization: ${org.name} (${org.id})`);

  // 2. Departments
  const engineering = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'Engineering' } },
    update: {},
    create: { name: 'Engineering', description: 'Core platform development', organizationId: org.id },
  });

  const security = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'Security' } },
    update: {},
    create: { name: 'Security', description: 'InfoSec and Compliance', organizationId: org.id },
  });

  const hr = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'Human Resources' } },
    update: {},
    create: { name: 'Human Resources', description: 'People operations', organizationId: org.id },
  });

  console.log('✅ Departments: Engineering, Security, Human Resources');

  // 3. Roles & Permissions
  const adminRole = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'Organization Admin' } },
    update: {},
    create: {
      name: 'Organization Admin',
      description: 'Full access to all resources',
      isSystem: true,
      organizationId: org.id,
      permissions: { create: [{ action: 'ALL', resource: 'ALL' }] },
    },
  });

  const memberRole = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'Member' } },
    update: {},
    create: {
      name: 'Member',
      description: 'Standard access to read/write own documents',
      isSystem: true,
      organizationId: org.id,
      permissions: { create: [{ action: 'DOC_READ', resource: 'Document' }, { action: 'DOC_CREATE', resource: 'Document' }] },
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'Manager' } },
    update: {},
    create: {
      name: 'Manager',
      description: 'Department management access',
      isSystem: false,
      organizationId: org.id,
      permissions: { create: [{ action: 'DOC_READ', resource: 'Document' }, { action: 'DOC_DELETE', resource: 'Document' }] },
    },
  });

  console.log('✅ Roles: Organization Admin, Member, Manager');

  // 4. Users (with first-party session passwords)
  const adminUser = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'admin@ekos.app' } },
    update: {},
    create: {
      organizationId: org.id,
      departmentId: security.id,
      email: 'admin@ekos.app',
      firstName: 'System',
      lastName: 'Admin',
      passwordHash: PasswordService.hash('admin12345'),
      isSuperAdmin: true,
      userRoles: { create: { roleId: adminRole.id } },
    },
  });

  const alice = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'alice@ekos.app' } },
    update: {},
    create: {
      organizationId: org.id,
      departmentId: engineering.id,
      email: 'alice@ekos.app',
      firstName: 'Alice',
      lastName: 'Engineer',
      passwordHash: PasswordService.hash('alice12345'),
      isSuperAdmin: false,
      userRoles: { create: { roleId: memberRole.id } },
    },
  });

  const bob = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'bob@ekos.app' } },
    update: {},
    create: {
      organizationId: org.id,
      departmentId: hr.id,
      email: 'bob@ekos.app',
      firstName: 'Bob',
      lastName: 'HR',
      passwordHash: PasswordService.hash('bob12345'),
      isSuperAdmin: false,
      userRoles: { create: { roleId: memberRole.id } },
    },
  });

  console.log(`✅ Users: ${adminUser.email} (Super Admin), ${alice.email} (Engineering), ${bob.email} (HR)`);
  console.log('   Dev credentials: admin@ekos.app / admin12345, alice@ekos.app / alice12345, bob@ekos.app / bob12345');

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });