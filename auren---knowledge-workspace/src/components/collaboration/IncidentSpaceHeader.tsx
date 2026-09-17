import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Shield,
  CheckCircle2,
  FileText,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { AurenDocument } from '../../types';

interface IncidentSpaceHeaderProps {
  documents: AurenDocument[];
  onOpenDocument?: (docId: string) => void;
}

export const IncidentSpaceHeader: React.FC<IncidentSpaceHeaderProps> = ({
  documents,
  onOpenDocument,
}) => {
  const { activeChannel } = useCollaboration();
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

  if (activeChannel?.type !== 'incident' || !activeChannel.incidentState) {
    return null;
  }

  const incident = activeChannel.incidentState;
  const pinnedDoc = documents.find((d) => d.id === 'doc_sec_002');

  return (
    <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-3 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Incident Summary Info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                {incident.id}: Ingress TLS Session Resumption Latency Spike
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white shadow-2xs">
                {incident.severity}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300">
                Status: {incident.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              <span>Incident Lead: <strong>{incident.incidentLead}</strong></span>
              <span>•</span>
              <span>Started: {incident.startedAt}</span>
            </div>
          </div>
        </div>

        {/* Pinned Incident Policy & Timeline Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {pinnedDoc && onOpenDocument && (
            <button
              type="button"
              onClick={() => onOpenDocument(pinnedDoc.id)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Incident Playbook</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
            className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Timeline ({incident.timeline.length})</span>
            {isTimelineExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Interactive Incident Timeline */}
      {isTimelineExpanded && (
        <div className="mt-3 pt-3 border-t border-rose-500/20 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
            Remediation Event Log:
          </span>
          <div className="space-y-1.5 pl-2 border-l-2 border-rose-500/40 ml-1">
            {incident.timeline.map((event, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className="text-neutral-500 font-mono text-[10px] shrink-0 mt-0.5">
                  {event.time}
                </span>
                <p className="text-neutral-800 dark:text-neutral-200">
                  {event.event}{' '}
                  <span className="text-neutral-500 text-[10px] font-mono">({event.actor})</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
