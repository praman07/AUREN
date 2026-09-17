import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconButton } from '../ui/IconButton';
import { NotificationsDrawer } from '../notifications/NotificationsDrawer';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

interface TopHeaderProps {
  activeTab?: string;
  onOpenMobileNav?: () => void;
  onOpenSearch?: () => void;
  onOpenCommandPalette?: () => void;
  onNavigateSettings?: () => void;
  onNavigateTab?: (tab: string) => void;
  title?: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  breadcrumbs?: BreadcrumbItem[];
  onBack?: () => void;
  backLabel?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMobileNav,
  onOpenSearch,
  onOpenCommandPalette,
  title,
  isSidebarCollapsed = false,
  onToggleSidebar,
  breadcrumbs,
  onBack,
  backLabel,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = 1;

  const handleSearchClick = () => {
    if (onOpenCommandPalette) {
      onOpenCommandPalette();
    } else if (onOpenSearch) {
      onOpenSearch();
    } else {
      navigate('/search');
    }
  };

  const getComputedBreadcrumbs = (): BreadcrumbItem[] => {
    if (breadcrumbs && breadcrumbs.length > 0) return breadcrumbs;

    const baseWorkspace: BreadcrumbItem = {
      label: 'Workspace',
      onClick: () => navigate('/dashboard'),
    };

    const path = location.pathname;

    if (path.startsWith('/documents') || path.startsWith('/docs')) {
      return [baseWorkspace, { label: 'Knowledge Library', isCurrent: true }];
    } else if (path.startsWith('/chat')) {
      return [baseWorkspace, { label: 'Chat & AI Workspace', isCurrent: true }];
    } else if (path.startsWith('/search')) {
      return [baseWorkspace, { label: 'Search & Retrieval', isCurrent: true }];
    } else if (path.startsWith('/settings') || path.startsWith('/integrations')) {
      return [baseWorkspace, { label: 'Preferences & Security', isCurrent: true }];
    } else if (path.startsWith('/departments')) {
      return [baseWorkspace, { label: 'Access Clearance & RBAC', isCurrent: true }];
    } else if (path.startsWith('/users')) {
      return [{ label: 'Governance' }, { label: 'Team Directory', isCurrent: true }];
    } else if (path.startsWith('/organizations')) {
      return [{ label: 'Governance' }, { label: 'Super Admin Panel', isCurrent: true }];
    } else if (path.startsWith('/memory')) {
      return [baseWorkspace, { label: 'Organizational Memory Graph', isCurrent: true }];
    } else if (path.startsWith('/dashboard')) {
      return [baseWorkspace, { label: 'Dashboard', isCurrent: true }];
    }

    return [baseWorkspace, { label: title || 'AUREN', isCurrent: true }];
  };

  const computedCrumbs = getComputedBreadcrumbs();

  return (
    <>
      <header className="sticky top-0 z-30 h-13 w-full bg-white/70 dark:bg-[#0E0F12]/70 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-800/70 px-3 md:px-5 flex items-center justify-between select-none shrink-0 transition-all">
        {/* Left Side: Sidebar Toggle, Back Button & Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile menu trigger */}
          {onOpenMobileNav && (
            <button
              type="button"
              onClick={onOpenMobileNav}
              className="md:hidden p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Desktop Sidebar Collapse / Expand Toggle */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden md:flex p-1.5 rounded-md text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
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

          {/* Back Button (if provided or if inside sub-level) */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer mr-1"
              title="Go back"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{backLabel || 'Back'}</span>
            </button>
          )}

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block mx-0.5" />

          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs truncate">
            {computedCrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label + idx}>
                {idx > 0 && (
                  <ChevronRight className="w-3 h-3 text-neutral-400 dark:text-neutral-600 shrink-0" />
                )}
                {crumb.onClick && !crumb.isCurrent ? (
                  <button
                    type="button"
                    onClick={crumb.onClick}
                    className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors truncate max-w-[140px] md:max-w-xs font-medium cursor-pointer"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span
                    className={`truncate max-w-[180px] md:max-w-sm ${
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

        {/* Right Side: Quick Search & Notifications */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search Trigger (⌘K) */}
          <button
            type="button"
            onClick={handleSearchClick}
            className="flex items-center gap-2 h-8 px-2.5 sm:px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 dark:bg-[#16171B] dark:hover:bg-[#1E1F24] text-neutral-500 dark:text-neutral-400 text-xs transition-colors cursor-pointer border border-neutral-200/60 dark:border-neutral-800/80"
            title="Search workspace (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            <span className="text-[11px] hidden sm:inline">Search...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-200/80 dark:border-neutral-700 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <IconButton
              ariaLabel="Notifications"
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-[#0E0F12]" />
              )}
            </IconButton>
          </div>
        </div>
      </header>

      {/* Notifications Popover/Drawer */}
      <NotificationsDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};
