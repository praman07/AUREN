import React, { useState, useEffect } from 'react';
import { useCollaboration } from '../../context/CollaborationContext';
import { useAuth } from '../../context/AuthContext';
import { CollaborationSidebar } from './CollaborationSidebar';
import { ChannelHeader } from './ChannelHeader';
import { MessageList } from './MessageList';
import { CollaborationComposer } from './CollaborationComposer';
import { ThreadInspector } from './ThreadInspector';
import { PinnedKnowledgeDrawer } from './PinnedKnowledgeDrawer';
import { DecisionsDrawer } from './DecisionsDrawer';
import { MeetingRoom } from './MeetingRoom';
import { IncidentSpaceHeader } from './IncidentSpaceHeader';
import { RestrictedChannelView } from './RestrictedChannelView';
import { BroadcastModal } from './BroadcastModal';
import { CreateChannelModal } from './CreateChannelModal';
import { CreateDecisionModal } from './CreateDecisionModal';
import { CreateActionItemModal } from './CreateActionItemModal';
import { SavedMessagesView } from './SavedMessagesView';
import { ChatView } from '../chat/ChatView';
import { AurenDocument, ChatConversation, NavigationTab } from '../../types';
import { CollaborationMessage } from '../../types/collaboration';

interface CollaborationViewProps {
  documents: AurenDocument[];
  onOpenDocument: (doc: AurenDocument) => void;
  onOpenRbacPolicy: () => void;
  conversations: ChatConversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  initialQuery?: string;
  initialAttachedDoc?: AurenDocument | null;
  onClearInitialDoc?: () => void;
  onBack?: () => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const CollaborationView: React.FC<CollaborationViewProps> = ({
  documents,
  onOpenDocument,
  onOpenRbacPolicy,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  initialQuery,
  initialAttachedDoc,
  onClearInitialDoc,
  onBack,
  onNavigateTab,
}) => {
  const {
    activeChannel,
    activeChannelId,
    selectChannel,
    messages,
    activeMeeting,
    activeThreadRootMessage,
    isPinnedKnowledgeOpen,
    isDecisionsOpen,
    sendAurenInquiry,
    joinMeeting,
    meetings,
  } = useCollaboration();
  const { user } = useAuth();

  const [isChannelSidebarCollapsed, setIsChannelSidebarCollapsed] = useState(false);

  // Keyboard shortcut: Cmd+B or Ctrl+B to toggle the active collaboration sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsChannelSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modals state
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [createChannelDefaultDept, setCreateChannelDefaultDept] = useState<string | undefined>();
  const [isCreateDecisionModalOpen, setIsCreateDecisionModalOpen] = useState(false);
  const [decisionInitialData, setDecisionInitialData] = useState<{ title: string; text: string }>({
    title: '',
    text: '',
  });
  const [isCreateActionModalOpen, setIsCreateActionModalOpen] = useState(false);
  const [actionInitialTitle, setActionInitialTitle] = useState('');
  const [isSavedViewActive, setIsSavedViewActive] = useState(false);

  // Helper to open document by ID
  const handleOpenDocById = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      onOpenDocument(doc);
    }
  };

  // Helper to ask AUREN about a message
  const handleAskAurenMessage = (msg: CollaborationMessage, prompt: string) => {
    sendAurenInquiry(`${prompt}\n\nContext Message from ${msg.senderName}:\n"${msg.content}"`, undefined, msg);
  };

  // Helper to create decision from message
  const handleCreateDecisionFromMessage = (msg: CollaborationMessage) => {
    setDecisionInitialData({
      title: `Decision regarding ${msg.content.slice(0, 40)}...`,
      text: msg.content,
    });
    setIsCreateDecisionModalOpen(true);
  };

  // Helper to create action item from message
  const handleCreateActionItemFromMessage = (msg: CollaborationMessage) => {
    setActionInitialTitle(msg.content.slice(0, 60));
    setIsCreateActionModalOpen(true);
  };

  // RBAC clearance check for restricted channels
  const isChannelClearanceRestricted = () => {
    if (!activeChannel?.isRestricted) return false;
    // Super admins always bypass
    if (user?.role === 'super_admin' || user?.isSuperAdmin) return false;

    // Check clearance
    if (activeChannel.minClearance === 'senior') {
      const userClearance = (user?.role as string) || '';
      // If user is junior, restrict!
      if (userClearance.includes('junior') || user?.title?.toLowerCase().includes('junior')) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white dark:bg-[#0E0F12]">
      {/* 1. Collaboration Channels & DMs Sidebar (Sole active sidebar on Collaboration page) */}
      {!isChannelSidebarCollapsed && (
        <CollaborationSidebar
          onOpenCreateChannel={(dept) => {
            setCreateChannelDefaultDept(dept);
            setIsCreateChannelModalOpen(true);
          }}
          onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
          onSelectSavedView={() => setIsSavedViewActive(true)}
          isSavedViewActive={isSavedViewActive}
          onBackToWorkspace={onBack || (() => onNavigateTab && onNavigateTab('library'))}
          onNavigateTab={onNavigateTab}
          onToggleCollapse={() => setIsChannelSidebarCollapsed(true)}
        />
      )}

      {/* 2. Main Stage Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* If Active Summit Meeting is Joined */}
        {activeMeeting ? (
          <MeetingRoom
            documents={documents}
            onOpenDocument={handleOpenDocById}
          />
        ) : isSavedViewActive ? (
          /* Saved Messages View */
          <SavedMessagesView
            onOpenDocument={handleOpenDocById}
            onOpenRbacPolicy={onOpenRbacPolicy}
            onCloseSavedView={() => setIsSavedViewActive(false)}
          />
        ) : activeChannelId === 'dm_auren_ai' ? (
          /* 1-on-1 AUREN AI Research Chat */
          <ChatView
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={onSelectConversation}
            onNewChat={onNewChat}
            onDeleteConversation={onDeleteConversation}
            documents={documents}
            onOpenDocument={onOpenDocument}
            initialQuery={initialQuery}
            initialAttachedDoc={initialAttachedDoc}
            isSidebarCollapsed={isChannelSidebarCollapsed}
            onToggleSidebar={() => setIsChannelSidebarCollapsed((prev) => !prev)}
            onBack={onBack}
            onNavigateTab={onNavigateTab}
          />
        ) : isChannelClearanceRestricted() && activeChannel ? (
          /* Restricted Channel Gated State */
          <RestrictedChannelView
            channel={activeChannel}
            onOpenRbacPolicy={onOpenRbacPolicy}
          />
        ) : (
          /* Standard Collaboration Channel View */
          <>
            {/* Incident Header (if incident space) */}
            <IncidentSpaceHeader
              documents={documents}
              onOpenDocument={handleOpenDocById}
            />

            {/* Channel Top Header */}
            <ChannelHeader
              onOpenKnowledgeDrawer={() => {}}
              onOpenDecisionsDrawer={() => {}}
              onStartMeeting={() => {
                const meeting = meetings.find((m) => m.channelId === activeChannel?.id);
                if (meeting) joinMeeting(meeting.id);
                else joinMeeting('meet_arch_review');
              }}
              onOpenRbacPolicy={onOpenRbacPolicy}
              isChannelSidebarCollapsed={isChannelSidebarCollapsed}
              onToggleChannelSidebar={() => setIsChannelSidebarCollapsed((prev) => !prev)}
              onBack={onBack}
              onNavigateTab={onNavigateTab}
            />

            {/* Messages Stream */}
            <MessageList
              messages={messages}
              onOpenDocument={handleOpenDocById}
              onOpenRbacPolicy={onOpenRbacPolicy}
              onAskAurenMessage={handleAskAurenMessage}
              onCreateDecisionFromMessage={handleCreateDecisionFromMessage}
              onCreateActionItemFromMessage={handleCreateActionItemFromMessage}
            />

            {/* Knowledge-Native Composer */}
            <CollaborationComposer
              documents={documents}
              onOpenCreateDecision={() => {
                setDecisionInitialData({ title: '', text: '' });
                setIsCreateDecisionModalOpen(true);
              }}
              onOpenCreateActionItem={() => {
                setActionInitialTitle('');
                setIsCreateActionModalOpen(true);
              }}
              initialAttachedDoc={initialAttachedDoc}
              onClearInitialDoc={onClearInitialDoc}
            />
          </>
        )}
      </div>

      {/* 3. Contextual Right Drawers (Thread, Pinned Knowledge, Decisions) */}
      {!activeMeeting && !isSavedViewActive && activeChannelId !== 'dm_auren_ai' && (
        <>
          {activeThreadRootMessage && (
            <ThreadInspector
              documents={documents}
              onOpenDocument={handleOpenDocById}
              onOpenRbacPolicy={onOpenRbacPolicy}
            />
          )}

          {isPinnedKnowledgeOpen && !activeThreadRootMessage && (
            <PinnedKnowledgeDrawer
              documents={documents}
              onOpenDocument={handleOpenDocById}
              onOpenRbacPolicy={onOpenRbacPolicy}
            />
          )}

          {isDecisionsOpen && !activeThreadRootMessage && (
            <DecisionsDrawer
              onOpenCreateDecision={() => {
                setDecisionInitialData({ title: '', text: '' });
                setIsCreateDecisionModalOpen(true);
              }}
              onOpenCreateActionItem={() => {
                setActionInitialTitle('');
                setIsCreateActionModalOpen(true);
              }}
              onOpenDocument={handleOpenDocById}
            />
          )}
        </>
      )}

      {/* 4. Modals */}
      <BroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        documents={documents}
      />

      <CreateChannelModal
        isOpen={isCreateChannelModalOpen}
        onClose={() => setIsCreateChannelModalOpen(false)}
        defaultDepartment={createChannelDefaultDept}
      />

      <CreateDecisionModal
        isOpen={isCreateDecisionModalOpen}
        onClose={() => setIsCreateDecisionModalOpen(false)}
        documents={documents}
        initialTitle={decisionInitialData.title}
        initialText={decisionInitialData.text}
      />

      <CreateActionItemModal
        isOpen={isCreateActionModalOpen}
        onClose={() => setIsCreateActionModalOpen(false)}
        initialTitle={actionInitialTitle}
      />
    </div>
  );
};
