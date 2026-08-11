import React, { useState } from 'react';
import { Activity, Search, Filter, Loader2, Calendar, FileText, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useProcessingJobs } from '../api/processingJobQueries';
import type { ProcessingJobStatus } from '../types';

export const ProcessingJobsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProcessingJobStatus | ''>('');
  const [queueFilter, setQueueFilter] = useState('');
  
  const { data, isLoading, isError } = useProcessingJobs({
    page,
    limit: 50,
    status: statusFilter,
    queueName: queueFilter,
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'FAILED': return 'bg-red-50 text-red-600 border-red-200';
      case 'COMPLETED': return 'bg-green-50 text-green-600 border-green-200';
      case 'PROCESSING': return 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse';
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'FAILED': return <AlertCircle size={14} className="mr-1 inline" />;
      case 'COMPLETED': return <CheckCircle2 size={14} className="mr-1 inline" />;
      case 'PROCESSING': return <Loader2 size={14} className="mr-1 inline animate-spin" />;
      case 'PENDING': return <Clock size={14} className="mr-1 inline" />;
      default: return null;
    }
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
            <Activity size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Processing Jobs</h1>
            <p className="text-sm text-muted-foreground">Monitor document ingestion and background queue workers.</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-4 bg-white border-b border-border flex items-center gap-4 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Filter by Queue Name..."
            value={queueFilter}
            onChange={(e) => {
              setQueueFilter(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ProcessingJobStatus);
              setPage(1);
            }}
            className="pl-9 pr-8 py-2 bg-slate-50 border border-border rounded-md text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white border border-border rounded-lg shadow-sm flex flex-col min-h-0">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Loading processing jobs...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-24 text-red-600 bg-red-50">
              <AlertCircle className="mb-4" size={32} />
              <p>Failed to load processing jobs.</p>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Search className="mb-4 opacity-50" size={32} />
              <p>No processing jobs found matching your filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-slate-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-medium whitespace-nowrap">Document</th>
                      <th className="px-6 py-3 font-medium whitespace-nowrap">Queue / Stage</th>
                      <th className="px-6 py-3 font-medium whitespace-nowrap">Status</th>
                      <th className="px-6 py-3 font-medium whitespace-nowrap">Time Created</th>
                      <th className="px-6 py-3 font-medium whitespace-nowrap">Details / Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data?.data.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-muted-foreground shrink-0" />
                            <div className="truncate">
                              <p className="font-medium text-foreground truncate" title={job.document?.title || 'Unknown'}>
                                {job.document?.title || 'Unknown Document'}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono truncate">
                                {job.documentId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs">
                            {job.queueName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap ${getStatusBadgeStyle(job.status)}`}>
                            {getStatusIcon(job.status)}
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <Calendar size={12} />
                            {new Date(job.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {job.error ? (
                            <p className="text-xs text-red-600 line-clamp-2" title={job.error}>
                              {job.error}
                            </p>
                          ) : job.completedAt ? (
                            <p className="text-xs text-muted-foreground">
                              Finished at {new Date(job.completedAt).toLocaleTimeString()}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Attempts: {job.attempts} / {job.maxAttempts}
                            </p>
                          )}
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
