import React from 'react';
import { Settings } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { NavItem } from './NavItem';
import { useAuthStore } from '../../core/auth/store/useAuthStore';
import { getTemplateConfig } from '../../core/templates/TemplateRegistry';

export const Sidebar: React.FC = () => {
  const { isSidebarOpen } = useUIStore();
  const user = useAuthStore((state) => state.user);
  const templateConfig = getTemplateConfig(user?.industry);

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
            {templateConfig.brandAbbr}
          </div>
          <span className={`transition-all duration-200 whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            {templateConfig.brandName}
          </span>
        </div>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 w-full">
        {templateConfig.navigation.map((section, idx) => (
          <div key={idx} className="mb-4">
            <p className={`px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest transition-all ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              {section.title}
            </p>
            <div className="space-y-1">
              {section.links.map((link, lidx) => (
                <NavItem key={lidx} label={link.label} icon={link.icon} href={link.href} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Navigation */}
      <div className="p-2 border-t border-border w-full bg-muted mt-auto">
        <NavItem label="Settings" icon={Settings} href="/settings" />
      </div>
    </aside>
  );
};
