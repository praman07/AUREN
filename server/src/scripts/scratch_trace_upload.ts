import { uploadService } from '../di';
import { prisma } from '../infrastructure/database/prisma';

async function main() {
  console.log('=== TRACING FRESH IMAGE UPLOADING PROCESS ===');

  // 1. Get an existing Organization & User
  const org = await prisma.organization.findFirst();
  const user = await prisma.user.findFirst({ where: { organizationId: org?.id } });

  if (!org || !user) {
    console.error('No org or user found');
    return;
  }

  console.log(`Testing with Org: ${org.id} (${org.name}), User: ${user.id} (${user.email})`);

  // 2. Create a test 1x1 PNG image buffer
  const sampleImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(sampleImageBase64, 'base64');
  const filename = `test_upload_image_${Date.now()}.png`;

  console.log(`\n--- STAGE 1: UPLOAD API INVOCATION ---`);
  const result = await uploadService.processUpload(
    org.id,
    user.id,
    imageBuffer,
    filename,
    'image/png',
    imageBuffer.length,
    'ORGANIZATION'
  );

  console.log(`UploadService.processUpload Result:`, result);

  const docId = result.documentId;
  const verId = result.versionId;

  // 3. Fetch Document Record
  console.log(`\n--- STAGE 2: DOCUMENT & VERSION DB RECORD ---`);
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: { versions: true, jobs: true }
  });

  console.log(`Document created:`, {
    id: doc?.id,
    title: doc?.title,
    mimeType: doc?.mimeType,
    sourceType: doc?.sourceType,
    scope: doc?.scope,
    visibility: doc?.visibility,
    organizationId: doc?.organizationId,
    ownerId: doc?.ownerId,
    deletedAt: doc?.deletedAt
  });

  const ver = doc?.versions.find(v => v.id === verId);
  console.log(`DocumentVersion created:`, {
    id: ver?.id,
    s3Key: ver?.s3Key,
    hash: ver?.hash
  });

  // 4. Fetch Chunks
  console.log(`\n--- STAGE 3: CHUNKS & EMBEDDINGS ---`);
  const chunks = await prisma.documentChunk.findMany({
    where: { versionId: verId }
  });
  console.log(`Total Chunks created: ${chunks.length}`);
  for (const c of chunks) {
    console.log(`  Chunk ID: ${c.id}, embeddingStatus: ${c.embeddingStatus}, indexingStatus: ${c.indexingStatus}, textLength: ${c.text.length}`);
    console.log(`  Snippet: "${c.text.slice(0, 100).replace(/\n/g, ' ')}"`);
  }

  // 5. Query Document Catalog via DocumentService
  console.log(`\n--- STAGE 4: CATALOG QUERY (DocumentService) ---`);
  const { documentService } = await import('../di');
  const requester = {
    id: user.id,
    organizationId: org.id,
    roles: [],
    departments: user.departmentId ? [user.departmentId] : [],
    isSuperAdmin: !!user.isSuperAdmin
  };

  const catalogDocs = await documentService.getDocuments(requester, 0, 100);
  const foundInCatalog = catalogDocs.some(d => d.id === docId);
  console.log(`Found in DocumentService.getDocuments: ${foundInCatalog} (Total docs returned: ${catalogDocs.length})`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
