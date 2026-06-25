import React from 'react';
import { useSecurityStore } from '../../store/useSecurityStore';
import { Building2, Shield, Users, Database } from 'lucide-react';

export const DepartmentsTable: React.FC = () => {
  const { departments, selectedDepartmentId, setSelectedDepartmentId } = useSecurityStore();

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'TOP_SECRET': return 'bg-red-50 text-red-700 border-red-200';
      case 'SECRET': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'STRICTLY_CONFIDENTIAL': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CONFIDENTIAL': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'INTERNAL': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PUBLIC': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="border border-border rounded-md bg-white overflow-hidden shadow-sm">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50 border-b border-border">
          <tr>
            <th className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider w-1/3">Department</th>
            <th className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider">Manager</th>
            <th className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider text-center">Clearance</th>
            <th className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider text-right">Metrics</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {departments.map(dept => {
            const isSelected = selectedDepartmentId === dept.id;
            return (
              <tr 
                key={dept.id} 
                onClick={() => setSelectedDepartmentId(dept.id)}
                className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-slate-50'}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 border border-border flex items-center justify-center shrink-0">
                      <Building2 size={14} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        {dept.name}
                        {dept.status === 'ARCHIVED' && (
                          <span className="text-[9px] font-bold text-slate-500 uppercase px-1 py-0.5 border border-slate-200 rounded">Archived</span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground font-medium">
                  {dept.manager}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide border ${getSecurityColor(dept.securityLevel)}`}>
                    {dept.securityLevel.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3 text-[10px] text-muted-foreground font-medium">
                    <div className="flex items-center gap-1" title="Members">
                      <Users size={12} /> {dept.memberCount}
                    </div>
                    <div className="flex items-center gap-1" title="Storage">
                      <Database size={12} /> {dept.storageUsedGB.toFixed(1)}GB
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
