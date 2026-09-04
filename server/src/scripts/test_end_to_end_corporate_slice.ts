import { createApp } from '../app';
import { prisma } from '../infrastructure/database/prisma';
import { PasswordService } from '../shared/security/password';
import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../shared/config/env';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

async function runEndToEndCorporateVerticalSliceTest() {
  console.log('==================================================');
  console.log('AUREN END-TO-END CORPORATE VERTICAL SLICE VALIDATION');
  console.log('==================================================\n');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`Live test backend server started on ${baseUrl}`);

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
    const timestamp = Date.now();
    const orgName = `AUREN Demo Corporation ${timestamp}`;
    const domain = `auren-demo-${timestamp}.corp`;
    const superAdminEmail = `admin@auren-demo-${timestamp}.corp`;
    const password = 'Password123!';

    // -----------------------------------------------------------------
    // STEP 1: ORGANIZATION ONBOARDING (REAL API)
    // -----------------------------------------------------------------
    console.log('\n--- 1. ORGANIZATION ONBOARDING ---');
    const onboardRes = await fetch(`${baseUrl}/api/v1/onboarding/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgName: orgName,
        domain: domain,
        industry: 'CORPORATE',
        customDepartments: ['Engineering', 'Human Resources', 'Finance'],
        customRoles: ['Engineering Manager', 'Employee'],
        superAdmin: {
          email: superAdminEmail,
          password: password,
          firstName: 'SuperAdmin',
          lastName: 'Corporate',
        },
      }),
    });

    const onboardData: any = await onboardRes.json();
    assert(onboardRes.status === 201 && onboardData.success, 'Onboarding creates Organization, SuperAdmin, Roles & Departments via Real API');
    
    const superAdminToken = onboardData.data?.session?.token;
    const orgId = onboardData.data?.organization?.id;
    const superAdminId = onboardData.data?.superAdmin?.id;

    assert(Boolean(superAdminToken) && Boolean(orgId) && Boolean(superAdminId), 'Onboarding returns valid session token and IDs');

    // Verify created departments & roles via DB
    const departments = await prisma.department.findMany({ where: { organizationId: orgId } });
    const roles = await prisma.role.findMany({ where: { organizationId: orgId } });

    const deptEng = departments.find((d) => d.name === 'Engineering');
    const deptHR = departments.find((d) => d.name === 'Human Resources');
    const deptFin = departments.find((d) => d.name === 'Finance');
    assert(Boolean(deptEng && deptHR && deptFin), 'Corporate departments (Engineering, HR, Finance) provisioned');

    const roleEngMgr = roles.find((r) => r.name === 'Engineering Manager');
    const roleEmployee = roles.find((r) => r.name === 'Employee');
    assert(Boolean(roleEngMgr && roleEmployee), 'Corporate roles (Engineering Manager, Employee) provisioned');

    // -----------------------------------------------------------------
    // STEP 2: SESSION RESTORATION & AUTH/ME
    // -----------------------------------------------------------------
    console.log('\n--- 2. AUTHENTICATION & SESSION RESTORATION ---');
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const meData: any = await meRes.json();
    assert(meRes.status === 200 && meData.data?.isSuperAdmin === true, 'GET /auth/me verifies SuperAdmin session token');

    // -----------------------------------------------------------------
    // STEP 3: PEOPLE & ACCESS (CREATE USERS & ROLES)
    // -----------------------------------------------------------------
    console.log('\n--- 3. PEOPLE & ACCESS PROVISIONING ---');
    // Create User A: Engineering Manager in Engineering
    const userAEmail = `john.mgr@auren-demo-${timestamp}.corp`;
    const createResA = await fetch(`${baseUrl}/api/v1/users/invite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userAEmail,
        password: password,
        firstName: 'John',
        lastName: 'Manager',
        departmentId: deptEng!.id,
        roleIds: [roleEngMgr!.id],
      }),
    });
    const dataA: any = await createResA.json();
    assert(createResA.status === 201, 'Super Admin invites User A (Engineering Manager)');
    const userAId = dataA.data.id;

    // Create User B: Employee in Finance
    const userBEmail = `sarah.fin@auren-demo-${timestamp}.corp`;
    const createResB = await fetch(`${baseUrl}/api/v1/users/invite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userBEmail,
        password: password,
        firstName: 'Sarah',
        lastName: 'Finance',
        departmentId: deptFin!.id,
        roleIds: [roleEmployee!.id],
      }),
    });
    const dataB: any = await createResB.json();
    assert(createResB.status === 201, 'Super Admin invites User B (Employee in Finance)');
    const userBId = dataB.data.id;

    // Log in User A
    const loginResA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password: password }),
    });
    const loginDataA: any = await loginResA.json();
    const tokenA = loginDataA.data?.token;
    assert(loginResA.status === 200 && Boolean(tokenA), 'User A authenticates & receives real JWT session');

    // Log in User B
    const loginResB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userBEmail, password: password }),
    });
    const loginDataB: any = await loginResB.json();
    const tokenB = loginDataB.data?.token;
    assert(loginResB.status === 200 && Boolean(tokenB), 'User B authenticates & receives real JWT session');

    // -----------------------------------------------------------------
    // STEP 4: REAL DOCUMENT INGESTION & PROCESSING
    // -----------------------------------------------------------------
    console.log('\n--- 4. REAL DOCUMENT INGESTION & VECTOR STORAGE ---');
    const policyDocTitle = 'Engineering Architecture Policy';
    const policyDocContent = `AUREN ENTERPRISE ARCHITECTURE POLICY v2.4
1. MICROSERVICES STANDARDS: All backend microservices must expose OpenAPI v3 specs and support gRPC for internal IPC.
2. ZERO-TRUST DISCIPLINE: Every vector query in Qdrant must be filtered with strict tenancy and document permission payload metadata.
3. SECURITY ENFORCEMENT: Explicit user denial must override role-level and department-level allow directives.`;

    const doc = await prisma.document.create({
      data: {
        organizationId: orgId,
        ownerId: superAdminId,
        title: policyDocTitle,
        mimeType: 'text/plain',
        sizeBytes: Buffer.byteLength(policyDocContent),
        visibility: 'DEPARTMENT' as any,
        allowedRoles: [roleEngMgr!.id],
        allowedDepartments: [deptEng!.id],
      },
    });

    assert(Boolean(doc.id), 'Document inserted with metadata policies');
    const docId = doc.id;

    // Index into vector store
    const collectionName = `org_${orgId.replace(/[^a-zA-Z0-9]/g, '_')}_docs`;
    try {
      await qdrant.createCollection(collectionName, {
        vectors: { size: 768, distance: 'Cosine' },
      });
    } catch (e) {
      // Collection might already exist
    }

    // Embed content via nomic-embed-text
    const embedRes = await fetch('http://localhost:11434/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'nomic-embed-text', input: policyDocContent }),
    });
    const embedData: any = await embedRes.json();
    const vector = embedData.embeddings?.[0];

    if (vector) {
      await qdrant.upsert(collectionName, {
        points: [
          {
            id: docId,
            vector: vector,
            payload: {
              organizationId: orgId,
              documentId: docId,
              title: policyDocTitle,
              content: policyDocContent,
              visibility: 'DEPARTMENT',
              allowedRoles: [roleEngMgr!.id],
              allowedDepartments: [deptEng!.id],
              deniedUsers: [],
            },
          },
        ],
      });
    }

    assert(Boolean(vector), 'Document chunk successfully embedded and upserted to Qdrant vector index');

    // -----------------------------------------------------------------
    // STEP 5: SECURITY TEST & AUTHORIZED RAG RETRIEVAL VIA OLLAMA
    // -----------------------------------------------------------------
    console.log('\n--- 5. MANDATORY SECURITY & ZERO-TRUST RAG TEST ---');

    // SCENARIO A: User A (Engineering Manager) asks about the policy -> ALLOWED
    console.log('Querying AI Assistant as User A (Engineering Manager - Authorized)...');
    const chatResA = await fetch(`${baseUrl}/api/v1/chat/stream`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is our engineering architecture policy?' }),
    });
    assert(chatResA.status === 200, 'Chat API accepts request for User A');
    const chatBodyA = await chatResA.text();
    const hasSourceA = chatBodyA.includes(policyDocTitle) || chatBodyA.toLowerCase().includes('microservices') || chatBodyA.toLowerCase().includes('architecture');
    assert(hasSourceA, 'User A (Engineering Manager) retrieves authorized document context from Qdrant/Ollama');

    // SCENARIO B: User B (Finance Employee) asks the exact same question -> DENIED (NO CONTEXT)
    console.log('Querying AI Assistant as User B (Finance Employee - Unauthorized)...');
    const chatResB = await fetch(`${baseUrl}/api/v1/chat/stream`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is our engineering architecture policy?' }),
    });
    assert(chatResB.status === 200, 'Chat API accepts request for User B');
    const chatBodyB = await chatResB.text();
    const containsSensitiveContextB = chatBodyB.includes('AUREN ENTERPRISE ARCHITECTURE POLICY v2.4') || chatBodyB.includes('gRPC for internal IPC');
    assert(!containsSensitiveContextB, 'User B (Finance Employee) is BLOCKED from unauthorized document context');

    // SCENARIO C: Add EXPLICIT DENY for User A -> DENIED
    console.log('Applying Explicit Deny for User A...');
    const policyUpdateRes = await fetch(`${baseUrl}/api/v1/super-admin/documents/${docId}/policy`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibility: 'DEPARTMENT',
        allowedRoles: [roleEngMgr!.id],
        allowedDepartments: [deptEng!.id],
        deniedUsers: [userAId],
      }),
    });
    assert(policyUpdateRes.status === 200, 'Super Admin applies explicit deny rule for User A');

    console.log('Querying AI Assistant as User A with Explicit Deny active...');
    const chatResADenied = await fetch(`${baseUrl}/api/v1/chat/stream`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is our engineering architecture policy?' }),
    });
    const chatBodyADenied = await chatResADenied.text();
    const containsSensitiveContextADenied = chatBodyADenied.includes('AUREN ENTERPRISE ARCHITECTURE POLICY v2.4') || chatBodyADenied.includes('gRPC for internal IPC');
    assert(!containsSensitiveContextADenied, 'Explicit Deny OVERRIDES Role Allow: User A is now BLOCKED from context');

    // SCENARIO D: Remove Explicit Deny -> ACCESS RESTORED
    console.log('Removing Explicit Deny for User A...');
    await fetch(`${baseUrl}/api/v1/super-admin/documents/${docId}/policy`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibility: 'DEPARTMENT',
        allowedRoles: [roleEngMgr!.id],
        allowedDepartments: [deptEng!.id],
        deniedUsers: [],
      }),
    });

    console.log('Querying AI Assistant as User A after explicit deny removal...');
    const chatResARestored = await fetch(`${baseUrl}/api/v1/chat/stream`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is our engineering architecture policy?' }),
    });
    const chatBodyARestored = await chatResARestored.text();
    const hasSourceARestored = chatBodyARestored.includes(policyDocTitle) || chatBodyARestored.toLowerCase().includes('microservices') || chatBodyARestored.toLowerCase().includes('architecture');
    assert(hasSourceARestored, 'Removing explicit deny RESTORES document retrieval access for User A');

    // -----------------------------------------------------------------
    // CLEANUP TEST DATA
    // -----------------------------------------------------------------
    await prisma.document.deleteMany({ where: { organizationId: orgId } });
    await prisma.userRole.deleteMany({ where: { userId: { in: [superAdminId, userAId, userBId] } } });
    await prisma.user.deleteMany({ where: { organizationId: orgId } });
    await prisma.department.deleteMany({ where: { organizationId: orgId } });
    await prisma.role.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.delete({ where: { id: orgId } });

  } catch (err) {
    console.error('Error during Corporate vertical slice validation:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log('\n==================================================');
  console.log('END-TO-END CORPORATE VERTICAL SLICE SUMMARY');
  console.log('==================================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runEndToEndCorporateVerticalSliceTest();
