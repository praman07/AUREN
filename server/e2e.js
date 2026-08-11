require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Testing Prisma...');
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL');
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
  }
}

main().catch(console.error);
