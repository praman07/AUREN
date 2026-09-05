import { ConnectorPolicyService } from '../domain/security/ConnectorPolicyService';
import { DocumentAccessPolicy, AccessSubject, AccessControlledDocument } from '../domain/security/DocumentAccessPolicy';
import { OrganizationRetriever } from '../ai/retrievers/OrganizationRetriever';
import { prisma } from '../infrastructure/database/prisma';

async function runAdversarialSecuritySuite() {
  console.log('================================================================');
  console.log('🛡️ AUREN CONNECTOR RBAC V1 — ADVERSARIAL SECURITY TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ✅ ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ❌ ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
      failures.push(testName);
    }
  }

  // Setup Test Organization and Connector Account in DB for deterministic cleanup
  const testOrgIdA = 'org_adv_test_tenant_a';
  const testOrgIdB = 'org_adv_test_tenant_b';
  let testAccountIdA = '';

  try {
    // Ensure test organization A exists
    await prisma.organization.upsert({
      where: { id: testOrgIdA },
      update: {},
      create: { id: testOrgIdA, name: 'Adversarial Test Org A' }
    });

    // Ensure test organization B exists
    await prisma.organization.upsert({
      where: { id: testOrgIdB },
      update: {},
      create: { id: testOrgIdB, name: 'Adversarial Test Org B' }
    });

    // Ensure connected account exists for Org A
    const accountA = await prisma.connectedAccount.upsert({
      where: { provider_accountId: { provider: 'GITHUB', accountId: 'acc_adv_test_gh_a' } },
      update: { organizationId: testOrgIdA },
      create: {
        organizationId: testOrgIdA,
        provider: 'GITHUB',
        accountId: 'acc_adv_test_gh_a',
        accessToken: 'enc_test_token',
        status: 'ACTIVE'
      }
    });
    testAccountIdA = accountA.id;

    // Clean any prior policies for this account
    await prisma.connectorPolicy.deleteMany({
      where: { connectedAccountId: testAccountIdA }
    });

    console.log(`[Setup] Seeded test tenants (${testOrgIdA}, ${testOrgIdB}) and ConnectedAccount (${testAccountIdA}).\n`);

    // ------------------------------------------------------------------
    // TEST 1: TENANT ISOLATION
    // ------------------------------------------------------------------
    const subjectOrgA: AccessSubject = {
      id: 'user_tenant_a',
      organizationId: testOrgIdA,
      roles: ['MEMBER'],
      departments: ['ENG'],
      isSuperAdmin: false
    };

    const result1 = await ConnectorPolicyService.evaluateAccess(subjectOrgA, {
      organizationId: testOrgIdB, // Cross-tenant target
      connectedAccountId: 'acc_org_b',
      resourcePattern: 'orgB/private-repo',
      externalId: 'github://orgB/private-repo/secret.md'
    });
    assert(result1 === 'DENY', 'TEST 1: Tenant Isolation (Org A user querying Org B content is DENIED)');

    // ------------------------------------------------------------------
    // TEST 2: EXPLICIT USER ALLOW
    // ------------------------------------------------------------------
    await prisma.connectorPolicy.create({
      data: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/backend-api',
        allowedUsers: ['user_arjun']
      }
    });

    const userArjun: AccessSubject = {
      id: 'user_arjun',
      organizationId: testOrgIdA,
      roles: ['MEMBER'],
      departments: ['ENG'],
      isSuperAdmin: false
    };

    const result2 = await ConnectorPolicyService.evaluateAccess(userArjun, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/backend-api'
    });
    assert(result2 === 'ALLOW', 'TEST 2: Explicit User Allow (user_arjun granted access)');

    // ------------------------------------------------------------------
    // TEST 3: EXPLICIT USER DENY
    // ------------------------------------------------------------------
    await prisma.connectorPolicy.create({
      data: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/payroll-service',
        deniedUsers: ['user_arjun']
      }
    });

    const result3 = await ConnectorPolicyService.evaluateAccess(userArjun, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/payroll-service'
    });
    assert(result3 === 'DENY', 'TEST 3: Explicit User Deny (user_arjun explicitly denied)');

    // ------------------------------------------------------------------
    // TEST 4: DENY OVERRIDES ALLOW
    // ------------------------------------------------------------------
    await prisma.connectorPolicy.create({
      data: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/confidential-repo',
        allowedUsers: ['user_arjun'],
        deniedUsers: ['user_arjun']
      }
    });

    const result4 = await ConnectorPolicyService.evaluateAccess(userArjun, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/confidential-repo'
    });
    assert(result4 === 'DENY', 'TEST 4: Deny Overrides Allow (user_arjun in both allowed and denied -> DENIED)');

    // ------------------------------------------------------------------
    // TEST 5: ROLE ALLOW
    // ------------------------------------------------------------------
    await prisma.connectorPolicy.create({
      data: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/docs-repo',
        allowedRoles: ['ENGINEERING']
      }
    });

    const engUser: AccessSubject = {
      id: 'user_eng_1',
      organizationId: testOrgIdA,
      roles: ['ENGINEERING'],
      departments: [],
      isSuperAdmin: false
    };

    const result5 = await ConnectorPolicyService.evaluateAccess(engUser, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/docs-repo'
    });
    assert(result5 === 'ALLOW', 'TEST 5: Role Allow (ENGINEERING role granted access)');

    // ------------------------------------------------------------------
    // TEST 6: ROLE DENY
    // ------------------------------------------------------------------
    await prisma.connectorPolicy.create({
      data: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/finance-repo',
        deniedRoles: ['FINANCE']
      }
    });

    const finUser: AccessSubject = {
      id: 'user_fin_1',
      organizationId: testOrgIdA,
      roles: ['FINANCE'],
      departments: [],
      isSuperAdmin: false
    };

    const result6 = await ConnectorPolicyService.evaluateAccess(finUser, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/finance-repo'
    });
    assert(result6 === 'DENY', 'TEST 6: Role Deny (FINANCE role explicitly denied)');

    // ------------------------------------------------------------------
    // TEST 7: DEPARTMENT ALLOW
    // ------------------------------------------------------------------
    await prisma.connectorPolicy.create({
      data: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/frontend-repo',
        allowedDepartments: ['dept_eng']
      }
    });

    const deptEngUser: AccessSubject = {
      id: 'user_dept_eng',
      organizationId: testOrgIdA,
      roles: ['MEMBER'],
      departments: ['dept_eng'],
      isSuperAdmin: false
    };

    const result7 = await ConnectorPolicyService.evaluateAccess(deptEngUser, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/frontend-repo'
    });
    assert(result7 === 'ALLOW', 'TEST 7: Department Allow (dept_eng department granted access)');

    // ------------------------------------------------------------------
    // TEST 8: DEPARTMENT DENY
    // ------------------------------------------------------------------
    await prisma.connectorPolicy.create({
      data: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/exec-repo',
        deniedDepartments: ['dept_sales']
      }
    });

    const salesUser: AccessSubject = {
      id: 'user_sales_1',
      organizationId: testOrgIdA,
      roles: ['MEMBER'],
      departments: ['dept_sales'],
      isSuperAdmin: false
    };

    const result8 = await ConnectorPolicyService.evaluateAccess(salesUser, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/exec-repo'
    });
    assert(result8 === 'DENY', 'TEST 8: Department Deny (dept_sales department explicitly denied)');

    // ------------------------------------------------------------------
    // TEST 9: DEFAULT DENY
    // ------------------------------------------------------------------
    await prisma.connectorPolicy.create({
      data: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/hr-secrets',
        allowedRoles: ['HR']
      }
    });

    const nonHrUser: AccessSubject = {
      id: 'user_eng_2',
      organizationId: testOrgIdA,
      roles: ['ENGINEERING'],
      departments: ['ENG'],
      isSuperAdmin: false
    };

    const result9 = await ConnectorPolicyService.evaluateAccess(nonHrUser, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/hr-secrets'
    });
    assert(result9 === 'DENY', 'TEST 9: Default Deny (Policy exists for repo, user has no grant -> DENIED)');

    // ------------------------------------------------------------------
    // TEST 10: NO-POLICY SEMANTICS
    // ------------------------------------------------------------------
    const result10 = await ConnectorPolicyService.evaluateAccess(nonHrUser, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/unconfigured-public-repo'
    });
    console.log(`[INFO] No-Policy Semantics Result: ${result10}`);
    assert(result10 === 'NEUTRAL', 'TEST 10: No-Policy Semantics (Returns NEUTRAL to defer to document/source ACLs)');

    // ------------------------------------------------------------------
    // TEST 11: SOURCE ACL DEFENSE
    // ------------------------------------------------------------------
    const connPolicyAllowDocAclDenyDoc: AccessControlledDocument = {
      id: 'doc_source_acl_test',
      organizationId: testOrgIdA,
      ownerId: 'owner_user_99',
      departmentId: null,
      visibility: 'PRIVATE',
      scope: 'PERSONAL',
      allowedUsers: ['owner_user_99']
    };

    const docAccessResult11 = DocumentAccessPolicy.canAccess(userArjun, connPolicyAllowDocAclDenyDoc);
    assert(!docAccessResult11, 'TEST 11: Source ACL Defense (ConnectorPolicy ALLOW + Source Private DENY -> DENIED)');

    // ------------------------------------------------------------------
    // TEST 12: DOCUMENT ACCESS DEFENSE
    // ------------------------------------------------------------------
    const docWithExplicitUserDeny: AccessControlledDocument = {
      id: 'doc_explicit_user_deny_test',
      organizationId: testOrgIdA,
      ownerId: 'owner_user_99',
      departmentId: null,
      visibility: 'ORG_WIDE',
      scope: 'ORGANIZATION',
      allowedRoles: ['ENGINEERING'],
      deniedUsers: ['user_arjun']
    };

    const docAccessResult12 = DocumentAccessPolicy.canAccess(userArjun, docWithExplicitUserDeny);
    assert(!docAccessResult12, 'TEST 12: Document Access Defense (Connector Policy ALLOW + Document Deny -> DENIED)');

    // ------------------------------------------------------------------
    // TEST 13: SUPERADMIN SCOPE
    // ------------------------------------------------------------------
    const superAdminOrgA: AccessSubject = {
      id: 'superadmin_a',
      organizationId: testOrgIdA,
      roles: ['ADMIN'],
      departments: [],
      isSuperAdmin: true
    };

    const crossTenantSuperAdminResult = await ConnectorPolicyService.evaluateAccess(superAdminOrgA, {
      organizationId: testOrgIdB,
      connectedAccountId: 'acc_org_b',
      resourcePattern: 'orgB/repo'
    });
    assert(crossTenantSuperAdminResult === 'DENY', 'TEST 13: SuperAdmin Scope (Cross-tenant SuperAdmin access is strictly DENIED)');

    // ------------------------------------------------------------------
    // TEST 14: RESOURCE ISOLATION
    // ------------------------------------------------------------------
    await prisma.connectorPolicy.create({
      data: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/isolated-repo-a',
        deniedUsers: ['user_arjun']
      }
    });

    const repoAResult = await ConnectorPolicyService.evaluateAccess(userArjun, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/isolated-repo-a'
    });
    const repoBResult = await ConnectorPolicyService.evaluateAccess(userArjun, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/isolated-repo-b'
    });

    assert(repoAResult === 'DENY' && repoBResult === 'NEUTRAL', 'TEST 14: Resource Isolation (Policy on repo-A has zero effect on repo-B)');

    // ------------------------------------------------------------------
    // TEST 15: POLICY UPDATE WITHOUT RE-EMBEDDING
    // ------------------------------------------------------------------
    const dynamicPolicy = await prisma.connectorPolicy.create({
      data: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/dynamic-update-repo',
        allowedUsers: ['user_arjun']
      }
    });

    const preUpdateResult = await ConnectorPolicyService.evaluateAccess(userArjun, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/dynamic-update-repo'
    });

    await prisma.connectorPolicy.update({
      where: { id: dynamicPolicy.id },
      data: {
        allowedUsers: [],
        deniedUsers: ['user_arjun']
      }
    });

    const postUpdateResult = await ConnectorPolicyService.evaluateAccess(userArjun, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/dynamic-update-repo'
    });

    assert(preUpdateResult === 'ALLOW' && postUpdateResult === 'DENY', 'TEST 15: Policy Update Without Re-Embedding (Pre: ALLOW -> Post: DENY immediately)');

    // ------------------------------------------------------------------
    // TEST 16: REVERSE POLICY UPDATE
    // ------------------------------------------------------------------
    await prisma.connectorPolicy.update({
      where: { id: dynamicPolicy.id },
      data: {
        deniedUsers: [],
        allowedUsers: ['user_arjun']
      }
    });

    const reverseUpdateResult = await ConnectorPolicyService.evaluateAccess(userArjun, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/dynamic-update-repo'
    });

    assert(reverseUpdateResult === 'ALLOW', 'TEST 16: Reverse Policy Update (Deny changed to Allow -> ALLOW immediately)');

    // ------------------------------------------------------------------
    // TEST 17 & 18: LLM CONTEXT SECURITY & MIXED RESULTS PIPELINE TEST
    // ------------------------------------------------------------------
    console.log('\n--- TEST GROUP 17 & 18: End-to-End Pipeline & LLM Context Security ---');

    await prisma.connectorPolicy.upsert({
      where: {
        connectedAccountId_resourcePattern: {
          connectedAccountId: testAccountIdA,
          resourcePattern: 'testorg/payroll-service'
        }
      },
      update: { deniedUsers: ['user_arjun'] },
      create: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/payroll-service',
        deniedUsers: ['user_arjun']
      }
    });

    const mockSearchResults = [
      {
        id: 'chunk_authorized_1',
        payload: {
          organizationId: testOrgIdA,
          sourceProvider: 'GITHUB',
          externalId: 'github://testorg/backend-api/readme.md',
          sourceUrl: 'https://github.com/testorg/backend-api/blob/main/readme.md',
          text: 'Public backend architecture overview for team.',
          visibility: 'ORG_WIDE'
        }
      },
      {
        id: 'chunk_unauthorized_secret_2',
        payload: {
          organizationId: testOrgIdA,
          sourceProvider: 'GITHUB',
          externalId: 'github://testorg/payroll-service/salaries.md',
          sourceUrl: 'https://github.com/testorg/payroll-service/blob/main/salaries.md',
          text: 'CONFIDENTIAL: CONNECTOR_RBAC_SECRET_93821 Executive Salary Data',
          visibility: 'ORG_WIDE'
        }
      }
    ];

    const activePolicies = await prisma.connectorPolicy.findMany({
      where: { organizationId: testOrgIdA }
    });

    const authorizedCandidates: any[] = [];
    const accessSubjectArjun: AccessSubject = {
      id: 'user_arjun',
      organizationId: testOrgIdA,
      roles: ['ENGINEERING'],
      departments: ['ENG'],
      isSuperAdmin: false
    };

    for (const res of mockSearchResults) {
      const payload: any = res.payload || {};
      const isConnectorDoc = payload.sourceProvider && payload.sourceProvider !== 'UPLOAD';
      if (isConnectorDoc) {
        const connPolicyResult = await ConnectorPolicyService.evaluateAccess(
          accessSubjectArjun,
          {
            organizationId: payload.organizationId || testOrgIdA,
            provider: payload.sourceProvider,
            sourceUrl: payload.sourceUrl,
            externalId: payload.externalId
          },
          activePolicies
        );

        if (connPolicyResult === 'DENY') {
          continue;
        }
      }

      const doc: AccessControlledDocument = {
        id: payload.documentId || String(res.id),
        organizationId: payload.organizationId || testOrgIdA,
        ownerId: payload.ownerId || '',
        departmentId: payload.departmentId || null,
        visibility: payload.visibility || 'ORG_WIDE',
        scope: payload.scope || 'ORGANIZATION'
      };

      if (DocumentAccessPolicy.canAccess(accessSubjectArjun, doc)) {
        authorizedCandidates.push(res);
      }
    }

    const authorizedTexts = authorizedCandidates.map((c) => c.payload.text).join(' ');
    const secretLeaked = authorizedTexts.includes('CONNECTOR_RBAC_SECRET_93821');

    assert(!secretLeaked, 'TEST 17: LLM Context Security (Secret CONNECTOR_RBAC_SECRET_93821 NOT present in context)');
    assert(
      authorizedCandidates.length === 1 && authorizedCandidates[0].id === 'chunk_authorized_1',
      'TEST 18: Mixed Results Filtering (Authorized repo chunk survived, unauthorized repo chunk stripped)'
    );

    // ------------------------------------------------------------------
    // TEST 19: MULTIPLE POLICIES
    // ------------------------------------------------------------------
    await prisma.connectorPolicy.create({
      data: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/multi-repo-1',
        allowedRoles: ['ROLE_ALPHA']
      }
    });
    await prisma.connectorPolicy.create({
      data: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/multi-repo-2',
        deniedRoles: ['ROLE_ALPHA']
      }
    });

    const alphaUser: AccessSubject = {
      id: 'user_alpha',
      organizationId: testOrgIdA,
      roles: ['ROLE_ALPHA'],
      departments: [],
      isSuperAdmin: false
    };

    const multiResult1 = await ConnectorPolicyService.evaluateAccess(alphaUser, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/multi-repo-1'
    });
    const multiResult2 = await ConnectorPolicyService.evaluateAccess(alphaUser, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/multi-repo-2'
    });

    assert(multiResult1 === 'ALLOW' && multiResult2 === 'DENY', 'TEST 19: Multiple Policies (Independent policy evaluation per resourcePattern)');

    // ------------------------------------------------------------------
    // TEST 20: ACL CHANGE IMMEDIACY
    // ------------------------------------------------------------------
    const immediacyPolicy = await prisma.connectorPolicy.create({
      data: {
        organizationId: testOrgIdA,
        connectedAccountId: testAccountIdA,
        resourcePattern: 'testorg/immediacy-repo',
        allowedRoles: ['ENGINEERING']
      }
    });

    const preImmediacyResult = await ConnectorPolicyService.evaluateAccess(engUser, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/immediacy-repo'
    });

    await prisma.connectorPolicy.update({
      where: { id: immediacyPolicy.id },
      data: { allowedRoles: ['FINANCE'] }
    });

    const postImmediacyResultEng = await ConnectorPolicyService.evaluateAccess(engUser, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/immediacy-repo'
    });

    const postImmediacyResultFin = await ConnectorPolicyService.evaluateAccess(finUser, {
      organizationId: testOrgIdA,
      connectedAccountId: testAccountIdA,
      resourcePattern: 'testorg/immediacy-repo'
    });

    assert(
      preImmediacyResult === 'ALLOW' && postImmediacyResultEng === 'DENY' && postImmediacyResultFin === 'ALLOW',
      'TEST 20: ACL Change Immediacy (Role update immediately denies Engineering & allows Finance)'
    );

  } catch (err: any) {
    console.error(`[TEST RUNNER ERROR]: ${err.stack || err.message}`);
    failed++;
  } finally {
    // Cleanup test policies and test accounts
    try {
      if (testAccountIdA) {
        await prisma.connectorPolicy.deleteMany({ where: { connectedAccountId: testAccountIdA } });
        await prisma.connectedAccount.deleteMany({ where: { id: testAccountIdA } });
      }
      await prisma.organization.deleteMany({
        where: { id: { in: [testOrgIdA, testOrgIdB] } }
      });
      console.log('\n[Cleanup] Test data removed cleanly from database.');
    } catch (e: any) {
      console.warn('[Cleanup Warning]:', e.message);
    }
  }

  console.log('\n================================================================');
  console.log(`📊 ADVERSARIAL TEST RESULTS SUMMARY:`);
  console.log(`   Total Tests: ${passed + failed}`);
  console.log(`   Passed:      ${passed}`);
  console.log(`   Failed:      ${failed}`);
  console.log(`   Status:      ${failed === 0 ? 'ALL PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('================================================================\n');

  if (failed > 0) {
    console.error('Failing tests:', failures);
    process.exit(1);
  }
}

runAdversarialSecuritySuite().catch((err) => {
  console.error('Fatal execution error in test suite:', err);
  process.exit(1);
});
