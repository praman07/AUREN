import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import { Menu, Search } from 'lucide-react';

interface EnterpriseLayoutProps {
  children: React.ReactNode;
}

import { Sidebar } from './Sidebar';

export const EnterpriseLayout: React.FC<EnterpriseLayoutProps> = ({ children }) => {
  const { toggleSidebar } = useUIStore();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        
        <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-medium text-foreground">/ Documents / Q3 Financials</span>
          </div>

          <div className="flex items-center">
            <button className="flex items-center gap-2 text-xs text-muted-foreground bg-muted hover:bg-slate-200/80 px-3 py-1.5 rounded-md border border-border transition-colors">
              <Search size={14} />
              <span>Search...</span>
              <kbd className="ml-4 font-mono text-[10px] bg-white border border-border px-1.5 py-0.5 rounded shadow-sm">Ctrl K</kbd>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
