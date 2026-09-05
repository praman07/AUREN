import { QdrantClient } from '@qdrant/js-client-rest';

async function main() {
  const client = new QdrantClient({ url: 'http://localhost:6333', checkCompatibility: false });
  const collections = await client.getCollections();
  console.log('=== QDRANT COLLECTIONS ===');
  for (const c of collections.collections) {
    const info = await client.getCollection(c.name);
    console.log(`- ${c.name} | Points: ${info.points_count} | Dim: ${(info.config?.params?.vectors as any)?.size}`);
  }
}

main().catch(console.error);
