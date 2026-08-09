const fs = require('fs');

async function runTest() {
  console.log("Starting Grounding & Security E2E Test...");
  const BASE_URL = 'http://localhost:5000/api/v1';

  const mockUser = { id: 'mock-user-id', organizationId: 'mock-org-id', role: 'ADMIN', clearanceLevel: 'TOP_SECRET' };
  const token = Buffer.from(JSON.stringify(mockUser)).toString('base64');
  const headers = { 'Authorization': `Bearer ${token}` };

  console.log("\n--- [1] UPLOADING DOCUMENT ---");
  const formData = new FormData();
  const mockPdfContent = new Blob([
    '%PDF-1.4 mock pdf content with text: The EKOS system is a knowledge OS designed for enterprise RAG with zero trust architectures. AUREN internal deployment code is AX-7429.'
  ], { type: 'application/pdf' });
  
  formData.append('file', mockPdfContent, 'test_document_ax7429.pdf');
  formData.append('title', 'EKOS Deployment Guide');
  formData.append('organizationId', mockUser.organizationId);
  formData.append('userId', mockUser.id);
  formData.append('clearanceLevel', 'INTERNAL');

  const uploadRes = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: headers,
    body: formData
  });

  const uploadResult = await uploadRes.json();
  if (!uploadResult.success) throw new Error('Upload failed!');
  console.log(`Document uploaded! ID: ${uploadResult.data.documentId}`);

  console.log("\n--- [2] WAITING FOR PIPELINE ---");
  await new Promise(resolve => setTimeout(resolve, 20000));

  console.log("\n--- [3] TESTING GROUNDING (SAME ORG) ---");
  const searchRes = await fetch(`${BASE_URL}/semantic-search/search`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What is AUREN internal deployment code?',
      organizationId: mockUser.organizationId,
      userId: mockUser.id,
      clearanceLevel: mockUser.clearanceLevel,
      limit: 5
    })
  });
  const searchResult = await searchRes.json();
  console.log("Search Result Chunks:", searchResult.data.totalFound);
  console.log("Chunks snippet:", JSON.stringify(searchResult.data.chunks.map(c => c.content).slice(0, 2), null, 2));

  console.log("\n--- [4] TESTING RAG CHAT GROUNDING ---");
  const chatRes = await fetch(`${BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What is AUREN internal deployment code?',
      organizationId: mockUser.organizationId
    })
  });

  const reader = chatRes.body.getReader();
  const decoder = new TextDecoder();
  let chatOutput = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    chatOutput += chunk;
  }
  console.log(chatOutput);
  console.log("Did it contain AX-7429?", chatOutput.includes("AX-7429"));

  console.log("\n--- [5] SECURITY TEST (DIFFERENT ORG) ---");
  const diffOrgUser = { id: 'diff-user', organizationId: 'evil-corp', role: 'ADMIN', clearanceLevel: 'TOP_SECRET' };
  const diffToken = Buffer.from(JSON.stringify(diffOrgUser)).toString('base64');
  
  const searchResDiff = await fetch(`${BASE_URL}/semantic-search/search`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${diffToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What is AUREN internal deployment code?',
      organizationId: 'evil-corp',
      userId: diffOrgUser.id,
      clearanceLevel: diffOrgUser.clearanceLevel,
      limit: 5
    })
  });
  const searchResultDiff = await searchResDiff.json();
  console.log("Different Org Found Chunks:", searchResultDiff.data.totalFound);

  console.log("\nE2E Grounding Tests Finished!");
}

runTest().catch(console.error);
