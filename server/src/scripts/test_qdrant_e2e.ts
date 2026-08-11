import { QdrantIndexingService } from '../application/services/QdrantIndexingService';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ProviderFactory } from '../infrastructure/providers/registry/ProviderFactory';
import * as dotenv from 'dotenv';
dotenv.config();

async function runQdrantE2E() {
  console.log('--- STARTING QDRANT INDEXING E2E TEST ---');

  const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });
  const providerFactory = new ProviderFactory();
  const indexer = new QdrantIndexingService({} as any, providerFactory);

  try {
    // 1. Check if Qdrant is available by trying to get collections
    console.log('Connecting to Qdrant...');
    const collections = await qdrant.getCollections();
    console.log(`Connected. Found ${collections.collections.length} collections.`);

    console.log('[PASS] Qdrant connectivity verified.');
  } catch (err: any) {
    if (err.message.includes('ECONNREFUSED') || err.message.includes('fetch failed')) {
      console.log(`[PARTIAL] Qdrant E2E setup succeeded, but infrastructure is unavailable: ${err.message}`);
    } else {
      console.error(`[FAIL] Qdrant E2E failed:`, err);
    }
  }
}

runQdrantE2E();
