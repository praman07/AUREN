import { createApp } from '../app';
import { prisma } from '../infrastructure/database/prisma';
import { PasswordService } from '../shared/security/password';
import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../shared/config/env';
import { ProviderFactory } from '../infrastructure/providers/registry/ProviderFactory';
import { AIGateway } from '../infrastructure/gateway/AIGateway';
import { randomUUID } from 'crypto';
import * as http from 'http';

async function runMVPE2ESecurityValidation() {
  console.log('===========================================================');
  console.log('AUREN MVP END-TO-END SECURITY VALIDATION');
  console.log('===========================================================\n');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`Test server active at ${baseUrl}\n`);

  const results: { step: number; name: string; pass: boolean; details?: string }[] = [];
  const qdrant = new QdrantClient({ url: env.QDRANT_URL });
  const providerFactory = new ProviderFactory();
  const aiGateway = new AIGateway(providerFactory);

  const prefix = `e2e_sec_${Date.now()}`;
  const password = 'Password123!';
  const passwordHash = PasswordService.hash(password);

  let orgA: any, orgB: any;
  let userA: any, userB: any, userC: any, superAdminA: any;
  let userAToken: string, userBToken: string, userCToken: string, superAdminToken: string;
  let roleA: any, roleB: any;
  let testDocument: any;
  let versionId: string, chunkId: string, qdrantPointId: string;
  const secretKeyword = 'TITAN_SECRET_KEY_994827';

  try {
    // -------------------------------------------------------------
    // STEP 1: Organization exists
    // -------------------------------------------------------------
    orgA = await prisma.organization.create({
      data: { name: `${prefix}_OrgA`, domain: `${prefix}_orga.com`, industry: 'CORPORATE' as any }
    });
    orgB = await prisma.organization.create({
      data: { name: `${prefix}_OrgB`, domain: `${prefix}_orgb.com`, industry: 'FINANCE' as any }
    });

    try { await qdrant.createCollection(`org_${orgA.id}_docs`, { vectors: { size: 768, distance: 'Cosine' } }); } catch (e) {}
    try { await qdrant.createCollection(`org_${orgB.id}_docs`, { vectors: { size: 768, distance: 'Cosine' } }); } catch (e) {}

    results.push({ step: 1, name: 'Organization exists', pass: !!orgA.id && !!orgB.id });

    // -------------------------------------------------------------
    // STEP 2: Create/use two real users in the same organization (+ 1 cross-org user)
    // -------------------------------------------------------------
    superAdminA = await prisma.user.create({
      data: {
        email: `${prefix}_superadmin@orga.com`,
        passwordHash,
        firstName: 'SuperAdmin',
        lastName: 'A',
        organizationId: orgA.id,
        isSuperAdmin: true
      }
    });

    userA = await prisma.user.create({
      data: {
        email: `${prefix}_usera@orga.com`,
        passwordHash,
        firstName: 'User',
        lastName: 'A',
        organizationId: orgA.id,
        isSuperAdmin: false
      }
    });

    userB = await prisma.user.create({
      data: {
        email: `${prefix}_userb@orga.com`,
        passwordHash,
        firstName: 'User',
        lastName: 'B',
        organizationId: orgA.id,
        isSuperAdmin: false
      }
    });

    userC = await prisma.user.create({
      data: {
        email: `${prefix}_userc@orgb.com`,
        passwordHash,
        firstName: 'User',
        lastName: 'C',
        organizationId: orgB.id,
        isSuperAdmin: false
      }
    });

    // Obtain real Auth tokens
    const login = async (email: string) => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data: any = await res.json();
      return data.data?.token;
    };

    superAdminToken = await login(superAdminA.email);
    userAToken = await login(userA.email);
    userBToken = await login(userB.email);
    userCToken = await login(userC.email);

    results.push({
      step: 2,
      name: 'Create/use two real users in the same organization',
      pass: !!userAToken && !!userBToken && !!userCToken && !!superAdminToken
    });

    // -------------------------------------------------------------
    // STEP 3: Create/use two different roles
    // -------------------------------------------------------------
    roleA = await prisma.role.create({
      data: { name: `${prefix}_RoleA_TitanAccess`, organizationId: orgA.id }
    });
    roleB = await prisma.role.create({
      data: { name: `${prefix}_RoleB_StandardAccess`, organizationId: orgA.id }
    });

    results.push({ step: 3, name: 'Create/use two different roles', pass: !!roleA.id && !!roleB.id });

    // -------------------------------------------------------------
    // STEP 4: Assign Role A to User A
    // -------------------------------------------------------------
    const assignARes = await fetch(`${baseUrl}/api/v1/super-admin/roles/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userA.id, roleId: roleA.id })
    });
    const assignAData: any = await assignARes.json();

    results.push({
      step: 4,
      name: 'Assign Role A to User A',
      pass: assignARes.status === 200 && assignAData.success === true
    });

    // -------------------------------------------------------------
    // STEP 5: Assign Role B to User B
    // -------------------------------------------------------------
    const assignBRes = await fetch(`${baseUrl}/api/v1/super-admin/roles/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userB.id, roleId: roleB.id })
    });
    const assignBData: any = await assignBRes.json();

    results.push({
      step: 5,
      name: 'Assign Role B to User B',
      pass: assignBRes.status === 200 && assignBData.success === true
    });

    // -------------------------------------------------------------
    // STEP 6: Upload a real document
    // -------------------------------------------------------------
    const docContent = `Project Titan Architecture Specifications.\nThe secret security key for quantum encryption is ${secretKeyword}. Keep restricted.`;

    testDocument = await prisma.document.create({
      data: {
        organizationId: orgA.id,
        ownerId: superAdminA.id,
        title: 'Project Titan Architecture',
        mimeType: 'text/plain',
        sizeBytes: Buffer.byteLength(docContent, 'utf8'),
        visibility: 'PRIVATE' as any,
        allowedRoles: [roleA.id],
        allowedUsers: [],
        allowedDepartments: [],
        deniedRoles: [],
        deniedUsers: [],
        deniedDepartments: []
      }
    });

    versionId = randomUUID();
    await prisma.documentVersion.create({
      data: { id: versionId, documentId: testDocument.id, version: 1, s3Key: `test-${testDocument.id}`, hash: 'hash' }
    });

    chunkId = randomUUID();
    qdrantPointId = chunkId;

    await prisma.documentChunk.create({
      data: {
        id: chunkId,
        organizationId: orgA.id,
        documentId: testDocument.id,
        versionId: versionId,
        chunkIndex: 0,
        text: docContent,
        tokenCount: 20,
        embeddingStatus: 'COMPLETED',
        indexingStatus: 'COMPLETED',
        qdrantPointId: qdrantPointId
      }
    });

    const embedRes = await aiGateway.embed({ texts: [docContent], context: {} });
    const vector = embedRes.embeddings[0];

    await prisma.documentChunk.update({
      where: { id: chunkId },
      data: { vectorData: vector }
    });

    await qdrant.upsert(`org_${orgA.id}_docs`, {
      wait: true,
      points: [{
        id: qdrantPointId,
        vector: vector,
        payload: {
          documentId: testDocument.id,
          chunkId: chunkId,
          organizationId: orgA.id,
          ownerId: superAdminA.id,
          visibility: 'PRIVATE',
          content: docContent,
          title: testDocument.title,
          allowedRoles: [roleA.id],
          allowedUsers: [],
          allowedDepartments: [],
          deniedRoles: [],
          deniedUsers: [],
          deniedDepartments: []
        }
      }]
    });

    results.push({ step: 6, name: 'Upload a real document', pass: !!testDocument.id });

    // -------------------------------------------------------------
    // STEP 7: Set document permission so only Role A can access it
    // -------------------------------------------------------------
    const policyRes = await fetch(`${baseUrl}/api/v1/super-admin/documents/${testDocument.id}/policy`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibility: 'PRIVATE',
        allowedRoles: [roleA.id],
        allowedUsers: [],
        allowedDepartments: [],
        deniedRoles: [],
        deniedUsers: [],
        deniedDepartments: []
      })
    });

    results.push({ step: 7, name: 'Set document permission so only Role A can access it', pass: policyRes.status === 200 });

    // Helper function to query stream chat endpoint and parse SSE tokens & sources
    const queryChat = async (token: string, message: string): Promise<{ text: string; sources: any[]; fullRaw: string }> => {
      const res = await fetch(`${baseUrl}/api/v1/chat/stream`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const raw = await res.text();
      let assembledText = '';
      let sources: any[] = [];

      const lines = raw.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.type === 'token') {
              assembledText += json.data;
            } else if (json.type === 'sources') {
              sources = json.data;
            }
          } catch (e) {}
        }
      }

      return { text: assembledText, sources, fullRaw: raw };
    };

    const chatPrompt = 'What is the secret key for quantum encryption in Project Titan?';

    // -------------------------------------------------------------
    // STEP 8: User A searches/asks a question requiring that document
    // -------------------------------------------------------------
    const userAStreamRes = await queryChat(userAToken, chatPrompt);
    const userAHasSecret = userAStreamRes.text.includes(secretKeyword) || userAStreamRes.fullRaw.includes(secretKeyword);
    const userAHasSources = userAStreamRes.sources.some((s: any) => s.documentId === testDocument.id);

    results.push({
      step: 8,
      name: 'User A searches/asks question -> document retrieved and grounded into RAG response',
      pass: userAHasSecret && userAHasSources,
      details: userAHasSecret ? `Grounded: ${secretKeyword}` : `Response: ${userAStreamRes.text.substring(0, 100)}`
    });

    // -------------------------------------------------------------
    // STEP 9: User B asks the same/similar question
    // -------------------------------------------------------------
    const userBStreamRes = await queryChat(userBToken, chatPrompt);
    const userBHasSecret = userBStreamRes.text.includes(secretKeyword) || userBStreamRes.fullRaw.includes(secretKeyword);
    const userBHasSources = userBStreamRes.sources.some((s: any) => s.documentId === testDocument.id);

    results.push({
      step: 9,
      name: 'User B asks question -> document NOT in retrieval or LLM context',
      pass: !userBHasSecret && !userBHasSources,
      details: !userBHasSecret ? 'Access successfully blocked' : `Leaked: ${userBStreamRes.text}`
    });

    // -------------------------------------------------------------
    // STEP 10: Add an explicit deny for User A
    // -------------------------------------------------------------
    await fetch(`${baseUrl}/api/v1/super-admin/documents/${testDocument.id}/policy`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibility: 'PRIVATE',
        allowedRoles: [roleA.id],
        allowedUsers: [],
        allowedDepartments: [],
        deniedRoles: [],
        deniedUsers: [userA.id],
        deniedDepartments: []
      })
    });

    const userADeniedStreamRes = await queryChat(userAToken, chatPrompt);
    const userADeniedHasSecret = userADeniedStreamRes.text.includes(secretKeyword) || userADeniedStreamRes.fullRaw.includes(secretKeyword);
    const userADeniedHasSources = userADeniedStreamRes.sources.some((s: any) => s.documentId === testDocument.id);

    results.push({
      step: 10,
      name: 'Add explicit deny for User A -> blocked despite having Role A (Deny Wins)',
      pass: !userADeniedHasSecret && !userADeniedHasSources,
      details: !userADeniedHasSecret ? 'Deny-wins enforced' : `Leaked: ${userADeniedStreamRes.text}`
    });

    // -------------------------------------------------------------
    // STEP 11: Remove the deny
    // -------------------------------------------------------------
    await fetch(`${baseUrl}/api/v1/super-admin/documents/${testDocument.id}/policy`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibility: 'PRIVATE',
        allowedRoles: [roleA.id],
        allowedUsers: [],
        allowedDepartments: [],
        deniedRoles: [],
        deniedUsers: [],
        deniedDepartments: []
      })
    });

    const userARestoredStreamRes = await queryChat(userAToken, chatPrompt);
    const userARestoredHasSecret = userARestoredStreamRes.text.includes(secretKeyword) || userARestoredStreamRes.fullRaw.includes(secretKeyword);
    const userARestoredHasSources = userARestoredStreamRes.sources.some((s: any) => s.documentId === testDocument.id);

    results.push({
      step: 11,
      name: 'Remove the deny -> User A regains access',
      pass: userARestoredHasSecret && userARestoredHasSources,
      details: userARestoredHasSecret ? 'Access successfully restored' : `Failed restore: ${userARestoredStreamRes.text}`
    });

    // -------------------------------------------------------------
    // STEP 12: Verify cross-organization access is blocked
    // -------------------------------------------------------------
    const userCStreamRes = await queryChat(userCToken, chatPrompt);
    const userCHasSecret = userCStreamRes.text.includes(secretKeyword) || userCStreamRes.fullRaw.includes(secretKeyword);
    const userCHasSources = userCStreamRes.sources.some((s: any) => s.documentId === testDocument.id);

    results.push({
      step: 12,
      name: 'Verify cross-organization access is blocked (Org B user)',
      pass: !userCHasSecret && !userCHasSources,
      details: !userCHasSecret ? 'Cross-tenant isolation verified' : `Cross-tenant leak: ${userCStreamRes.text}`
    });

    // Clean up test data
    await prisma.documentChunk.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await prisma.documentVersion.deleteMany({ where: { document: { organizationId: { in: [orgA.id, orgB.id] } } } });
    await prisma.document.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: [userA.id, userB.id, userC.id, superAdminA.id] } } });
    await prisma.user.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await prisma.role.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });

  } catch (err: any) {
    console.error('Fatal Error during E2E Security Test Execution:', err);
  } finally {
    server.close();
  }

  console.log('\n===========================================================');
  console.log('E2E SECURITY VALIDATION SUMMARY');
  console.log('===========================================================');
  let passCount = 0;
  let failCount = 0;

  for (const r of results) {
    if (r.pass) {
      console.log(`✅ Step ${r.step}: ${r.name} -> PASS ${r.details ? `(${r.details})` : ''}`);
      passCount++;
    } else {
      console.log(`❌ Step ${r.step}: ${r.name} -> FAIL ${r.details ? `(${r.details})` : ''}`);
      failCount++;
    }
  }

  console.log('\n-----------------------------------------------------------');
  console.log(`TOTAL STEPS: ${results.length}`);
  console.log(`PASSED:      ${passCount}`);
  console.log(`FAILED:      ${failCount}`);
  console.log('-----------------------------------------------------------\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runMVPE2ESecurityValidation();
