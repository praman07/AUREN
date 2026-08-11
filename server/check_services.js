const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

async function main() {
  console.log('Testing infrastructure connections...');
  
  // 1. Postgres
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Postgres is reachable');
    await prisma.$disconnect();
  } catch (err) {
    console.log('❌ Postgres is NOT reachable: ' + err.message);
  }

  // 2. Redis
  try {
    const redis = new Redis('redis://localhost:6379', { maxRetriesPerRequest: 1, connectTimeout: 1000 });
    await new Promise((resolve) => {
      redis.on('ready', () => {
        console.log('✅ Redis is reachable');
        redis.quit();
        resolve();
      });
      redis.on('error', (err) => {
        console.log('❌ Redis is NOT reachable: ' + err.message);
        redis.quit();
        resolve();
      });
    });
  } catch (err) {
    console.log('❌ Redis is NOT reachable: ' + err.message);
  }

  // 3. Qdrant
  try {
    const res = await fetch('http://localhost:6333/');
    if (res.ok) {
      console.log('✅ Qdrant is reachable');
    } else {
      console.log('❌ Qdrant is NOT reachable, status: ' + res.status);
    }
  } catch (err) {
    console.log('❌ Qdrant is NOT reachable: ' + err.message);
  }
}

main().catch(console.error);
