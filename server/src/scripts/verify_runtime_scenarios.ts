import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';
import { DocumentAccessPolicy, AccessSubject, AccessControlledDocument } from '../domain/security/DocumentAccessPolicy';
import { PermissionFilter } from '../infrastructure/search/PermissionFilter';
import { DocumentScope } from '@prisma/client';
import { SearchRequest } from '../domain/retrieval/types';

interface TraceLog {
  nodeName: string;
  intentCategory?: string;
  fastRoutingTarget?: string;
  retrievedDocsCount?: number;
  internalDocsCount?: number;
  systemPromptSnippet?: string;
  finalAnswer?: string;
}

async function runRuntimeVerification() {
  console.log('================================================================');
  console.log('🔍 AUREN Focused Runtime Verification Suite');
  console.log('================================================================\n');

  let passedScenarios = 0;
  let totalScenarios = 6;

  function logSection(title: string) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`📌 SCENARIO: ${title}`);
    console.log(`----------------------------------------------------------------`);
  }

  function assertRuntime(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
    } else {
      console.error(`  ❌ [FAIL] ${description}`);
      throw new Error(`Runtime Verification Failed: ${description}`);
    }
  }

  // Common Test Accounts & Documents
  const arjunAuth = {
    userId: 'user_arjun_123',
    userName: 'Arjun Mehta',
    email: 'arjun.mehta@northstar.com',
    organizationId: 'org_northstar_456',
    roles: ['MEMBER'],
    departmentId: 'dept_engineering',
    isSuperAdmin: false
  };

  const pramanAuth = {
    userId: 'user_praman_789',
    userName: 'Praman Bhogal',
    email: 'praman.bhogal@northstar.com',
    organizationId: 'org_northstar_456',
    roles: ['MEMBER'],
    departmentId: 'dept_engineering',
    isSuperAdmin: false
  };

  const pramanSubjectUser: AccessSubject = {
    id: pramanAuth.userId,
    organizationId: pramanAuth.organizationId,
    roles: pramanAuth.roles,
    departments: [pramanAuth.departmentId],
    isSuperAdmin: false
  };

  const arjunSubjectUser: AccessSubject = {
    id: arjunAuth.userId,
    organizationId: arjunAuth.organizationId,
    roles: arjunAuth.roles,
    departments: [arjunAuth.departmentId],
    isSuperAdmin: false
  };

  // ------------------------------------------------------------------
  // 1. IDENTITY RUNTIME
  // ------------------------------------------------------------------
  logSection('1. IDENTITY RUNTIME ("Who am I?")');

  const graph = KnowledgeGraph.buildGraph();
  const trace1: TraceLog[] = [];

  const state1: any = await graph.invoke({
    userQuery: 'Who am I?',
    authContext: arjunAuth,
    messages: [],
    executionMode: 'FAST',
    useKnowledgeBase: false
  });

  assertRuntime(state1.intentCategory === 'IDENTITY', 'Intent classified as IDENTITY');
  assertRuntime(state1.fastRoutingTarget === 'none' || !state1.internalDocs || state1.internalDocs.length === 0, 'No organization document chunks retrieved/passed to synthesis');
  assertRuntime(state1.finalAnswer.includes('Arjun Mehta'), 'Final answer authoritatively contains logged-in user: Arjun Mehta');
  assertRuntime(!state1.finalAnswer.toLowerCase().includes('praman'), 'Final answer NEVER mentions Praman Bhogal');
  console.log(`  ℹ️ Final Answer Output:\n     "${state1.finalAnswer.replace(/\n/g, ' ')}"`);
  passedScenarios++;

  // ------------------------------------------------------------------
  // 2. PERSONAL DOCUMENT ISOLATION
  // ------------------------------------------------------------------
  logSection('2. PERSONAL DOCUMENT ISOLATION (Arjun accesses Praman\'s unshared personal document)');

  const pramanPersonalDoc: AccessControlledDocument = {
    id: 'doc_praman_resume',
    ownerId: pramanAuth.userId,
    organizationId: 'org_northstar_456',
    visibility: 'PRIVATE',
    scope: 'PERSONAL',
    departmentId: null,
    allowedUsers: [],
    allowedRoles: [],
    deniedUsers: []
  };

  // Check 1: DocumentAccessPolicy check for Arjun
  const arjunCanAccessPersonal = DocumentAccessPolicy.canAccess(arjunSubjectUser, pramanPersonalDoc);
  assertRuntime(!arjunCanAccessPersonal, 'DocumentAccessPolicy explicitly DENIES Arjun access to Praman\'s PERSONAL document');

  // Check 2: PermissionFilter vector query check for Arjun requesting PERSONAL scope
  const filterEngine = new PermissionFilter();
  const arjunPersonalFilter = filterEngine.buildVectorFilter({
    query: 'Praman projects',
    organizationId: arjunAuth.organizationId,
    userId: arjunAuth.userId,
    roleIds: arjunAuth.roles,
    departmentIds: [arjunAuth.departmentId],
    limit: 5,
    scope: DocumentScope.PERSONAL
  });

  const ownerOrAclCondition = arjunPersonalFilter.should?.some((cond: any) => 
    (cond.key === 'ownerId' && cond.match?.value === arjunAuth.userId) ||
    (cond.key === 'allowedUsers' && cond.match?.any?.includes(arjunAuth.userId))
  );
  assertRuntime(ownerOrAclCondition, 'PermissionFilter strictly limits PERSONAL retrieval to Arjun\'s ownerId or explicit allowedUsers');
  passedScenarios++;

  // ------------------------------------------------------------------
  // 3. PERSONAL OWNER ACCESS
  // ------------------------------------------------------------------
  logSection('3. PERSONAL OWNER ACCESS (Praman accesses his own personal document)');

  const pramanCanAccessPersonal = DocumentAccessPolicy.canAccess(pramanSubjectUser, pramanPersonalDoc);
  assertRuntime(pramanCanAccessPersonal, 'DocumentAccessPolicy GRANTS Praman access to his own PERSONAL document');

  const pramanPersonalFilter = filterEngine.buildVectorFilter({
    query: 'my resume projects',
    organizationId: pramanAuth.organizationId,
    userId: pramanAuth.userId,
    roleIds: pramanAuth.roles,
    departmentIds: [pramanAuth.departmentId],
    limit: 5,
    scope: DocumentScope.PERSONAL
  });

  const pramanOwnerCondition = pramanPersonalFilter.should?.some((cond: any) => cond.key === 'ownerId' && cond.match?.value === pramanAuth.userId);
  assertRuntime(pramanOwnerCondition, 'PermissionFilter generates ownerId match clause for Praman');
  passedScenarios++;

  // ------------------------------------------------------------------
  // 4. SHARED PERSONAL ACCESS & REVOCATION
  // ------------------------------------------------------------------
  logSection('4. SHARED PERSONAL ACCESS & REVOCATION (Grant Arjun ACL on Praman\'s doc, verify access, then revoke)');

  // 4a. Shared state
  const pramanPersonalDocSharedWithArjun: AccessControlledDocument = {
    ...pramanPersonalDoc,
    allowedUsers: [arjunAuth.userId]
  };

  const arjunCanAccessShared = DocumentAccessPolicy.canAccess(arjunSubjectUser, pramanPersonalDocSharedWithArjun);
  assertRuntime(arjunCanAccessShared, 'DocumentAccessPolicy GRANTS Arjun access to Praman\'s PERSONAL doc when explicitly in allowedUsers');

  const arjunSharedFilter = filterEngine.buildVectorFilter({
    query: 'Praman resume projects',
    organizationId: arjunAuth.organizationId,
    userId: arjunAuth.userId,
    roleIds: arjunAuth.roles,
    departmentIds: [arjunAuth.departmentId],
    limit: 5,
    scope: DocumentScope.PERSONAL
  });

  const aclMatchClause = arjunSharedFilter.should?.some((cond: any) => cond.key === 'allowedUsers' && cond.match?.any?.includes(arjunAuth.userId));
  assertRuntime(aclMatchClause, 'PermissionFilter generates allowedUsers clause matching Arjun\'s userId');

  // 4b. Revoked state
  const pramanPersonalDocRevoked: AccessControlledDocument = {
    ...pramanPersonalDocSharedWithArjun,
    allowedUsers: []
  };

  const arjunCanAccessRevoked = DocumentAccessPolicy.canAccess(arjunSubjectUser, pramanPersonalDocRevoked);
  assertRuntime(!arjunCanAccessRevoked, 'DocumentAccessPolicy DENIES Arjun access after ACL is revoked');
  passedScenarios++;

  // ------------------------------------------------------------------
  // 5. ORGANIZATION DOCUMENT
  // ------------------------------------------------------------------
  logSection('5. ORGANIZATION DOCUMENT (Arjun accesses ORG_WIDE policy doc)');

  const orgDoc: AccessControlledDocument = {
    id: 'doc_deployment_window',
    ownerId: pramanAuth.userId,
    organizationId: 'org_northstar_456',
    visibility: 'ORG_WIDE',
    scope: 'ORGANIZATION',
    departmentId: null,
    allowedUsers: [],
    allowedRoles: [],
    deniedUsers: []
  };

  const arjunCanAccessOrgDoc = DocumentAccessPolicy.canAccess(arjunSubjectUser, orgDoc);
  assertRuntime(arjunCanAccessOrgDoc, 'DocumentAccessPolicy GRANTS Arjun access to ORGANIZATION scope ORG_WIDE document');

  const arjunOrgFilter = filterEngine.buildVectorFilter({
    query: 'engineering deployment window',
    organizationId: arjunAuth.organizationId,
    userId: arjunAuth.userId,
    roleIds: arjunAuth.roles,
    departmentIds: [arjunAuth.departmentId],
    limit: 5,
    scope: DocumentScope.ORGANIZATION
  });

  const orgVisibilityClause = arjunOrgFilter.should?.some((cond: any) => cond.key === 'visibility' && cond.match?.value === 'ORG_WIDE');
  assertRuntime(orgVisibilityClause, 'PermissionFilter generates ORG_WIDE visibility clause for ORGANIZATION scope queries');
  passedScenarios++;

  // ------------------------------------------------------------------
  // 6. MIXED QUERY
  // ------------------------------------------------------------------
  logSection('6. MIXED QUERY ("Who am I and what does Praman\'s resume say about his projects?")');

  const state6: any = await graph.invoke({
    userQuery: 'Who am I and what does Praman\'s resume say about his projects?',
    authContext: arjunAuth,
    messages: [],
    executionMode: 'FAST',
    useKnowledgeBase: false
  });

  // Verify Identity Resolution
  assertRuntime(state6.finalAnswer.includes('Arjun Mehta'), 'Identity resolution authoritatively identifies logged-in user as Arjun Mehta');
  assertRuntime(!state6.finalAnswer.includes('You are Praman'), 'System NEVER claims the user is Praman Bhogal');
  console.log(`  ℹ️ Mixed Query Final Answer Output:\n     "${state6.finalAnswer.replace(/\n/g, ' ')}"`);
  passedScenarios++;

  console.log('\n================================================================');
  console.log(`🎉 RUNTIME VERIFICATION COMPLETE: ${passedScenarios}/${totalScenarios} SCENARIOS VERIFIED SUCCESSFULLY`);
  console.log('================================================================\n');
}

runRuntimeVerification().catch(err => {
  console.error('\n❌ Runtime Verification Failed:', err.message);
  process.exit(1);
});
