import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
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
        flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 outline-none
        focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
        ${
          isActive 
            ? 'bg-white shadow-sm border border-border text-primary font-medium' 
            : 'text-muted-foreground hover:bg-slate-200/50 hover:text-foreground border border-transparent'
        }
      `}
      title={isSidebarOpen ? undefined : label}
    >
      <Icon size={18} className={`shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
      
      {/* Text smoothly fades/shrinks when sidebar closes */}
      <span 
        className={`whitespace-nowrap transition-all duration-200 overflow-hidden text-sm ${
          isSidebarOpen ? 'w-auto opacity-100 ml-1' : 'w-0 opacity-0 ml-0'
        }`}
      >
        {label}
      </span>
    </Link>
  );
};
