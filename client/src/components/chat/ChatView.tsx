import React, { useState, useEffect, useRef } from 'react';
import type {
  ChatConversation,
  ChatMessage,
  SourceCitation,
  AurenDocument,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ChatHeader } from './ChatHeader';
import { SourceDrawer } from './SourceDrawer';
import { ChatComposer } from './ChatComposer';
import { EmptyChat } from './EmptyChat';
import { MessageContent } from './MessageContent';
import { GroundedSuggestionsAndImages } from './GroundedSuggestionsAndImages';

interface ChatViewProps {
  conversations: ChatConversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  onTogglePinConversation?: (id: string) => void;
  documents: AurenDocument[];
  onOpenDocument: (doc: AurenDocument) => void;
  initialQuery?: string;
  initialAttachedDoc?: AurenDocument | null;
  onOpenMobileNav?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onBack?: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat: _onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  documents,
  onOpenDocument,
  initialQuery,
  initialAttachedDoc,
  onOpenMobileNav,
  isSidebarCollapsed,
  onToggleSidebar,
  onBack,
  onNavigateTab,
}) => {
  const { activeScope, setActiveScope } = useAuth();
  const [currentConv, setCurrentConv] = useState<ChatConversation | null>(null);
  const [inputMessage, setInputMessage] = useState(initialQuery || '');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeCitations, setActiveCitations] = useState<SourceCitation[]>([]);
  const [attachedDocs, setAttachedDocs] = useState<AurenDocument[]>(
    initialAttachedDoc ? [initialAttachedDoc] : []
  );
  const [searchWeb, setSearchWeb] = useState(false);

  // Sources drawer state
  const [isSourcesDrawerOpen, setIsSourcesDrawerOpen] = useState(false);
  const [highlightedSource, setHighlightedSource] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync active conversation
  useEffect(() => {
    if (activeConversationId) {
      const found = conversations.find((c) => c.id === activeConversationId);
      if (found) {
        setCurrentConv(found);
        // Extract citations from the latest assistant message
        const lastAssistantMsg = [...found.messages]
          .reverse()
          .find((m) => m.role === 'assistant' && m.sources && m.sources.length > 0);
        if (lastAssistantMsg?.sources) {
          setActiveCitations(lastAssistantMsg.sources);
        } else {
          setActiveCitations([]);
        }
      }
    } else if (conversations.length > 0) {
      onSelectConversation(conversations[0].id);
    }
  }, [activeConversationId, conversations, onSelectConversation]);

  // Handle auto-send if initialQuery provided
  useEffect(() => {
    if (initialQuery && !isStreaming) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  // Scroll to bottom on new messages or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv?.messages, streamingText]);

  // Handle opening source citation in library or in drawer
  const handleCitationClick = (citation: SourceCitation | string) => {
    const titleOrId = typeof citation === 'string' ? citation : citation.title || citation.id;
    setHighlightedSource(titleOrId);
    setIsSourcesDrawerOpen(true);
  };

  const handleOpenDocumentById = (docId: string, title?: string) => {
    const doc =
      documents.find((d) => d.id === docId) ||
      (title ? documents.find((d) => d.title.toLowerCase() === title.toLowerCase()) : undefined);
    if (doc) {
      onOpenDocument(doc);
    }
  };

  // Send message and stream via SSE
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isStreaming) return;

    setInputMessage('');
    setIsStreaming(true);
    setStreamingText('');

    const convId = currentConv?.id;
    const docIds = attachedDocs.map((d) => d.id);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          query,
          attachedDocumentIds: docIds,
          scope: activeScope,
          searchWeb,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming connection failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const rawChunk = decoder.decode(value);
        const lines = rawChunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'init') {
                if (data.citations) {
                  setActiveCitations(data.citations);
                }
              } else if (data.type === 'token') {
                accumulatedResponse += data.text;
                setStreamingText(accumulatedResponse);
              } else if (data.type === 'citation') {
                setActiveCitations((prev) => [...prev, data.citation]);
              } else if (data.type === 'done') {
                // Done event
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      // Refresh conversation list after response is fully streamed
      const updatedRes = await fetch('/api/chat/conversations');
      if (updatedRes.ok) {
        const updatedList: ChatConversation[] = await updatedRes.json();
        const fresh = updatedList.find((c) => c.id === convId) || updatedList[0];
        if (fresh) {
          setCurrentConv(fresh);
          if (fresh.id !== activeConversationId) {
            onSelectConversation(fresh.id);
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err);
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      setAttachedDocs([]);
    }
  };

  const hasMessages = Boolean(
    (currentConv && currentConv.messages && currentConv.messages.length > 0) || streamingText
  );

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-neutral-950 overflow-hidden relative select-text">
      {/* 1. Chat Header */}
      <ChatHeader
        conversation={currentConv}
        sourcesCount={activeCitations.length}
        onToggleSources={() => setIsSourcesDrawerOpen(!isSourcesDrawerOpen)}
        isSourcesOpen={isSourcesDrawerOpen}
        onRenameConversation={onRenameConversation}
        onTogglePinConversation={onTogglePinConversation}
        onDeleteConversation={onDeleteConversation}
        onOpenMobileNav={onOpenMobileNav}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        onBack={onBack}
        onNavigateTab={onNavigateTab}
      />

      {/* 2. Main Conversation Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {hasMessages ? (
          <>
            {/* Scrollable Reading Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 min-w-0">
              <div className="max-w-3xl lg:max-w-3.5xl mx-auto space-y-8 min-w-0">
                {currentConv?.messages.map((msg: ChatMessage) => (
                  <div key={msg.id} className="space-y-2.5 min-w-0">
                    {msg.role === 'user' ? (
                      /* User Message: Clean, restrained enterprise bubble */
                      <div className="flex items-start justify-end gap-3 min-w-0">
                        <div className="max-w-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg px-4 py-2.5 text-sm leading-relaxed border border-neutral-200 dark:border-neutral-700 min-w-0 break-words">
                          {/* Attached context docs */}
                          {msg.attachedDocumentIds && msg.attachedDocumentIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2 pb-1.5 border-b border-neutral-200 dark:border-neutral-700">
                              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 select-none">
                                Context:
                              </span>
                              {msg.attachedDocumentIds.map((id) => {
                                const d = documents.find((doc) => doc.id === id);
                                return d ? (
                                  <span
                                    key={id}
                                    className="text-[11px] bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                                  >
                                    {d.title}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                          <p className="font-medium text-[14px]">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      /* Assistant Response: Reading layout */
                      <div className="space-y-3 pt-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 select-none">
                          <div className="w-5 h-5 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-[10px] font-bold">
                            A
                          </div>
                          <span>AUREN</span>
                        </div>

                        {/* Document Content with Headings, Lists, & Grounded Source Pills */}
                        <div className="pl-0 sm:pl-7 min-w-0">
                          <MessageContent
                            content={msg.content}
                            sources={msg.sources}
                            onCitationClick={handleCitationClick}
                          />

                          {/* Grounded Web Suggestions and Org Knowledge Base Images */}
                          <GroundedSuggestionsAndImages
                            webSuggestions={msg.webSuggestions}
                            orgImages={msg.orgImages}
                            onOpenDocument={handleOpenDocumentById}
                          />

                          {/* Suggested follow-up questions */}
                          {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                              {msg.suggestedFollowUps.map((prompt, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => handleSendMessage(prompt)}
                                  className="text-xs px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                                >
                                  {prompt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Streaming Response State */}
                {isStreaming && (
                  <div className="space-y-3 pt-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 select-none">
                      <div className="w-5 h-5 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-[10px] font-bold">
                        A
                      </div>
                      <span>AUREN</span>
                      <span className="text-[11px] font-normal text-neutral-400 dark:text-neutral-500 ml-1">
                        Generating response...
                      </span>
                    </div>

                    <div className="pl-0 sm:pl-7 min-w-0">
                      <MessageContent
                        content={streamingText}
                        sources={activeCitations}
                        onCitationClick={handleCitationClick}
                      />
                      <span className="inline-block w-1.5 h-4 bg-neutral-900 dark:bg-white animate-pulse ml-0.5" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>

            {/* Bottom Composer */}
            <ChatComposer
              inputMessage={inputMessage}
              onInputChange={setInputMessage}
              onSend={handleSendMessage}
              isStreaming={isStreaming}
              activeScope={activeScope}
              onChangeScope={setActiveScope}
              searchWeb={searchWeb}
              onToggleSearchWeb={() => setSearchWeb(!searchWeb)}
              attachedDocs={attachedDocs}
              onRemoveAttachedDoc={(id) =>
                setAttachedDocs((prev) => (prev || []).filter((d) => d.id !== id))
              }
            />
          </>
        ) : (
          /* Empty State */
          <EmptyChat onSelectSuggestion={(q) => handleSendMessage(q)}>
            <ChatComposer
              inputMessage={inputMessage}
              onInputChange={setInputMessage}
              onSend={handleSendMessage}
              isStreaming={isStreaming}
              activeScope={activeScope}
              onChangeScope={setActiveScope}
              searchWeb={searchWeb}
              onToggleSearchWeb={() => setSearchWeb(!searchWeb)}
              attachedDocs={attachedDocs}
              onRemoveAttachedDoc={(id) =>
                setAttachedDocs((prev) => (prev || []).filter((d) => d.id !== id))
              }
            />
          </EmptyChat>
        )}
      </div>

      {/* 3. Collapsible Sources Drawer (Right Overlay, opens on-demand) */}
      <SourceDrawer
        isOpen={isSourcesDrawerOpen}
        onClose={() => {
          setIsSourcesDrawerOpen(false);
          setHighlightedSource(null);
        }}
        citations={activeCitations}
        highlightedTitleOrId={highlightedSource}
        onOpenDocument={handleOpenDocumentById}
      />
    </div>
  );
};
