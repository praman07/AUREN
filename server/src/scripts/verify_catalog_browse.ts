import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';

async function verifyCatalogBrowse() {
  console.log('================================================================');
  console.log('📚 AUREN Document Catalog / Browse Retrieval Verification');
  console.log('================================================================\n');

  const arjunAuth = {
    userId: 'user_arjun_123',
    userName: 'Arjun Mehta',
    email: 'arjun.mehta@northstar.com',
    organizationId: 'org_northstar_456',
    roles: ['MEMBER'],
    departmentId: 'dept_engineering',
    isSuperAdmin: false
  };

  const queries = [
    'show me everything about org knowledge',
    'show me all organization documents',
    'what documents are in our knowledge base?',
    'list our HR documents',
    'catalog of organization documents'
  ];

  for (const q of queries) {
    console.log(`\n📌 Testing query: "${q}"`);
    let executedNodes: string[] = [];

    const graph = KnowledgeGraph.buildGraph({
      onEvent: (event: any) => {
        if (event.type === 'node_execution') {
          executedNodes.push(event.data.nodeName);
        }
      }
    });

    const state: any = await graph.invoke({
      userQuery: q,
      authContext: arjunAuth,
      messages: [],
      executionMode: 'FAST',
      useKnowledgeBase: false
    });

    console.log(`  Intent Classified: ${state.intentCategory}`);
    console.log(`  Executed Nodes: ${executedNodes.join(' -> ')}`);
    console.log(`  Catalog Docs Count: ${state.catalogDocs?.length ?? 0}`);
    
    if (state.intentCategory !== 'DOC_CATALOG_BROWSE') {
      throw new Error(`Failed: Query "${q}" was classified as ${state.intentCategory} instead of DOC_CATALOG_BROWSE`);
    }
    if (executedNodes.includes('retrieveInternal')) {
      throw new Error(`Failed: Query "${q}" incorrectly executed retrieveInternal vector search`);
    }
    if (!executedNodes.includes('retrieveDocumentCatalog')) {
      throw new Error(`Failed: Query "${q}" did not execute retrieveDocumentCatalog node`);
    }
    console.log(`  ✅ [PASS] Direct catalog browse path verified for "${q}"`);
  }

  console.log('\n================================================================');
  console.log('🎉 CATALOG BROWSE RETRIEVAL VERIFIED SUCCESSFULLY');
  console.log('================================================================\n');
}

verifyCatalogBrowse().catch(err => {
  console.error('\n❌ Verification Failed:', err.message || err);
  process.exit(1);
});
