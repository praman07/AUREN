import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LeftRail } from './components/navigation/LeftRail';
import { TopHeader } from './components/navigation/TopHeader';
import { CommandPalette } from './components/navigation/CommandPalette';
import { LibraryView } from './components/library/LibraryView';
import { ChatView } from './components/chat/ChatView';
import { ConnectorsView } from './components/connectors/ConnectorsView';
import { GitHubDetailView } from './components/connectors/GitHubDetailView';
import { ConnectorDetailView } from './components/connectors/ConnectorDetailView';
import { RbacView } from './components/rbac/RbacView';
import { SuperAdminPanel } from './components/superadmin/SuperAdminPanel';
import { SearchView } from './components/search/SearchView';
import { SettingsView } from './components/settings/SettingsView';
import { ProfileView } from './components/profile/ProfileView';
import { CollaborationView } from './components/collaboration/CollaborationView';
import { CollaborationProvider } from './context/CollaborationContext';
import { DocumentDetailModal } from './components/document/DocumentDetailModal';
import { EditDocumentModal } from './components/document/EditDocumentModal';
import { ArchitectureReviewerView } from './components/agents/ArchitectureReviewerView';
import { KnowledgeCuratorView } from './components/agents/KnowledgeCuratorView';
import { OrganizationalMemoryView } from './components/agents/OrganizationalMemoryView';
import { AgentsWorkspace } from './components/agents/AgentsWorkspace';
import { LoginView } from './components/auth/LoginView';
import { SignupView } from './components/auth/SignupView';
import { OnboardingView } from './components/auth/OnboardingView';
import { api } from './services/api';
import {
  NavigationTab,
  AurenDocument,
  Connector,
  ChatConversation,
  ConnectorPolicy,
  ConnectorDataItem,
} from './types';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = Boolean(user?.role === 'super_admin' || user?.isSuperAdmin);

  const [authMode, setAuthMode] = useState<'authenticated' | 'login' | 'signup' | 'onboarding'>('authenticated');
  const [activeTab, setActiveTab] = useState<NavigationTab>('connectors');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [navHistory, setNavHistory] = useState<NavigationTab[]>([]);

  // Global keyboard shortcut: Cmd+B or Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Data state
  const [documents, setDocuments] = useState<AurenDocument[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<AurenDocument | null>(null);
  const [editingDocGlobal, setEditingDocGlobal] = useState<AurenDocument | null>(null);

  // Full-screen Connector Detail state
  const [selectedConnectorDetailId, setSelectedConnectorDetailId] = useState<string | null>(null);
  const [connectorDetailBackPage, setConnectorDetailBackPage] = useState<string>('Connectors');

  // Intent handover from Home or Library to Chat
  const [pendingChatQuery, setPendingChatQuery] = useState<string | undefined>();
  const [pendingAttachedDoc, setPendingAttachedDoc] = useState<AurenDocument | null>(null);
  const [pendingCollaborationDoc, setPendingCollaborationDoc] = useState<AurenDocument | null>(null);

  // Initial data loading
  const loadData = async () => {
    try {
      const [docs, conns, convs] = await Promise.all([
        api.getDocuments(),
        api.getConnectors(),
        api.getConversations(),
      ]);
      setDocuments(docs);
      setConnectors(conns);
      setConversations(convs);
      if (convs.length > 0 && !activeConversationId) {
        setActiveConversationId(convs[0].id);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Intelligent URL Hash Router
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash.startsWith('connector/')) {
        const connId = hash.replace('connector/', '');
        setSelectedConnectorDetailId(connId);
        setActiveTab('connectors');
      } else {
        setSelectedConnectorDetailId(null);
        if (!hash || hash === 'home' || hash.startsWith('chat')) {
          setActiveTab('chat');
          const parts = hash.split('/');
          if (parts[1]) {
            setActiveConversationId(parts[1]);
          }
        } else if (hash === 'connectors/github') {
          setActiveTab('connectors/github');
        } else if (hash.startsWith('connectors')) {
          setActiveTab('connectors');
        } else if (hash.startsWith('collaboration')) {
          setActiveTab('collaboration');
        } else if (hash === 'rbac') {
          setActiveTab('rbac');
        } else if (hash === 'agents') {
          setActiveTab('agents');
        } else if (hash === 'architecture-reviewer') {
          setActiveTab('architecture-reviewer');
        } else if (hash === 'knowledge-curator') {
          setActiveTab('knowledge-curator');
        } else if (hash === 'organizational-memory' || hash === 'memory') {
          setActiveTab('organizational-memory');
        } else if (hash === 'super-admin' || hash === 'superadmin') {
          if (isSuperAdmin) {
            setActiveTab('super-admin');
          } else {
            setActiveTab('library');
            window.location.hash = '#library';
          }
        } else if (hash === 'library') {
          setActiveTab('library');
        } else if (hash === 'search') {
          setActiveTab('search');
        } else if (hash === 'settings') {
          setActiveTab('settings');
        } else if (hash === 'profile') {
          setActiveTab('profile');
        }
      }
    };

    if (window.location.hash) {
      handleHashChange();
    } else {
      window.location.hash = '#chat/conv_q2_arch_review';
      setActiveTab('chat');
      setActiveConversationId('conv_q2_arch_review');
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isSuperAdmin]);

  // Ensure non-super-admins are never left on the super-admin tab
  useEffect(() => {
    if (activeTab === 'super-admin' && !isSuperAdmin) {
      setActiveTab('library');
      if (window.location.hash === '#super-admin' || window.location.hash === '#superadmin') {
        window.location.hash = '#library';
      }
    }
  }, [activeTab, isSuperAdmin]);

  const handleNavigateTab = (tab: NavigationTab, convId?: string) => {
    if (tab === 'super-admin' && !isSuperAdmin) {
      tab = 'library';
    }
    if (activeTab !== tab) {
      setNavHistory((prev) => [...prev.slice(-15), activeTab]);
    }
    setSelectedConnectorDetailId(null);
    setActiveTab(tab);
    if (tab === 'chat') {
      const targetId = convId || activeConversationId;
      if (targetId) {
        setActiveConversationId(targetId);
        window.location.hash = `#chat/${targetId}`;
      } else {
        window.location.hash = '#chat';
      }
    } else if (tab === 'connectors/github') {
      window.location.hash = '#connectors/github';
    } else {
      window.location.hash = `#${tab}`;
    }
  };

  const handleGoBack = () => {
    if (selectedConnectorDetailId) {
      setSelectedConnectorDetailId(null);
      if (connectorDetailBackPage === 'Knowledge Library') {
        handleNavigateTab('library');
      } else {
        handleNavigateTab('connectors');
      }
      return;
    }
    if (navHistory.length > 0) {
      const previous = navHistory[navHistory.length - 1];
      setNavHistory((prev) => prev.slice(0, -1));
      setActiveTab(previous);
      window.location.hash = `#${previous}`;
    } else {
      handleNavigateTab('connectors');
    }
  };

  const handleOpenConnectorDetail = (id: string, backPage: string = 'Connectors') => {
    setSelectedConnectorDetailId(id);
    setConnectorDetailBackPage(backPage);
    window.location.hash = `#connector/${id}`;
  };

  // Handlers
  const handleAskAurenAboutDoc = (doc: AurenDocument) => {
    setPendingAttachedDoc(doc);
    setPendingChatQuery(`Summarize key concepts and architectural decisions in ${doc.title}.`);
    handleNavigateTab('chat');
  };

  const handleAskAurenAboutConnectorData = (item: ConnectorDataItem) => {
    setPendingAttachedDoc(null);
    setPendingChatQuery(
      `Analyze the synchronized ${item.connectorName} resource "${item.title}" (${item.nestedPath || item.parentGroup}) and synthesize key architectural findings.`
    );
    handleNavigateTab('chat');
  };

  const handleDiscussDocInCollaboration = (doc: AurenDocument) => {
    setPendingCollaborationDoc(doc);
    handleNavigateTab('collaboration');
  };

  const handleCreateNewChat = () => {
    setPendingChatQuery(undefined);
    setPendingAttachedDoc(null);
    const newId = `conv_${Date.now()}`;
    const newConv: ChatConversation = {
      id: newId,
      title: 'New Research Inquiry',
      scope: 'organization',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
    handleNavigateTab('chat', newId);
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
    try {
      await api.updateConversation(id, { title: newTitle });
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  const handleTogglePinConversation = async (id: string) => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return;
    const newPinned = !target.pinned;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: newPinned } : c))
    );
    try {
      await api.updateConversation(id, { pinned: newPinned });
    } catch (err) {
      console.error('Failed to pin/unpin conversation:', err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    setConversations((prev) => (prev || []).filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = (conversations || []).filter((c) => c.id !== id);
      const nextId = remaining[0]?.id;
      setActiveConversationId(nextId);
      if (nextId) {
        window.location.hash = `#chat/${nextId}`;
      } else {
        window.location.hash = '#chat';
      }
    }
    try {
      await api.deleteConversation(id);
    } catch (err) {
      console.error('Failed to delete conversation on server:', err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleSyncConnector = async (id: string) => {
    try {
      const result = await api.syncConnector(id);
      setConnectors((prev) =>
        prev.map((c) => (c.id === id ? { ...c, lastSyncAt: result.syncedAt } : c))
      );
    } catch (err) {
      console.error('Failed to sync connector:', err);
    }
  };

  const handleUpdatePolicy = async (id: string, policy: ConnectorPolicy) => {
    try {
      const updated = await api.updateConnectorPolicy(id, policy);
      setConnectors((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      console.error('Failed to update connector policy:', err);
    }
  };

  // Auth flow views
  if (authMode === 'login') {
    return (
      <LoginView
        onSuccess={() => setAuthMode('authenticated')}
        onGoToSignup={() => setAuthMode('signup')}
      />
    );
  }

  if (authMode === 'signup') {
    return (
      <SignupView
        onSuccess={() => setAuthMode('onboarding')}
        onGoToLogin={() => setAuthMode('login')}
      />
    );
  }

  if (authMode === 'onboarding') {
    return (
      <OnboardingView
        onComplete={() => setAuthMode('authenticated')}
        onSkip={() => setAuthMode('authenticated')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0A0B0D] text-neutral-900 dark:text-neutral-100 flex transition-colors duration-200 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* 1. Left Rail Navigation: Active on all workspace tabs except Collaboration (which uses its own dedicated sidebar) */}
      {activeTab !== 'collaboration' && (
        <LeftRail
          activeTab={activeTab}
          onTabChange={(tab) => {
            handleNavigateTab(tab);
            setIsMobileNavOpen(false);
          }}
          onNewChat={handleCreateNewChat}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => handleNavigateTab('chat', id)}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          onTogglePinConversation={handleTogglePinConversation}
          onOpenOnboarding={() => setAuthMode('onboarding')}
          onSignOut={() => setAuthMode('login')}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          unreadNotificationsCount={1}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      )}

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header - hidden on chat and collaboration because they contain integrated context headers */}
        {activeTab !== 'chat' && activeTab !== 'collaboration' && !selectedConnectorDetailId && (
          <TopHeader
            activeTab={activeTab}
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onNavigateSettings={() => handleNavigateTab('settings')}
            onNavigateTab={handleNavigateTab}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
            onBack={navHistory.length > 0 ? handleGoBack : undefined}
            backLabel="Back"
          />
        )}

        {/* Dynamic Route View */}
        <main
          className={`flex-1 ${
            activeTab === 'chat' || activeTab === 'collaboration' || selectedConnectorDetailId
              ? 'overflow-hidden flex flex-col'
              : 'overflow-y-auto'
          }`}
        >
          {selectedConnectorDetailId ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <TopHeader
                activeTab="connectors"
                customBreadcrumbs={[
                  { label: 'Workspace', tab: 'connectors' },
                  {
                    label: connectorDetailBackPage,
                    tab: connectorDetailBackPage === 'Knowledge Library' ? 'library' : 'connectors',
                  },
                  { label: 'Connector Detail' },
                ]}
                onOpenMobileNav={() => setIsMobileNavOpen(true)}
                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                onNavigateSettings={() => handleNavigateTab('settings')}
                onNavigateTab={handleNavigateTab}
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
                onBack={handleGoBack}
                backLabel={`Back to ${connectorDetailBackPage}`}
              />
              <div className="flex-1 overflow-y-auto">
                <ConnectorDetailView
                  connectorId={selectedConnectorDetailId}
                  backPageName={connectorDetailBackPage}
                  onBack={handleGoBack}
                  onAskAuren={handleAskAurenAboutConnectorData}
                  onSyncConnector={handleSyncConnector}
                  onUpdatePolicy={handleUpdatePolicy}
                />
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'library' && (
                <LibraryView
                  documents={documents}
                  connectors={connectors}
                  onRefreshDocuments={loadData}
                  onAskAuren={handleAskAurenAboutDoc}
                  onAskAurenAboutConnectorData={handleAskAurenAboutConnectorData}
                  onOpenConnectorDetail={handleOpenConnectorDetail}
                  onDeleteDocument={handleDeleteDocument}
                  onNavigateToRbac={() => handleNavigateTab('rbac')}
                />
              )}

              {activeTab === 'collaboration' && (
                <CollaborationView
                  documents={documents}
                  onOpenDocument={(doc) => setSelectedDocForDetail(doc)}
                  onOpenRbacPolicy={() => handleNavigateTab('rbac')}
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onSelectConversation={(id) => handleNavigateTab('chat', id)}
                  onNewChat={handleCreateNewChat}
                  onDeleteConversation={handleDeleteConversation}
                  initialQuery={pendingChatQuery}
                  initialAttachedDoc={pendingCollaborationDoc}
                  onClearInitialDoc={() => setPendingCollaborationDoc(null)}
                  onBack={navHistory.length > 0 ? handleGoBack : () => handleNavigateTab('library')}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'chat' && (
                <ChatView
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onSelectConversation={(id) => handleNavigateTab('chat', id)}
                  onNewChat={handleCreateNewChat}
                  onDeleteConversation={handleDeleteConversation}
                  onRenameConversation={handleRenameConversation}
                  onTogglePinConversation={handleTogglePinConversation}
                  documents={documents}
                  onOpenDocument={(doc) => setSelectedDocForDetail(doc)}
                  initialQuery={pendingChatQuery}
                  initialAttachedDoc={pendingAttachedDoc}
                  onOpenMobileNav={() => setIsMobileNavOpen(true)}
                  isSidebarCollapsed={isSidebarCollapsed}
                  onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
                  onBack={navHistory.length > 0 ? handleGoBack : undefined}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'search' && (
                <SearchView
                  documents={documents}
                  onOpenDocument={(doc) => setSelectedDocForDetail(doc)}
                  onOpenConversation={(id) => handleNavigateTab('chat', id)}
                />
              )}

              {activeTab === 'connectors' && (
                <ConnectorsView
                  connectors={connectors}
                  onSyncConnector={handleSyncConnector}
                  onUpdatePolicy={handleUpdatePolicy}
                  onOpenGitHubDetail={() => handleOpenConnectorDetail('conn_github_org', 'Connectors')}
                  onOpenConnectorDetail={handleOpenConnectorDetail}
                />
              )}

              {activeTab === 'connectors/github' && (
                <GitHubDetailView
                  onBack={() => handleNavigateTab('connectors')}
                  onOpenCommitDoc={(repo, commitSha) => {
                    const target = documents.find((d) => d.id === 'doc_github_004');
                    if (target) setSelectedDocForDetail(target);
                  }}
                />
              )}

              {activeTab === 'rbac' && <RbacView />}

              {activeTab === 'agents' && (
                <AgentsWorkspace
                  onOpenDocument={(docId) => {
                    const target = documents.find((d) => d.id === docId);
                    if (target) setSelectedDocForDetail(target);
                    else handleNavigateTab('library');
                  }}
                  onOpenDecision={() => handleNavigateTab('collaboration')}
                  onOpenMeeting={() => handleNavigateTab('collaboration')}
                  onAskAuren={(prompt) => {
                    setPendingChatQuery(prompt);
                    handleNavigateTab('chat');
                  }}
                />
              )}

              {activeTab === 'architecture-reviewer' && (
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                  <ArchitectureReviewerView
                    documents={documents}
                    onOpenDocument={(doc) => setSelectedDocForDetail(doc)}
                    onAskAuren={(prompt) => {
                      setPendingChatQuery(prompt);
                      handleNavigateTab('chat');
                    }}
                  />
                </div>
              )}

              {activeTab === 'knowledge-curator' && (
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                  <KnowledgeCuratorView
                    documents={documents}
                    onOpenDocument={(doc) => setSelectedDocForDetail(doc)}
                    onAskAuren={(prompt) => {
                      setPendingChatQuery(prompt);
                      handleNavigateTab('chat');
                    }}
                  />
                </div>
              )}

              {(activeTab === 'organizational-memory' || activeTab === 'memory') && (
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                  <OrganizationalMemoryView
                    documents={documents}
                    onOpenDocument={(doc) => setSelectedDocForDetail(doc)}
                    onOpenMeeting={(meetingId) => {
                      handleNavigateTab('collaboration');
                    }}
                    onOpenDecision={(decisionId) => {
                      handleNavigateTab('collaboration');
                    }}
                    onOpenChannel={(channelId) => {
                      handleNavigateTab('collaboration');
                    }}
                    onAskAuren={(prompt) => {
                      setPendingChatQuery(prompt);
                      handleNavigateTab('chat');
                    }}
                  />
                </div>
              )}

              {activeTab === 'super-admin' && isSuperAdmin && <SuperAdminPanel />}

              {activeTab === 'settings' && <ProfileView initialSubTab="settings" />}

              {activeTab === 'profile' && <ProfileView initialSubTab="profile" />}
            </>
          )}
        </main>
      </div>

      {/* 3. Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        documents={documents}
        connectors={connectors}
        onNavigate={(tab) => handleNavigateTab(tab)}
        onSelectDocument={(doc) => setSelectedDocForDetail(doc)}
      />

      {/* 4. Global Document Detail Modal */}
      <DocumentDetailModal
        document={selectedDocForDetail}
        isOpen={Boolean(selectedDocForDetail)}
        onClose={() => setSelectedDocForDetail(null)}
        onAskAuren={handleAskAurenAboutDoc}
        onDiscussInCollaboration={handleDiscussDocInCollaboration}
        onEditDocument={(doc) => {
          setSelectedDocForDetail(null);
          setEditingDocGlobal(doc);
        }}
        onSelectRelatedDoc={(relId) => {
          const target = documents.find((d) => d.id === relId);
          if (target) setSelectedDocForDetail(target);
        }}
      />

      {/* 5. Global Edit Document & Clearance Policy Modal */}
      <EditDocumentModal
        document={editingDocGlobal}
        isOpen={Boolean(editingDocGlobal)}
        onClose={() => setEditingDocGlobal(null)}
        onDocumentUpdated={() => {
          loadData();
        }}
        onNavigateToRbac={() => handleNavigateTab('rbac')}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <CollaborationProvider>
            <MainApp />
          </CollaborationProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
