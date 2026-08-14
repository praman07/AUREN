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
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto opacity-0 animate-spring-up">
            <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 text-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm backdrop-blur-xl">
              <Sparkles size={28} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-3 font-sans">
              Ask your organization's knowledge.
            </h1>
            <p className="text-slate-500 text-sm max-w-md font-sans">
              Securely query policies, employee resources, and internal documentation with zero-trust protection.
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
