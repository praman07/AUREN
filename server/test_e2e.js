const fs = require('fs');

async function runE2ETest() {
  console.log("Starting End-to-End Test...");

  const BASE_URL = 'http://localhost:5000/api/v1';
  
  // Create a mock user token
  const mockUser = { id: 'mock-user-id', organizationId: 'mock-org-id', role: 'ADMIN' };
  const token = Buffer.from(JSON.stringify(mockUser)).toString('base64');
  const headers = { 'Authorization': `Bearer ${token}` };

  // 1. Upload a mock PDF Document
  console.log("1. Uploading PDF...");
  const formData = new FormData();
  
  const mockPdfContent = new Blob(['%PDF-1.4 mock pdf content with text: The EKOS system is a knowledge OS designed for enterprise RAG with zero trust architectures. It allows seamless semantic search and RAG workflows. It uses Qwen2.5 and Ollama.'], { type: 'application/pdf' });
  formData.append('file', mockPdfContent, 'test_document.pdf');
  formData.append('title', 'EKOS Architecture Overview');
  formData.append('organizationId', mockUser.organizationId);
  formData.append('userId', mockUser.id);
  formData.append('clearanceLevel', 'INTERNAL');

  const uploadRes = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: headers,
    body: formData
  });

  const uploadResult = await uploadRes.json();
  console.log("Upload Response:", uploadResult);

  if (!uploadResult.success) {
    throw new Error('Upload failed!');
  }

  const documentId = uploadResult.data.documentId;
  const versionId = uploadResult.data.versionId || uploadResult.data.id; // Usually returns the uploaded entity

  console.log(`Uploaded Document ID: ${documentId}`);

  // 2. Wait for processing to complete (Simulate waiting for workers)
  console.log("2. Waiting 15 seconds for workers (OCR -> Chunking -> Embedding -> Qdrant Indexing) to process the document...");
  await new Promise(resolve => setTimeout(resolve, 15000));

  // 3. Test Semantic Search API
  console.log("3. Testing Semantic Search API...");
  const searchRes = await fetch(`${BASE_URL}/semantic-search/search`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What is the EKOS system?',
      organizationId: mockUser.organizationId,
      userId: mockUser.id,
      clearanceLevel: 'INTERNAL',
      limit: 5
    })
  });

  const searchResult = await searchRes.json();
  console.log("Search Result:", JSON.stringify(searchResult, null, 2));

  // 4. Test Chat Stream API
  console.log("4. Testing SSE Chat API...");
  const chatRes = await fetch(`${BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Explain how EKOS handles zero trust architecture according to the document.',
      
      organizationId: mockUser.organizationId
    })
  });

  if (!chatRes.ok) {
    throw new Error(`Chat API failed: ${chatRes.statusText}`);
  }

  const reader = chatRes.body.getReader();
  const decoder = new TextDecoder();
  let chatOutput = "";

  console.log("\n--- CHAT RESPONSE START ---");
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    process.stdout.write(chunk);
    chatOutput += chunk;
  }
  console.log("\n--- CHAT RESPONSE END ---\n");

  console.log("End-to-End Test Completed Successfully!");
}

runE2ETest().catch(err => {
  console.error("E2E Test Failed:", err);
  process.exit(1);
});
