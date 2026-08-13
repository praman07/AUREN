import { createApp } from '../app';
import { prisma } from '../infrastructure/database/prisma';
import http from 'http';
import fetch from 'node-fetch';

async function runOnboardingValidation() {
  console.log('====================================================');
  console.log('🚀 AUREN MVP: Organization Onboarding End-to-End Test');
  console.log('====================================================\n');

  // 1. Start test HTTP server
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    // 2. Fetch Industry Templates
    console.log('STEP 1: Querying Industry Templates...');
    const templatesRes = await fetch(`${baseUrl}/onboarding/templates`);
    const templatesJson: any = await templatesRes.json();
    console.log(`  ✓ Status: ${templatesRes.status}`);
    console.log(`  ✓ Available templates: ${templatesJson.data.map((t: any) => t.industry).join(', ')}`);

    if (templatesRes.status !== 200 || !templatesJson.success || templatesJson.data.length < 5) {
      throw new Error('Failed to retrieve industry templates');
    }

    // 3. Perform Organization Onboarding (Hospital Industry Template)
    const timestamp = Date.now();
    const testOrgName = `St. Jude Health ${timestamp}`;
    const testDomain = `stjude-${timestamp}.auren.health`;
    const adminEmail = `cm_officer_${timestamp}@stjude.health`;
    const adminPassword = `HospitalAdmin2026!`;

    console.log('\nSTEP 2: Executing Organization Onboarding API...');
    const onboardRes = await fetch(`${baseUrl}/onboarding/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgName: testOrgName,
        domain: testDomain,
        industry: 'HOSPITAL',
        superAdmin: {
          email: adminEmail,
          password: adminPassword,
          firstName: 'Sarah',
          lastName: 'Connors',
        },
        customDepartments: ['Pediatrics Unit'],
        customRoles: ['Chief Surgeon'],
        initialMembers: [
          { email: `nurse_john_${timestamp}@stjude.health`, firstName: 'John', lastName: 'Nurse' }
        ]
      })
    });

    const onboardJson: any = await onboardRes.json();
    console.log(`  ✓ Status: ${onboardRes.status}`);
    if (onboardRes.status !== 201 || !onboardJson.success) {
      throw new Error(`Onboarding failed: ${JSON.stringify(onboardJson)}`);
    }

    const { organization, superAdmin, departments, roles, session } = onboardJson.data;
    console.log(`  ✓ Organization Created: ID=${organization.id}, Name="${organization.name}", Industry=${organization.industry}`);
    console.log(`  ✓ SuperAdmin Created: ID=${superAdmin.id}, Email=${superAdmin.email}, isSuperAdmin=${superAdmin.isSuperAdmin}`);
    console.log(`  ✓ Auto-provisioned Departments (${departments.length}): ${departments.map((d: any) => d.name).join(', ')}`);
    console.log(`  ✓ Auto-provisioned Roles (${roles.length}): ${roles.map((r: any) => r.name).join(', ')}`);
    console.log(`  ✓ Session Token Generated: ${session.token.substring(0, 15)}...`);

    // 4. Verify Database Records directly
    console.log('\nSTEP 3: Direct Database Verification...');
    const dbOrg = await prisma.organization.findUnique({
      where: { id: organization.id },
      include: { departments: true, roles: true, users: true }
    });

    if (!dbOrg) throw new Error('DB Organization record missing!');
    console.log(`  ✓ DB Org Found: ${dbOrg.name}`);
    console.log(`  ✓ DB Departments Count: ${dbOrg.departments.length}`);
    console.log(`  ✓ DB Roles Count: ${dbOrg.roles.length}`);
    console.log(`  ✓ DB Users Count: ${dbOrg.users.length}`);

    // 5. Test Authenticated Workspace API Call with SuperAdmin Token
    console.log('\nSTEP 4: Authenticated API Verification...');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` }
    });
    const meJson: any = await meRes.json();
    console.log(`  ✓ Auth /me Status: ${meRes.status}`);
    console.log(`  ✓ Resolved User: ${meJson.data.email} [Org=${meJson.data.organizationId}]`);

    if (meRes.status !== 200 || meJson.data.email !== adminEmail) {
      throw new Error('Session token authentication failed');
    }

    // Clean up test organization records
    console.log('\nSTEP 5: Cleaning up test data...');
    await prisma.userRole.deleteMany({ where: { user: { organizationId: organization.id } } });
    await prisma.session.deleteMany({ where: { user: { organizationId: organization.id } } });
    await prisma.auditLog.deleteMany({ where: { organizationId: organization.id } });
    await prisma.user.deleteMany({ where: { organizationId: organization.id } });
    await prisma.role.deleteMany({ where: { organizationId: organization.id } });
    await prisma.department.deleteMany({ where: { organizationId: organization.id } });
    await prisma.organization.delete({ where: { id: organization.id } });
    console.log('  ✓ Cleaned up test organization.');

    console.log('\n====================================================');
    console.log('✅ ALL ORGANIZATION ONBOARDING CHECKS PASSED SUCCESSFULLY!');
    console.log('====================================================\n');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runOnboardingValidation().catch(err => {
  console.error('❌ ONBOARDING VALIDATION FAILED:', err);
  process.exit(1);
});
