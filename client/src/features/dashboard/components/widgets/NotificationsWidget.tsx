import React from 'react';
import { Notification } from '../../mock/dashboard.mock';
import { Bell, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

const getIcon = (type: string) => {
  switch (type) {
    case 'SUCCESS': return <CheckCircle2 size={16} className="text-green-600" />;
    case 'WARNING': return <AlertTriangle size={16} className="text-amber-600" />;
    case 'ERROR': return <XCircle size={16} className="text-red-600" />;
    case 'INFO': return <Info size={16} className="text-blue-600" />;
    default: return null;
  }
};

export const NotificationsWidget: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        <Bell size={14} className="text-muted-foreground" />
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {notifications.map((note) => (
          <div key={note.id} className="flex gap-3 p-3 rounded-md bg-slate-50 border border-border/50 items-start">
            <div className="shrink-0 mt-0.5">{getIcon(note.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-foreground truncate">{note.title}</h4>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{note.time}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                {note.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
