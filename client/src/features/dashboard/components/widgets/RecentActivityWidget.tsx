import React from 'react';
import { ActivityEvent } from '../../mock/dashboard.mock';
import { Activity, UploadCloud, MessageSquare, Shield, UserPlus } from 'lucide-react';

const getEventIcon = (type: string) => {
  switch (type) {
    case 'UPLOAD': return <UploadCloud size={14} className="text-blue-600" />;
    case 'CHAT': return <MessageSquare size={14} className="text-purple-600" />;
    case 'PERMISSION': return <Shield size={14} className="text-amber-600" />;
    case 'INVITE': return <UserPlus size={14} className="text-green-600" />;
    default: return <Activity size={14} className="text-slate-600" />;
  }
};

const getRelativeTime = (timestamp: string) => {
  const mins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const RecentActivityWidget: React.FC<{ activity: ActivityEvent[] }> = ({ activity }) => {
  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Organization Activity</h2>
        <Activity size={14} className="text-muted-foreground" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <ol className="relative border-l border-border ml-2 space-y-4">
          {activity.map((event) => (
            <li key={event.id} className="ml-5">
              <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-50 rounded-full -left-3 ring-4 ring-white border border-border">
                {getEventIcon(event.type)}
              </span>
              <div className="flex flex-col text-xs">
                <span className="text-foreground">
                  <span className="font-semibold">{event.user}</span> {event.description}
                </span>
                <span className="text-muted-foreground mt-0.5">{getRelativeTime(event.timestamp)}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
