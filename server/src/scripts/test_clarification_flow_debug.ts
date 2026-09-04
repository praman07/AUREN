import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';
import { HumanMessage } from '@langchain/core/messages';

async function testClarificationFlow() {
  console.log('--- Testing Completely Ambiguous Query & Clarification ---');
  const graph = KnowledgeGraph.buildGraph({
    onEvent: (evt) => {
      if (evt.type !== 'token') {
        console.log(`[Event: ${evt.type}]`, evt.data ? JSON.stringify(evt.data) : '');
      }
    }
  });

  const query1 = "What happened after the latest earnings report?";
  console.log(`\nStep 1: User sends query with missing entity: "${query1}"`);
  
  const state1: any = await graph.invoke({
    userQuery: query1,
    authContext: { organizationId: 'test-org', userId: 'admin', roles: ['admin'] },
    mode: 'HYBRID',
    isWebAccessEnabled: true,
  });

  console.log('\n--- Result Step 1 ---');
  console.log('isAmbiguous:', state1.isAmbiguous);
  console.log('clarificationQuestion:', state1.clarificationQuestion);
  console.log('clarificationOptions:', state1.clarificationOptions);

  if (state1.isAmbiguous) {
    const selectedOption = "Apple Inc. (AAPL)";
    console.log(`\nStep 2: User selects clarification option: "${selectedOption}"`);
    const messages = [new HumanMessage(query1)];

    const state2: any = await graph.invoke({
      userQuery: selectedOption,
      messages: messages,
      authContext: { organizationId: 'test-org', userId: 'admin', roles: ['admin'] },
      mode: 'HYBRID',
      isWebAccessEnabled: true,
    });

    console.log('\n--- Result Step 2 ---');
    console.log('isAmbiguous:', state2.isAmbiguous);
    console.log('userQuery:', state2.userQuery);
    console.log('resolvedQuery:', state2.resolvedQuery);
    console.log('researchBrief:', state2.researchBrief);
    console.log('webResults count:', state2.webResults?.length);
  }
}

testClarificationFlow().catch(err => {
  console.error('Test error:', err);
});
