import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';
import { DocumentAccessPolicy } from '../domain/security/DocumentAccessPolicy';
import { PermissionFilter } from '../infrastructure/search/PermissionFilter';
import { DocumentScope } from '@prisma/client';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 AUREN Identity Resolution & Knowledge Scope Isolation Tests');
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

  // ------------------------------------------------------------------
  // TEST 1: First-Class IDENTITY Intent & Authoritative Session Response
  // ------------------------------------------------------------------
  console.log('--- TEST GROUP 1: First-Class IDENTITY Intent Routing ---');

  const mockAuthContext = {
    userId: 'user_arjun_123',
    userName: 'Arjun Mehta',
    email: 'arjun.mehta@northstar.com',
    organizationId: 'org_northstar_456',
    roles: ['MEMBER'],
    departmentId: 'dept_engineering',
    isSuperAdmin: false
  };

  const graph = KnowledgeGraph.buildGraph();

  const identityQueries = [
    'Who am I?',
    'who am i',
    'what is my name',
    'who am I logged in as',
    'tell me about myself',
    'what account am i using'
  ];

  for (const query of identityQueries) {
    try {
      const res: any = await graph.invoke({
        userQuery: query,
        authContext: mockAuthContext,
        messages: [],
        executionMode: 'FAST',
        useKnowledgeBase: false
      });

      const containsArjun = res.finalAnswer.includes('Arjun Mehta');
      const containsPraman = res.finalAnswer.includes('Praman');

      assert(containsArjun && !containsPraman, `Query "${query}" resolves to Arjun Mehta and NOT Praman`);
      assert(res.intentCategory === 'IDENTITY', `Query "${query}" intent correctly classified as IDENTITY`);
    } catch (err: any) {
      assert(false, `Query "${query}" threw error: ${err.message}`);
    }
  }

  // ------------------------------------------------------------------
  // TEST 2: DocumentAccessPolicy Scope Isolation
  // ------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: DocumentAccessPolicy Scope Isolation ---');

  const ownerUser = {
    id: 'user_arjun_123',
    organizationId: 'org_northstar_456',
    roles: ['MEMBER'],
    departments: ['dept_engineering'],
    isSuperAdmin: false
  };

  const otherUserSameOrg = {
    id: 'user_bob_999',
    organizationId: 'org_northstar_456',
    roles: ['MEMBER'],
    departments: ['dept_engineering'],
    isSuperAdmin: false
  };

  const personalDoc = {
    id: 'doc_resume_1',
    ownerId: 'user_arjun_123',
    organizationId: 'org_northstar_456',
    visibility: 'PRIVATE' as const,
    scope: DocumentScope.PERSONAL,
    allowedUsers: [],
    allowedRoles: [],
    departmentId: null
  };

  const personalDocSharedWithBob = {
    ...personalDoc,
    id: 'doc_resume_2',
    allowedUsers: ['user_bob_999']
  };

  const orgDoc = {
    id: 'doc_company_policy_1',
    ownerId: 'user_arjun_123',
    organizationId: 'org_northstar_456',
    visibility: 'ORG_WIDE' as const,
    scope: DocumentScope.ORGANIZATION,
    allowedUsers: [],
    allowedRoles: [],
    departmentId: null
  };

  assert(
    DocumentAccessPolicy.canAccess(ownerUser, personalDoc as any),
    'Owner can access their own PERSONAL document'
  );

  assert(
    !DocumentAccessPolicy.canAccess(otherUserSameOrg, personalDoc as any),
    'Other user in same org CANNOT access PERSONAL document without ACL'
  );

  assert(
    DocumentAccessPolicy.canAccess(otherUserSameOrg, personalDocSharedWithBob as any),
    'Other user CAN access PERSONAL document when granted explicit ACL in allowedUsers'
  );

  assert(
    DocumentAccessPolicy.canAccess(otherUserSameOrg, orgDoc as any),
    'Other user in same org CAN access ORGANIZATION ORG_WIDE document'
  );

  // ------------------------------------------------------------------
  // TEST 3: PermissionFilter Query Scope Filter Generation
  // ------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: PermissionFilter Scope Filter Generation ---');

  const filterEngine = new PermissionFilter();
  const qdrantFilter = filterEngine.buildVectorFilter({
    query: 'test',
    organizationId: 'org_northstar_456',
    userId: 'user_bob_999',
    roleIds: ['MEMBER'],
    departmentIds: [],
    limit: 5,
    scope: DocumentScope.PERSONAL
  });

  assert(
    qdrantFilter.must !== undefined && qdrantFilter.must.length >= 2,
    'Vector filter for PERSONAL scope contains required scope must clauses'
  );

  const scopeClause = qdrantFilter.must.find((c: any) => c.key === 'scope');
  assert(
    scopeClause && scopeClause.match.value === 'PERSONAL',
    'Vector filter explicitly restricts to scope=PERSONAL'
  );

  const shouldClauses = qdrantFilter.should || [];
  const ownerClause = shouldClauses.find((c: any) => c.key === 'ownerId');
  assert(
    ownerClause && ownerClause.match.value === 'user_bob_999',
    'Vector filter restricts PERSONAL documents to ownerId=user_bob_999 or ACL shares'
  );

  // ------------------------------------------------------------------
  // TEST 4: Unified Default Mode PermissionFilter Generation
  // ------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Unified Default Mode Filter Generation ---');

  const unifiedFilter = filterEngine.buildVectorFilter({
    query: 'test',
    organizationId: 'org_northstar_456',
    userId: 'user_bob_999',
    roleIds: ['MEMBER'],
    departmentIds: [],
    limit: 5
    // scope is undefined -> UNIFIED SEARCH across personal + organization documents!
  });

  const scopeInMust = unifiedFilter.must.find((c: any) => c.key === 'scope');
  assert(
    scopeInMust === undefined,
    'Unified Mode does NOT restrict must conditions to a single scope'
  );

  const orgWideClause = (unifiedFilter.should || []).find((c: any) => c.must && c.must.some((m: any) => m.key === 'visibility' && m.match.value === 'ORG_WIDE'));
  assert(
    orgWideClause && orgWideClause.must_not && orgWideClause.must_not.some((mn: any) => mn.key === 'scope' && mn.match.value === 'PERSONAL'),
    'Unified Mode ORG_WIDE clause explicitly excludes PERSONAL documents via must_not'
  );

  const unifiedOwnerClause = (unifiedFilter.should || []).find((c: any) => c.key === 'ownerId');
  assert(
    unifiedOwnerClause && unifiedOwnerClause.match.value === 'user_bob_999',
    'Unified Mode allows user-owned documents across all scopes'
  );

  console.log(`\n================================================================`);
  console.log(`Test Execution Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
