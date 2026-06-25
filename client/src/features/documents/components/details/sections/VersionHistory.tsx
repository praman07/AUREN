import React from 'react';
import { ExtendedDocumentDetails } from '../../mock/documentDetails.mock';
import { SectionHeader } from '../ui/DetailRow';
import { History, RotateCcw } from 'lucide-react';

export const VersionHistory: React.FC<{ doc: ExtendedDocumentDetails }> = ({ doc }) => {
  return (
    <div>
      <SectionHeader title="Version History" icon={<History size={14} className="text-muted-foreground" />} />
      <div className="space-y-3 mt-2">
        {doc.versions.map((v, idx) => (
          <div key={v.id} className="flex gap-3 text-xs">
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-primary' : 'bg-muted-foreground'}`} />
              {idx !== doc.versions.length - 1 && <div className="w-[1px] flex-1 bg-border my-1" />}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground font-mono">{v.version}</span>
                <span className="text-muted-foreground">{new Date(v.timestamp).toLocaleDateString()}</span>
              </div>
              <p className="text-muted-foreground mt-0.5">{v.changes}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-muted-foreground">by {v.author}</span>
                {idx !== 0 && (
                  <button className="text-[10px] flex items-center gap-1 text-primary hover:underline" disabled>
                    <RotateCcw size={10} /> Restore
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
