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
import { ChatConversation } from '../../types';

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

  const currentTitle = conversation?.title || 'Q2 Architecture Review';
  const currentScope = conversation?.scope === 'personal' ? 'Personal' : 'Organization';

  return (
    <header className="h-14 px-4 md:px-6 border-b border-neutral-200/60 dark:border-neutral-800/80 bg-white/90 dark:bg-[#0D0E10]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-20 select-none">
      {/* Left side: Sidebar toggle | Back button | Breadcrumbs / Title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Mobile menu button (hidden on desktop) */}
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="md:hidden p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Open Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Desktop Sidebar Collapse Toggle */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden md:flex p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer shrink-0"
            title={isSidebarCollapsed ? 'Expand navigation sidebar (⌘B)' : 'Collapse navigation sidebar (⌘B)'}
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Back Button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        {/* Breadcrumb Hierarchy */}
        <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('library')}
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

        {/* Title and Edit */}
        {isRenaming ? (
          <div className="flex items-center gap-1 min-w-0 max-w-sm">
            <input
              ref={renameInputRef}
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-0.5 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 w-full"
            />
            <button
              type="button"
              onClick={handleSaveRename}
              className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsRenaming(false)}
              className="p-1 text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <h1
              className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 truncate cursor-pointer hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              onClick={handleStartRename}
              title="Click to rename"
            >
              {currentTitle}
            </h1>

            <button
              type="button"
              onClick={handleStartRename}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors cursor-pointer shrink-0"
              title="Rename conversation"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            {/* Scope Badge */}
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 px-2 py-0.5 rounded-full border border-neutral-200/60 dark:border-neutral-700/60 shrink-0">
              {currentScope}
            </span>
          </div>
        )}
      </div>

      {/* Far Right: Sources X | More */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Sources Button */}
        <button
          type="button"
          onClick={onToggleSources}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            isSourcesOpen
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-2xs'
              : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/80 hover:bg-neutral-200/60 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60'
          }`}
          title="Toggle Source Citations Drawer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Sources</span>
          <span className="font-mono text-[11px] opacity-80">{sourcesCount}</span>
        </button>

        {/* More Dropdown Menu */}
        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="More conversation options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMoreMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-44 p-1 rounded-xl bg-white dark:bg-[#16171B] border border-neutral-200/80 dark:border-neutral-800 shadow-xl z-30 flex flex-col gap-0.5 animate-fadeIn">
              {conversation && onTogglePinConversation && (
                <button
                  type="button"
                  onClick={() => {
                    onTogglePinConversation(conversation.id);
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                >
                  {conversation.pinned ? (
                    <>
                      <PinOff className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Unpin conversation</span>
                    </>
                  ) : (
                    <>
                      <Pin className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Pin conversation</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleStartRename}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>Rename title</span>
              </button>

              {conversation && onDeleteConversation && (
                <>
                  <div className="border-t border-neutral-100 dark:border-neutral-800 my-0.5" />
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteConversation(conversation.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete conversation</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
