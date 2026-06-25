import React from 'react';
import { ExtendedDocumentDetails } from '../../mock/documentDetails.mock';
import { SectionHeader } from '../ui/DetailRow';
import { Activity, UploadCloud, Eye, Download, Users, Lock, BrainCircuit, MessageSquare } from 'lucide-react';

const getEventIcon = (type: string) => {
  switch (type) {
    case 'UPLOADED': return <UploadCloud size={12} />;
    case 'VIEWED': return <Eye size={12} />;
    case 'DOWNLOADED': return <Download size={12} />;
    case 'SHARED': return <Users size={12} />;
    case 'PERMISSION_CHANGED': return <Lock size={12} />;
    case 'INDEXED': return <BrainCircuit size={12} />;
    case 'AI_CHAT': return <MessageSquare size={12} />;
    default: return <Activity size={12} />;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'UPLOADED': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'INDEXED': return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'AI_CHAT': return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'SHARED': return 'text-green-600 bg-green-50 border-green-200';
    case 'PERMISSION_CHANGED': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

export const ActivityTimeline: React.FC<{ doc: ExtendedDocumentDetails }> = ({ doc }) => {
  return (
    <div>
      <SectionHeader title="Activity Timeline" icon={<Activity size={14} className="text-muted-foreground" />} />
      <ol className="relative border-l border-border ml-2 mt-3 space-y-4">
        {doc.timeline.map((event) => (
          <li key={event.id} className="ml-5">
            <span className={`absolute flex items-center justify-center w-5 h-5 rounded-full -left-2.5 ring-4 ring-white border ${getEventColor(event.type)}`}>
              {getEventIcon(event.type)}
            </span>
            <div className="flex flex-col text-xs">
              <span className="font-medium text-foreground capitalize">
                {event.type.replace('_', ' ').toLowerCase()}
              </span>
              <span className="text-muted-foreground mt-0.5">
                {event.actor} • {new Date(event.timestamp).toLocaleString()}
              </span>
              {event.details && (
                <span className="text-muted-foreground mt-1 bg-slate-50 p-1.5 rounded border border-border/50">
                  {event.details}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
