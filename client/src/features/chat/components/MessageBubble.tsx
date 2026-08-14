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
        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-xs ${
          isUser 
            ? 'bg-blue-600 text-white font-semibold' 
            : 'bg-blue-50 text-blue-600 border border-blue-200/60'
        }`}>
          {isUser ? <User size={16} /> : <Sparkles size={16} />}
        </div>
        
        {/* Content */}
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser 
              ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm font-medium' 
              : 'liquid-glass-panel-light text-slate-800 rounded-tl-sm border border-slate-200/80 shadow-sm'
          }`}>
            {message.content}
            {!isUser && message.content === '' && (
              <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1 align-middle"></span>
            )}
          </div>
          
          {/* Sources / Citations */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-3 w-full">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block font-sans">Sources Analyzed</span>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg liquid-glass-chip-light text-xs hover:bg-slate-100 transition-all duration-200 cursor-pointer group border border-slate-200">
                    <FileText size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                    <span className="truncate font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{source.title || 'Untitled Document'}</span>
                    <ChevronRight size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
                className="p-1.5 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Copy size={14} />
              </button>
              <button 
                type="button" 
                title="Helpful"
                className="p-1.5 rounded-full hover:bg-slate-100 hover:text-emerald-600 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <ThumbsUp size={14} />
              </button>
              <button 
                type="button" 
                title="Not Helpful"
                className="p-1.5 rounded-full hover:bg-slate-100 hover:text-rose-600 transition-all duration-200 hover:scale-105 active:scale-95"
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

