import React, { useState } from 'react';
import {
  Hash,
  Volume2,
  Bell,
  Lock,
  Paperclip,
  CheckSquare,
  Search,
  Video,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';

interface ChannelHeaderProps {
  onOpenKnowledgeDrawer?: () => void;
  onOpenDecisionsDrawer?: () => void;
  onStartMeeting?: () => void;
  onOpenRbacPolicy?: () => void;
  isChannelSidebarCollapsed?: boolean;
  onToggleChannelSidebar?: () => void;
  onBack?: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const ChannelHeader: React.FC<ChannelHeaderProps> = ({
  onOpenKnowledgeDrawer: _onOpenKnowledgeDrawer,
  onOpenDecisionsDrawer: _onOpenDecisionsDrawer,
  onStartMeeting,
  onOpenRbacPolicy,
  isChannelSidebarCollapsed = false,
  onToggleChannelSidebar,
  onBack,
  onNavigateTab,
}) => {
  const {
    activeChannel,
    isPinnedKnowledgeOpen,
    setIsPinnedKnowledgeOpen,
    isDecisionsOpen,
    setIsDecisionsOpen,
    decisions: _decisions,
    actionItems,
    channelSearchQuery,
    setChannelSearchQuery,
    joinMeeting,
    meetings,
  } = useCollaboration();
  const { user: _user } = useAuth();

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (!activeChannel) return null;

  const relevantMeeting = meetings.find(
    (m) => m.channelId === activeChannel.id || (activeChannel.category === 'organization' && m.status === 'active')
  );

  const getChannelIcon = () => {
    if (activeChannel.type === 'broadcast') return <Volume2 className="w-4 h-4 text-amber-500" />;
    if (activeChannel.type === 'announcement') return <Bell className="w-4 h-4 text-blue-500" />;
    if (activeChannel.type === 'incident') return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    if (activeChannel.isRestricted) return <Lock className="w-4 h-4 text-neutral-400" />;
    return <Hash className="w-4 h-4 text-neutral-400" />;
  };

  const openActionCount = (actionItems || []).filter((a) => a.status === 'Open').length;

  return (
    <div className="h-13 px-3 md:px-4 border-b border-neutral-200/70 dark:border-neutral-800/80 bg-white/80 dark:bg-[#121316]/80 backdrop-blur-md flex items-center justify-between gap-3 select-none shrink-0 z-10">
      {/* Left Details: Sidebar toggle, Back button, Breadcrumb & Channel Identity */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Channel Sidebar toggle */}
        {onToggleChannelSidebar && (
          <button
            type="button"
            onClick={onToggleChannelSidebar}
            className="p-1.5 rounded-md text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isChannelSidebarCollapsed ? 'Show channels sidebar (⌘B)' : 'Hide channels sidebar (⌘B)'}
            aria-label="Toggle channel sidebar"
          >
            {isChannelSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Back to Workspace Button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer mr-0.5"
            title="Return to Workspace"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Workspace</span>
          </button>
        )}

        {/* Breadcrumb Navigation Trail */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 mr-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('library') : onBack && onBack()}
            className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Workspace
          </button>
          <ChevronRight className="w-3 h-3 text-neutral-300 dark:text-neutral-600" />
          <span className="text-neutral-600 dark:text-neutral-400">Collaboration</span>
          <ChevronRight className="w-3 h-3 text-neutral-300 dark:text-neutral-600" />
          {activeChannel.department && (
            <>
              <span className="text-neutral-500 dark:text-neutral-400">{activeChannel.department}</span>
              <ChevronRight className="w-3 h-3 text-neutral-300 dark:text-neutral-600" />
            </>
          )}
        </nav>

        {/* Channel Name & Icon */}
        <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-semibold text-xs sm:text-sm truncate">
          {getChannelIcon()}
          <span className="truncate">{activeChannel.name}</span>
        </div>

        {activeChannel.department && (
          <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60 shrink-0">
            {activeChannel.department}
          </span>
        )}

        {activeChannel.isRestricted && (
          <button
            type="button"
            onClick={onOpenRbacPolicy}
            title="Restricted Channel - Click to view RBAC policy"
            className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer shrink-0"
          >
            <Lock className="w-2.5 h-2.5" />
            <span>Clearance: {activeChannel.minClearance || 'Senior+'}</span>
          </button>
        )}

        {activeChannel.type === 'incident' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {activeChannel.incidentState?.status || 'Investigating'}
          </span>
        )}

        <div className="hidden 2xl:block h-4 w-px bg-neutral-200 dark:bg-neutral-800 shrink-0" />

        <p className="hidden 2xl:block text-xs text-neutral-400 dark:text-neutral-500 truncate max-w-xs">
          {activeChannel.description}
        </p>
      </div>

      {/* Right Controls: Knowledge drawer, Decisions drawer, Meeting trigger, Search */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Search in channel */}
        {isSearchActive ? (
          <div className="relative flex items-center">
            <input
              type="text"
              autoFocus
              placeholder="Search in channel..."
              value={channelSearchQuery}
              onChange={(e) => setChannelSearchQuery(e.target.value)}
              onBlur={() => {
                if (!channelSearchQuery) setIsSearchActive(false);
              }}
              className="w-36 sm:w-52 pl-7 pr-2 py-1 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-neutral-400"
            />
            <Search className="w-3.5 h-3.5 absolute left-2 text-neutral-400 pointer-events-none" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsSearchActive(true)}
            title="Search inside this channel"
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Pinned Knowledge Drawer Toggle */}
        <button
          type="button"
          onClick={() => {
            setIsPinnedKnowledgeOpen(!isPinnedKnowledgeOpen);
            setIsDecisionsOpen(false);
          }}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
            isPinnedKnowledgeOpen
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent shadow-2xs'
              : 'bg-transparent text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
          }`}
        >
          <Paperclip className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pinned Knowledge</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-mono">
            {activeChannel.pinnedDocumentIds.length}
          </span>
        </button>

        {/* Decisions & Action Items Drawer Toggle */}
        <button
          type="button"
          onClick={() => {
            setIsDecisionsOpen(!isDecisionsOpen);
            setIsPinnedKnowledgeOpen(false);
          }}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
            isDecisionsOpen
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent shadow-2xs'
              : 'bg-transparent text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Decisions</span>
          {openActionCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-semibold">
              {openActionCount}
            </span>
          )}
        </button>

        {/* Meeting trigger / Join Active Meeting */}
        {relevantMeeting ? (
          <Button
            variant={relevantMeeting.status === 'active' ? 'primary' : 'secondary'}
            size="sm"
            icon={<Video className="w-3.5 h-3.5" />}
            onClick={() => joinMeeting(relevantMeeting.id)}
            className={relevantMeeting.status === 'active' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
          >
            <span className="hidden sm:inline">
              {relevantMeeting.status === 'active' ? 'Join Live Summit' : 'Review Meeting'}
            </span>
          </Button>
        ) : onStartMeeting ? (
          <button
            type="button"
            onClick={onStartMeeting}
            title="Start Instant Channel Meeting"
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
          >
            <Video className="w-4 h-4" />
          </button>
        ) : null}

        {/* Notification Mute Toggle */}
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Unmute Channel' : 'Mute Channel'}
          className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
        >
          <Bell className={`w-4 h-4 ${isMuted ? 'text-neutral-300 dark:text-neutral-600 line-through' : ''}`} />
        </button>
      </div>
    </div>
  );
};
