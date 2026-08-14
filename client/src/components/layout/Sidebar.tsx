import React from 'react';
import { Settings } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { NavItem } from './NavItem';
import { useAuthStore } from '../../core/auth/store/useAuthStore';
import { getTemplateConfig } from '../../core/templates/TemplateRegistry';
import { useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const { isSidebarOpen } = useUIStore();
  const user = useAuthStore((state) => state.user);
  const templateConfig = getTemplateConfig(user?.industry);
  const location = useLocation();
  const isChatRoute = location.pathname === '/chat';

  // Flatten all navigation links into a single array for capsule layout
  const allNavLinks = templateConfig.navigation.flatMap((sec) => sec.links);

  // When on /chat route, render as a floating center-bottom elastic capsule
  if (isChatRoute) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <nav className="elastic-capsule-nav h-14 px-4 rounded-full flex items-center gap-1 shadow-2xl border border-slate-200/90 bg-white/80 backdrop-blur-xl">
          {allNavLinks.map((link, idx) => (
            <NavItem 
              key={idx} 
              label={link.label} 
              icon={link.icon} 
              href={link.href} 
            />
          ))}
          <div className="h-6 w-[1px] bg-slate-200 mx-1" />
          <NavItem label="Settings" icon={Settings} href="/settings" />
        </nav>
      </div>
    );
  }

  // Standard left sidebar for other enterprise pages
  return (
    <aside 
      className={`
        transition-all duration-200 border-r border-border bg-slate-950 text-slate-100 flex flex-col shrink-0 select-none shadow-md
        ${isSidebarOpen ? 'w-[250px]' : 'w-[68px] items-center'}
      `}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 w-full border-b border-slate-800/80 shrink-0 overflow-hidden bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/40 rounded-lg shrink-0 flex items-center justify-center text-blue-400 text-xs font-extrabold tracking-wider shadow-sm">
            {templateConfig.brandAbbr || 'AU'}
          </div>
          <div className={`transition-all duration-200 flex flex-col leading-tight ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <span className="font-semibold text-white tracking-tight text-sm">
              {templateConfig.brandName || 'AUREN'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Zero-Trust Enterprise</span>
          </div>
        </div>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-4 w-full custom-scrollbar">
        {templateConfig.navigation.map((section, idx) => (
          <div key={idx}>
            {isSidebarOpen && (
              <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.links.map((link, lidx) => (
                <NavItem key={lidx} label={link.label} icon={link.icon} href={link.href} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Navigation */}
      <div className="p-2.5 border-t border-slate-800/80 w-full bg-slate-950 mt-auto">
        <NavItem label="Settings" icon={Settings} href="/settings" />
      </div>
    </aside>
  );
};

