import React from 'react';
import { allPermissions } from '../../mock/security.mock';
import { Check, X, Loader2 } from 'lucide-react';
import { useRoles, useTogglePermission } from '../../api/roleQueries';
import type { PermissionKey } from '../../types';

export const PermissionMatrixTable: React.FC = () => {
  const { data: roles, isLoading, isError } = useRoles();
  const toggleMutation = useTogglePermission();

  const getRoleHeaderColor = (roleName: string) => {
    if (roleName === 'Super Admin') return 'text-red-600 bg-red-50 border-red-200';
    if (roleName === 'Organization Admin') return 'text-purple-600 bg-purple-50 border-purple-200';
    if (roleName === 'Department Admin') return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (roleName === 'Guest') return 'text-slate-500 bg-slate-50 border-slate-200';
    return 'text-foreground bg-white border-border';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12 border border-border rounded-md bg-white shadow-sm">
        <Loader2 className="animate-spin text-muted-foreground mr-2" size={24} />
        <span className="text-muted-foreground">Loading roles...</span>
      </div>
    );
  }

  if (isError || !roles) {
    return (
      <div className="flex justify-center items-center p-12 border border-red-200 rounded-md bg-red-50 text-red-600 shadow-sm">
        Failed to load roles and permissions.
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="flex justify-center items-center p-12 border border-border rounded-md bg-white shadow-sm text-muted-foreground">
        No roles found.
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md bg-white overflow-x-auto shadow-sm">
      <table className="w-full text-[11px] text-left">
        <thead className="bg-slate-50 border-b border-border sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider sticky left-0 bg-slate-50 border-r border-border min-w-[150px]">
              Capability
            </th>
            {roles.map(role => (
              <th key={role.id} className="px-2 py-3 text-center min-w-[100px] border-r border-border last:border-r-0">
                <div className={`inline-block px-2 py-1 border rounded font-semibold ${getRoleHeaderColor(role.name)}`}>
                  {role.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {allPermissions.map(perm => {
            const isCritical = ['USER_INVITE', 'ORG_MANAGE', 'PERM_MANAGE', 'AUDIT_LOGS'].includes(perm);
            
            return (
              <tr key={perm} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2 sticky left-0 bg-white border-r border-border font-medium flex items-center justify-between">
                  <span className={isCritical ? 'text-red-700' : 'text-foreground'}>{perm.replace('_', ' ')}</span>
                  {isCritical && <span className="w-2 h-2 rounded-full bg-red-500" title="Critical Permission" />}
                </td>
                {roles.map(role => {
                  const hasPerm = role.permissions?.some(p => p.action === perm);
                  const isSystem = role.isSystem;
                  const isMutating = toggleMutation.isPending && toggleMutation.variables?.roleId === role.id && toggleMutation.variables?.permission === perm;
                  
                  return (
                    <td key={`${role.id}-${perm}`} className="px-2 py-2 text-center border-r border-border last:border-r-0">
                      <button
                        onClick={() => toggleMutation.mutate({ roleId: role.id, permission: perm as PermissionKey, enabled: !hasPerm })}
                        disabled={isSystem || toggleMutation.isPending}
                        className={`w-6 h-6 mx-auto rounded flex items-center justify-center transition-colors border ${
                          hasPerm 
                            ? isSystem ? 'bg-red-100 border-red-200 text-red-600' : 'bg-primary border-primary text-primary-foreground hover:bg-primary-hover' 
                            : 'bg-slate-50 border-slate-200 text-slate-300 hover:bg-slate-100 hover:text-slate-400'
                        } ${isSystem ? 'cursor-not-allowed opacity-80' : 'cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none'} ${(isSystem && !hasPerm) && 'opacity-40'}`}
                      >
                        {isMutating ? <Loader2 size={12} className="animate-spin" /> : hasPerm ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
