import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  AtSign,
  Sparkles,
  Scale,
  ListTodo,
  X,
  FileText,
  Code2,
  Users,
  Building2,
  Bot,
  Search,
} from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { useAuth } from '../../context/AuthContext';
import { AttachedKnowledgeItem, CollaborationMessage } from '../../types/collaboration';
import { AurenDocument } from '../../types';
import { DEFAULT_DEPARTMENTS } from '../../services/rbacData';

interface CollaborationComposerProps {
  documents: AurenDocument[];
  onOpenCreateDecision?: () => void;
  onOpenCreateActionItem?: () => void;
  initialAttachedDoc?: AurenDocument | null;
  onClearInitialDoc?: () => void;
  placeholder?: string;
}

export const CollaborationComposer: React.FC<CollaborationComposerProps> = ({
  documents,
  onOpenCreateDecision,
  onOpenCreateActionItem,
  initialAttachedDoc,
  onClearInitialDoc,
  placeholder,
}) => {
  const { sendMessage, activeChannel, sendAurenInquiry } = useCollaboration();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [attachedKnowledge, setAttachedKnowledge] = useState<AttachedKnowledgeItem[]>([]);
  const [showKnowledgeSelector, setShowKnowledgeSelector] = useState(false);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionTab, setMentionTab] = useState<'people' | 'departments' | 'knowledge' | 'ai'>('people');
  const [knowledgeSearch, setKnowledgeSearch] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // If a document was passed from DocumentDetailModal ("Discuss in Chat")
  useEffect(() => {
    if (initialAttachedDoc) {
      setAttachedKnowledge((prev) => {
        if (prev.some((k) => k.id === initialAttachedDoc.id)) return prev;
        return [
          ...prev,
          {
            id: initialAttachedDoc.id,
            title: initialAttachedDoc.title,
            filename: initialAttachedDoc.filename,
            type: initialAttachedDoc.type,
            department: initialAttachedDoc.scope === 'organization' ? 'Enterprise' : 'Personal',
            summary: initialAttachedDoc.title,
            fileSize: initialAttachedDoc.fileSize,
          },
        ];
      });
      onClearInitialDoc && onClearInitialDoc();
    }
  }, [initialAttachedDoc, onClearInitialDoc]);

  const handleSend = () => {
    if (!text.trim() && attachedKnowledge.length === 0) return;

    sendMessage(text, attachedKnowledge.length > 0 ? attachedKnowledge : undefined);
    setText('');
    setAttachedKnowledge([]);
    setShowMentionPopup(false);
    setShowKnowledgeSelector(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === '@') {
      setShowMentionPopup(true);
    }
  };

  const attachDoc = (doc: AurenDocument) => {
    if (!attachedKnowledge.some((k) => k.id === doc.id)) {
      setAttachedKnowledge([
        ...attachedKnowledge,
        {
          id: doc.id,
          title: doc.title,
          filename: doc.filename,
          type: doc.type,
          department: doc.scope === 'organization' ? 'Enterprise' : 'Personal',
          summary: doc.title,
          fileSize: doc.fileSize,
        },
      ]);
    }
    setShowKnowledgeSelector(false);
  };

  const removeDoc = (id: string) => {
    setAttachedKnowledge(attachedKnowledge.filter((k) => k.id !== id));
  };

  const insertMention = (mentionText: string) => {
    setText((prev) => (prev.endsWith('@') ? prev.slice(0, -1) + mentionText + ' ' : prev + mentionText + ' '));
    setShowMentionPopup(false);
    textareaRef.current?.focus();
  };

  const filteredDocs = (documents || []).filter(
    (d) =>
      d.title.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
      d.filename.toLowerCase().includes(knowledgeSearch.toLowerCase())
  );

  const peopleList = [
    { name: 'Elena Vance', role: 'Super Admin & CISO', department: 'Executive Security' },
    { name: 'Praman Singh Bhogal', role: 'Architecture Lead', department: 'Core Architecture' },
    { name: 'Marcus Vance', role: 'Senior Infrastructure', department: 'Platform Engineering' },
    { name: 'Chloe Zhang', role: 'Junior Backend', department: 'Platform Engineering' },
    { name: 'Aarav Patel', role: 'Lead Security Auditor', department: 'Security & Compliance' },
    { name: 'Maya Lin', role: 'Senior Product Designer', department: 'Product & Design' },
  ];

  return (
    <div className="p-3 border-t border-neutral-200/70 dark:border-neutral-800/80 bg-white/80 dark:bg-[#121316]/80 backdrop-blur-md shrink-0 relative">
      {/* Attached Knowledge Pills */}
      {attachedKnowledge.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {attachedKnowledge.map((k) => (
            <div
              key={k.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 shadow-2xs"
            >
              {k.type === 'code' ? (
                <Code2 className="w-3.5 h-3.5 text-neutral-500" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
              )}
              <span className="font-medium truncate max-w-xs">{k.title}</span>
              <button
                type="button"
                onClick={() => removeDoc(k.id)}
                className="hover:text-rose-500 transition-colors p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Box */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-[#18191E] focus-within:border-neutral-400 dark:focus-within:border-neutral-500 transition-all p-2 flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ||
            `Message #${activeChannel?.name || 'channel'}... (Type @ to mention people, knowledge, or @AUREN)`
          }
          rows={2}
          className="w-full bg-transparent text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none resize-none leading-relaxed"
        />

        {/* Action Controls & Triggers */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-200/50 dark:border-neutral-800/60">
          <div className="flex items-center gap-1 flex-wrap">
            {/* Attach Knowledge Button */}
            <button
              type="button"
              onClick={() => {
                setShowKnowledgeSelector(!showKnowledgeSelector);
                setShowMentionPopup(false);
              }}
              className="px-2 py-1 rounded text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Attach Knowledge</span>
            </button>

            {/* Mention Button */}
            <button
              type="button"
              onClick={() => {
                setShowMentionPopup(!showMentionPopup);
                setShowKnowledgeSelector(false);
              }}
              className="px-2 py-1 rounded text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <AtSign className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Mention</span>
            </button>

            {/* Quick Ask AUREN Button */}
            <button
              type="button"
              onClick={() => {
                setText((prev) => (prev ? prev + ' @AUREN ' : '@AUREN '));
                textareaRef.current?.focus();
              }}
              className="px-2 py-1 rounded text-xs text-purple-700 dark:text-purple-400 hover:bg-purple-100/60 dark:hover:bg-purple-950/40 transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AUREN</span>
            </button>

            {/* Create Decision Button */}
            {onOpenCreateDecision && (
              <button
                type="button"
                onClick={onOpenCreateDecision}
                title="Record Organization Decision"
                className="hidden md:flex items-center gap-1 px-2 py-1 rounded text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                <span className="font-medium">Decision</span>
              </button>
            )}

            {/* Create Action Item Button */}
            {onOpenCreateActionItem && (
              <button
                type="button"
                onClick={onOpenCreateActionItem}
                title="Create Action Item"
                className="hidden md:flex items-center gap-1 px-2 py-1 rounded text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <ListTodo className="w-3.5 h-3.5" />
                <span className="font-medium">Action</span>
              </button>
            )}
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() && attachedKnowledge.length === 0}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
          >
            <span>Send</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Searchable Knowledge Selector Modal / Popup */}
      {showKnowledgeSelector && (
        <div className="absolute left-4 bottom-20 w-80 sm:w-96 rounded-xl bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-700 shadow-xl p-3 z-30 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-xs font-bold text-neutral-900 dark:text-white">
              Attach Organization Knowledge
            </span>
            <button
              type="button"
              onClick={() => setShowKnowledgeSelector(false)}
              className="text-neutral-400 hover:text-neutral-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search documents, specifications, code..."
              value={knowledgeSearch}
              onChange={(e) => setKnowledgeSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-1 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => attachDoc(doc)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center justify-between gap-2 text-left transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {doc.type === 'code' ? (
                    <Code2 className="w-4 h-4 text-neutral-500 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                      {doc.title}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-mono truncate">{doc.filename}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 shrink-0">{doc.fileSize}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mention Popup Categorized: People, Departments, Knowledge, AI */}
      {showMentionPopup && (
        <div className="absolute left-16 bottom-20 w-80 rounded-xl bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-700 shadow-xl p-2 z-30 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMentionTab('people')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                  mentionTab === 'people'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                People
              </button>
              <button
                type="button"
                onClick={() => setMentionTab('departments')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                  mentionTab === 'departments'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Departments
              </button>
              <button
                type="button"
                onClick={() => setMentionTab('knowledge')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                  mentionTab === 'knowledge'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Knowledge
              </button>
              <button
                type="button"
                onClick={() => setMentionTab('ai')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                  mentionTab === 'ai'
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-600 hover:bg-purple-50'
                }`}
              >
                @AUREN
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowMentionPopup(false)}
              className="text-neutral-400 hover:text-neutral-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {mentionTab === 'people' &&
              peopleList.map((p) => (
                <div
                  key={p.name}
                  onClick={() => insertMention(`@${p.name}`)}
                  className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-neutral-900 dark:text-white">{p.name}</span>
                  <span className="text-[10px] text-neutral-400">{p.department}</span>
                </div>
              ))}

            {mentionTab === 'departments' &&
              DEFAULT_DEPARTMENTS.map((dept) => (
                <div
                  key={dept}
                  onClick={() => insertMention(`@${dept}`)}
                  className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center gap-2 text-xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="font-medium text-neutral-900 dark:text-white">{dept}</span>
                </div>
              ))}

            {mentionTab === 'knowledge' &&
              documents.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => insertMention(`@doc:${doc.title}`)}
                  className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center gap-2 text-xs truncate"
                >
                  <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate font-medium text-neutral-900 dark:text-white">
                    {doc.title}
                  </span>
                </div>
              ))}

            {mentionTab === 'ai' && (
              <div
                onClick={() => insertMention('@AUREN')}
                className="p-2 rounded bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 cursor-pointer flex items-center gap-2 text-xs"
              >
                <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="font-bold text-purple-700 dark:text-purple-300">@AUREN AI Assistant</p>
                  <p className="text-[10px] text-neutral-500">Autonomous enterprise knowledge engine</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
