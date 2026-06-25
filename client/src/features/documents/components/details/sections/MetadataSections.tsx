import React from 'react';
import { ExtendedDocumentDetails } from '../../mock/documentDetails.mock';
import { DetailRow, SectionHeader } from '../ui/DetailRow';
import { Info, Shield, BrainCircuit } from 'lucide-react';
import { ClassificationBadge } from '../../ui/DocumentStatusBadges';

export const OverviewSection: React.FC<{ doc: ExtendedDocumentDetails }> = ({ doc }) => {
  const ext = doc.name.split('.').pop()?.toUpperCase() || 'FILE';
  return (
    <div>
      <SectionHeader title="Overview" icon={<Info size={14} className="text-muted-foreground" />} />
      <div className="grid grid-cols-2 gap-x-4">
        <DetailRow label="File Type" value={ext} />
        <DetailRow label="Size" value={doc.size} />
        <DetailRow label="Version" value={<span className="font-mono">{doc.version}</span>} />
        <DetailRow label="Owner" value={doc.owner} />
        <DetailRow label="Department" value={doc.department} />
        <DetailRow label="Organization" value={doc.organization} />
        <DetailRow label="Created" value={new Date(doc.uploadedAt).toLocaleString()} />
        <DetailRow label="Updated" value={new Date(doc.modifiedAt).toLocaleString()} />
      </div>
    </div>
  );
};

export const SecuritySection: React.FC<{ doc: ExtendedDocumentDetails }> = ({ doc }) => {
  return (
    <div>
      <SectionHeader title="Security & Access" icon={<Shield size={14} className="text-muted-foreground" />} />
      <div className="grid grid-cols-1">
        <DetailRow label="Classification" value={<ClassificationBadge classification={doc.classification} />} />
        <DetailRow label="Clearance Level" value={doc.clearanceLevel} />
        <DetailRow label="Visibility" value={doc.visibility} />
        {doc.sharedWithGroups.length > 0 && (
          <DetailRow label="Shared Groups" value={doc.sharedWithGroups.join(', ')} />
        )}
        {doc.sharedWithUsers.length > 0 && (
          <DetailRow label="Shared Users" value={doc.sharedWithUsers.join(', ')} />
        )}
      </div>
    </div>
  );
};

export const AISection: React.FC<{ doc: ExtendedDocumentDetails }> = ({ doc }) => {
  return (
    <div>
      <SectionHeader title="AI Knowledge Base" icon={<BrainCircuit size={14} className="text-muted-foreground" />} />
      <div className="grid grid-cols-2 gap-x-4">
        <DetailRow label="Indexed Status" value={doc.aiStatus} />
        <DetailRow label="Embedding Model" value={doc.embeddingModel} />
        <DetailRow label="Vector Count" value={doc.vectorCount.toLocaleString()} />
        <DetailRow label="Chunks" value={doc.chunkCount.toLocaleString()} />
        <div className="col-span-2">
          <DetailRow label="Last Indexed" value={new Date(doc.indexedAt).toLocaleString()} />
        </div>
      </div>
    </div>
  );
};
