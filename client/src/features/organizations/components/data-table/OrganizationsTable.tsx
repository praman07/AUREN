import React from 'react';
import { useOrganization } from '../../api/organizationQueries';
import { Building2, ShieldCheck, Users, FileText } from 'lucide-react';

export const OrganizationsTable: React.FC = () => {
  const { data: org, isLoading, isError, error } = useOrganization();

  if (isLoading) {
    return (
      <div className="p-8 text-center border border-border rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Loading workspace organization context...</p>
      </div>
    );
  }

  if (isError || !org) {
    return (
      <div className="p-6 border border-red-200 dark:border-red-900 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-xs">
        Failed to load organization settings: {(error as any)?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-border">
          <tr>
            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Organization</th>
            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Industry</th>
            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Users</th>
            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Departments</th>
            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Documents</th>
            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">Isolation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
            <td className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/60 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                  <Building2 size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{org.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{org.domain || 'Single Tenant Workspace'}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3.5">
              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {org.industry}
              </span>
            </td>
            <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-slate-400" />
                {org._count?.users || 0} active members
              </div>
            </td>
            <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
              {org._count?.departments || 0} departments
            </td>
            <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
              <div className="flex items-center gap-1.5">
                <FileText size={13} className="text-slate-400" />
                {org._count?.documents || 0} ingested
              </div>
            </td>
            <td className="px-4 py-3.5 text-right">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck size={12} /> HARD ISOLATED
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
