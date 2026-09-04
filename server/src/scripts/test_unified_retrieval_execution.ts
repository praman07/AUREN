import { OrganizationRetriever } from '../ai/retrievers/OrganizationRetriever';
import { PermissionFilter } from '../infrastructure/search/PermissionFilter';
import { DocumentAccessPolicy } from '../domain/security/DocumentAccessPolicy';

async function verifyUnifiedRetrieval() {
  console.log('================================================================');
  console.log('🧪 AUREN Unified Retrieval Runtime Verification');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ✅ ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ❌ ${testName}`);
      failed++;
    }
  }

  const mockUserArjun = {
    organizationId: 'org_northstar_456',
    userId: 'user_arjun_123',
    roles: ['MEMBER'],
    departmentId: 'dept_engineering',
    isSuperAdmin: false
  };

  // ------------------------------------------------------------------
  // TEST 1: Scope Detection in OrganizationRetriever
  // ------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Automatic Scope Detection ---');

  const defaultRetriever = new OrganizationRetriever({ authContext: mockUserArjun });

  const queryPersonal = 'What projects are in my personal uploaded resume?';
  const queryOrg = 'What is our organization docs deployment policy?';
  const queryUnified = 'What are the architectural guidelines for microservices?';

  const scopePersonal = (defaultRetriever as any).detectQueryScope(queryPersonal);
  assert(scopePersonal === 'PERSONAL', `Query "${queryPersonal}" detects PERSONAL scope`);

  const scopeOrg = (defaultRetriever as any).detectQueryScope(queryOrg);
  assert(scopeOrg === 'ORGANIZATION', `Query "${queryOrg}" detects ORGANIZATION scope`);

  const scopeUnified = (defaultRetriever as any).detectQueryScope(queryUnified);
  assert(scopeUnified === undefined, `Query "${queryUnified}" defaults to UNIFIED scope (undefined)`);

  // ------------------------------------------------------------------
  // TEST 2: Filter Construction in Unified vs Explicit Scope
  // ------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Qdrant Vector Filter Structure ---');

  const filterEngine = new PermissionFilter();

  // Unified Filter
  const unifiedFilter = filterEngine.buildVectorFilter({
    query: queryUnified,
    organizationId: mockUserArjun.organizationId,
    userId: mockUserArjun.userId,
    roleIds: mockUserArjun.roles,
    departmentIds: [mockUserArjun.departmentId],
    isSuperAdmin: false,
    limit: 10
  });

  assert(
    !unifiedFilter.must.some((c: any) => c.key === 'scope'),
    'Unified filter does NOT enforce scope match in must conditions'
  );

  const orgWideGrant = unifiedFilter.should.find((c: any) => c.must && c.must.some((m: any) => m.key === 'visibility' && m.match.value === 'ORG_WIDE'));
  assert(
    orgWideGrant && orgWideGrant.must_not && orgWideGrant.must_not.some((mn: any) => mn.key === 'scope' && mn.match.value === 'PERSONAL'),
    'Unified filter ORG_WIDE clause excludes scope=PERSONAL from general grants'
  );

  // Explicit Personal Filter
  const personalFilter = filterEngine.buildVectorFilter({
    query: queryPersonal,
    organizationId: mockUserArjun.organizationId,
    userId: mockUserArjun.userId,
    roleIds: mockUserArjun.roles,
    departmentIds: [mockUserArjun.departmentId],
    scope: 'PERSONAL',
    limit: 10
  });

  const scopeMust = personalFilter.must.find((c: any) => c.key === 'scope');
  assert(
    scopeMust && scopeMust.match.value === 'PERSONAL',
    'Personal filter enforces scope=PERSONAL in must conditions'
  );

  // ------------------------------------------------------------------
  // TEST 3: Defense-in-Depth Post-Filtering Logic
  // ------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Defense-in-Depth Policy Post-Filtering ---');

  const mockSubject = {
    id: 'user_arjun_123',
    organizationId: 'org_northstar_456',
    roles: ['MEMBER'],
    departments: ['dept_engineering'],
    isSuperAdmin: false
  };

  const mockPayloads = [
    {
      documentId: 'doc_arjun_resume',
      organizationId: 'org_northstar_456',
      ownerId: 'user_arjun_123',
      visibility: 'PRIVATE',
      scope: 'PERSONAL'
    },
    {
      documentId: 'doc_praman_resume',
      organizationId: 'org_northstar_456',
      ownerId: 'user_praman_789',
      visibility: 'PRIVATE',
      scope: 'PERSONAL'
    },
    {
      documentId: 'doc_engineering_policy',
      organizationId: 'org_northstar_456',
      ownerId: 'user_cto_000',
      visibility: 'ORG_WIDE',
      scope: 'ORGANIZATION'
    }
  ];

  const authorizedPayloads = mockPayloads.filter((p: any) => {
    return DocumentAccessPolicy.canAccess(mockSubject, p);
  });

  assert(
    authorizedPayloads.length === 2,
    'Post-policy authorization allows Arjun personal doc + Org doc, denying Praman personal doc'
  );

  assert(
    authorizedPayloads.some(p => p.documentId === 'doc_arjun_resume'),
    'Arjun personal resume is authorized'
  );

  assert(
    authorizedPayloads.some(p => p.documentId === 'doc_engineering_policy'),
    'Engineering policy org doc is authorized'
  );

  assert(
    !authorizedPayloads.some(p => p.documentId === 'doc_praman_resume'),
    'Praman personal resume is DENIED for Arjun'
  );

  console.log(`\n================================================================`);
  console.log(`Verification Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

verifyUnifiedRetrieval().catch(err => {
  console.error('Verification script failed:', err);
  process.exit(1);
});
