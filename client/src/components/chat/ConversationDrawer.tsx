import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  Check,
  Search,
} from 'lucide-react';
import type { ChatConversation } from '../../types';

interface ConversationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ChatConversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  onDeleteConversation?: (id: string) => void;
  onTogglePinConversation?: (id: string) => void;
}

export const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onTogglePinConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (renamingId) {
          setRenamingId(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, renamingId, onClose]);

  const handleStartRename = (conv: ChatConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (editingTitle.trim() && onRenameConversation) {
      onRenameConversation(id, editingTitle.trim());
    }
    setRenamingId(null);
  };

  if (!isOpen) return null;

  const filteredConversations = (conversations || []).filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group into Pinned, Today, Yesterday, Older
  const pinned = (filteredConversations || []).filter((c) => c.pinned);
  const unpinned = (filteredConversations || []).filter((c) => !c.pinned);

  const now = new Date();
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const isYesterday = (dateStr: string) => {
    const d = new Date(dateStr);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()
    );
  };

  const todayList = (unpinned || []).filter((c) => isToday(c.updatedAt || c.createdAt));
  const yesterdayList = (unpinned || []).filter((c) => isYesterday(c.updatedAt || c.createdAt));
  const olderList = (unpinned || []).filter(
    (c) => !isToday(c.updatedAt || c.createdAt) && !isYesterday(c.updatedAt || c.createdAt)
  );

  const renderConvItem = (c: ChatConversation) => {
    const isActive = activeConversationId === c.id;
    const isRenaming = renamingId === c.id;

    return (
      <div
        key={c.id}
        onClick={() => {
          if (!isRenaming) {
            onSelectConversation(c.id);
            onClose();
          }
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${
          isActive
            ? 'bg-neutral-200/70 dark:bg-[#1E2026] text-neutral-900 dark:text-white font-medium shadow-2xs'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
        }`}
      >
        {isRenaming ? (
          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
            <input
              ref={renameInputRef}
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(c.id);
                if (e.key === 'Escape') setRenamingId(null);
              }}
              className="flex-1 bg-white dark:bg-[#121316] border border-neutral-300 dark:border-neutral-700 rounded px-2 py-0.5 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={(e) => handleSaveRename(c.id, e)}
              className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setRenamingId(null)}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
              <span className="truncate">{c.title}</span>
            </div>

            {/* Hover Actions */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
              {onTogglePinConversation && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePinConversation(c.id);
                  }}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    c.pinned
                      ? 'text-blue-500 hover:text-blue-600'
                      : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                  }`}
                  title={c.pinned ? 'Unpin' : 'Pin to top'}
                >
                  {c.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                </button>
              )}

              <button
                type="button"
                onClick={(e) => handleStartRename(c, e)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors cursor-pointer"
                title="Rename"
              >
                <Edit2 className="w-3 h-3" />
              </button>

              {onDeleteConversation && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(c.id);
                  }}
                  className="p-1 text-neutral-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/30 dark:bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="fixed top-0 left-0 md:left-52 lg:left-56 z-50 h-screen w-80 max-w-[85vw] bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-xl flex flex-col transition-transform duration-200 ease-out select-none">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Conversations
            </h2>
            <span className="text-[11px] font-mono text-neutral-400">
              ({conversations.length})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Start New Chat"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search filter if many */}
        {conversations.length > 4 && (
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50 text-xs">
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conversation Groups List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {/* 1. Pinned */}
          {pinned.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                <Pin className="w-2.5 h-2.5 rotate-45 text-blue-500" />
                <span>Pinned</span>
              </div>
              {pinned.map(renderConvItem)}
            </div>
          )}

          {/* 2. Today */}
          {todayList.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-0.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Today
              </div>
              {todayList.map(renderConvItem)}
            </div>
          )}

          {/* 3. Yesterday */}
          {yesterdayList.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-0.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Yesterday
              </div>
              {yesterdayList.map(renderConvItem)}
            </div>
          )}

          {/* 4. Older */}
          {olderList.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-0.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Previous
              </div>
              {olderList.map(renderConvItem)}
            </div>
          )}

          {filteredConversations.length === 0 && (
            <div className="py-12 text-center text-xs text-neutral-400 italic">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
