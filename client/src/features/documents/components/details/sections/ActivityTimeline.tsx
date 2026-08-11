import React from 'react';
import type { Document } from '../../../api/documentQueries';
import { SectionHeader } from '../ui/DetailRow';
import { Activity, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

const getEventIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case 'UPLOADED': return <UploadCloud size={12} />;
    case 'COMPLETED': return <CheckCircle2 size={12} />;
    case 'FAILED': return <AlertCircle size={12} />;
    case 'PROCESSING': return <Activity size={12} />;
    case 'QUEUED': return <Activity size={12} />;
    default: return <Activity size={12} />;
  }
};

const getEventColor = (type: string) => {
  switch (type.toUpperCase()) {
    case 'UPLOADED': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'COMPLETED': return 'text-green-600 bg-green-50 border-green-200';
    case 'FAILED': return 'text-red-600 bg-red-50 border-red-200';
    case 'PROCESSING': return 'text-purple-600 bg-purple-50 border-purple-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

export const ActivityTimeline: React.FC<{ doc: Document }> = ({ doc }) => {
  const jobs = doc.jobs || [];

  return (
    <div>
      <SectionHeader title="Processing Timeline" icon={<Activity size={14} className="text-muted-foreground" />} />
      {jobs.length === 0 ? (
        <div className="text-xs text-muted-foreground mt-3">No processing jobs recorded.</div>
      ) : (
        <ol className="relative border-l border-border ml-2 mt-3 space-y-4">
          {jobs.map((job, idx) => (
            <li key={idx} className="ml-5">
              <span className={`absolute flex items-center justify-center w-5 h-5 rounded-full -left-2.5 ring-4 ring-white border ${getEventColor(job.status)}`}>
                {getEventIcon(job.status)}
              </span>
              <div className="flex flex-col text-xs">
                <span className="font-medium text-foreground capitalize">
                  {job.status.toLowerCase()}
                </span>
                <span className="text-muted-foreground mt-0.5">
                  System • {new Date(job.createdAt).toLocaleString()}
                </span>
                {job.error && (
                  <span className="text-red-600 mt-1 bg-red-50 p-1.5 rounded border border-red-200/50">
                    {job.error}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
