import { prisma } from '../src/infrastructure/database/prisma';
import { GoogleDriveConnector } from '../src/infrastructure/connectors/GoogleDriveConnector';
import { ConnectorRegistry } from '../src/application/connectors/ConnectorRegistry';
import { ConnectorService } from '../src/application/connectors/ConnectorService';
import { LocalStorageProvider } from '../src/infrastructure/storage/LocalStorageProvider';
import { DocumentProcessingOrchestrator } from '../src/application/services/DocumentProcessingOrchestrator';
import { PipelineStatusService } from '../src/application/services/PipelineStatusService';
import { AuditLogRepository } from '../src/infrastructure/repositories/AuditLogRepository';
import { UnitOfWork } from '../src/infrastructure/database/UnitOfWork';
import { QueueManager } from '../src/infrastructure/queue/QueueManager';
import { EncryptionService } from '../src/application/services/EncryptionService';
import * as crypto from 'crypto';

async function runE2ETest() {
  console.log('====================================================');
  console.log('STARTING GOOGLE DRIVE CONNECTOR AUTOMATED VERIFICATION');
  console.log('====================================================\n');

  try {
    // 1. Setup Test Tenant & User
    console.log('[1/6] Setting up isolated test tenant context...');
    const testOrgId = `org_test_gdrive_${Date.now()}`;
    const testUserId = `user_test_gdrive_${Date.now()}`;

    const org = await prisma.organization.create({
      data: {
        id: testOrgId,
        name: 'Google Drive Test Org'
      }
    });

    const user = await prisma.user.create({
      data: {
        id: testUserId,
        organizationId: testOrgId,
        email: `gdrive_tester_${Date.now()}@auren.ai`,
        firstName: 'Google',
        lastName: 'Tester'
      }
    });

    console.log(`✓ Created Test Org ${org.id} and User ${user.email}`);

    // 2. Register Connector in Registry
    console.log('\n[2/6] Registering GoogleDriveConnector in ConnectorRegistry...');
    const connector = new GoogleDriveConnector();
    ConnectorRegistry.getInstance().register(connector);
    console.log(`✓ Provider registered: ${connector.getProvider()}`);

    // 3. Create ConnectedAccount with Encrypted Tokens
    console.log('\n[3/6] Creating ConnectedAccount with encrypted credentials...');
    const dummyToken = 'mock_google_access_token_12345';
    const encrypted = EncryptionService.encrypt(dummyToken);

    const connectedAccount = await prisma.connectedAccount.create({
      data: {
        organizationId: testOrgId,
        userId: testUserId,
        provider: 'GOOGLE_DRIVE',
        accountId: `gdrive_mock_account_${Date.now()}`,
        accountEmail: user.email,
        accessToken: encrypted.encrypted,
        tokenIv: encrypted.iv,
        scopes: 'https://www.googleapis.com/auth/drive.readonly',
        status: 'ACTIVE'
      }
    });

    console.log(`✓ ConnectedAccount ${connectedAccount.id} created for ${connectedAccount.accountEmail}`);

    // 4. Mock Drive API fetchResources output to test pipeline end-to-end
    console.log('\n[4/6] Mocking Google Drive API responses and executing ConnectorService.syncConnectedAccount()...');
    
    // Override fetchResources on our registered instance for deterministic test
    const mockResources = [
      {
        externalId: `gdrive://doc_q3_financials_${Date.now()}`,
        title: 'Q3 Financial Overview.gdoc',
        content: '# Q3 Financial Overview\n\nRevenue grew by 24% YoY. Operating margin stands at 32%. Confidential internal document.',
        sourceUrl: 'https://docs.google.com/document/d/doc_q3_financials/edit',
        mimeType: 'text/plain',
        sizeBytes: 150,
        allowedUsers: [testUserId],
        allowedRoles: [],
        metadata: { isShared: false, originalMimeType: 'application/vnd.google-apps.document' }
      },
      {
        externalId: `gdrive://doc_engineering_roadmap_${Date.now()}`,
        title: 'Engineering Q4 Roadmap.gdoc',
        content: '# Engineering Q4 Roadmap\n\nKey Focus: AI RAG Pipeline & Multi-tenant Security Isolation.',
        sourceUrl: 'https://docs.google.com/document/d/doc_engineering_roadmap/edit',
        mimeType: 'text/plain',
        sizeBytes: 120,
        allowedUsers: [testUserId],
        allowedRoles: [],
        metadata: { isShared: true, originalMimeType: 'application/vnd.google-apps.document' }
      }
    ];

    connector.fetchResources = async () => mockResources as any;

    const auditLogRepo = new AuditLogRepository();
    const unitOfWork = new UnitOfWork();
    const statusService = new PipelineStatusService(auditLogRepo, unitOfWork);
    const queueManager = new QueueManager();
    const orchestrator = new DocumentProcessingOrchestrator(statusService, queueManager);
    const storageProvider = new LocalStorageProvider();

    const connectorService = new ConnectorService(orchestrator, storageProvider);

    const syncResult = await connectorService.syncConnectedAccount(connectedAccount.id, 'GOOGLE_DRIVE');

    console.log(`✓ Sync Result:`, JSON.stringify(syncResult, null, 2));

    if (syncResult.resourcesFetched !== 2 || syncResult.documentsUpserted !== 2 || syncResult.versionsCreated !== 2) {
      throw new Error('Sync result count mismatch!');
    }

    // Assert database state
    const docsInDb = await prisma.document.findMany({
      where: { connectedAccountId: connectedAccount.id, organizationId: testOrgId }
    });

    console.log(`✓ Verified ${docsInDb.length} Documents stored in database with sourceType = GOOGLE_DRIVE`);

    for (const doc of docsInDb) {
      if (doc.sourceType !== 'GOOGLE_DRIVE') throw new Error(`Invalid sourceType: ${doc.sourceType}`);
      if (doc.visibility !== 'PRIVATE' || !doc.allowedUsers.includes(testUserId)) {
        throw new Error(`Fail-closed permission violation for doc ${doc.id}`);
      }
    }

    // 5. Test Idempotency (Re-syncing identical content should create 0 new versions)
    console.log('\n[5/6] Testing Idempotency & Deduplication...');
    const secondSync = await connectorService.syncConnectedAccount(connectedAccount.id, 'GOOGLE_DRIVE');
    console.log(`✓ Second Sync Result (Idempotency): versionsCreated = ${secondSync.versionsCreated}`);
    if (secondSync.versionsCreated !== 0) {
      throw new Error('Deduplication failed: Duplicate version created for unchanged content!');
    }

    // 6. Test Incremental Deletion Purging
    console.log('\n[6/6] Testing Incremental Deletion Purging...');
    // Simulate removing 1 file from Google Drive (only 1 item returned)
    mockResources.pop();

    await connectorService.syncConnectedAccount(connectedAccount.id, 'GOOGLE_DRIVE');

    const activeDocs = await prisma.document.findMany({
      where: { connectedAccountId: connectedAccount.id, organizationId: testOrgId, deletedAt: null }
    });
    const deletedDocs = await prisma.document.findMany({
      where: { connectedAccountId: connectedAccount.id, organizationId: testOrgId, NOT: { deletedAt: null } }
    });

    console.log(`✓ Active documents remaining: ${activeDocs.length}`);
    console.log(`✓ Soft-deleted documents purged: ${deletedDocs.length}`);

    if (activeDocs.length !== 1 || deletedDocs.length !== 1) {
      throw new Error('Deletion purging failure: Removed document was not soft-deleted!');
    }

    // Cleanup test tenant
    console.log('\nCleaning up test artifacts...');
    await prisma.documentVersion.deleteMany({ where: { document: { organizationId: testOrgId } } });
    await prisma.document.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.connectedAccount.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.user.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.organization.delete({ where: { id: testOrgId } });

    console.log('\n====================================================');
    console.log('SUCCESS: GOOGLE DRIVE CONNECTOR VERIFICATION COMPLETED');
    console.log('====================================================');

  } catch (err: any) {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
  }
}

runE2ETest();
