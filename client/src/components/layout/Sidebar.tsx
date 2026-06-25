import React from 'react';
import { 
  FileText, 
  Sparkles, 
  Building2, 
  Users, 
  BarChart3, 
  ShieldAlert, 
  Settings 
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { NavItem } from './NavItem';

export const Sidebar: React.FC = () => {
  const { isSidebarOpen } = useUIStore();

  return (
    <aside 
      className={`
        transition-all duration-200 border-r border-border bg-muted flex flex-col shrink-0
        ${isSidebarOpen ? 'w-[240px]' : 'w-[64px] items-center'}
      `}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 w-full border-b border-border font-semibold text-foreground shrink-0 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary rounded-md shadow-sm shrink-0 flex items-center justify-center text-primary-foreground text-[10px] font-bold">
            EK
          </div>
          <span className={`transition-all duration-200 whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            Knowledge OS
          </span>
        </div>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 w-full">
        <div className="mb-4">
          <p className={`px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-all ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            Workspace
          </p>
          <div className="space-y-1">
            <NavItem label="Documents" icon={FileText} href="/documents" />
            <NavItem label="AI Assistant" icon={Sparkles} href="/ai-assistant" />
            <NavItem label="Organizations" icon={Building2} href="/organizations" />
            <NavItem label="Users & Roles" icon={Users} href="/users" />
            <NavItem label="Departments & Security" icon={Building2} href="/departments" />
          </div>
        </div>

        <div className="mb-4">
          <p className={`px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-all ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            Administration
          </p>
          <div className="space-y-1">
            <NavItem label="Users" icon={Users} href="/users" />
            <NavItem label="Analytics" icon={BarChart3} href="/analytics" />
            <NavItem label="Audit Logs" icon={ShieldAlert} href="/audit-logs" />
          </div>
        </div>
      </nav>

      {/* Footer Navigation */}
      <div className="p-2 border-t border-border w-full bg-muted mt-auto">
        <NavItem label="Settings" icon={Settings} href="/settings" />
      </div>
    </aside>
  );
};
