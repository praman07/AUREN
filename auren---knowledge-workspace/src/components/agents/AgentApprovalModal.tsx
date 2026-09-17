import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  FileText,
  ArrowRight,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import { AgentApprovalRequest } from '../../types/agents';
import { Button } from '../ui/Button';

interface AgentApprovalModalProps {
  requests: AgentApprovalRequest[];
  isOpen: boolean;
  onClose: () => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onReviewChanges?: (request: AgentApprovalRequest) => void;
}

export const AgentApprovalModal: React.FC<AgentApprovalModalProps> = ({
  requests,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onReviewChanges,
}) => {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    requests[0]?.id || null
  );

  if (!isOpen) return null;

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || requests[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Human-in-the-Loop Approval Queue
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {requests.filter((r) => r.status === 'pending').length} pending agent action requests requiring human authorization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white text-xs font-semibold p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Body Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Request Selector Tabs if multiple */}
          {requests.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-100 dark:border-neutral-800">
              {requests.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRequestId(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                    selectedRequest?.id === r.id
                      ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-800'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  {r.agentName}: {r.title.slice(0, 24)}...
                </button>
              ))}
            </div>
          )}

          {selectedRequest ? (
            <div className="space-y-4">
              {/* Request Overview */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Requested by {selectedRequest.agentName}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      selectedRequest.risk === 'High'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {selectedRequest.risk} Risk Impact
                  </span>
                </div>

                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {selectedRequest.title}
                </h4>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  <span className="font-semibold text-neutral-900 dark:text-white">Rationale: </span>
                  {selectedRequest.reason}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Requires Role: <strong className="text-neutral-800 dark:text-neutral-200">{selectedRequest.requiresRole}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedRequest.createdAt}</span>
                  </div>
                </div>
              </div>

              {/* Affected Items List */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Affected Artifacts ({selectedRequest.affectedCount})
                  </h5>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Cryptographic hash validation pending
                  </span>
                </div>

                <div className="space-y-1.5">
                  {selectedRequest.affectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 text-xs text-neutral-800 dark:text-neutral-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="font-medium">{item}</span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">
                        PENDING SIGN-OFF
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Policy Reminder */}
              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  By approving, an immutable audit log entry is recorded with your clearance and user identity.
                  Changes cannot be silently reverted.
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-neutral-400">
              No pending approval requests.
            </div>
          )}
        </div>

        {/* Footer Actions (Requirement 13) */}
        {selectedRequest && (
          <div className="p-4 bg-neutral-50/80 dark:bg-neutral-900/80 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReviewChanges && onReviewChanges(selectedRequest)}
              icon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Review Changes
            </Button>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(selectedRequest.id)}
                icon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
                className="hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300"
              >
                Reject Request
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => onApprove(selectedRequest.id)}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Approve & Execute
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
