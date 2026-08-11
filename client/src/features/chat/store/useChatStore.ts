import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  timestamp: Date;
}

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: (sources?: any[]) => void;
  setStreaming: (isStreaming: boolean) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,

  addMessage: (message) => set((state) => ({
    messages: [
      ...state.messages,
      {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date()
      }
    ]
  })),

  appendStreamChunk: (chunk) => set((state) => {
    const newMessages = [...state.messages];
    const lastMessage = newMessages[newMessages.length - 1];
    
    if (lastMessage && lastMessage.role === 'assistant') {
      lastMessage.content += chunk;
    }
    
    return { messages: newMessages };
  }),

  finalizeStream: (sources) => set((state) => {
    const newMessages = [...state.messages];
    const lastMessage = newMessages[newMessages.length - 1];
    
    if (lastMessage && lastMessage.role === 'assistant' && sources) {
      lastMessage.sources = sources;
    }
    
    return { messages: newMessages, isStreaming: false };
  }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  clearHistory: () => set({ messages: [], isStreaming: false }),
}));
