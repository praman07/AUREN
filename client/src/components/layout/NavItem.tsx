import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

interface NavItemProps {
  label: string;
  icon: LucideIcon;
  href: string;
}

export const NavItem: React.FC<NavItemProps> = ({ label, icon: Icon, href }) => {
  const { pathname } = useLocation();
  const { isSidebarOpen } = useUIStore();
  
  // Strict active matching (or startsWith for nested routes)
  const isActive = pathname === href || (pathname.startsWith(href) && href !== '/');

  return (
    <Link
      to={href}
      aria-current={isActive ? 'page' : undefined}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 outline-none group text-xs font-medium
        ${
          isActive 
            ? 'bg-blue-600/20 text-white border border-blue-500/40 shadow-xs' 
            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
        }
      `}
      title={isSidebarOpen ? undefined : label}
    >
      <Icon size={16} className={`shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
      
      <span 
        className={`whitespace-nowrap transition-all duration-200 overflow-hidden ${
          isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'
        }`}
      >
        {label}
      </span>
    </Link>
  );
};
