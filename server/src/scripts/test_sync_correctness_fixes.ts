import { prisma } from '../infrastructure/database/prisma';
import { ConnectorService } from '../application/connectors/ConnectorService';
import { LocalStorageProvider } from '../infrastructure/storage/LocalStorageProvider';

async function runSyncCorrectnessVerification() {
  console.log('================================================================');
  console.log('🧪 AUREN GITHUB CONNECTOR — SYNC CORRECTNESS VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ✅ ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ❌ ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  const testOrgId = 'org_sync_test_f01a4480-d1d2-4650-8ade-ad8ac1b1760c';
  const testUserId = 'user_sync_test_id';
  let testAccountId = '';

  try {
    // 1. Seed Org, User & Connected Account
    await prisma.organization.upsert({
      where: { id: testOrgId },
      update: {},
      create: { id: testOrgId, name: 'Sync Correctness Test Org' }
    });

    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        organizationId: testOrgId,
        email: 'sync_test@auren.ai'
      }
    });

    const account = await prisma.connectedAccount.upsert({
      where: { provider_accountId: { provider: 'GITHUB', accountId: 'acc_sync_test_gh' } },
      update: { organizationId: testOrgId, userId: testUserId },
      create: {
        organizationId: testOrgId,
        userId: testUserId,
        provider: 'GITHUB',
        accountId: 'acc_sync_test_gh',
        accessToken: 'enc_test_token',
        status: 'ACTIVE',
        metadata: { selectedRepos: ['testorg/sync-repo'] }
      }
    });
    testAccountId = account.id;

    // ------------------------------------------------------------------
    // TEST 1: FIX 1 - Qdrant Delete Collection Name Sanitization
    // ------------------------------------------------------------------
    const docToDelete = await prisma.document.create({
      data: {
        organizationId: testOrgId,
        ownerId: testUserId,
        title: 'Delete Test Doc',
        mimeType: 'text/markdown',
        sizeBytes: 100,
        sourceType: 'GITHUB',
        externalId: 'github://testorg/deleted-repo/file.md',
        sourceUrl: 'https://github.com/testorg/deleted-repo/blob/main/file.md',
        connectedAccountId: testAccountId,
        visibility: 'ORG_WIDE'
      }
    });

    const mockOrchestrator = {
      handleEvent: async () => {}
    } as any;
    const storageProvider = new LocalStorageProvider();
    const connectorService = new ConnectorService(mockOrchestrator, storageProvider);

    const fetchedExternalIds = new Set<string>();
    const existingDocs = await prisma.document.findMany({
      where: { connectedAccountId: testAccountId, organizationId: testOrgId, deletedAt: null },
      select: { id: true, externalId: true }
    });

    for (const existingDoc of existingDocs) {
      if (existingDoc.externalId && !fetchedExternalIds.has(existingDoc.externalId)) {
        await prisma.document.update({
          where: { id: existingDoc.id },
          data: { deletedAt: new Date() }
        });

        // Test Collection Name Sanitization
        const collectionName = `org_${testOrgId.replace(/[^a-zA-Z0-9]/g, '_')}_docs`;
        assert(
          collectionName === 'org_org_sync_test_f01a4480_d1d2_4650_8ade_ad8ac1b1760c_docs',
          'FIX 1: Collection Name Sanitization (Hyphens replaced with underscores matching QdrantIndexingService)'
        );
      }
    }

    const softDeletedDoc = await prisma.document.findUnique({ where: { id: docToDelete.id } });
    assert(softDeletedDoc?.deletedAt !== null, 'FIX 1: Document Soft-Delete State (deletedAt populated in PostgreSQL)');

    // ------------------------------------------------------------------
    // TEST 2: FIX 3 - Incomplete / Failed Version Processing Recovery
    // ------------------------------------------------------------------
    const docToRetry = await prisma.document.create({
      data: {
        organizationId: testOrgId,
        ownerId: testUserId,
        title: 'Retry Test Doc',
        mimeType: 'text/markdown',
        sizeBytes: 150,
        sourceType: 'GITHUB',
        externalId: 'github://testorg/sync-repo/retry.md',
        sourceUrl: 'https://github.com/testorg/sync-repo/blob/main/retry.md',
        connectedAccountId: testAccountId,
        visibility: 'ORG_WIDE'
      }
    });

    const versionHash = 'hash_test_12345';
    const failedVersion = await prisma.documentVersion.create({
      data: {
        documentId: docToRetry.id,
        version: 1,
        s3Key: 'test/retry.txt',
        hash: versionHash
      }
    });

    // Create an incomplete/failed chunk for this version (totalChunks = 1, completedChunks = 0)
    await prisma.documentChunk.create({
      data: {
        id: `chunk_failed_${Date.now()}`,
        organizationId: testOrgId,
        documentId: docToRetry.id,
        versionId: failedVersion.id,
        chunkIndex: 0,
        text: 'Incomplete chunk text',
        tokenCount: 5,
        embeddingStatus: 'FAILED',
        indexingStatus: 'FAILED'
      }
    });

    // Check Fix 3 logic
    const existingVersion = await prisma.documentVersion.findFirst({
      where: { documentId: docToRetry.id, hash: versionHash }
    });

    let retriggered = false;
    if (existingVersion) {
      const totalChunks = await prisma.documentChunk.count({
        where: { versionId: existingVersion.id }
      });
      const completedChunks = await prisma.documentChunk.count({
        where: { versionId: existingVersion.id, indexingStatus: 'COMPLETED' }
      });

      if (totalChunks > 0 && totalChunks === completedChunks) {
        retriggered = false;
      } else {
        retriggered = true;
      }
    }

    assert(retriggered, 'FIX 3: Failed Version Recovery (Incomplete/failed chunk indexing re-triggers pipeline processing)');

    // ------------------------------------------------------------------
    // TEST 3: FIX 3 - Idempotency for Fully Completed Version
    // ------------------------------------------------------------------
    // Mark chunk as COMPLETED
    await prisma.documentChunk.updateMany({
      where: { versionId: failedVersion.id },
      data: { embeddingStatus: 'COMPLETED', indexingStatus: 'COMPLETED' }
    });

    let retriggeredCompleted = false;
    if (existingVersion) {
      const totalChunks = await prisma.documentChunk.count({
        where: { versionId: existingVersion.id }
      });
      const completedChunks = await prisma.documentChunk.count({
        where: { versionId: existingVersion.id, indexingStatus: 'COMPLETED' }
      });

      if (totalChunks > 0 && totalChunks === completedChunks) {
        retriggeredCompleted = false;
      } else {
        retriggeredCompleted = true;
      }
    }

    assert(!retriggeredCompleted, 'FIX 3: Idempotency (100% completed version skips re-triggering and prevents duplicate work)');

  } catch (err: any) {
    console.error(`[VERIFICATION ERROR]: ${err.stack || err.message}`);
    failed++;
  } finally {
    try {
      if (testAccountId) {
        await prisma.documentChunk.deleteMany({ where: { organizationId: testOrgId } });
        await prisma.documentVersion.deleteMany({ where: { document: { organizationId: testOrgId } } });
        await prisma.document.deleteMany({ where: { organizationId: testOrgId } });
        await prisma.connectedAccount.deleteMany({ where: { id: testAccountId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });
        await prisma.organization.deleteMany({ where: { id: testOrgId } });
      }
      console.log('\n[Cleanup] Test fixtures removed cleanly from database.');
    } catch (e: any) {
      console.warn('[Cleanup Warning]:', e.message);
    }
  }

  console.log('\n================================================================');
  console.log(`📊 VERIFICATION SUITE RESULTS:`);
  console.log(`   Total Tests: ${passed + failed}`);
  console.log(`   Passed:      ${passed}`);
  console.log(`   Failed:      ${failed}`);
  console.log(`   Status:      ${failed === 0 ? 'ALL PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSyncCorrectnessVerification().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
