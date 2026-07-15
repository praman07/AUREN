import { RAGService } from '../RAGService';

const mockRetrievalEngine = {
  buildPrompt: jest.fn(),
  search: jest.fn()
};

const mockAIGateway = {
  streamChat: jest.fn()
};

jest.mock('../../../infrastructure/database/prisma', () => ({
  prisma: {
    chat: { create: jest.fn(), findUnique: jest.fn() },
    message: { create: jest.fn(), findMany: jest.fn() },
    auditLog: { create: jest.fn() }
  }
}));

import { prisma } from '../../../infrastructure/database/prisma';

describe('RAGService', () => {
  let service: RAGService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RAGService(mockRetrievalEngine as any, mockAIGateway as any);
  });

  const baseReq = {
    message: 'What is our policy?',
    organizationId: 'org-1',
    userId: 'user-1',
    departmentIds: []
  };

  it('1. Successfully completes a chat flow with SSE events', async () => {
    (prisma.chat.create as jest.Mock).mockResolvedValue({ id: 'chat-1', organizationId: 'org-1' });
    (prisma.message.findMany as jest.Mock).mockResolvedValue([{ role: 'user', content: 'What is our policy?' }]);
    
    mockRetrievalEngine.search.mockResolvedValue({ chunks: [{ documentId: 'doc-1', id: 'chunk-1' }] });
    mockRetrievalEngine.buildPrompt.mockResolvedValue({ fullPrompt: 'System: ... Context: ... User: What is our policy?' });
    
    async function* mockStream() {
      yield 'Hello ';
      yield 'World';
    }
    mockAIGateway.streamChat.mockResolvedValue(mockStream());

    const events: any[] = [];
    await service.streamChat(baseReq, (e) => events.push(e));

    expect(events).toEqual([
      { type: 'retrieval_started' },
      { type: 'sources', data: [{ documentId: 'doc-1', page: undefined, title: undefined, chunkId: 'chunk-1' }] },
      { type: 'token', data: 'Hello ' },
      { type: 'token', data: 'World' },
      { type: 'completed', data: { conversationId: 'chat-1' } }
    ]);
  });

  it('2. User from Org A cannot retrieve Org B data (Unauthorized conversation access)', async () => {
    (prisma.chat.findUnique as jest.Mock).mockResolvedValue({ id: 'chat-1', organizationId: 'org-2' }); // Mismatch

    const events: any[] = [];
    await service.streamChat({ ...baseReq, conversationId: 'chat-1' }, (e) => events.push(e));

    expect(events).toEqual([
      { type: 'error', data: 'Unauthorized conversation access' }
    ]);
  });
});
