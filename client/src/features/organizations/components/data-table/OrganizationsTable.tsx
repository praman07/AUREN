import React from 'react';
import { useOrganizationStore } from '../../store/useOrganizationStore';
import { Building2 } from 'lucide-react';

export const OrganizationsTable: React.FC = () => {
  const { organizations, selectedOrgId, setSelectedOrgId } = useOrganizationStore();

  return (
    <div className="border border-border rounded-md bg-white overflow-hidden shadow-sm">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50 border-b border-border">
          <tr>
            <th className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider w-[300px]">Organization</th>
            <th className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
            <th className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider">Storage</th>
            <th className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider">Users</th>
            <th className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {organizations.map(org => {
            const isSelected = selectedOrgId === org.id;
            const storagePercent = (org.storageUsedGB / org.storageLimitGB) * 100;
            
            return (
              <tr 
                key={org.id} 
                onClick={() => setSelectedOrgId(org.id)}
                className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-slate-50'}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded border border-border flex items-center justify-center shrink-0">
                      <Building2 size={14} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{org.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{org.domain}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide border ${
                    org.plan === 'ENTERPRISE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    org.plan === 'PROFESSIONAL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {org.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 w-24">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{org.storageUsedGB.toFixed(0)}G</span>
                      <span>{org.storageLimitGB}G</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${storagePercent > 90 ? 'bg-red-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min(storagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {org.userCount}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                    org.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                    org.status === 'SUSPENDED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {org.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
