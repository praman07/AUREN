import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface TopHeaderProps {
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenMobileNav?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  isSidebarCollapsed = false,
  onToggleSidebar,
  onOpenMobileNav,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;
    const base: BreadcrumbItem = { label: 'Workspace', href: '/dashboard' };

    if (path.startsWith('/dashboard')) {
      return [base, { label: 'Dashboard', isCurrent: true }];
    } else if (path.startsWith('/chat')) {
      return [base, { label: 'AI Assistant', isCurrent: true }];
    } else if (path.startsWith('/documents') || path.startsWith('/docs')) {
      return [base, { label: 'Knowledge Base', isCurrent: true }];
    } else if (path.startsWith('/search')) {
      return [base, { label: 'Search & Retrieval', isCurrent: true }];
    } else if (path.startsWith('/settings') || path.startsWith('/integrations')) {
      return [base, { label: 'Preferences & Security', isCurrent: true }];
    } else if (path.startsWith('/users')) {
      return [{ label: 'Governance', href: '/users' }, { label: 'Team Directory', isCurrent: true }];
    } else if (path.startsWith('/departments')) {
      return [{ label: 'Governance', href: '/departments' }, { label: 'Access Control & Security', isCurrent: true }];
    } else if (path.startsWith('/audit-logs')) {
      return [{ label: 'Governance', href: '/audit-logs' }, { label: 'Audit Logs', isCurrent: true }];
    } else if (path.startsWith('/jobs')) {
      return [{ label: 'Governance', href: '/jobs' }, { label: 'Processing Jobs', isCurrent: true }];
    } else if (path.startsWith('/memory')) {
      return [{ label: 'Governance', href: '/memory' }, { label: 'Memory Console', isCurrent: true }];
    } else if (path.startsWith('/organizations')) {
      return [{ label: 'Governance', href: '/organizations' }, { label: 'Organizations', isCurrent: true }];
    }

    return [base, { label: 'AUREN', isCurrent: true }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 px-4 sm:px-6 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-[#0A0B0D]/90 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 select-none">
      {/* Left side: Navigation / Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Nav toggle */}
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="md:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Open Menu"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Sidebar collapse toggle */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden md:flex p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block mx-1" />

        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs truncate">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label + idx}>
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600 shrink-0" />
              )}
              {crumb.href && !crumb.isCurrent ? (
                <button
                  type="button"
                  onClick={() => navigate(crumb.href!)}
                  className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors truncate max-w-[140px] md:max-w-xs font-medium cursor-pointer rounded-lg px-1.5 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {crumb.label}
                </button>
              ) : (
                <span
                  className={`truncate max-w-[180px] md:max-w-sm px-1.5 py-0.5 ${
                    crumb.isCurrent
                      ? 'font-semibold text-neutral-900 dark:text-neutral-100'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right side: Search & Notifications */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="flex items-center gap-2.5 h-9 px-3.5 rounded-xl bg-neutral-100/90 hover:bg-neutral-200/80 dark:bg-[#16171B] dark:hover:bg-[#1E1F24] text-neutral-500 dark:text-neutral-400 text-xs transition-colors cursor-pointer border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs"
          title="Search workspace (Ctrl K)"
        >
          <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-[11px] hidden sm:inline font-medium">Search workspace...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded-md border border-neutral-200/80 dark:border-neutral-700 font-mono shadow-2xs">
            Ctrl K
          </kbd>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
