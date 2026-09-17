import { prisma } from '../infrastructure/database/prisma';
import { storageProvider } from '../di';

async function main() {
  console.log('=== INSPECTING STORED IMAGE BYTES ===');
  
  const doc = await prisma.document.findFirst({
    where: {
      title: { contains: 'test_upload_image' },
      deletedAt: null
    },
    include: { versions: true }
  });

  if (!doc || doc.versions.length === 0) {
    console.log('No test_upload_image doc found');
    return;
  }

  const ver = doc.versions[0];
  console.log(`Doc ID: ${doc.id}, Title: ${doc.title}, MimeType: ${doc.mimeType}`);
  console.log(`Version ID: ${ver.id}, s3Key: ${ver.s3Key}`);

  const buffer = await storageProvider.download(ver.s3Key);
  console.log(`Downloaded Buffer length: ${buffer.length} bytes`);
  console.log(`First 16 Hex bytes: ${buffer.subarray(0, 16).toString('hex')}`);
  console.log(`ASCII Header (first 10 chars): "${buffer.subarray(0, 10).toString('ascii')}"`);

  // Check PNG magic header: 89 50 4e 47 0d 0a 1a 0a
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    console.log('Valid PNG Magic Bytes detected!');
  } else {
    console.log('NOT a standard PNG header!');
  }

  // Convert buffer to base64
  console.log(`Base64 string sample: "${buffer.toString('base64').slice(0, 50)}..."`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
