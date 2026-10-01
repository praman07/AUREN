import { create } from 'zustand';

export interface ToolCallState {
  name: string;
  query?: string;
  status: 'running' | 'completed' | 'blocked';
  resultCount?: number;
  stepLabel?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  activeTool?: ToolCallState;
  clarification?: {
    question?: string;
    options?: Array<{ label: string; value: string; description?: string }>;
  };
  timestamp: Date;
}


export interface ConversationItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMemoryItem {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  activeConversationId: string | null;
  activeMode: 'hybrid' | 'local';
  executionMode: 'FAST' | 'DEEP';
  conversations: ConversationItem[];
  memories: UserMemoryItem[];
  isSidebarOpen: boolean;
  isMemoryModalOpen: boolean;
  useKnowledgeBase: boolean;

  streamingChatIds: Record<string, boolean>;
  addStreamingChatId: (id: string) => void;
  removeStreamingChatId: (id: string) => void;
  isChatStreaming: (id: string | null | undefined) => boolean;

  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  appendStreamChunk: (chunk: string) => void;
  setToolCall: (tool: { name: string; query?: string; status?: 'running' | 'completed' | 'blocked'; stepLabel?: string }) => void;
  setToolResult: (data: { count?: number; status?: string }) => void;
  setClarification: (data: { question?: string; options?: Array<{ label: string; value: string; description?: string }> }) => void;
  finalizeStream: (sources?: any[]) => void;

  setStreaming: (isStreaming: boolean) => void;
  clearHistory: () => void;
  
  setActiveConversationId: (id: string | null) => void;
  setActiveMode: (mode: 'hybrid' | 'local') => void;
  setExecutionMode: (mode: 'FAST' | 'DEEP') => void;
  setUseKnowledgeBase: (enabled: boolean) => void;
  setConversations: (conversations: ConversationItem[]) => void;
  setMemories: (memories: UserMemoryItem[]) => void;
  setMessages: (messages: ChatMessage[]) => void;
  toggleSidebar: () => void;
  toggleMemoryModal: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingChatIds: {},
  activeConversationId: null,
  activeMode: 'hybrid',
  executionMode: 'FAST',
  conversations: [],
  memories: [],
  isSidebarOpen: true,
  isMemoryModalOpen: false,
  useKnowledgeBase: false,

  addStreamingChatId: (id: string) => set((state) => {
    const next = { ...state.streamingChatIds, [id]: true };
    return { streamingChatIds: next, isStreaming: true };
  }),

  removeStreamingChatId: (id: string) => set((state) => {
    const next = { ...state.streamingChatIds };
    delete next[id];
    return { streamingChatIds: next, isStreaming: Object.keys(next).length > 0 };
  }),

  isChatStreaming: (id: string | null | undefined) => {
    if (!id) return false;
    return Boolean(get().streamingChatIds[id]);
  },

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

  setToolCall: (tool) => set((state) => {
    const newMessages = [...state.messages];
    const lastMessage = newMessages[newMessages.length - 1];
    
    if (lastMessage && lastMessage.role === 'assistant') {
      lastMessage.activeTool = {
        name: tool.name,
        query: tool.query ?? lastMessage.activeTool?.query,
        status: tool.status || 'running',
        stepLabel: tool.stepLabel ?? lastMessage.activeTool?.stepLabel,
        resultCount: lastMessage.activeTool?.resultCount
      };
    }
    return { messages: newMessages };
  }),

  setToolResult: (data: { name?: string; count?: number; status?: string }) => set((state) => {
    const newMessages = [...state.messages];
    const lastMessage = newMessages[newMessages.length - 1];
    
    if (lastMessage && lastMessage.role === 'assistant') {
      if (!lastMessage.activeTool) {
        lastMessage.activeTool = {
          name: data.name || 'internal_knowledge',
          status: data.status === 'blocked_by_policy' ? 'blocked' : 'completed',
          resultCount: data.count
        };
      } else {
        if (data.name) {
          lastMessage.activeTool.name = data.name;
        }
        lastMessage.activeTool.status = data.status === 'blocked_by_policy' ? 'blocked' : 'completed';
        if (typeof data.count === 'number') {
          lastMessage.activeTool.resultCount = data.count;
        }
      }
    }
    return { messages: newMessages };
  }),

  setClarification: (data) => set((state) => {
    const newMessages = [...state.messages];
    const lastMessage = newMessages[newMessages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      lastMessage.clarification = data;
      if (data.question && !lastMessage.content) {
        lastMessage.content = data.question;
      }
    }
    return { messages: newMessages };
  }),


  finalizeStream: (sources) => set((state) => {
    const newMessages = [...state.messages];
    const lastMessage = newMessages[newMessages.length - 1];
    
    if (lastMessage && lastMessage.role === 'assistant') {
      if (sources) {
        lastMessage.sources = sources;
      }
      if (lastMessage.activeTool && lastMessage.activeTool.status === 'running') {
        lastMessage.activeTool.status = 'completed';
      }
    }
    
    return { messages: newMessages, isStreaming: false };
  }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  clearHistory: () => set({ messages: [], activeConversationId: null, isStreaming: false }),

  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setActiveMode: (mode) => set({ activeMode: mode }),
  setExecutionMode: (mode) => set({ executionMode: mode }),
  setUseKnowledgeBase: (enabled) => set({ useKnowledgeBase: enabled }),
  setConversations: (conversations) => set({ conversations }),
  setMemories: (memories) => set({ memories }),
  setMessages: (messages) => set({ messages }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleMemoryModal: () => set((state) => ({ isMemoryModalOpen: !state.isMemoryModalOpen })),
}));

