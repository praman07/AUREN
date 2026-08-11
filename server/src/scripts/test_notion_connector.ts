import { ConnectorRegistry } from '../application/connectors/ConnectorRegistry';
import { ConnectorProvider } from '@prisma/client';
import { NotionConnector } from '../infrastructure/connectors/NotionConnector';
import { ConnectorService } from '../application/connectors/ConnectorService';
import { LocalStorageProvider } from '../infrastructure/storage/LocalStorageProvider';

// Mock dependencies
const mockPrisma = {
  document: {
    findFirst: async () => null,
    create: async (data: any) => ({ id: 'doc_notion_1', ...data.data }),
    update: async (data: any) => ({ ...data.data })
  },
  documentVersion: {
    create: async (data: any) => ({ id: 'ver_notion_1', ...data.data })
  },
  connectedAccount: {
    findMany: async () => [
      {
        id: 'account_notion_1',
        provider: ConnectorProvider.NOTION,
        organizationId: 'org_1',
        accessToken: 'mock_notion_token'
      }
    ],
    update: async () => ({})
  }
};

const mockOrchestrator = {
  handleEvent: async (eventType: string, payload: any) => {
    console.log(`[MockOrchestrator] Emitted ${eventType}`, payload);
  }
};

async function testNotionIngestion() {
  console.log('--- Testing Notion Connector E2E ---');
  
  // 1. Setup Registry
  const registry = ConnectorRegistry.getInstance();
  
  // Create a mock Notion connector that doesn't actually hit the API for the test
  class MockNotionConnector extends NotionConnector {
    getProvider(): ConnectorProvider { return ConnectorProvider.NOTION; }
    
    async fetchResources(accessToken: string, organizationId: string) {
      console.log(`[MockNotionConnector] Fetching with token ${accessToken}`);
      return [
        {
          externalId: 'notion://page_123',
          title: 'Q3 Engineering Roadmap',
          content: 'This is the roadmap for Q3. We will build the Universal Knowledge Core.',
          sourceUrl: 'https://notion.so/page_123',
          mimeType: 'text/markdown',
          sizeBytes: 100,
          metadata: { lastEditedTime: new Date().toISOString() }
        }
      ];
    }
  }
  
  registry.register(new MockNotionConnector());
  
  // 2. Setup Service
  const storageProvider = new LocalStorageProvider();
  const service = new ConnectorService(mockOrchestrator as any, storageProvider);
  
  // 3. Trigger Sync
  await service.syncConnectedAccount('account_notion_1');
  
  console.log('--- Notion Test Complete ---');
}

testNotionIngestion().catch(console.error);
