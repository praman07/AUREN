import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, Loader2, Calendar } from 'lucide-react';
import { useAuditLogs } from '../api/auditLogQueries';
import type { AuditAction } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<AuditAction | ''>('');
  const [actorIdFilter, setActorIdFilter] = useState('');
  
  const { data, isLoading, isError } = useAuditLogs({
    page,
    limit: 50,
    action: actionFilter,
    actorId: actorIdFilter,
  });

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('FAILED')) {
      return 'bg-red-50 text-red-600 border-red-200';
    }
    if (action.includes('CREATE') || action.includes('GRANT') || action.includes('COMPLETED')) {
      return 'bg-green-50 text-green-600 border-green-200';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const handlePreviousPage = () => setPage(p => Math.max(1, p - 1));
  const handleNextPage = () => {
    if (data && page < data.meta.totalPages) {
      setPage(p => p + 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Audit Logs</h1>
            <p className="text-sm text-muted-foreground">Immutable record of organization activity and security events.</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-4 bg-white border-b border-border flex items-center gap-4 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Filter by Actor ID..."
            value={actorIdFilter}
            onChange={(e) => {
              setActorIdFilter(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value as AuditAction);
              setPage(1);
            }}
            className="pl-9 pr-8 py-2 bg-slate-50 border border-border rounded-md text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="READ">Read</option>
            <option value="PERMISSION_GRANT">Permission Grant</option>
            <option value="PERMISSION_REVOKE">Permission Revoke</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white border border-border rounded-lg shadow-sm flex flex-col min-h-0">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Loading audit records...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-24 text-red-600 bg-red-50">
              <ShieldAlert className="mb-4" size={32} />
              <p>Failed to load audit logs.</p>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Search className="mb-4 opacity-50" size={32} />
              <p>No audit records found matching your filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-muted-foreground bg-slate-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-medium">Timestamp</th>
                      <th className="px-6 py-3 font-medium">Action</th>
                      <th className="px-6 py-3 font-medium">Actor</th>
                      <th className="px-6 py-3 font-medium">Resource ID</th>
                      <th className="px-6 py-3 font-medium">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data?.data.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar size={14} />
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${getActionBadgeStyle(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {log.actor ? (
                            <div>
                              <p className="font-medium text-foreground">
                                {log.actor.firstName} {log.actor.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{log.actor.email}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">System</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {log.resourceId || '-'}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-slate-50">
                  <span className="text-sm text-muted-foreground">
                    Showing {(data.meta.page - 1) * data.meta.limit + 1} to {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of {data.meta.total} records
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-sm font-medium border border-border rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={page === data.meta.totalPages}
                      className="px-3 py-1.5 text-sm font-medium border border-border rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
