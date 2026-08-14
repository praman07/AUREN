import React, { useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../../../core/auth/store/useAuthStore';
import { Trash2, Sparkles, LogOut, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

export const ChatPage: React.FC = () => {
  const { clearHistory, messages } = useChatStore();
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
      
      {/* Top Floating Center Header Capsule (Shadcn UI Refactored) */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="h-12 px-4 rounded-full flex items-center gap-3 border border-slate-200/90 bg-white/90 backdrop-blur-md shadow-lg">
          
          <div className="flex items-center gap-2 border-r border-slate-200/80 pr-3.5">
            <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Sparkles size={12} />
            </div>
            <span className="text-xs font-bold tracking-tight text-slate-900 font-sans">
              AUREN AI
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/search')}
              className="text-xs text-slate-600 hover:text-slate-900 gap-1.5 h-8 px-3 rounded-full"
            >
              <Search size={14} className="text-blue-600" />
              <span className="hidden sm:inline font-medium">Search</span>
            </Button>

            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1.5 h-8 px-3 rounded-full"
                title="Clear Conversation"
              >
                <Trash2 size={13} />
                <span className="hidden md:inline">Clear</span>
              </Button>
            )}

            {user && (
              <div className="pl-1 border-l border-slate-200/80">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none rounded-full ring-offset-2 focus:ring-2 focus:ring-slate-400">
                      <Avatar className="h-7 w-7 border border-slate-200">
                        <AvatarFallback>
                          {user.firstName ? user.firstName[0] : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer"
                    >
                      <LogOut size={14} className="mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
