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
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        
        {/* Corporate Top Header Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 shadow-md z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-800"
              title="Toggle navigation"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black tracking-wider text-white uppercase bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                AUREN Enterprise
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Zero-Trust Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/search')}
              className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 hover:bg-slate-900 hover:text-slate-200 px-3.5 py-2 rounded-xl border border-slate-800 transition-all duration-150 shadow-xs"
            >
              <Search size={14} className="text-blue-400" />
              <span className="hidden sm:inline">Search workspace...</span>
              <kbd className="ml-2 font-mono text-[10px] bg-slate-900 border border-slate-700/80 text-slate-400 px-1.5 py-0.5 rounded shadow-2xs">Ctrl K</kbd>
            </button>

            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-600/20 border border-blue-400/30">
                    {user.firstName ? user.firstName[0] : 'U'}
                  </div>
                  <div className="hidden md:flex flex-col text-left leading-tight">
                    <span className="text-xs font-bold text-white tracking-tight">{user.firstName} {user.lastName}</span>
                    <span className="text-[10px] text-blue-400 font-mono font-medium">{user.role || 'Super Admin'}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="p-2 ml-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 rounded-xl transition-all"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Container */}
        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
