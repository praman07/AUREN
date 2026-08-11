import React from 'react';
import type { Document } from '../../../api/documentQueries';
import { SectionHeader } from '../ui/DetailRow';
import { GitCommit } from 'lucide-react';

export const VersionHistory: React.FC<{ doc: Document }> = ({ doc }) => {
  return (
    <div>
      <SectionHeader title="Version History" icon={<GitCommit size={14} className="text-muted-foreground" />} />
      <div className="space-y-3 mt-2">
        {doc.versions?.map((v, i) => (
          <div key={v.id} className="flex gap-3 text-sm">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              {i !== (doc.versions?.length || 0) - 1 && <div className="w-px h-full bg-border my-1" />}
            </div>
            <div className="flex-1 pb-3">
              <div className="flex items-center justify-between">
                <span className="font-medium font-mono text-xs">v{v.version}</span>
                <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
