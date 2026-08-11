import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { MessageBubble } from './MessageBubble';
import { Sparkles } from 'lucide-react';

export const MessageList: React.FC = () => {
  const { messages } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full scroll-smooth">
      <div className="max-w-4xl mx-auto flex flex-col w-full h-full">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto fade-in">
            <div className="w-16 h-16 bg-ai/10 text-ai rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">How can I help you today?</h2>
            <p className="text-muted-foreground text-sm">
              I am AUREN, your enterprise knowledge assistant. I can search through organizational documents and provide grounded answers with citations.
            </p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 pb-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>
    </div>
  );
};
