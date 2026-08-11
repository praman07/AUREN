import React from 'react';
import { Send, Sparkles } from 'lucide-react';
import { chatService } from '../services/chatService';
import { useChatStore } from '../store/useChatStore';

export const ChatInput: React.FC = () => {
  const [input, setInput] = React.useState('');
  const { isStreaming } = useChatStore();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    chatService.streamChat(input.trim());
    setInput('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-t border-border bg-background p-4 flex-shrink-0">
      <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-muted/50 border border-border rounded-xl p-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask AUREN about organizational knowledge..."
          className="flex-1 max-h-[200px] min-h-[44px] bg-transparent resize-none outline-none text-sm text-foreground p-3"
          rows={1}
          disabled={isStreaming}
        />
        
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isStreaming}
          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors shadow-sm mb-1"
        >
          {isStreaming ? (
            <Sparkles size={18} className="animate-pulse" />
          ) : (
            <Send size={18} className="ml-0.5" />
          )}
        </button>
      </div>
      <div className="text-center mt-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Auren AI can make mistakes. Verify critical facts.</span>
      </div>
    </div>
  );
};
