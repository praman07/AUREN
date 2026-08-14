import React from 'react';
import { Sparkles, User, FileText, ChevronRight, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { ChatMessage } from '../store/useChatStore';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 opacity-0 animate-spring-up`}>
      <div className={`flex max-w-[85%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-md ${
          isUser 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-400/30' 
            : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 backdrop-blur-xl'
        }`}>
          {isUser ? <User size={16} /> : <Sparkles size={16} />}
        </div>
        
        {/* Content */}
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser 
              ? 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-600/20 font-medium' 
              : 'liquid-glass-panel text-slate-100 rounded-tl-sm border border-slate-700/60'
          }`}>
            {message.content}
            {!isUser && message.content === '' && (
              <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1 align-middle"></span>
            )}
          </div>
          
          {/* Sources / Citations */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-3 w-full">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Sources Analyzed</span>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg liquid-glass-chip text-xs hover:bg-slate-800/80 transition-all duration-200 cursor-pointer group border border-slate-700/50">
                    <FileText size={14} className="text-slate-400 group-hover:text-blue-400 transition-colors shrink-0" />
                    <span className="truncate font-medium text-slate-200 group-hover:text-white transition-colors">{source.title || 'Untitled Document'}</span>
                    <ChevronRight size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons for AI Responses */}
          {!isUser && message.content !== '' && (
            <div className="flex items-center gap-1.5 mt-1 self-end text-slate-400">
              <button 
                type="button" 
                title="Copy Answer"
                onClick={() => navigator.clipboard.writeText(message.content)}
                className="p-1.5 rounded-full liquid-glass-chip hover:bg-slate-800 hover:text-blue-400 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Copy size={14} />
              </button>
              <button 
                type="button" 
                title="Helpful"
                className="p-1.5 rounded-full liquid-glass-chip hover:bg-slate-800 hover:text-emerald-400 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <ThumbsUp size={14} />
              </button>
              <button 
                type="button" 
                title="Not Helpful"
                className="p-1.5 rounded-full liquid-glass-chip hover:bg-slate-800 hover:text-rose-400 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

