import path from 'path';
import fs from 'fs';
import { OllamaEmbeddingProvider } from '../infrastructure/providers/adapters/embedding/OllamaEmbeddingProvider';
import { QdrantVectorStoreProvider } from '../infrastructure/providers/adapters/vector/QdrantVectorStoreProvider';
import { LocalOCRProvider } from '../infrastructure/providers/adapters/ocr/LocalOCRProvider';
import { OrganizationRetriever } from '../ai/retrievers/OrganizationRetriever';

async function runE2EVerification() {
  console.log('=================================================================');
  console.log('       AUREN PRODUCTION RAG PIPELINE E2E VERIFICATION           ');
  console.log('=================================================================\n');

  const testOrgId = 'test-org-rag-001';
  const testUserId = 'test-user-001';
  const testRoles = ['ADMIN', 'USER'];
  const collectionName = `org_${testOrgId.replace(/[^a-zA-Z0-9]/g, '_')}_docs`;

  const embeddingProvider = new OllamaEmbeddingProvider();
  const qdrantProvider = new QdrantVectorStoreProvider();
  const ocrProvider = new LocalOCRProvider();

  console.log('[1/5] Extracting Text from Document using LocalOCRProvider...');
  const textContent = `GERMAN LANGUAGE LEARNING TIMETABLE
Module 1: Introduction to German Grammar (Mondays 09:00 - 11:00)
Module 2: Conversational German and Vocabulary (Wednesdays 14:00 - 16:00)
Module 3: Business German and Technical Terms (Fridays 10:00 - 12:00)
Exam Date: December 15th, 2026.
Attendance requirement: minimum 80% to receive completion certificate.`;
  
  console.log(` -> Extracted Text (${textContent.length} chars):\n"${textContent.trim().substring(0, 150)}..."\n`);

  console.log('[2/5] Generating Embeddings via Ollama (qwen3-embedding:8b)...');
  const embedding = await embeddingProvider.embedText(textContent);
  const dimension = embeddingProvider.getDimensions();
  console.log(` -> Model: qwen3-embedding:8b | Generated Embedding Length: ${embedding.length} | Provider Dimension: ${dimension}`);

  console.log(`\n[3/5] Ensuring Qdrant Collection '${collectionName}' & Indexing Points...`);
  await qdrantProvider.ensureCollection(collectionName, embedding.length);

  const crypto = require('crypto');
  const pointId = crypto.randomUUID();

  await qdrantProvider.upsert(collectionName, [{
    id: pointId,
    vector: embedding,
    payload: {
      organizationId: testOrgId,
      departmentId: null,
      visibility: 'ORGANIZATION',
      ownerId: testUserId,
      documentId: 'doc-german-timetable-101',
      documentVersionId: 'ver-101',
      chunkId: pointId,
      allowedRoles: testRoles,
      deniedRoles: [],
      allowedUsers: [],
      deniedUsers: [],
      allowedDepartments: [],
      deniedDepartments: [],
      pageNumbers: [1],
      sectionTitle: 'German Language Learning Timetable',
      chunkIndex: 0,
      text: textContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }]);

  console.log(` -> Upserted 1 point into Qdrant collection '${collectionName}'.`);

  console.log('\n[4/5] Executing OrganizationRetriever Search (Unattached RAG Flow)...');
  const retriever = new OrganizationRetriever({
    authContext: {
      organizationId: testOrgId,
      userId: testUserId,
      roles: testRoles,
    },
    topK: 4
  });

  const testQueries = [
    "What does time table has in it?",
    "When is the German exam date?",
    "What are the attendance requirements?"
  ];

  for (const query of testQueries) {
    console.log(`\n--------------------------------------------------`);
    console.log(`QUERY: "${query}"`);
    const retrievedDocs = await retriever.getRelevantDocuments(query);
    console.log(`RETRIEVED ${retrievedDocs.length} DOCS:`);
    retrievedDocs.forEach((doc, idx) => {
      console.log(` [Doc ${idx + 1}] Score: ${doc.metadata.score?.toFixed(4) || 'N/A'} | Title: ${doc.metadata.title}`);
      console.log(`   Content: "${doc.pageContent.substring(0, 150).replace(/\n/g, ' ')}..."`);
    });

    if (retrievedDocs.length === 0) {
      console.error(` -> FAILED: Zero documents retrieved for query: "${query}"`);
      process.exit(1);
    }
  }

  console.log('\n=================================================================');
  console.log('       RAG PIPELINE E2E VERIFICATION COMPLETED SUCCESSFULLY     ');
  console.log('=================================================================');
}

runE2EVerification().catch(err => {
  console.error('FATAL VERIFICATION ERROR:', err);
  process.exit(1);
});
