import React from 'react';
import type { Document } from '../../../api/documentQueries';
import { DetailRow, SectionHeader } from '../ui/DetailRow';
import { Info, Shield, BrainCircuit } from 'lucide-react';
import { ClassificationBadge, AIStatusBadge } from '../../ui/DocumentStatusBadges';

export const OverviewSection: React.FC<{ doc: Document }> = ({ doc }) => {
  const ext = doc.title.split('.').pop()?.toUpperCase() || 'FILE';
  const ownerStr = doc.owner ? `${doc.owner.firstName} ${doc.owner.lastName}` : 'Unknown';
  const bytes = doc.sizeBytes || 0;
  const mb = (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  const v = doc.versions && doc.versions.length > 0 ? doc.versions[0].version : 1;

  return (
    <div>
      <SectionHeader title="Overview" icon={<Info size={14} className="text-muted-foreground" />} />
      <div className="grid grid-cols-2 gap-x-4">
        <DetailRow label="File Type" value={ext} />
        <DetailRow label="Size" value={mb} />
        <DetailRow label="Latest Version" value={<span className="font-mono">v{v}</span>} />
        <DetailRow label="Owner" value={ownerStr} />
        <DetailRow label="Created" value={new Date(doc.createdAt).toLocaleString()} />
      </div>
    </div>
  );
};

export const SecuritySection: React.FC<{ doc: Document }> = ({ doc }) => {
  return (
    <div>
      <SectionHeader title="Security & Access" icon={<Shield size={14} className="text-muted-foreground" />} />
      <div className="grid grid-cols-1">
        <DetailRow label="Classification" value={<ClassificationBadge classification={(doc as any).classification || 'PUBLIC'} />} />
      </div>
    </div>
  );
};

export const AISection: React.FC<{ doc: Document }> = ({ doc }) => {
  const status = (doc.jobs?.[0]?.status === 'COMPLETED' ? 'Ready' : 'Processing') as any;
  
  return (
    <div>
      <SectionHeader title="AI Knowledge Base" icon={<BrainCircuit size={14} className="text-muted-foreground" />} />
      <div className="grid grid-cols-2 gap-x-4">
        <DetailRow label="Latest Job Status" value={<AIStatusBadge status={status} />} />
        {doc.jobs && doc.jobs[0]?.error && (
          <div className="col-span-2 mt-2">
            <span className="text-xs text-red-600">Error: {doc.jobs[0].error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
