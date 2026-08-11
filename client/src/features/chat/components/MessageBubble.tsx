import React from 'react';
import { Sparkles, User, FileText, ChevronRight } from 'lucide-react';
import type { ChatMessage } from '../store/useChatStore';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[85%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-sm ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-ai text-white'
        }`}>
          {isUser ? <User size={16} /> : <Sparkles size={16} />}
        </div>
        
        {/* Content */}
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-5 py-3.5 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${
            isUser 
              ? 'bg-primary text-primary-foreground rounded-tr-sm' 
              : 'bg-card border border-border text-foreground rounded-tl-sm'
          }`}>
            {message.content}
            {!isUser && message.content === '' && (
              <span className="inline-block w-2 h-4 bg-ai animate-pulse ml-1 align-middle"></span>
            )}
          </div>
          
          {/* Sources / Citations */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-2 w-full max-w-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">Sources</p>
              <div className="flex flex-col gap-2">
                {message.sources.map((source, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border text-xs hover:bg-muted transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className="text-muted-foreground shrink-0" />
                      <span className="truncate font-medium text-foreground">{source.title || 'Untitled Document'}</span>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
