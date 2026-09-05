const { QdrantVectorStoreProvider } = require('./src/infrastructure/providers/adapters/vector/QdrantVectorStoreProvider');

async function checkQdrant() {
  const qdrant = new QdrantVectorStoreProvider();
  const collections = await qdrant.client.getCollections();
  console.log('=== QDRANT COLLECTIONS ===');
  console.log(JSON.stringify(collections, null, 2));

  for (const c of collections.collections) {
    const info = await qdrant.client.getCollection(c.name);
    console.log(`\nCollection: "${c.name}" | Points Count: ${info.points_count} | Vectors Count: ${info.vectors_count}`);
  }
}

checkQdrant().catch(console.error);
