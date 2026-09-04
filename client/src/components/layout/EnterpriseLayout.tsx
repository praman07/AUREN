import React from 'react';
import { Search } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Button } from '../ui/button';
import { UploadDialog } from '../../features/documents/components/upload/UploadDialog';
import { DocumentDetailsDrawer } from '../../features/documents/components/details/DocumentDetailsDrawer';

export const EnterpriseLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white bg-white text-slate-900">
      
      {/* Floating Center-Bottom Navigation Bar */}
      <Sidebar />

      {/* Top Header: Search Only (No Logo, No Extra Widgets) */}
      <header className="h-16 flex items-center justify-center px-6 shrink-0 z-40 bg-white border-b border-slate-100">
        <Button
          variant="outline"
          onClick={() => navigate('/search')}
          className="w-full max-w-md flex items-center justify-between text-xs text-slate-500 hover:text-slate-900 bg-slate-50/80 hover:bg-slate-100 border-slate-200/90 rounded-full h-10 px-4 transition-all shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search size={15} className="text-blue-600" />
            <span className="font-medium">Search workspace...</span>
          </div>
          <kbd className="font-mono text-[10px] bg-white border border-slate-200 text-slate-400 px-2 py-0.5 rounded-md shadow-2xs">Ctrl K</kbd>
        </Button>
      </header>

      {/* Main Content Area - pb-24 ensures content never gets hidden under fixed bottom navbar */}
      <main className="flex-1 overflow-auto custom-scrollbar p-6 pb-28">
        <div className="max-w-7xl mx-auto h-full">
          <Outlet />
        </div>
      </main>

      {/* Global Dialogs & Drawers */}
      <UploadDialog />
      <DocumentDetailsDrawer />
    </div>
  );
};


