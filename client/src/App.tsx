import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { queryClient } from './lib/queryClient';
import { EnterpriseLayout } from './components/layout/EnterpriseLayout';
import { DocumentsPage } from './features/documents/components/DocumentsPage';
import { DashboardPage } from './features/dashboard/components/DashboardPage';
import { OrganizationsPage } from './features/organizations/components/OrganizationsPage';
import { UsersPage } from './features/users/components/UsersPage';
import { DepartmentsSecurityPage } from './features/departments/components/DepartmentsSecurityPage';
import { EnterpriseAuthProvider } from './core/auth/providers/EnterpriseAuthProvider';
import { RequireAuth, PublicOnly } from './core/auth/guards/AuthGuards';
import { LoginForm } from './features/authentication/components/LoginForm';
import { SignUpForm } from './features/authentication/components/SignUpForm';

// Use a dummy dev key if env var is missing, to satisfy Clerk initialization
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2xlcmsuYXBwLmRldiQ';

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
          <EnterpriseAuthProvider>
            <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<PublicOnly><LoginForm /></PublicOnly>} />
            <Route path="/signup" element={<PublicOnly><SignUpForm /></PublicOnly>} />
            <Route path="/forgot-password" element={<PublicOnly><LoginForm /></PublicOnly>} />

            {/* Protected Enterprise Routes */}
            <Route path="/" element={<RequireAuth><EnterpriseLayout /></RequireAuth>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="organizations" element={<OrganizationsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="departments" element={<DepartmentsSecurityPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <h2 className="text-lg font-semibold text-foreground mb-2">Module Not Found</h2>
                  <p className="text-sm">This section is currently under construction.</p>
                </div>
              } />
            </Route>
          </Routes>
          </EnterpriseAuthProvider>
        </ClerkProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
