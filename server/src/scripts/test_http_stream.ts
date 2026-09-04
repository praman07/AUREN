import fetch from 'node-fetch';
import { prisma } from '../infrastructure/database/prisma';
import { AuthService } from '../application/services/AuthService';

async function testHttpStream() {
  console.log('--- Creating Session Token for HTTP stream test ---');
  const authService = new AuthService();
  
  // Find test user
  const user = await prisma.user.findFirst({ where: { deletedAt: null } });
  if (!user) {
    console.error('No test user found in DB!');
    return;
  }
  
  // Generate session token
  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);
  
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: AuthService.hashToken(token),
      expiresAt
    }
  });

  console.log(`Session token created for user ${user.email}`);

  // Test Step 1: Ambiguous query
  console.log('\n--- Sending HTTP POST Step 1: "What is the latest performance of Meta?" ---');
  const res1 = await fetch('http://127.0.0.1:5000/api/v1/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: 'What is the latest performance of Meta?',
      mode: 'hybrid'
    })
  });

  console.log('Step 1 HTTP Status:', res1.status, res1.statusText);
  const text1 = await res1.text();
  console.log('Step 1 SSE Stream Output:\n', text1);

  // Extract conversationId from step 1 SSE events
  let convId = '';
  const lines = text1.split('\n');
  for (const line of lines) {
    if (line.startsWith('data:')) {
      try {
        const evt = JSON.parse(line.slice(5).trim());
        if (evt.type === 'retrieval_started' && evt.data?.conversationId) {
          convId = evt.data.conversationId;
        }
      } catch (_) {}
    }
  }

  console.log(`Extracted Conversation ID: ${convId}`);

  if (convId) {
    // Test Step 2: Clarification response
    console.log('\n--- Sending HTTP POST Step 2: "Financial Performance" with conversationId ---');
    const res2 = await fetch('http://127.0.0.1:5000/api/v1/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: 'Financial Performance',
        conversationId: convId,
        mode: 'hybrid'
      })
    });

    console.log('Step 2 HTTP Status:', res2.status, res2.statusText);
    const text2 = await res2.text();
    console.log('Step 2 SSE Stream Output:\n', text2);
  }

  // Test Step 3: Fresh Query: "What is the latest situation with Apple?"
  console.log('\n--- Sending HTTP POST Step 3: "What is the latest situation with Apple?" ---');
  const res3 = await fetch('http://127.0.0.1:5000/api/v1/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: 'What is the latest situation with Apple?',
      mode: 'hybrid'
    })
  });

  console.log('Step 3 HTTP Status:', res3.status, res3.statusText);
  const text3 = await res3.text();
  console.log('Step 3 SSE Stream Output:\n', text3);

  process.exit(0);
}

testHttpStream().catch(err => {
  console.error('HTTP Stream Test Error:', err);
  process.exit(1);
});
