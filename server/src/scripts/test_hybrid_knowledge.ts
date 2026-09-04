import { RAGService } from '../application/services/RAGService';
import { IRetrievalEngine } from '../application/services/RetrievalEngine';
import { IWebSearchProvider, WebSearchResult } from '../infrastructure/search/WebSearchProvider';
import { prisma } from '../infrastructure/database/prisma';

class MockRetrievalEngine implements IRetrievalEngine {
  async search(params: any): Promise<any> {
    if (params.query.includes('leave policy')) {
      return {
        chunks: [
          {
            id: 'chunk-1',
            documentId: 'doc-1',
            text: 'Employee leave policy allows 20 annual days.',
            score: 0.95,
            metadata: { sectionTitle: 'HR Leave Policy' }
          }
        ]
      };
    }
    return { chunks: [] };
  }

  async buildPrompt(params: any): Promise<any> {
    if (params.query.includes('leave policy')) {
      return {
        fullPrompt: '=== INTERNAL DOCUMENTS ===\nHR Leave Policy: Employee leave policy allows 20 annual days.'
      };
    }
    return { fullPrompt: `The user asked: "${params.query}"` };
  }
}

class MockWebSearchProvider implements IWebSearchProvider {
  public searchCalled = false;
  public lastQuery = '';

  async search(query: string, maxResults: number = 3): Promise<WebSearchResult[]> {
    this.searchCalled = true;
    this.lastQuery = query;
    return [
      {
        title: 'Current Prime Minister of India',
        url: 'https://example.com/pm-india',
        snippet: 'Narendra Modi is the current Prime Minister of India.',
        source: 'example.com'
      }
    ];
  }
}

class MockAIGateway {
  async *streamChat(params: any): AsyncGenerator<string, void, unknown> {
    yield 'Response based on provided context.';
  }
}

async function runHybridKnowledgeE2ETests() {
  console.log('==================================================');
  console.log('RUNNING HYBRID WEB KNOWLEDGE END-TO-END VERIFICATION');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. Setup Test DB Context
    const org = await prisma.organization.create({
      data: {
        name: 'Test Hybrid Org',
        webAccessEnabled: true
      }
    });

    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        email: `test_hybrid_${Date.now()}@auren.com`,
        passwordHash: 'hashed_pw',
        firstName: 'Hybrid',
        lastName: 'User'
      }
    });

    const retrievalEngine = new MockRetrievalEngine();
    const mockGateway = new MockAIGateway() as any;

    // Test Case 1: Internal-Only Query (Should NOT trigger web search)
    console.log('[Test 1] Internal-Only Query ("What is our leave policy?")');
    const mockWebProvider1 = new MockWebSearchProvider();
    const ragService = new RAGService();

    let toolCalled1 = false;
    let sourcesReceived1: any[] = [];

    await ragService.streamChat(
      {
        message: 'What is our leave policy?',
        organizationId: org.id,
        userId: user.id,
        departmentIds: [],
        roleIds: [],
        mode: 'hybrid'
      },
      (event) => {
        if (event.type === 'tool_call') toolCalled1 = true;
        if (event.type === 'sources') sourcesReceived1 = event.data;
      }
    );

    if (!toolCalled1 && sourcesReceived1.length === 1 && sourcesReceived1[0].type === 'internal') {
      console.log('  ✅ PASSED: Internal query answered strictly using internal documents without triggering web search.');
      passed++;
    } else {
      console.log('  ❌ FAILED: Web tool improperly triggered or incorrect sources returned.');
      failed++;
    }

    // Test Case 2: External-Only Query in Hybrid Mode (Should trigger web search)
    const mockWebProvider2 = new MockWebSearchProvider();
    const ragService2 = new RAGService();

    let toolCalled2 = false;
    let sourcesReceived2: any[] = [];

    await ragService2.streamChat(
      {
        message: 'Who is the current PM of India?',
        organizationId: org.id,
        userId: user.id,
        departmentIds: [],
        roleIds: [],
        mode: 'hybrid'
      },
      (event) => {
        if (event.type === 'tool_call') toolCalled2 = true;
        if (event.type === 'sources') sourcesReceived2 = event.data;
      }
    );

    if (toolCalled2 && mockWebProvider2.searchCalled && sourcesReceived2.some(s => s.type === 'web')) {
      console.log('  ✅ PASSED: External query successfully invoked web_search tool and attached web citations.');
      passed++;
    } else {
      console.log('  ❌ FAILED: Web search tool not called for external query.');
      failed++;
    }

    // Test Case 3: Local Mode Enforced (Should NOT allow web search even for external queries)
    console.log('\n[Test 3] External Query in Local Mode (Web access disabled)');
    const mockWebProvider3 = new MockWebSearchProvider();
    const ragService3 = new RAGService();

    let toolCalled3 = false;

    await ragService3.streamChat(
      {
        message: 'Who is the current PM of India?',
        organizationId: org.id,
        userId: user.id,
        departmentIds: [],
        roleIds: [],
        mode: 'local'
      },
      (event) => {
        if (event.type === 'tool_call') toolCalled3 = true;
      }
    );

    if (!toolCalled3 && !mockWebProvider3.searchCalled) {
      console.log('  ✅ PASSED: Local Mode strictly enforced. Web search was not invoked.');
      passed++;
    } else {
      console.log('  ❌ FAILED: Web search invoked in Local mode!');
      failed++;
    }

    // Test Case 4: Zero-Trust Security Boundary (Web Search query must NOT expose internal document content)
    console.log('\n[Test 4] Zero-Trust Security Boundary Audit');
    if (mockWebProvider2.lastQuery === 'Who is the current PM of India?') {
      console.log('  ✅ PASSED: Web search query contains only user input. No internal tokens or document context exposed.');
      passed++;
    } else {
      console.log('  ❌ FAILED: Internal context leaked into web search query!');
      failed++;
    }

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.organization.delete({ where: { id: org.id } });

  } catch (err: any) {
    console.error('Test script crashed:', err);
    failed++;
  }

  console.log('\n==================================================');
  console.log(`HYBRID KNOWLEDGE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');
}

runHybridKnowledgeE2ETests().catch(console.error);
