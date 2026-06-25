import React from 'react';
import { RecentDocument } from '../../mock/dashboard.mock';
import { FileText } from 'lucide-react';

export const RecentDocumentsWidget: React.FC<{ docs: RecentDocument[] }> = ({ docs }) => {
  return (
    <div className="bg-white border border-border rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Recent Documents</h2>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 sticky top-0 border-b border-border">
            <tr>
              <th className="px-4 py-2 font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 font-medium text-muted-foreground uppercase tracking-wider">Dept</th>
              <th className="px-4 py-2 font-medium text-muted-foreground uppercase tracking-wider text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {docs.map(doc => (
              <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[180px]" title={doc.name}>{doc.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{doc.department}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                    doc.status === 'Ready' ? 'bg-green-50 text-green-700 border-green-200' :
                    doc.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {doc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
