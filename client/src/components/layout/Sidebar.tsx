import React from 'react';
import { LeftRail } from '../navigation/LeftRail';
import type { ChatConversation } from '../navigation/LeftRail';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  conversations?: ChatConversation[];
  activeConversationId?: string;
  onSelectConversation?: (id: string) => void;
  onRenameConversation?: (id: string, title: string) => void;
  onDeleteConversation?: (id: string) => void;
  onTogglePinConversation?: (id: string) => void;
  onNewChat?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  return <LeftRail {...props} />;
};
