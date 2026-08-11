import React, { useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChatStore } from '../store/useChatStore';
import { Trash2 } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { clearHistory, messages } = useChatStore();

  // Optionally clear chat on unmount if desired, or keep state persistent
  useEffect(() => {
    return () => {
      // clearHistory();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-background relative animate-in fade-in duration-300">
      
      {/* Header (optional, for specific chat controls) */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0 bg-background/95 backdrop-blur-sm z-10 sticky top-0">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">Conversations</h1>
        {messages.length > 0 && (
          <button 
            onClick={clearHistory}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <Trash2 size={14} />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
        <MessageList />
        <ChatInput />
      </div>
    </div>
  );
};
