import React from 'react';
import { useSecurityStore } from '../../store/useSecurityStore';
import { X, Building2, Shield, Users, Database, BrainCircuit, Activity, Trash2, RotateCcw } from 'lucide-react';
import { useDepartments, useArchiveDepartment, useRestoreDepartment } from '../../api/departmentQueries';

export const DepartmentDetailsDrawer: React.FC = () => {
  const { selectedDepartmentId, setSelectedDepartmentId } = useSecurityStore();
  const { data: departments } = useDepartments();
  const archiveMutation = useArchiveDepartment();
  const restoreMutation = useRestoreDepartment();
  
  const dept = departments?.find(d => d.id === selectedDepartmentId);
  const isOpen = !!dept;

  if (!isOpen || !dept) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
        onClick={() => setSelectedDepartmentId(null)}
      />
      <div className="fixed top-0 right-0 h-screen w-full max-w-md bg-white border-l border-border z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-md border border-border flex items-center justify-center shrink-0 shadow-sm">
              <Building2 size={18} className="text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {dept.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Manager: {dept.manager}</p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedDepartmentId(null)}
            className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Security & Compliance</h3>
            <div className="p-3 border border-border rounded-md bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Base Clearance Level</span>
              </div>
              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide border bg-slate-100 text-slate-700 border-slate-200">
                {dept.securityLevel.replace('_', ' ')}
              </span>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resource Analytics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-border rounded-md bg-slate-50">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Users size={12} />
                  <span className="text-[10px] font-medium uppercase tracking-wide">Members</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{dept.memberCount}</p>
              </div>
              <div className="p-3 border border-border rounded-md bg-slate-50">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Activity size={12} />
                  <span className="text-[10px] font-medium uppercase tracking-wide">Documents</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{dept.documentCount}</p>
              </div>
              <div className="p-3 border border-border rounded-md bg-slate-50">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Database size={12} />
                  <span className="text-[10px] font-medium uppercase tracking-wide">Storage Used</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{dept.storageUsedGB.toFixed(1)} GB</p>
              </div>
              <div className="p-3 border border-border rounded-md bg-slate-50">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <BrainCircuit size={12} />
                  <span className="text-[10px] font-medium uppercase tracking-wide">AI Tokens</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{(dept.aiTokensUsed / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-slate-50 flex items-center justify-between gap-2">
          <div>
            {dept.status === 'ACTIVE' ? (
              <button 
                onClick={() => archiveMutation.mutate(dept.id, { onSuccess: () => setSelectedDepartmentId(null) })}
                disabled={archiveMutation.isPending}
                className="h-8 px-3 border border-red-200 bg-red-50 text-red-700 rounded-md text-xs font-medium hover:bg-red-100 transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                {archiveMutation.isPending ? 'Archiving...' : 'Archive'}
              </button>
            ) : (
              <button 
                onClick={() => restoreMutation.mutate(dept.id, { onSuccess: () => setSelectedDepartmentId(null) })}
                disabled={restoreMutation.isPending}
                className="h-8 px-3 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium hover:bg-emerald-100 transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="h-8 px-4 border border-border bg-white text-foreground rounded-md text-xs font-medium hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-primary focus:outline-none">
              Manage Members
            </button>
            <button className="h-8 px-4 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary-hover transition-colors shadow-sm focus:ring-2 focus:ring-primary focus:outline-none">
              Edit Security Policy
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
