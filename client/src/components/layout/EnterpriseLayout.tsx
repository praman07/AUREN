import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import { Menu, Search, LogOut } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';

import { useAuthStore } from '../../core/auth/store/useAuthStore';

export const EnterpriseLayout: React.FC = () => {
  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans antialiased">
      
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        
        <header className="h-14 border-b border-border bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
              title="Toggle navigation"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100 uppercase">AUREN Engine</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-full">
                Zero-Trust Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/search')}
              className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100/80 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200/80 transition-all"
            >
              <Search size={14} className="text-slate-400" />
              <span>Search workspace...</span>
              <kbd className="ml-3 font-mono text-[10px] bg-white border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded shadow-2xs">Ctrl K</kbd>
            </button>

            {user && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shadow-2xs">
                  {user.firstName ? user.firstName[0] : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-none">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user.firstName} {user.lastName}</span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">{user.role || 'Super Admin'}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="p-1.5 ml-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
