import React from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
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

  const setSuggestion = (text: string) => {
    setInput(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="p-4 pb-24 flex-shrink-0 relative z-20 bg-white">
      {/* Contextual Suggestion Chips (Light Glass) */}
      <div className="flex flex-wrap gap-2 justify-center mb-4 max-w-3xl mx-auto opacity-0 animate-spring-up stagger-1">
        <button
          type="button"
          onClick={() => setSuggestion('What is our leave policy?')}
          className="px-4 py-2 rounded-full text-xs text-slate-700 font-medium transition-colors duration-200 liquid-glass-chip-light hover:bg-slate-100 hover:text-slate-900"
        >
          What is our leave policy?
        </button>
        <button
          type="button"
          onClick={() => setSuggestion('How do I request equipment?')}
          className="px-4 py-2 rounded-full text-xs text-slate-700 font-medium transition-colors duration-200 liquid-glass-chip-light hover:bg-slate-100 hover:text-slate-900"
        >
          How do I request equipment?
        </button>
        <button
          type="button"
          onClick={() => setSuggestion('What are the latest security requirements?')}
          className="px-4 py-2 rounded-full text-xs text-slate-700 font-medium transition-colors duration-200 liquid-glass-chip-light hover:bg-slate-100 hover:text-slate-900"
        >
          What are the latest security requirements?
        </button>
      </div>

      {/* AI Composer Field with Light Mode Liquid Glass */}
      <div className="max-w-3xl mx-auto relative">
        <div className="rounded-2xl overflow-hidden liquid-glass-input-light p-2 flex items-end gap-2 border border-slate-200/80 shadow-lg">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="What would you like to know?"
            className="flex-1 max-h-[200px] min-h-[48px] bg-transparent resize-none outline-none text-sm text-slate-900 placeholder:text-slate-400 p-3 leading-relaxed font-sans"
            rows={1}
            disabled={isStreaming}
          />
          
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming}
            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors duration-200 shadow-md shadow-blue-600/25 mb-1"
          >
            {isStreaming ? (
              <Sparkles size={18} className="animate-pulse text-white" />
            ) : (
              <ArrowUp size={18} className="text-white font-bold" />
            )}
          </button>
        </div>
      </div>
      <div className="text-center mt-3">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Auren AI can make mistakes. Verify critical facts.</span>
      </div>
    </div>
  );
};

