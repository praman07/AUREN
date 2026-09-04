import React from 'react';
import { Link } from 'react-router-dom';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatSidebar } from './ChatSidebar';
import { MemoryModal } from './MemoryModal';

export const ChatPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-white text-slate-900 relative font-sans antialiased overflow-hidden -m-6">
      {/* Top Sub-Header Navigation based on Stitch design spec */}
      <div className="h-12 border-b border-slate-200/80 px-6 flex items-center justify-between bg-white shrink-0 z-10">
        <div className="flex items-center gap-6">
          <Link to="/chat" className="text-xs font-semibold text-slate-900 border-b-2 border-slate-900 py-3 transition-colors">
            Ask
          </Link>
          <Link to="/documents" className="text-xs font-medium text-slate-500 hover:text-slate-900 py-3 transition-colors">
            Knowledge
          </Link>
          <Link to="/users" className="text-xs font-medium text-slate-500 hover:text-slate-900 py-3 transition-colors">
            People
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Zero-Trust Active
          </span>
        </div>
      </div>

      {/* Main Workspace Canvas with Sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative bg-white">
        <ChatSidebar />
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative bg-white">
          <MessageList />
          <ChatInput />
        </div>
      </div>

      {/* User Memory Management Modal */}
      <MemoryModal />
    </div>
  );
};



