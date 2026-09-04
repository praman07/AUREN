import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

async function testScenario() {
  console.log('=== TESTING SCENARIO 1: "What is the latest performance of Meta?" ===');
  const graph = KnowledgeGraph.buildGraph({
    onEvent: (evt) => {
      if (evt.type !== 'token') {
        console.log(`[Event: ${evt.type}]`, evt.data ? JSON.stringify(evt.data) : '');
      }
    }
  });

  const query1 = "What is the latest performance of Meta?";
  console.log(`\nStep 1: User sends query: "${query1}"`);
  
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
    const selectedOption = "Financial Performance";
    console.log(`\nStep 2: User selects clarification option: "${selectedOption}"`);
    const messages = [
      new HumanMessage(query1),
      new AIMessage(state1.clarificationQuestion || "Which aspect of Meta performance?")
    ];

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
    console.log('finalAnswer length:', state2.finalAnswer?.length);
  }

  console.log('\n=== TESTING SCENARIO 2: "What is the latest situation with Apple?" ===');
  const queryFresh = "What is the latest situation with Apple?";
  const stateFresh: any = await graph.invoke({
    userQuery: queryFresh,
    authContext: { organizationId: 'test-org', userId: 'admin', roles: ['admin'] },
    mode: 'HYBRID',
    isWebAccessEnabled: true,
  });

  console.log('\n--- Result Fresh Query ---');
  console.log('isAmbiguous:', stateFresh.isAmbiguous);
  console.log('userQuery:', stateFresh.userQuery);
  console.log('resolvedQuery:', stateFresh.resolvedQuery);
  console.log('webResults count:', stateFresh.webResults?.length);
  console.log('finalAnswer length:', stateFresh.finalAnswer?.length);
}

testScenario().catch(err => {
  console.error('CRITICAL SCENARIO ERROR:', err);
});
