import React from 'react';
import { useOrganizationStore } from '../../store/useOrganizationStore';
import { Building2, Search, Filter } from 'lucide-react';

export const OrganizationsToolbar: React.FC = () => {
  const { setCreateModalOpen } = useOrganizationStore();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search organizations..." 
            className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
        <button className="h-8 px-3 border border-border bg-white text-foreground rounded-md text-xs font-medium hover:bg-muted transition-colors flex items-center gap-2 focus:ring-2 focus:ring-primary focus:outline-none">
          <Filter size={14} />
          Filters
        </button>
      </div>
      
      <button 
        onClick={() => setCreateModalOpen(true)}
        className="h-8 px-4 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2 focus:ring-2 focus:ring-primary focus:outline-none"
      >
        <Building2 size={14} />
        New Organization
      </button>
    </div>
  );
};
