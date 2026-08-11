import { ConnectorRegistry } from '../application/connectors/ConnectorRegistry';
import { ConnectorProvider } from '@prisma/client';
import { GmailConnector } from '../infrastructure/connectors/GmailConnector';
import { ConnectorService } from '../application/connectors/ConnectorService';
import { LocalStorageProvider } from '../infrastructure/storage/LocalStorageProvider';

// Mock dependencies
const mockPrisma = {
  document: {
    findFirst: async () => null,
    create: async (data: any) => ({ id: 'doc_gmail_1', ...data.data }),
    update: async (data: any) => ({ ...data.data })
  },
  documentVersion: {
    create: async (data: any) => ({ id: 'ver_gmail_1', ...data.data })
  },
  connectedAccount: {
    findMany: async () => [
      {
        id: 'account_gmail_1',
        provider: ConnectorProvider.GMAIL,
        organizationId: 'org_1',
        accessToken: 'mock_gmail_token'
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

async function testGmailIngestion() {
  console.log('--- Testing Gmail Connector E2E ---');
  
  // 1. Setup Registry
  const registry = ConnectorRegistry.getInstance();
  
  // Create a mock Gmail connector that doesn't actually hit the API for the test
  class MockGmailConnector extends GmailConnector {
    getProvider(): ConnectorProvider { return ConnectorProvider.GMAIL; }
    
    async fetchResources(accessToken: string, organizationId: string) {
      console.log(`[MockGmailConnector] Fetching with token ${accessToken}`);
      return [
        {
          externalId: 'gmail://msg_456',
          title: 'Project Status Update',
          content: 'From: boss@ekos.app\nDate: 2026-08-10T10:00:00Z\nSubject: Project Status Update\n\nAll tasks are on track.',
          sourceUrl: 'https://mail.google.com/mail/u/0/#inbox/msg_456',
          mimeType: 'text/plain',
          sizeBytes: 100,
          metadata: { from: 'boss@ekos.app', date: '2026-08-10T10:00:00Z' }
        }
      ];
    }
  }
  
  registry.register(new MockGmailConnector());
  
  // 2. Setup Service
  const storageProvider = new LocalStorageProvider();
  const service = new ConnectorService(mockOrchestrator as any, storageProvider);
  
  // 3. Trigger Sync
  await service.syncConnectedAccount('account_gmail_1');
  
  console.log('--- Gmail Test Complete ---');
}

testGmailIngestion().catch(console.error);
