import React, { useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export const ChatPage: React.FC = () => {
  useEffect(() => {
    return () => {
      // clearHistory();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-white text-slate-900 relative font-sans antialiased overflow-hidden">
      {/* Main Workspace Canvas */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative bg-white">
        <MessageList />
        <ChatInput />
      </div>
    </div>
  );
};

