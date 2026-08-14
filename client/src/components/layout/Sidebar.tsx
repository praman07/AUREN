import React from 'react';
import { Settings } from 'lucide-react';
import { useAuthStore } from '../../core/auth/store/useAuthStore';
import { getTemplateConfig } from '../../core/templates/TemplateRegistry';
import { useLocation, Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const templateConfig = getTemplateConfig(user?.industry);
  const location = useLocation();

  // Flatten all navigation links into a single array for capsule layout
  const allNavLinks = templateConfig.navigation.flatMap((sec) => sec.links);

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
};



