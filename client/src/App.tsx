import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { queryClient } from './lib/queryClient';
import { EnterpriseLayout } from './components/layout/EnterpriseLayout';
import { DocumentsPage } from './features/documents/components/DocumentsPage';
import { DashboardPage } from './features/dashboard/components/DashboardPage';
import { SearchPage } from './features/search/components/SearchPage';
import { ChatPage } from './features/chat/components/ChatPage';
import { OrganizationsPage } from './features/organizations/components/OrganizationsPage';
import { UsersPage } from './features/users/components/UsersPage';
import { DepartmentsSecurityPage } from './features/departments/components/DepartmentsSecurityPage';
import { AuditLogsPage } from './features/audit-logs/components/AuditLogsPage';
import { ProcessingJobsPage } from './features/processing-jobs/components/ProcessingJobsPage';
import { MemoryConsolePage } from './features/memory/components/MemoryConsolePage';
import { SettingsPage } from './features/settings/components/SettingsPage';
import { EnterpriseAuthProvider } from './core/auth/providers/EnterpriseAuthProvider';
import { RequireAuth, PublicOnly, RequireSuperAdmin } from './core/auth/guards/AuthGuards';
import { LoginForm } from './features/authentication/components/LoginForm';
import { SignUpForm } from './features/authentication/components/SignUpForm';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CollaborationProvider } from './context/CollaborationContext';

import { MockClerkProvider } from './core/auth/providers/MockClerkProvider';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

import { CollaborationView } from './components/collaboration/CollaborationView';
import { ConnectorsView } from './components/connectors/ConnectorsView';
import { RbacView } from './components/rbac/RbacView';
import { AgentsWorkspace } from './components/agents/AgentsWorkspace';
import { ArchitectureReviewerView } from './components/agents/ArchitectureReviewerView';
import { KnowledgeCuratorView } from './components/agents/KnowledgeCuratorView';
import { OrganizationalMemoryView } from './components/agents/OrganizationalMemoryView';
import { SuperAdminPanel } from './components/superadmin/SuperAdminPanel';
import { ProfileView } from './components/profile/ProfileView';

function App() {
  const content = (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<PublicOnly><LoginForm /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignUpForm /></PublicOnly>} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/forgot-password" element={<PublicOnly><LoginForm /></PublicOnly>} />

      {/* Protected Enterprise Routes */}
      <Route path="/" element={<RequireAuth><EnterpriseLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="documents" element={<Navigate to="/documents/org" replace />} />
        <Route path="documents/:scopeRoute" element={<DocumentsPage />} />
        <Route path="docs" element={<Navigate to="/documents/org" replace />} />
        <Route path="docs/:scopeRoute" element={<DocumentsPage />} />
        <Route path="library" element={<Navigate to="/documents/org" replace />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/*" element={<SettingsPage />} />
        <Route path="profile" element={<ProfileView initialSubTab="profile" />} />
        <Route path="integrations" element={<SettingsPage />} />
        <Route path="integrations/*" element={<SettingsPage />} />
        <Route path="collaboration" element={<CollaborationView />} />
        <Route path="connectors" element={<ConnectorsView connectors={[]} onSyncConnector={async () => {}} onUpdatePolicy={async () => {}} />} />
        <Route path="rbac" element={<RbacView />} />
        <Route path="agents" element={<AgentsWorkspace />} />
        <Route path="architecture-reviewer" element={<ArchitectureReviewerView documents={[]} />} />
        <Route path="knowledge-curator" element={<KnowledgeCuratorView documents={[]} />} />
        <Route path="organizational-memory" element={<OrganizationalMemoryView documents={[]} />} />
        
        {/* Protected Super Admin Routes */}
        <Route path="memory" element={<RequireSuperAdmin><MemoryConsolePage /></RequireSuperAdmin>} />
        <Route path="organizations" element={<RequireSuperAdmin><OrganizationsPage /></RequireSuperAdmin>} />
        <Route path="users" element={<RequireSuperAdmin><UsersPage /></RequireSuperAdmin>} />
        <Route path="departments" element={<RequireSuperAdmin><DepartmentsSecurityPage /></RequireSuperAdmin>} />
        <Route path="audit-logs" element={<RequireSuperAdmin><AuditLogsPage /></RequireSuperAdmin>} />
        <Route path="jobs" element={<RequireSuperAdmin><ProcessingJobsPage /></RequireSuperAdmin>} />
        <Route path="super-admin" element={<RequireSuperAdmin><SuperAdminPanel /></RequireSuperAdmin>} />
        <Route path="superadmin" element={<RequireSuperAdmin><SuperAdminPanel /></RequireSuperAdmin>} />
        
        <Route path="admin/users" element={<Navigate to="/users" replace />} />
        <Route path="admin/departments" element={<Navigate to="/departments" replace />} />
        <Route path="admin/audit-logs" element={<Navigate to="/audit-logs" replace />} />
        <Route path="admin/jobs" element={<Navigate to="/jobs" replace />} />
        
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-12">
            <h2 className="text-lg font-semibold text-foreground mb-2">Module Not Found</h2>
            <p className="text-sm">This section is currently under construction.</p>
          </div>
        } />
      </Route>
    </Routes>
  );

  return (
    <ThemeProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {CLERK_PUBLISHABLE_KEY ? (
            <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
              <EnterpriseAuthProvider>
                <AuthProvider>
                  <NotificationProvider>
                    <CollaborationProvider>{content}</CollaborationProvider>
                  </NotificationProvider>
                </AuthProvider>
              </EnterpriseAuthProvider>
            </ClerkProvider>
          ) : (
            <MockClerkProvider>
              <AuthProvider>
                <NotificationProvider>
                  <CollaborationProvider>{content}</CollaborationProvider>
                </NotificationProvider>
              </AuthProvider>
            </MockClerkProvider>
          )}
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
