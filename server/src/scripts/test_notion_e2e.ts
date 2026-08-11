import { prisma } from '../infrastructure/database/prisma';
import { ConnectorRegistry } from '../application/connectors/ConnectorRegistry';
import { NotionConnector } from '../infrastructure/connectors/NotionConnector';
import { ConnectorService } from '../application/connectors/ConnectorService';
import { DocumentProcessingOrchestrator } from '../application/services/DocumentProcessingOrchestrator';
import { PipelineStatusService } from '../application/services/PipelineStatusService';
import { QueueManager } from '../infrastructure/queue/QueueManager';
import { LocalStorageProvider } from '../infrastructure/storage/LocalStorageProvider';

async function runNotionIntegrationTest() {
  console.log('--- STARTING NOTION E2E TEST ---');

  const registry = ConnectorRegistry.getInstance();
  registry.register(new NotionConnector());

  const queueManager: any = {
    ocrQueue: { add: async () => {} },
    chunkingQueue: { add: async () => {} },
    embeddingQueue: { add: async () => {} },
    qdrantIndexingQueue: { add: async () => {} },
    close: async () => {}
  };
  const statusService = new PipelineStatusService({} as any, {} as any);
  const orchestrator = new DocumentProcessingOrchestrator(statusService, queueManager as any);
  const storageProvider = new LocalStorageProvider();
  const connectorService = new ConnectorService(orchestrator, storageProvider);

  try {
    const org = await prisma.organization.findFirst({ where: { name: 'Test Org' } });
    if (!org) throw new Error('Run setup first');

    const account = await prisma.connectedAccount.create({
      data: {
        organizationId: org.id,
        provider: 'NOTION',
        accountId: 'mock-notion-account',
        accessToken: 'mock-access-token',
      }
    });

    console.log(`1. Fetching resources from Notion...`);
    await connectorService.syncConnectedAccount(account.id);
    console.log(`2. Sync triggered pipeline.`);

  } catch (err: any) {
    if (err.message && (err.message.includes('ECONNREFUSED') || err.message.includes("Can't reach database server"))) {
      console.log('⚠️ Implementation blocked because Database/Redis/Ollama is not accessible in this test environment.');
    } else {
      console.error('Notion E2E Test Error:', err);
    }
  } finally {
    await prisma.$disconnect();
    await queueManager.close();
  }
}

runNotionIntegrationTest();
