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
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../features/chat/store/useChatStore';
import { ArrowDown } from 'lucide-react';

interface ChatViewProps {
  conversations: ChatConversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  onTogglePinConversation?: (id: string) => void;
  onRefreshConversations?: () => void;
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
  onRefreshConversations,
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
  const navigate = useNavigate();
  const setGlobalStreaming = useChatStore((state) => state.setStreaming);
  const addStreamingChatId = useChatStore((state) => state.addStreamingChatId);
  const removeStreamingChatId = useChatStore((state) => state.removeStreamingChatId);
  const isChatStreaming = useChatStore((state) => state.isChatStreaming);

  const [currentConv, setCurrentConv] = useState<ChatConversation | null>(null);
  const [inputMessage, setInputMessage] = useState(initialQuery || '');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeCitations, setActiveCitations] = useState<SourceCitation[]>([]);
  const [attachedDocs, setAttachedDocs] = useState<AurenDocument[]>(
    initialAttachedDoc ? [initialAttachedDoc] : []
  );
  const [searchWeb, setSearchWeb] = useState(false);

  const isCurrentConvStreaming = currentConv?.id ? (isChatStreaming(currentConv.id) || isStreaming) : isStreaming;
  const isStreamingActive = isCurrentConvStreaming;

  // Sync initialAttachedDoc into attachedDocs state
  useEffect(() => {
    if (initialAttachedDoc) {
      setAttachedDocs((prev) => {
        if (prev.some((d) => d.id === initialAttachedDoc.id)) return prev;
        return [initialAttachedDoc, ...prev];
      });
    }
  }, [initialAttachedDoc]);

  // Sources drawer state
  const [isSourcesDrawerOpen, setIsSourcesDrawerOpen] = useState(false);
  const [highlightedSource, setHighlightedSource] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isUserScrolledUpRef = useRef(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    isUserScrolledUpRef.current = isScrolledUp;
    setIsUserScrolledUp(isScrolledUp);
  };

  const scrollToBottomInstant = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  const scrollToBottomSmooth = () => {
    isUserScrolledUpRef.current = false;
    setIsUserScrolledUp(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStopGeneration = () => {
    if (currentConv?.id) {
      removeStreamingChatId(currentConv.id);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setGlobalStreaming(false);
  };

  // Listen for global new chat trigger
  useEffect(() => {
    const handleNewChatTrigger = () => {
      setCurrentConv(null);
      setInputMessage('');
      setAttachedDocs([]);
      setActiveCitations([]);
      setIsStreaming(false);
    };
    window.addEventListener('auren:start-new-chat', handleNewChatTrigger);
    return () => window.removeEventListener('auren:start-new-chat', handleNewChatTrigger);
  }, []);

  // Sync active conversation
  useEffect(() => {
    let isMounted = true;
    if (activeConversationId && activeConversationId !== 'new') {
      const found = conversations.find((c) => c.id === activeConversationId);
      if (found) {
        setCurrentConv(found);
        const msgs = Array.isArray(found.messages) ? found.messages : [];
        if (!found.messages) {
          api.getConversation(found.id).then((full) => {
            if (isMounted && full) {
              setCurrentConv(full);
              const fullMsgs = Array.isArray(full.messages) ? full.messages : [];
              const lastAssistantMsg = [...fullMsgs]
                .reverse()
                .find((m) => m.role === 'assistant' && m.sources && m.sources.length > 0);
              if (lastAssistantMsg?.sources) {
                setActiveCitations(lastAssistantMsg.sources);
              }
            }
          }).catch(() => {});
        } else {
          const lastAssistantMsg = [...msgs]
            .reverse()
            .find((m) => m.role === 'assistant' && m.sources && m.sources.length > 0);
          if (lastAssistantMsg?.sources) {
            setActiveCitations(lastAssistantMsg.sources);
          } else {
            setActiveCitations([]);
          }
        }
      } else {
        setCurrentConv(null);
        setActiveCitations([]);
      }
    } else {
      // Empty or new conversation state — render blank canvas
      setCurrentConv(null);
      setActiveCitations([]);
    }
    return () => {
      isMounted = false;
    };
  }, [activeConversationId, conversations]);

  // Handle auto-send if initialQuery provided
  useEffect(() => {
    if (initialQuery && !isStreaming) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  // Instant non-animated auto-scroll to bottom on streaming, respecting user scroll-up preference
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    if (!isUserScrolledUpRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
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
    if (!query || isStreamingActive) return;

    isUserScrolledUpRef.current = false;
    setIsUserScrolledUp(false);
    setTimeout(scrollToBottomInstant, 10);

    setInputMessage('');
    setIsStreaming(true);
    setGlobalStreaming(true);
    setStreamingText('');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
      attachedDocumentIds: attachedDocs.map((d) => d.id),
    };

    // Optimistically create/update conversation in state
    let targetConv = currentConv;
    if (!targetConv) {
      targetConv = {
        id: `conv_${Date.now()}`,
        title: query.substring(0, 30),
        scope: activeScope === 'personal' ? 'personal' : 'organization',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [userMessage],
      };
    } else {
      const existingMsgs = Array.isArray(targetConv.messages) ? targetConv.messages : [];
      targetConv = {
        ...targetConv,
        messages: [...existingMsgs, userMessage],
      };
    }
    setCurrentConv(targetConv);

    const convId = targetConv.id;
    const isUuid = typeof convId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(convId);
    let activeStreamConvId = convId;

    if (activeStreamConvId) {
      addStreamingChatId(activeStreamConvId);
    }

    let accumulatedResponse = '';

    try {
      const getAuthHeaderToken = () => {
        const token = localStorage.getItem('auren_token');
        if (token) return token;
        const mockUser = {
          id: 'user-northstar-praman',
          email: 'praman.bhogal@northstar-test.local',
          organizationId: 'org-northstar-technologies',
          role: 'Senior Backend Engineer',
        };
        const jsonStr = JSON.stringify(mockUser);
        return typeof window !== 'undefined' && typeof btoa === 'function'
          ? btoa(unescape(encodeURIComponent(jsonStr)))
          : String(jsonStr);
      };

      const response = await fetch('/api/v1/chat/stream', {
        signal: abortController.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthHeaderToken()}`,
        },
        body: JSON.stringify({
          message: query,
          conversationId: isUuid ? convId : undefined,
          mode: activeScope === 'personal' ? 'local' : 'hybrid',
          executionMode: 'AUTO',
          useKnowledgeBase: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Streaming failed: HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const rawChunk = decoder.decode(value);
        const lines = rawChunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'retrieval_started' && data.data?.conversationId) {
                const realId = data.data.conversationId;
                if (activeStreamConvId && activeStreamConvId !== realId) {
                  removeStreamingChatId(activeStreamConvId);
                }
                activeStreamConvId = realId;
                addStreamingChatId(realId);
                setCurrentConv((prev) => (prev ? { ...prev, id: realId } : {
                  id: realId,
                  title: query.substring(0, 30),
                  scope: activeScope === 'personal' ? 'personal' : 'organization',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  messages: [userMessage],
                }));
                onSelectConversation(realId);
                useChatStore.getState().setActiveConversationId(realId);
                navigate('/chat', { replace: true, state: { conversationId: realId } });
                onRefreshConversations?.();
                window.dispatchEvent(new CustomEvent('auren:refresh-conversations'));
              } else if (data.type === 'token') {
                const tokenStr = typeof data.data === 'string' ? data.data : (data.text || data.token || '');
                accumulatedResponse += tokenStr;
                setStreamingText(accumulatedResponse);
              } else if (data.type === 'sources' || data.type === 'citations') {
                const citations = data.data || data.sources || data.citations;
                if (Array.isArray(citations)) {
                  setActiveCitations(citations);
                }
              } else if (data.type === 'citation' && (data.citation || data.data)) {
                const c = data.citation || data.data;
                setActiveCitations((prev) => [...prev, c]);
              } else if (data.type === 'init' && data.citations) {
                setActiveCitations(data.citations);
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      // Append assistant message to local conversation state
      if (accumulatedResponse) {
        const assistantMessage: ChatMessage = {
          id: `msg_ast_${Date.now()}`,
          role: 'assistant',
          content: accumulatedResponse,
          timestamp: new Date().toISOString(),
          sources: activeCitations,
        };
        setCurrentConv((prev) => {
          if (!prev) return null;
          const existing = Array.isArray(prev.messages) ? prev.messages : [];
          return { ...prev, messages: [...existing, assistantMessage] };
        });
      }

      // Refresh conversation list from backend
      onRefreshConversations?.();
      window.dispatchEvent(new CustomEvent('auren:refresh-conversations'));
      try {
        const updatedList = await api.getConversations();
        const fresh = updatedList.find((c) => c.id === convId || c.id === activeStreamConvId) || updatedList[0];
        if (fresh) {
          const fullDetails = await api.getConversation(fresh.id).catch(() => fresh);
          setCurrentConv(fullDetails);
          if (fresh.id !== activeConversationId) {
            onSelectConversation(fresh.id);
          }
        }
      } catch (refreshErr) {
        console.warn('Conversation refresh notice:', refreshErr);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.name === 'Canceled' || err.message?.includes('aborted')) {
        console.log('Response generation aborted by user.');
        // Save partial response if present
        if (accumulatedResponse) {
          const assistantMessage: ChatMessage = {
            id: `msg_ast_${Date.now()}`,
            role: 'assistant',
            content: accumulatedResponse,
            timestamp: new Date().toISOString(),
            sources: activeCitations,
          };
          setCurrentConv((prev) => {
            if (!prev) return null;
            const existing = Array.isArray(prev.messages) ? prev.messages : [];
            return { ...prev, messages: [...existing, assistantMessage] };
          });
        }
      } else {
        console.error('Streaming error:', err);
        setStreamingText((prev) => prev || `Notice: Could not connect to AI engine (${err?.message || err}).`);
      }
    } finally {
      if (activeStreamConvId) {
        removeStreamingChatId(activeStreamConvId);
      }
      abortControllerRef.current = null;
      setIsStreaming(false);
      setGlobalStreaming(false);
      setStreamingText('');
      setAttachedDocs([]);
    }
  };

  const hasMessages = Boolean(
    (currentConv && currentConv.messages && Array.isArray(currentConv.messages) && currentConv.messages.length > 0) || streamingText
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
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 min-w-0"
            >
              <div className="max-w-3xl lg:max-w-3.5xl mx-auto space-y-8 min-w-0">
                {(currentConv?.messages || []).map((msg: ChatMessage) => (
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

            {/* Floating Jump to Bottom Button when scrolled up */}
            {isUserScrolledUp && (
              <button
                type="button"
                onClick={scrollToBottomSmooth}
                className="absolute bottom-24 right-8 z-20 px-3.5 py-1.5 rounded-full bg-neutral-900/90 dark:bg-neutral-100/90 text-white dark:text-neutral-900 text-xs font-semibold shadow-lg hover:bg-neutral-800 dark:hover:bg-white transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-xs"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Scroll to bottom</span>
              </button>
            )}

            {/* Bottom Composer */}
            <ChatComposer
              inputMessage={inputMessage}
              onInputChange={setInputMessage}
              onSend={handleSendMessage}
              onStop={handleStopGeneration}
              isStreaming={isStreamingActive}
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
              onStop={handleStopGeneration}
              isStreaming={isStreamingActive}
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
