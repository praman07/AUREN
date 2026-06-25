import React from 'react';
import { useOrganizationStore } from '../../store/useOrganizationStore';
import { X, Building2, HardDrive, Users, Activity, ExternalLink, Archive } from 'lucide-react';

export const OrganizationDetailsDrawer: React.FC = () => {
  const { selectedOrgId, setSelectedOrgId, organizations, setArchiveAlertOpen } = useOrganizationStore();
  
  const org = organizations.find(o => o.id === selectedOrgId);
  const isOpen = !!org;

  if (!isOpen || !org) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
        onClick={() => setSelectedOrgId(null)}
      />
      <div className="fixed top-0 right-0 h-screen w-full max-w-md bg-white border-l border-border z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-md border border-border flex items-center justify-center shrink-0 shadow-sm">
              <Building2 size={18} className="text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{org.name}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {org.domain}
                <a href={`https://${org.domain}`} target="_blank" rel="noreferrer" className="hover:text-primary">
                  <ExternalLink size={10} />
                </a>
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedOrgId(null)}
            className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Overview */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-md border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Industry</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{org.industry}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-md border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Timezone</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{org.timezone}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-md border border-border col-span-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Description</p>
                <p className="text-xs text-foreground mt-0.5 leading-relaxed">{org.description}</p>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Usage & Limits</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border rounded-md bg-white">
                <div className="flex items-center gap-2">
                  <HardDrive size={14} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Storage</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-foreground">{org.storageUsedGB.toFixed(1)} GB</span>
                  <span className="text-[10px] text-muted-foreground ml-1">/ {org.storageLimitGB} GB</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border border-border rounded-md bg-white">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Seats Active</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{org.userCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 border border-border rounded-md bg-white">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">AI Tokens</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{(org.aiTokensUsed / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-slate-50 flex items-center justify-between">
          <button 
            disabled={org.status === 'ARCHIVED'}
            onClick={() => setArchiveAlertOpen(true)}
            className="flex items-center gap-2 h-8 px-3 text-red-600 hover:bg-red-50 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Archive size={14} />
            {org.status === 'ARCHIVED' ? 'Archived' : 'Archive Org'}
          </button>
          
          <button className="h-8 px-4 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary-hover transition-colors shadow-sm focus:ring-2 focus:ring-primary focus:outline-none">
            Edit Details
          </button>
        </div>
      </div>
    </>
  );
};
