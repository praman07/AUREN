import React from 'react';
import { Settings } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { NavItem } from './NavItem';
import { useAuthStore } from '../../core/auth/store/useAuthStore';
import { getTemplateConfig } from '../../core/templates/TemplateRegistry';
import { useLocation, Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const { isSidebarOpen } = useUIStore();
  const user = useAuthStore((state) => state.user);
  const templateConfig = getTemplateConfig(user?.industry);
  const location = useLocation();
  const isChatRoute = location.pathname === '/chat';

  // Flatten all navigation links into a single array for capsule layout
  const allNavLinks = templateConfig.navigation.flatMap((sec) => sec.links);

  // When on /chat route, render as a clean floating center-bottom navbar with Shadcn Tooltips
  if (isChatRoute) {
    return (
      <TooltipProvider delayDuration={150}>
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <nav className="h-14 px-3 rounded-full flex items-center gap-1.5 shadow-xl border border-slate-200/90 bg-white/90 backdrop-blur-md">
            {allNavLinks.map((link, idx) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;

              return (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>
                    <Link
                      to={link.href}
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors',
                        isActive && 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white shadow-xs'
                      )}
                    >
                      <Icon size={18} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {link.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}

            <div className="h-5 w-[1px] bg-slate-200/90 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/settings"
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors',
                    location.pathname === '/settings' && 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white shadow-xs'
                  )}
                >
                  <Settings size={18} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">
                Settings
              </TooltipContent>
            </Tooltip>
          </nav>
        </div>
      </TooltipProvider>
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


