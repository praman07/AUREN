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
import { RequireAuth, PublicOnly } from './core/auth/guards/AuthGuards';
import { LoginForm } from './features/authentication/components/LoginForm';
import { SignUpForm } from './features/authentication/components/SignUpForm';
import { OnboardingPage } from './features/onboarding/OnboardingPage';

import { MockClerkProvider } from './core/auth/providers/MockClerkProvider';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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
        <Route path="search" element={<SearchPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="memory" element={<MemoryConsolePage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="departments" element={<DepartmentsSecurityPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="jobs" element={<ProcessingJobsPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        
        <Route path="admin/users" element={<Navigate to="/users" replace />} />
        <Route path="admin/departments" element={<Navigate to="/departments" replace />} />
        <Route path="admin/audit-logs" element={<Navigate to="/audit-logs" replace />} />
        <Route path="admin/jobs" element={<Navigate to="/jobs" replace />} />
        
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground mb-2">Module Not Found</h2>
            <p className="text-sm">This section is currently under construction.</p>
          </div>
        } />
      </Route>
    </Routes>
  );

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
            <EnterpriseAuthProvider>{content}</EnterpriseAuthProvider>
          </ClerkProvider>
        ) : (
          <MockClerkProvider>{content}</MockClerkProvider>
        )}
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
