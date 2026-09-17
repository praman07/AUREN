import React, { useState } from 'react';
import {
  Hash,
  Volume2,
  Bell,
  Lock,
  Plus,
  ChevronDown,
  ChevronRight,
  Bookmark,
  Search,
  AlertTriangle,
  Crown,
  ArrowLeft,
  PanelLeftClose,
} from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { useAuth } from '../../context/AuthContext';
import type { ChannelType } from '../../types/collaboration';
import { DEFAULT_DEPARTMENTS } from '../../services/rbacData';

interface CollaborationSidebarProps {
  onOpenCreateChannel?: (dept?: string) => void;
  onOpenBroadcastModal?: () => void;
  onSelectSavedView?: () => void;
  isSavedViewActive?: boolean;
  onBackToWorkspace?: () => void;
  onNavigateTab?: (tab: any) => void;
  onToggleCollapse?: () => void;
}

export const CollaborationSidebar: React.FC<CollaborationSidebarProps> = ({
  onOpenCreateChannel,
  onOpenBroadcastModal,
  onSelectSavedView,
  isSavedViewActive,
  onBackToWorkspace,
  onNavigateTab,
  onToggleCollapse,
}) => {
  const { channels, activeChannelId, selectChannel, presence, meetings, savedMessages } =
    useCollaboration();
  const { user } = useAuth();
  const isSuperAdmin = Boolean(user?.role === 'super_admin' || user?.isSuperAdmin);
  const isDeptHead = Boolean(user?.role === 'dept_head' || user?.isDepartmentHead);

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});

  const toggleDept = (dept: string) => {
    setCollapsedDepts((prev) => ({ ...prev, [dept]: !prev[dept] }));
  };

  // Filter channels based on quick search
  const filteredChannels = (channels || []).filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.department && c.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const orgChannels = (filteredChannels || []).filter((c) => c.category === 'organization');
  const deptChannels = (filteredChannels || []).filter((c) => c.category === 'department');
  const dmChannels = (filteredChannels || []).filter((c) => c.category === 'direct');

  // Group department channels by department name
  const depts = Array.from(
    new Set([
      ...DEFAULT_DEPARTMENTS,
      ...deptChannels.map((c) => c.department).filter(Boolean),
    ])
  ) as string[];

  const activeMeeting = meetings.find((m) => m.status === 'active');

  const getChannelIcon = (type: ChannelType, isRestricted?: boolean) => {
    if (type === 'broadcast') return <Volume2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    if (type === 'announcement') return <Bell className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    if (type === 'incident') return <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    if (isRestricted) return <Lock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
    return <Hash className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
  };

  return (
    <aside className="w-64 lg:w-72 h-full bg-[#FAFAFA] dark:bg-[#0D0E11] border-r border-neutral-200/70 dark:border-neutral-800/80 flex flex-col select-none shrink-0">
      {/* Top Breadcrumb & Workspace Switcher Header */}
      <div className="p-3 border-b border-neutral-200/60 dark:border-neutral-800/70 bg-white/50 dark:bg-[#121317]/50 space-y-2.5 shrink-0">
        {/* Workspace Back Link & Collapse Toggle */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToWorkspace}
            className="flex items-center gap-1.5 px-2 py-1 -ml-1 rounded-md text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
            title="Back to AUREN Workspace"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-transform group-hover:-translate-x-0.5" />
            <span className="tracking-tight text-neutral-900 dark:text-white">Workspace</span>
            <span className="text-neutral-300 dark:text-neutral-600">/</span>
            <span className="text-neutral-500 dark:text-neutral-400 font-normal">Collaboration</span>
          </button>

          <div className="flex items-center gap-1">
            {isSuperAdmin && onOpenBroadcastModal && (
              <button
                type="button"
                onClick={onOpenBroadcastModal}
                title="Publish Executive Broadcast"
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Crown className="w-3 h-3" />
                <span>Broadcast</span>
              </button>
            )}

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Collapse sidebar (⌘B)"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Workspace Switcher Links */}
        {onNavigateTab && (
          <div className="flex items-center gap-1 pt-1 border-t border-neutral-200/50 dark:border-neutral-800/60">
            <button
              type="button"
              onClick={() => onNavigateTab('library')}
              className="flex-1 py-1 px-1.5 rounded text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-colors text-center truncate cursor-pointer"
              title="Open Knowledge Library"
            >
              Library
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('chat')}
              className="flex-1 py-1 px-1.5 rounded text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-colors text-center truncate cursor-pointer"
              title="Open AUREN Chat"
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('connectors')}
              className="flex-1 py-1 px-1.5 rounded text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-colors text-center truncate cursor-pointer"
              title="Open Connected Outlets"
            >
              Connectors
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('rbac')}
              className="flex-1 py-1 px-1.5 rounded text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-colors text-center truncate cursor-pointer"
              title="Open Access Control (RBAC)"
            >
              RBAC
            </button>
          </div>
        )}

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Jump to channel, DM, incident..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md bg-neutral-100/80 dark:bg-[#15161A] border border-neutral-200/80 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
          />
        </div>
      </div>

      {/* Scrollable Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Active Meeting Callout (if active) */}
        {activeMeeting && (
          <div
            onClick={() => selectChannel(activeMeeting.channelId || 'dept_arch_general')}
            className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 cursor-pointer transition-all hover:border-emerald-500/50"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Summit Active
              </span>
              <span className="text-[10px] font-mono">{activeMeeting.participants.length} in room</span>
            </div>
            <p className="text-xs font-semibold text-neutral-900 dark:text-white mt-1 truncate">
              {activeMeeting.title}
            </p>
          </div>
        )}

        {/* 1. ORGANIZATION CHANNELS */}
        <div>
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            <span>Organization</span>
            <span className="text-[9px] font-mono">{orgChannels.length}</span>
          </div>
          <div className="space-y-0.5 mt-1">
            {orgChannels.map((c) => {
              const isActive = activeChannelId === c.id && !isSavedViewActive;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectChannel(c.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-neutral-200/80 dark:bg-[#1E2026] text-neutral-900 dark:text-white font-medium shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getChannelIcon(c.type, c.isRestricted)}
                    <span className="truncate">{c.name}</span>
                  </div>
                  {c.unreadCount && c.unreadCount > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white">
                      {c.unreadCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. DEPARTMENTS */}
        <div>
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            <span>Departments</span>
            {onOpenCreateChannel && (isSuperAdmin || isDeptHead) && (
              <button
                type="button"
                onClick={() => onOpenCreateChannel()}
                title="Create Department Channel"
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-2 mt-1">
            {depts.map((dept) => {
              const channelsInDept = deptChannels.filter((c) => c.department === dept);
              const isCollapsed = Boolean(collapsedDepts[dept]);

              return (
                <div key={dept} className="space-y-0.5">
                  {/* Department Group Header */}
                  <div
                    onClick={() => toggleDept(dept)}
                    className="flex items-center justify-between px-2 py-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 cursor-pointer rounded transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
                      )}
                      <span className="truncate font-semibold text-neutral-700 dark:text-neutral-300">
                        {dept}
                      </span>
                    </div>
                    {onOpenCreateChannel && (isSuperAdmin || (isDeptHead && user?.department === dept)) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCreateChannel(dept);
                        }}
                        title={`Add channel in ${dept}`}
                        className="opacity-0 hover:opacity-100 group-hover:opacity-100 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-opacity p-0.5"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Department Sub-channels */}
                  {!isCollapsed && (
                    <div className="pl-3.5 space-y-0.5 border-l border-neutral-200/50 dark:border-neutral-800/60 ml-2">
                      {channelsInDept.length === 0 ? (
                        <div className="px-2 py-1 text-[10px] text-neutral-400 italic">
                          No channels
                        </div>
                      ) : (
                        channelsInDept.map((c) => {
                          const isActive = activeChannelId === c.id && !isSavedViewActive;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectChannel(c.id)}
                              className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-xs transition-colors cursor-pointer text-left ${
                                isActive
                                  ? 'bg-neutral-200/80 dark:bg-[#1E2026] text-neutral-900 dark:text-white font-medium shadow-2xs'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/60'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {getChannelIcon(c.type, c.isRestricted)}
                                <span className="truncate">{c.name}</span>
                              </div>
                              {c.type === 'incident' ? (
                                <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  P1
                                </span>
                              ) : c.unreadCount && c.unreadCount > 0 ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              ) : null}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. DIRECT MESSAGES */}
        <div>
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            <span>Direct</span>
            <span className="text-[9px] font-mono">{dmChannels.length}</span>
          </div>

          <div className="space-y-0.5 mt-1">
            {dmChannels.map((c) => {
              const isActive = activeChannelId === c.id && !isSavedViewActive;
              const isAuren = c.dmUserId === 'auren_ai';
              const userPresence = c.dmUserId ? presence[c.dmUserId] || 'offline' : 'offline';

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectChannel(c.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-neutral-200/80 dark:bg-[#1E2026] text-neutral-900 dark:text-white font-medium shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      {isAuren ? (
                        <div className="w-4 h-4 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-[9px] font-bold">
                          A
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[9px] font-semibold text-neutral-700 dark:text-neutral-300">
                          {c.name.charAt(0)}
                        </div>
                      )}
                      {/* Presence indicator */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white dark:border-[#0D0E11] ${
                          userPresence === 'online'
                            ? 'bg-emerald-500'
                            : userPresence === 'in_meeting'
                            ? 'bg-amber-500'
                            : userPresence === 'away'
                            ? 'bg-yellow-500'
                            : 'bg-neutral-400'
                        }`}
                      />
                    </div>
                    <span className={`truncate ${isAuren ? 'font-semibold text-purple-700 dark:text-purple-300' : ''}`}>
                      {c.name}
                    </span>
                  </div>
                  {c.unreadCount && c.unreadCount > 0 ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. SAVED ITEMS & DECISIONS QUICK LINK */}
        {onSelectSavedView && (
          <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/70">
            <button
              type="button"
              onClick={onSelectSavedView}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left ${
                isSavedViewActive
                  ? 'bg-neutral-200/80 dark:bg-[#1E2026] text-neutral-900 dark:text-white font-medium'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-3.5 h-3.5 text-neutral-400" />
                <span>Saved Items</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">{savedMessages.length}</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer User Profile Status */}
      <div className="p-3 border-t border-neutral-200/60 dark:border-neutral-800/70 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <img
              src={
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={user?.name || 'User'}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-[#0D0E11]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
              {user?.name || 'Praman Singh Bhogal'}
            </p>
            <p className="text-[10px] text-neutral-400 truncate">
              {user?.role === 'super_admin' ? 'Super Admin' : user?.department || 'Core Architecture'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
