import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Edit2,
  Check,
  X,
  MoreHorizontal,
  Pin,
  PinOff,
  Trash2,
  FileText,
  PanelLeftClose,
  PanelLeft,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import type { ChatConversation } from '../../types';

interface ChatHeaderProps {
  conversation: ChatConversation | null;
  sourcesCount: number;
  onToggleSources: () => void;
  isSourcesOpen: boolean;
  onRenameConversation?: (id: string, newTitle: string) => void;
  onTogglePinConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onOpenMobileNav?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onBack?: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  sourcesCount,
  onToggleSources,
  isSourcesOpen,
  onRenameConversation,
  onTogglePinConversation,
  onDeleteConversation,
  onOpenMobileNav,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onBack,
  onNavigateTab,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartRename = () => {
    if (conversation) {
      setEditingTitle(conversation.title);
      setIsRenaming(true);
      setIsMoreMenuOpen(false);
    }
  };

  const handleSaveRename = () => {
    if (conversation && editingTitle.trim() && onRenameConversation) {
      onRenameConversation(conversation.id, editingTitle.trim());
    }
    setIsRenaming(false);
  };

  const currentTitle = conversation?.title || 'Architecture Inquiry';

  return (
    <header className="h-14 px-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between shrink-0 z-20 select-none">
      {/* Left side: Sidebar toggle | Back button | Breadcrumbs / Title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="md:hidden p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Open Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden md:flex p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title={isSidebarCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('documents')}
            className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            Workspace
          </button>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          <span className="font-medium text-neutral-600 dark:text-neutral-400">
            Assistant
          </span>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
        </nav>

        {/* Conversation Title & Rename Input */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isRenaming ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <input
                ref={renameInputRef}
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') setIsRenaming(false);
                }}
                className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 rounded px-2 py-1 outline-none font-medium min-w-0 w-48 sm:w-64"
              />
              <button
                type="button"
                onClick={handleSaveRename}
                className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {currentTitle}
              </h2>
              {conversation?.pinned && (
                <span title="Pinned conversation">
                  <Pin className="w-3 h-3 text-amber-500 shrink-0" />
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Sources drawer trigger & More actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Sources button */}
        <button
          type="button"
          onClick={onToggleSources}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
            isSourcesOpen
              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Sources</span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/10 dark:bg-white/20">
            {sourcesCount}
          </span>
        </button>

        {/* More options menu */}
        {conversation && (
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg py-1 z-30 text-xs">
                <button
                  type="button"
                  onClick={handleStartRename}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Rename thread</span>
                </button>

                {onTogglePinConversation && (
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePinConversation(conversation.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left cursor-pointer"
                  >
                    {conversation.pinned ? (
                      <>
                        <PinOff className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Unpin thread</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Pin thread</span>
                      </>
                    )}
                  </button>
                )}

                {onDeleteConversation && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteConversation(conversation.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left cursor-pointer border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete conversation</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
