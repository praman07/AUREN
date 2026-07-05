import { PrismaClient, ClearanceLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create System Organization
  const org = await prisma.organization.create({
    data: {
      name: 'EKOS Enterprise',
      domain: 'ekos.app',
    },
  });

  console.log(`✅ Created Organization: ${org.name} (${org.id})`);

  // 2. Create System Departments
  const engineering = await prisma.department.create({
    data: {
      name: 'Engineering',
      description: 'Core platform development',
      organizationId: org.id,
    },
  });

  const security = await prisma.department.create({
    data: {
      name: 'Security',
      description: 'InfoSec and Compliance',
      organizationId: org.id,
    },
  });

  console.log(`✅ Created Departments: Engineering, Security`);

  // 3. Create System Roles & Permissions
  const adminRole = await prisma.role.create({
    data: {
      name: 'Organization Admin',
      description: 'Full access to all resources',
      isSystem: true,
      organizationId: org.id,
      permissions: {
        create: [
          { action: 'ALL', resource: 'ALL' },
        ],
      },
    },
  });

  const memberRole = await prisma.role.create({
    data: {
      name: 'Member',
      description: 'Standard access to read/write own documents',
      isSystem: true,
      organizationId: org.id,
      permissions: {
        create: [
          { action: 'DOC_READ', resource: 'Document' },
          { action: 'DOC_CREATE', resource: 'Document' },
        ],
      },
    },
  });

  console.log(`✅ Created Roles: Org Admin, Member`);

  // 4. Create Seed User
  const adminUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: engineering.id,
      email: 'admin@ekos.app',
      firstName: 'System',
      lastName: 'Admin',
      clearanceLevel: ClearanceLevel.TOP_SECRET,
      userRoles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  console.log(`✅ Created Admin User: ${adminUser.email}`);
  
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
