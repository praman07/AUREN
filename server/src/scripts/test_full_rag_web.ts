import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';

async function testFullGraph() {
  const app = KnowledgeGraph.buildGraph({
    onEvent: (event) => {
      console.log(`[Event] ${event.type}:`, JSON.stringify(event.data || {}));
    }
  });

  const query = 'use web and tell me about who is pm of india';
  console.log('--- EXECUTING GRAPH FOR QUERY ---');
  console.log('Query:', query);

  const initialInput = {
    userQuery: query,
    authContext: { organizationId: 'org_test_123', userId: 'user_test_456', roles: ['user'] },
    mode: 'HYBRID' as const,
    isWebAccessEnabled: true,
    messages: []
  };

  const result = await app.invoke(initialInput);
  console.log('\n--- FINAL GRAPH ANSWER ---');
  console.log(result.finalAnswer);
  console.log('\n--- CITATIONS ---');
  console.log(result.citations);
}

testFullGraph();
