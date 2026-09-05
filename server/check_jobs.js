const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const versions = await prisma.documentVersion.findMany({
    where: {
      s3Key: { startsWith: 'connectors/' }
    }
  });

  console.log(`Found ${versions.length} connector version records`);

  let updated = 0;
  for (const v of versions) {
    if (!v.s3Key.endsWith('.txt')) {
      const newKey = v.s3Key + '.txt';
      await prisma.documentVersion.update({
        where: { id: v.id },
        data: { s3Key: newKey }
      });
      console.log(`Updated version ${v.id}: ${v.s3Key} -> ${newKey}`);
      updated++;
    }
  }

  console.log(`Successfully fixed ${updated} version records.`);
}

main().then(() => prisma.$disconnect()).catch(err => {
  console.error(err);
  prisma.$disconnect();
});
