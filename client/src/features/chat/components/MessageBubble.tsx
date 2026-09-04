import React from 'react';
import { Sparkles, User, FileText, Globe, ChevronRight, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { ChatMessage } from '../store/useChatStore';
import { chatService } from '../services/chatService';
import { useDocumentStore } from '../../documents/store/useDocumentStore';

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

          {/* Ambiguity Clarification Options */}
          {!isUser && message.clarification?.options && message.clarification.options.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.clarification.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    chatService.streamChat(opt.label);
                  }}

                  className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>{opt.label}</span>
                  {opt.description && (
                    <span className="text-[10px] text-blue-500 font-normal">({opt.description})</span>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Active Tool Call Indicator / Status */}
          {!isUser && message.activeTool && (() => {
            const rawInternal = (message.sources || []).filter(s => s.type === 'internal' || !!s.documentId);
            const docMap = new Map<string, string>();
            rawInternal.forEach(s => {
              const k = s.documentId || s.title || 'doc';
              docMap.set(k, s.documentName || s.title || 'Document');
            });
            const uniqueDocCount = docMap.size;

            return (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200 text-xs font-medium text-slate-700">
                {message.activeTool.name === 'internal_knowledge' || (uniqueDocCount > 0 && message.activeTool.name !== 'web_search') ? (
                  message.activeTool.status === 'running' ? (
                    <>
                      <Sparkles size={14} className="text-emerald-600 animate-spin" />
                      <span>Searching organization knowledge...</span>
                    </>
                  ) : (
                    <>
                      <FileText size={14} className="text-emerald-600" />
                      <span>Found {uniqueDocCount || message.activeTool.resultCount || 0} relevant organization document(s)</span>
                    </>
                  )
                ) : message.activeTool.name === 'web_search' ? (
                  message.activeTool.status === 'running' ? (
                    <>
                      <Sparkles size={14} className="text-blue-600 animate-spin" />
                      <span>{message.activeTool.stepLabel || 'Searching the web...'}</span>
                    </>
                  ) : message.activeTool.status === 'blocked' ? (
                    <>
                      <Globe size={14} className="text-amber-500" />
                      <span className="text-amber-700">Real-time web search disabled in Local mode.</span>
                    </>
                  ) : (
                    <>
                      <Globe size={14} className="text-blue-600" />
                      <span>Found {message.activeTool.resultCount ?? 0} web sources</span>
                    </>
                  )
                ) : (
                  <>
                    <Sparkles size={14} className="text-blue-600" />
                    <span>Executing tool: <strong>{message.activeTool.name}</strong></span>
                  </>
                )}
              </div>
            );
          })()}

          {/* Sources / Citations */}
          {!isUser && message.sources && message.sources.length > 0 && (() => {
            const webSources = message.sources.filter(s => s.type === 'web' || (!!s.url && !s.documentId));
            const rawInternal = message.sources.filter(s => s.type === 'internal' || !!s.documentId);

            interface GroupedDoc {
              documentId?: string;
              title: string;
              chunks: Array<{ chunkIndex?: number; snippet?: string }>;
            }

            const internalMap = new Map<string, GroupedDoc>();

            for (const s of rawInternal) {
              const key = s.documentId || s.title || 'doc';
              let rawTitle = s.title || s.documentName || 'Internal Document';
              if (rawTitle === 'Full Document' || rawTitle.includes('Full Document')) {
                rawTitle = s.documentName || 'Internal Document';
              }
              const cleanTitle = rawTitle.replace(/^svg+/i, '').replace(/svg$/i, '').trim() || 'Internal Document';

              if (!internalMap.has(key)) {
                internalMap.set(key, {
                  documentId: s.documentId,
                  title: cleanTitle,
                  chunks: []
                });
              }
              internalMap.get(key)!.chunks.push({
                chunkIndex: s.chunkIndex,
                snippet: s.snippet
              });
            }

            const groupedInternal = Array.from(internalMap.values());

            return (
              <div className="mt-3 w-full">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-sans">
                  {groupedInternal.length > 0 && (
                    <span className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      📚 Organization knowledge ({groupedInternal.length})
                    </span>
                  )}
                  {webSources.length > 0 && (
                    <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      🌐 Web Sources ({webSources.length})
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Grouped Internal Organization Documents */}
                  {groupedInternal.map((doc, idx) => (
                    <button
                      key={doc.documentId || `int-doc-${idx}`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (doc.documentId) {
                          useDocumentStore.getState().setSelectedDocument(doc.documentId);
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer group border border-emerald-200 bg-emerald-50/60 text-slate-800 hover:bg-emerald-100/80 hover:border-emerald-300 shadow-2xs"
                      title={doc.title}
                    >
                      <FileText size={14} className="text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[220px] font-semibold text-slate-800 group-hover:text-emerald-900 transition-colors">
                        {doc.title}
                      </span>
                      {doc.chunks.length > 1 && (
                        <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-medium">
                          {doc.chunks.length} chunks
                        </span>
                      )}
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}

                  {/* Web Sources */}
                  {webSources.map((source, idx) => {
                    const rawTitle = source.title || source.source || 'Web Result';
                    const displayTitle = rawTitle.replace(/^svg+/i, '').replace(/svg$/i, '').trim() || 'Web Reference';

                    return (
                      <a
                        key={`web-doc-${idx}`}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer group border border-blue-200 bg-blue-50/70 text-blue-800 hover:bg-blue-100 shadow-2xs no-underline"
                        title={source.snippet || displayTitle}
                      >
                        <Globe size={14} className="text-blue-600 shrink-0" />
                        <span className="truncate max-w-[220px]">{displayTitle}</span>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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

