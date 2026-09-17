import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Layers,
  Search,
  Settings,
  Plus,
  Moon,
  Sun,
  User,
  LogOut,
  Sparkles,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  Check,
  X,
  MessageSquare,
  ShieldCheck,
  Crown,
  Users,
  PanelLeftClose,
  Cpu,
  Network,
  Bot,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { NavigationTab, ChatConversation } from '../../types';

interface LeftRailProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onNewChat: () => void;
  conversations?: ChatConversation[];
  activeConversationId?: string;
  onSelectConversation?: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  onDeleteConversation?: (id: string) => void;
  onTogglePinConversation?: (id: string) => void;
  onOpenOnboarding?: () => void;
  onSignOut?: () => void;
  unreadNotificationsCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  activeTab,
  onTabChange,
  onNewChat,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onTogglePinConversation,
  onOpenOnboarding,
  onSignOut,
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user, personas, switchPersona } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuperAdminUser = Boolean(user?.role === 'super_admin' || user?.isSuperAdmin);

  const navItems = [
    { id: 'library' as NavigationTab, label: 'Library', icon: <BookOpen className="w-4 h-4" /> },
    {
      id: 'collaboration' as NavigationTab,
      label: 'Collaboration',
      icon: <MessageSquare className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />,
      badge: 'Live',
    },
    {
      id: 'agents' as NavigationTab,
      label: 'Agents',
      icon: <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      badge: 'Governed',
    },
    { id: 'connectors' as NavigationTab, label: 'Connectors', icon: <Layers className="w-4 h-4" /> },
    { id: 'rbac' as NavigationTab, label: 'Clearance & RBAC', icon: <ShieldCheck className="w-4 h-4" /> },
    {
      id: 'architecture-reviewer' as NavigationTab,
      label: 'Architecture Reviewer',
      icon: <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      badge: 'Agent',
    },
    {
      id: 'knowledge-curator' as NavigationTab,
      label: 'Knowledge Curator',
      icon: <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      badge: 'Agent',
    },
    {
      id: 'organizational-memory' as NavigationTab,
      label: 'Org Memory Graph',
      icon: <Network className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      badge: 'Graph',
    },
    ...(isSuperAdminUser
      ? [
          {
            id: 'super-admin' as NavigationTab,
            label: 'Super Admin',
            icon: <Crown className="w-4 h-4 text-amber-500" />,
            badge: 'Admin',
          },
        ]
      : []),
    { id: 'search' as NavigationTab, label: 'Search', icon: <Search className="w-4 h-4" /> },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectConv = (id: string) => {
    if (onSelectConversation) {
      onSelectConversation(id);
    }
    if (onCloseMobile) onCloseMobile();
  };

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

  if (isCollapsed && !isMobileOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 md:w-56 lg:w-60 bg-[#FBFBFB] dark:bg-[#0E0F12] border-r border-neutral-200/70 dark:border-neutral-800/80 flex flex-col justify-between p-3.5 transition-transform duration-200 ease-in-out select-none shrink-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Segment: Brand & Action & Nav & Chats */}
        <div className="flex flex-col gap-3 min-h-0 flex-1">
          {/* Logo & Brand & Collapse Button */}
          <div className="flex items-center justify-between px-1.5 pt-1 pb-0.5">
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => handleNavClick('collaboration')}
            >
              <div className="w-7 h-7 rounded-lg bg-[#18181B] dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs tracking-wider shadow-xs transition-transform group-hover:scale-105">
                A
              </div>
              <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
                AUREN
              </span>
            </div>

            {/* Close / Collapse Sidebar button */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden md:flex p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Collapse sidebar (⌘B)"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* New Chat Primary Action */}
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="w-full justify-start pl-3 font-medium text-xs tracking-wide cursor-pointer shrink-0"
            onClick={() => {
              onNewChat();
              if (onCloseMobile) onCloseMobile();
            }}
          >
            New Chat
          </Button>

          {/* Primary Navigation: Home, Library, Connectors, Search, Settings */}
          <nav className="flex flex-col gap-0.5 mt-0.5 shrink-0" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive =
                activeTab === item.id || (item.id === 'connectors' && activeTab === 'connectors/github');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100/80 dark:hover:bg-neutral-900/60'
                  }`}
                >
                  <span
                    className={`${
                      isActive
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="border-t border-neutral-200/60 dark:border-neutral-800/80 my-0.5 shrink-0" />

          {/* Chats Section: Listed directly in main sidebar below settings */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between px-2.5 py-1 shrink-0">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Chats
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                {conversations.length}
              </span>
            </div>

            {/* Scrollable Conversation List */}
            <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 mt-0.5">
              {conversations.length === 0 ? (
                <div className="px-2.5 py-4 text-center text-xs text-neutral-400 italic">
                  No chats yet
                </div>
              ) : (
                conversations.map((c) => {
                  const isChatActive = activeTab === 'chat' && activeConversationId === c.id;
                  const isRenaming = renamingId === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        if (!isRenaming) {
                          handleSelectConv(c.id);
                        }
                      }}
                      className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                        isChatActive
                          ? 'bg-neutral-200/80 dark:bg-[#1C1E23] text-neutral-900 dark:text-white font-medium shadow-2xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100/80 dark:hover:bg-neutral-900/60'
                      }`}
                    >
                      {isRenaming ? (
                        <div
                          className="flex items-center gap-1 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(c.id);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            className="flex-1 bg-white dark:bg-[#121316] border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-0.5 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleSaveRename(c.id, e)}
                            className="p-0.5 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingId(null)}
                            className="p-0.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                            {c.pinned && (
                              <Pin className="w-2.5 h-2.5 text-blue-500 shrink-0 rotate-45" />
                            )}
                            <span className="truncate">{c.title}</span>
                          </div>

                          {/* Hover action buttons */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                            {onTogglePinConversation && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTogglePinConversation(c.id);
                                }}
                                className={`p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                                  c.pinned
                                    ? 'text-blue-500'
                                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                                }`}
                                title={c.pinned ? 'Unpin' : 'Pin'}
                              >
                                {c.pinned ? (
                                  <PinOff className="w-3 h-3" />
                                ) : (
                                  <Pin className="w-3 h-3" />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleStartRename(c, e)}
                              className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
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
                                className="p-0.5 text-neutral-400 hover:text-rose-500 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
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
                })
              )}
            </div>
          </div>
        </div>

        {/* Bottom Segment: Theme Toggle & User Profile Popover */}
        <div
          className="relative flex flex-col gap-2 pt-2.5 border-t border-neutral-200/60 dark:border-neutral-800/80 shrink-0"
          ref={profileMenuRef}
        >
          {/* Theme Switcher Row */}
          <div className="flex items-center justify-between px-2 py-0.5">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
              Theme
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {isDark ? (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Light</span>
                </>
              )}
            </button>
          </div>

          {/* Profile Menu Popover Overlay */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-16 left-0 w-64 md:w-72 p-2.5 rounded-2xl bg-white dark:bg-[#16171B] border border-neutral-200/80 dark:border-neutral-800 shadow-xl flex flex-col gap-2 z-50 animate-fadeIn">
              <div className="flex flex-col px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {user?.name || 'Praman Singh Bhogal'}
                  </span>
                  {user?.role === 'super_admin' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 shrink-0">
                      <Crown className="w-2.5 h-2.5" />
                      Super Admin
                    </span>
                  ) : user?.role === 'dept_head' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 shrink-0">
                      Dept Head
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-400 capitalize">{user?.role || 'Member'}</span>
                  )}
                </div>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                  {user?.email || 'praman@example.com'}
                </span>
                <span className="text-[10px] text-neutral-400 truncate">
                  {user?.department || 'Core Architecture'}
                </span>
              </div>

              {/* Fast Persona Switcher (Super Admin vs Dept Head) */}
              {personas && personas.length > 0 && (
                <div className="px-2 py-1 bg-neutral-50 dark:bg-[#111215] rounded-xl border border-neutral-100 dark:border-neutral-800/80">
                  <div className="flex items-center justify-between mb-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-neutral-400" />
                      Switch Role Context
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                    {personas.map((p) => {
                      const isCurrent = user?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            switchPersona(p.id);
                            setIsProfileMenuOpen(false);
                          }}
                          className={`flex items-center gap-2 p-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-white dark:bg-neutral-800 font-medium shadow-2xs text-neutral-900 dark:text-white'
                              : 'hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          <img
                            src={p.avatarUrl}
                            alt={p.name}
                            className="w-5 h-5 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium truncate">{p.name}</span>
                              {p.role === 'super_admin' ? (
                                <Crown className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                              ) : null}
                            </div>
                            <span className="text-[9px] text-neutral-400 truncate">
                              {p.role === 'super_admin'
                                ? 'Super Admin'
                                : p.role === 'dept_head'
                                ? `Head of ${p.department}`
                                : p.department}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onTabChange('profile');
                    setIsProfileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Profile & Context</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTabChange('settings');
                    setIsProfileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Settings & Preferences</span>
                </button>

                {onOpenOnboarding && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenOnboarding();
                      setIsProfileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>Re-run Welcome Setup</span>
                  </button>
                )}

                {onSignOut && (
                  <>
                    <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        onSignOut();
                        setIsProfileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* User Profile Card Button */}
          <div
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors cursor-pointer ${
              isProfileMenuOpen
                ? 'bg-neutral-200/80 dark:bg-neutral-800'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
            }`}
          >
            <div className="relative shrink-0">
              <img
                src={
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
                referrerPolicy="no-referrer"
              />
              {user?.role === 'super_admin' && (
                <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 text-white shadow-2xs">
                  <Crown className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {user?.name || 'Praman Singh Bhogal'}
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                {user?.role === 'super_admin'
                  ? 'Super Admin'
                  : user?.role === 'dept_head'
                  ? `Head • ${user?.department || 'Architecture'}`
                  : user?.department || 'Core Team'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
