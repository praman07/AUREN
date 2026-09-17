import React, { useRef, useEffect } from 'react';
import { CheckCheck, FileText, GitBranch, Shield, Layers, X, Crown, Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationItem } from '../../types';
import { IconButton } from '../ui/IconButton';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'super_admin_action':
        return <Crown className="w-3.5 h-3.5 text-amber-500" />;
      case 'document_ready':
        return <FileText className="w-3.5 h-3.5 text-emerald-500" />;
      case 'github_sync':
        return <GitBranch className="w-3.5 h-3.5 text-blue-500" />;
      case 'permission_updated':
        return <Shield className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-neutral-500" />;
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-4 top-14 z-50 w-80 sm:w-96 bg-white dark:bg-[#151619] border border-neutral-200/80 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            Activity & Notifications
          </span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Mark all read
            </button>
          )}
          <IconButton ariaLabel="Close" variant="ghost" size="xs" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/50">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
            No recent activity
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`p-3 text-left flex items-start gap-3 hover:bg-neutral-50 dark:hover:bg-[#1A1B1E] transition-colors cursor-pointer ${
                !notif.read ? 'bg-neutral-50/50 dark:bg-[#191A1E]/40' : ''
              }`}
            >
              <div className="mt-0.5 p-1 rounded-md bg-neutral-100 dark:bg-neutral-800/80 shrink-0">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-xs truncate ${
                      !notif.read
                        ? 'font-semibold text-neutral-900 dark:text-neutral-100'
                        : 'font-medium text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {notif.title}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0">
                    {new Date(notif.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5">
                  {notif.description}
                </p>
              </div>
              {!notif.read && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
