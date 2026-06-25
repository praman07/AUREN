import React from 'react';
import { Plus, Users, MessageSquare, FolderPlus } from 'lucide-react';
import { useUploadStore } from '../../documents/store/useUploadStore';

export const DashboardHeader: React.FC = () => {
  const { setIsOpen } = useUploadStore();

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Good morning, Admin</h1>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Acme Corp</span>
          <span>•</span>
          <span>Global Workspace</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 h-8 px-3 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary-hover transition-colors shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
        >
          <Plus size={14} />
          Upload Document
        </button>
        <button className="flex items-center gap-2 h-8 px-3 border border-border bg-white text-foreground rounded-md text-xs font-medium hover:bg-muted transition-colors shadow-sm focus:ring-2 focus:ring-primary focus:outline-none">
          <FolderPlus size={14} />
          New Department
        </button>
        <button className="flex items-center gap-2 h-8 px-3 border border-border bg-white text-foreground rounded-md text-xs font-medium hover:bg-muted transition-colors shadow-sm focus:ring-2 focus:ring-primary focus:outline-none">
          <MessageSquare size={14} />
          New Chat
        </button>
      </div>
    </div>
  );
};
