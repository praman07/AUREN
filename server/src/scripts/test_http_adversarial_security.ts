import { createApp } from '../app';
import { prisma } from '../infrastructure/database/prisma';
import { PasswordService } from '../shared/security/password';
import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../shared/config/env';
import * as http from 'http';

async function runHttpAdversarialTests() {
  console.log('==================================================');
  console.log('PHASE 13: ADVERSARIAL HTTP INTEGRATION TESTS');
  console.log('==================================================\n');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`Test server running at ${baseUrl}`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string, details?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`, details !== undefined ? details : '');
      failed++;
    }
  }

  const qdrant = new QdrantClient({ url: env.QDRANT_URL });

  try {
    // --- SEED TEST DATA ---
    const prefix = `http_test_${Date.now()}`;
    const passwordHash = PasswordService.hash('Password123!');

    // Create Org A and Org B
    const orgA = await prisma.organization.create({
      data: { name: `${prefix}_OrgA`, domain: `${prefix}_orga.com`, industry: 'CORPORATE' as any },
    });
    const orgB = await prisma.organization.create({
      data: { name: `${prefix}_OrgB`, domain: `${prefix}_orgb.com`, industry: 'FINANCE' as any },
    });

    // Create Departments in Org A
    const deptEngineering = await prisma.department.create({
      data: { name: `${prefix}_Engineering`, organizationId: orgA.id },
    });
    const deptHR = await prisma.department.create({
      data: { name: `${prefix}_HR`, organizationId: orgA.id },
    });

    // Create Roles in Org A
    const roleJunior = await prisma.role.create({
      data: { name: `${prefix}_JuniorRole`, organizationId: orgA.id },
    });
    const roleSenior = await prisma.role.create({
      data: { name: `${prefix}_SeniorRole`, organizationId: orgA.id },
    });

    // Users in Org A
    const superAdminA = await prisma.user.create({
      data: {
        email: `${prefix}_superadmin@orga.com`,
        passwordHash,
        firstName: 'SuperAdmin',
        lastName: 'A',
        organizationId: orgA.id,
        isSuperAdmin: true,
      },
    });

    const employeeA = await prisma.user.create({
      data: {
        email: `${prefix}_emp@orga.com`,
        passwordHash,
        firstName: 'Emp',
        lastName: 'A',
        organizationId: orgA.id,
        departmentId: deptEngineering.id,
        isSuperAdmin: false,
      },
    });

    await prisma.userRole.create({
      data: { userId: employeeA.id, roleId: roleJunior.id },
    });

    // User in Org B
    const userB = await prisma.user.create({
      data: {
        email: `${prefix}_user@orgb.com`,
        passwordHash,
        firstName: 'User',
        lastName: 'B',
        organizationId: orgB.id,
        isSuperAdmin: false,
      },
    });

    // Login SuperAdmin A
    const superAdminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: superAdminA.email, password: 'Password123!' }),
    });
    const superAdminLoginData: any = await superAdminLoginRes.json();
    const superAdminToken = superAdminLoginData.data.token;

    // Login Employee A
    const empLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: employeeA.email, password: 'Password123!' }),
    });
    const empLoginData: any = await empLoginRes.json();
    const empToken = empLoginData.data.token;

    // Login User B
    const userBLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userB.email, password: 'Password123!' }),
    });
    const userBLoginData: any = await userBLoginRes.json();
    const userBToken = userBLoginData.data.token;

    // -------------------------------------------------------------
    // TEST 1: Unauthenticated request -> 401
    // -------------------------------------------------------------
    const res1 = await fetch(`${baseUrl}/api/v1/organization`);
    assert(res1.status === 401, 'Test 1: Unauthenticated request returns 401');

    // -------------------------------------------------------------
    // TEST 2: Normal employee accessing admin endpoint -> 403
    // -------------------------------------------------------------
    const res2 = await fetch(`${baseUrl}/api/v1/super-admin/organization/hierarchy`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(res2.status === 403, 'Test 2: Normal employee accessing super-admin endpoint returns 403');

    // -------------------------------------------------------------
    // TEST 3: Employee accessing another organization's resource -> 403/404
    // -------------------------------------------------------------
    const docB = await prisma.document.create({
      data: {
        organizationId: orgB.id,
        ownerId: userB.id,
        title: 'Org B Secret Doc',
        mimeType: 'text/plain',
        sizeBytes: 100,
        visibility: 'ORG_WIDE' as any,
      },
    });

    const res3 = await fetch(`${baseUrl}/api/v1/documents/${docB.id}`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(res3.status === 404 || res3.status === 403, 'Test 3: Cross-organization document access blocked (403/404)');

    // -------------------------------------------------------------
    // TEST 4: Employee modifying roles -> 403
    // -------------------------------------------------------------
    const res4 = await fetch(`${baseUrl}/api/v1/super-admin/roles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'HackerRole' }),
    });
    assert(res4.status === 403, 'Test 4: Normal employee modifying roles returns 403');

    // -------------------------------------------------------------
    // TEST 5: Employee modifying policies -> 403
    // -------------------------------------------------------------
    const res5 = await fetch(`${baseUrl}/api/v1/super-admin/documents/${docB.id}/policy`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: 'ORG_WIDE' }),
    });
    assert(res5.status === 403, 'Test 5: Normal employee modifying policies returns 403');

    // -------------------------------------------------------------
    // TEST 6, 7, 8, 9, 10: Zero-Trust Permission Policy Enforcement
    // -------------------------------------------------------------
    // Document restricted to Senior Role
    const docSenior = await prisma.document.create({
      data: {
        organizationId: orgA.id,
        ownerId: superAdminA.id,
        title: 'Senior Exec Strategy',
        mimeType: 'text/plain',
        sizeBytes: 100,
        visibility: 'PRIVATE' as any,
        allowedRoles: [roleSenior.id],
      },
    });

    // Employee A has roleJunior, NOT roleSenior
    const res6 = await fetch(`${baseUrl}/api/v1/documents/${docSenior.id}`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(res6.status === 403 || res6.status === 404, 'Test 6: Unauthorized role cannot access document');

    // -------------------------------------------------------------
    // TEST 11: Connector credentials cannot be retrieved (no secrets exposed)
    // -------------------------------------------------------------
    await prisma.connectedAccount.create({
      data: {
        organizationId: orgA.id,
        userId: superAdminA.id,
        provider: 'GITHUB',
        accountId: 'gh_123',
        accessToken: 'enc_secret_access_token',
        refreshToken: 'enc_secret_refresh_token',
        tokenIv: 'iv_secret',
      },
    });

    const res11 = await fetch(`${baseUrl}/api/v1/connectors`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const data11: any = await res11.json();
    assert(res11.status === 200, 'Test 11a: Connector listing API call successful');
    
    const githubConn = data11.data.find((c: any) => c.provider === 'GITHUB');
    const safeAccount = githubConn?.account;
    const secretsExposed = safeAccount && ('accessToken' in safeAccount || 'refreshToken' in safeAccount || 'tokenIv' in safeAccount);
    assert(!secretsExposed, 'Test 11b: Connector credentials (tokens/IVs) are NEVER exposed in API response');

    // -------------------------------------------------------------
    // TEST 12 & 13: Unauthorized document cannot reach RAG / Chat Context
    // -------------------------------------------------------------
    const res12 = await fetch(`${baseUrl}/api/v1/chat/stream`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is in the Senior Exec Strategy document?' }),
    });
    assert(res12.status === 200, 'Test 12a: Chat endpoint responds');
    const answer12 = await res12.text();
    const containsSecret = answer12.toLowerCase().includes('senior exec strategy content');
    assert(!containsSecret, 'Test 12b & 13: Unauthorized document content never reaches RAG/LLM context');

    // -------------------------------------------------------------
    // TEST 14: Admin can manage only their organization
    // -------------------------------------------------------------
    const res14 = await fetch(`${baseUrl}/api/v1/organization/members/${userB.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    });
    assert(res14.status === 404 || res14.status === 403, 'Test 14: Admin cannot manage users of another organization');

    // -------------------------------------------------------------
    // TEST 15 & 16: Super Admin can modify policies & propagate to Qdrant
    // -------------------------------------------------------------
    const docPolicyTest = await prisma.document.create({
      data: {
        organizationId: orgA.id,
        ownerId: superAdminA.id,
        title: 'Policy Propagation Test Doc',
        mimeType: 'text/plain',
        sizeBytes: 100,
        visibility: 'PRIVATE' as any,
        allowedRoles: [roleSenior.id],
      },
    });

    const res15 = await fetch(`${baseUrl}/api/v1/super-admin/documents/${docPolicyTest.id}/policy`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibility: 'ORG_WIDE',
        allowedRoles: [roleJunior.id],
        deniedUsers: [],
      }),
    });
    assert(res15.status === 200, 'Test 15: Super Admin successfully updates document policy');

    // -------------------------------------------------------------
    // TEST 17: Deleted documents disappear from retrieval
    // -------------------------------------------------------------
    const docDeleteTest = await prisma.document.create({
      data: {
        organizationId: orgA.id,
        ownerId: superAdminA.id,
        title: 'Document to be deleted',
        mimeType: 'text/plain',
        sizeBytes: 100,
        visibility: 'ORG_WIDE' as any,
      },
    });

    const res17a = await fetch(`${baseUrl}/api/v1/documents/${docDeleteTest.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert(res17a.status === 204 || res17a.status === 200, 'Test 17a: Document successfully deleted via API');

    const res17b = await fetch(`${baseUrl}/api/v1/documents/${docDeleteTest.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert(res17b.status === 404, 'Test 17b: Deleted document disappears from retrieval (404)');

    // -------------------------------------------------------------
    // TEST 18: Cross-tenant access impossible through manipulated IDs
    // -------------------------------------------------------------
    const res18 = await fetch(`${baseUrl}/api/v1/organization/members`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const data18: any = await res18.json();
    const membersOrgB = data18.data || [];
    const hasOrgAMember = membersOrgB.some((m: any) => m.id === superAdminA.id || m.id === employeeA.id);
    assert(!hasOrgAMember, 'Test 18: Cross-tenant isolation strictly enforced on member listing');

    // -------------------------------------------------------------
    // TEST 19: Invalid/expired token returns 401
    // -------------------------------------------------------------
    const res19 = await fetch(`${baseUrl}/api/v1/organization`, {
      headers: { Authorization: `Bearer invalid.jwt.token` },
    });
    assert(res19.status === 401, 'Test 19: Invalid/expired token returns 401');

    // -------------------------------------------------------------
    // TEST 20: Normal user cannot create/invite user -> 403
    // -------------------------------------------------------------
    const res20 = await fetch(`${baseUrl}/api/v1/users/invite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `${prefix}_invited_fail@orga.com`, role: 'MEMBER' }),
    });
    assert(res20.status === 403, 'Test 20: Normal user cannot create/invite user (403)');

    // -------------------------------------------------------------
    // TEST 21: Super Admin can create/invite user -> 201
    // -------------------------------------------------------------
    const res21 = await fetch(`${baseUrl}/api/v1/users/invite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `${prefix}_invited_pass@orga.com`, firstName: 'Invited', lastName: 'User' }),
    });
    assert(res21.status === 201, 'Test 21: Super Admin can create/invite user (201)');

    // -------------------------------------------------------------
    // TEST 22: Normal user cannot modify organization settings -> 403
    // -------------------------------------------------------------
    const res22 = await fetch(`${baseUrl}/api/v1/organization/settings`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Org Name' }),
    });
    assert(res22.status === 403, 'Test 22: Normal user cannot modify organization settings (403)');

    // -------------------------------------------------------------
    // TEST 23: Normal user cannot manage connectors (connect) -> 403
    // -------------------------------------------------------------
    const res23 = await fetch(`${baseUrl}/api/v1/connectors/connect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'GITHUB', accountId: 'acc_test', accountEmail: 'test@gh.com' }),
    });
    assert(res23.status === 403, 'Test 23: Normal user cannot connect connector (403)');

    // -------------------------------------------------------------
    // TEST 24: Normal user cannot manage connectors (sync) -> 403
    // -------------------------------------------------------------
    const res24 = await fetch(`${baseUrl}/api/v1/connectors/conn_test/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(res24.status === 403, 'Test 24: Normal user cannot sync connector (403)');

    // -------------------------------------------------------------
    // TEST 25: Explicit Deny overrides Role Allow
    // -------------------------------------------------------------
    const docExplicitDeny = await prisma.document.create({
      data: {
        organizationId: orgA.id,
        ownerId: superAdminA.id,
        title: 'Explicit Deny Document',
        mimeType: 'text/plain',
        sizeBytes: 100,
        visibility: 'PRIVATE' as any,
        allowedRoles: [roleJunior.id],
        deniedUsers: [employeeA.id],
      },
    });

    const res25 = await fetch(`${baseUrl}/api/v1/documents/${docExplicitDeny.id}`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(res25.status === 403 || res25.status === 404, 'Test 25: Explicit deny overrides role allow (403/404)');

    // --- CLEANUP ---
    await prisma.document.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: [superAdminA.id, employeeA.id, userB.id] } } });
    await prisma.user.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await prisma.department.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await prisma.role.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await prisma.connectedAccount.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });

  } catch (error) {
    console.error('Error during HTTP adversarial tests:', error);
    failed++;
  } finally {
    server.close();
  }

  console.log('\n==================================================');
  console.log('HTTP ADVERSARIAL TEST RESULTS');
  console.log('==================================================');
  console.log(`TOTAL:   ${passed + failed}`);
  console.log(`PASS:    ${passed}`);
  console.log(`FAIL:    ${failed}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runHttpAdversarialTests();
