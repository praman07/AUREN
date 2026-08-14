import React, { useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChatStore } from '../store/useChatStore';
import { useUIStore } from '../../../store/useUIStore';
import { useAuthStore } from '../../../core/auth/store/useAuthStore';
import { Trash2, Menu, Sparkles, LogOut, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ChatPage: React.FC = () => {
  const { clearHistory, messages } = useChatStore();
  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    return () => {
      // clearHistory();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-white text-slate-900 relative font-sans antialiased overflow-hidden">
      
      {/* Floating Center Capsule Navbar with Elastic Hover Effect */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="elastic-capsule-nav h-12 px-4 rounded-full flex items-center gap-4 cursor-pointer shadow-lg">
          
          <button 
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 hover:text-slate-900 transition-colors"
            title="Toggle sidebar"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2 border-r border-slate-200/80 pr-4">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles size={12} />
            </div>
            <span className="text-xs font-bold tracking-tight text-slate-900 font-sans">
              AUREN AI
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <Search size={14} className="text-blue-600" />
              <span className="hidden sm:inline font-medium">Search</span>
            </button>

            {messages.length > 0 && (
              <button 
                type="button"
                onClick={clearHistory}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                title="Clear Conversation"
              >
                <Trash2 size={13} />
                <span className="hidden md:inline">Clear</span>
              </button>
            )}

            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shadow-2xs">
                  {user.firstName ? user.firstName[0] : 'U'}
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign out"
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded-full"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative pt-16 bg-white">
        <MessageList />
        <ChatInput />
      </div>
    </div>
  );
};

