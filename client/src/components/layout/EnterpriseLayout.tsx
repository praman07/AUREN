import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LeftRail } from '../navigation/LeftRail';
import { TopHeader } from '../navigation/TopHeader';
import { UploadDialog } from '../../features/documents/components/upload/UploadDialog';
import { DocumentDetailsDrawer } from '../../features/documents/components/details/DocumentDetailsDrawer';

export const EnterpriseLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  const isChatView = location.pathname.startsWith('/chat');
  const isCollaborationView = location.pathname.startsWith('/collaboration');
  const isFullBleedView = isChatView || isCollaborationView;

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0A0B0D] text-neutral-900 dark:text-neutral-100 flex transition-colors duration-200 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* 1. Left Rail Navigation */}
      <LeftRail
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onNewChat={() => navigate('/chat')}
      />

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        {!isCollaborationView && (
          <TopHeader
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
            onOpenSearch={() => navigate('/search')}
            onNavigateSettings={() => navigate('/settings')}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          />
        )}

        {/* Dynamic Route View */}
        <main
          className={`flex-1 ${
            isFullBleedView
              ? 'overflow-hidden flex flex-col w-full h-full'
              : 'overflow-y-auto p-6 sm:p-8 lg:p-10'
          }`}
        >
          <div className={`${isFullBleedView ? 'w-full h-full' : 'max-w-7xl mx-auto w-full h-full flex flex-col gap-8'}`}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Drawers & Dialogs */}
      <UploadDialog />
      <DocumentDetailsDrawer />
    </div>
  );
};
