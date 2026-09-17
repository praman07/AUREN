import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Scale,
  MessageSquare,
  Video,
  Sparkles,
  ExternalLink,
  ListTodo,
  Bot,
  RefreshCw,
} from 'lucide-react';
import type { ArchitectureReviewResult } from '../../types/agents';
import { getArchitectureReview } from '../../services/agentData';
import type { AurenDocument } from '../../types';
import { Button } from '../ui/button';
import { CreateActionItemModal } from '../collaboration/CreateActionItemModal';

interface ArchitectureReviewerViewProps {
  initialDocumentId?: string;
  documents: AurenDocument[];
  onOpenDocument?: (doc: AurenDocument) => void;
  onOpenPolicy?: (policyId: string) => void;
  onOpenDecision?: (decisionId: string) => void;
  onOpenMeeting?: (meetingId: string) => void;
  onOpenDiscussion?: (channelId: string) => void;
  onAskAuren?: (prompt: string) => void;
  onClose?: () => void;
}

export const ArchitectureReviewerView: React.FC<ArchitectureReviewerViewProps> = ({
  initialDocumentId = 'doc_arch_001',
  documents,
  onOpenDocument,
  onOpenPolicy,
  onOpenDecision,
  onOpenMeeting,
  onOpenDiscussion,
  onAskAuren,
  onClose: _onClose,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocumentId);
  const [filterType, setFilterType] = useState<'all' | 'alignment' | 'concern' | 'conflict'>('all');
  const [isReevaluating, setIsReevaluating] = useState(false);

  // Action modal state
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionAssignee, setActionAssignee] = useState('Marcus Vance');

  const currentDoc =
    documents.find((d) => d.id === selectedDocId) ||
    documents.find((d) => d.id === 'doc_arch_001') ||
    documents[0];

  const docTitle = currentDoc?.title || 'AUREN System Architecture & Multi-Tenant Retrieval Engine v4';
  const reviewResult: ArchitectureReviewResult = getArchitectureReview(selectedDocId, docTitle);

  const handleReevaluate = () => {
    setIsReevaluating(true);
    setTimeout(() => {
      setIsReevaluating(false);
    }, 600);
  };

  const handleCreateRemediationTask = (recommendation: string) => {
    setActionTitle(`Remediate: ${recommendation}`);
    setActionAssignee('Praman Singh Bhogal');
    setIsActionModalOpen(true);
  };

  const filteredFindings = (reviewResult?.findings || []).filter((f) => {
    if (filterType === 'all') return true;
    return f.type === filterType;
  });

  const statusBadge = () => {
    switch (reviewResult.overallStatus) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            APPROVED
          </span>
        );
      case 'CONFLICT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            CONFLICT DETECTED
          </span>
        );
      case 'NEEDS_REVIEW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            NEEDS REVIEW
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <ShieldAlert className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                AUREN Architecture Reviewer
              </span>
              <span className="text-xs text-neutral-400 font-mono">Autonomous Policy & Decision Auditing</span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Proposal Conformance & Multi-Factor Review
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReevaluate}
              disabled={isReevaluating}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isReevaluating ? 'animate-spin' : ''}`} />}
            >
              {isReevaluating ? 'Re-Evaluating Policies...' : 'Re-Run Review'}
            </Button>
            {onAskAuren && (
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  onAskAuren(
                    `Audit the architecture proposal "${docTitle}" against Security Policy #12 and Decision #001. What remediations are required before production sign-off?`
                  )
                }
                icon={<Bot className="w-3.5 h-3.5" />}
              >
                Ask AUREN
              </Button>
            )}
          </div>
        </div>

        {/* Target Proposal Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Audited Proposal:
            </span>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-400 max-w-md"
            >
              {(documents || [])
                .filter((d) => d.type === 'markdown' || d.type === 'spec' || d.type === 'code')
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.department})
                  </option>
                ))}
            </select>
          </div>

          {statusBadge()}
        </div>

        {/* Multi-Factor Synthesis Summary Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200/80 dark:border-neutral-800">
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">Related Specs</span>
            <strong className="text-sm font-bold text-neutral-900 dark:text-white">
              {reviewResult.analyzedAgainst.relatedDocs} Documents
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200/80 dark:border-neutral-800">
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">Policies</span>
            <strong className="text-sm font-bold text-neutral-900 dark:text-white">
              {reviewResult.analyzedAgainst.policies} Policies
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200/80 dark:border-neutral-800">
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">Decisions</span>
            <strong className="text-sm font-bold text-neutral-900 dark:text-white">
              {reviewResult.analyzedAgainst.decisions} Ratified
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200/80 dark:border-neutral-800">
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">Discussions</span>
            <strong className="text-sm font-bold text-neutral-900 dark:text-white">
              {reviewResult.analyzedAgainst.discussions} Threads
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200/80 dark:border-neutral-800">
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">Meetings</span>
            <strong className="text-sm font-bold text-neutral-900 dark:text-white">
              {reviewResult.analyzedAgainst.meetings} Artifacts
            </strong>
          </div>
        </div>
      </div>

      {/* Synthesis Callout Banner */}
      <div
        className={`p-4 rounded-2xl border space-y-1.5 ${
          reviewResult.overallStatus === 'CONFLICT'
            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
            : reviewResult.overallStatus === 'APPROVED'
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
            : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Executive Review Verdict
          </h3>
          <span className="text-[11px] opacity-80 font-mono">{reviewResult.reviewedAt}</span>
        </div>
        <p className="text-xs leading-relaxed font-medium">{reviewResult.statusSummary}</p>
      </div>

      {/* Findings Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <span>Detailed Findings</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
              {filteredFindings.length}
            </span>
          </h2>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'all'
                  ? 'bg-white dark:bg-[#15171C] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              All ({reviewResult.findings.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('conflict')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                filterType === 'conflict'
                  ? 'bg-white dark:bg-[#15171C] text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              <XCircle className="w-3 h-3 text-rose-500" />
              Conflicts
            </button>
            <button
              type="button"
              onClick={() => setFilterType('concern')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                filterType === 'concern'
                  ? 'bg-white dark:bg-[#15171C] text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Concerns
            </button>
            <button
              type="button"
              onClick={() => setFilterType('alignment')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                filterType === 'alignment'
                  ? 'bg-white dark:bg-[#15171C] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Alignments
            </button>
          </div>
        </div>

        {/* Findings List */}
        <div className="grid gap-4">
          {filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className={`p-5 rounded-xl border space-y-3 transition-all ${
                finding.type === 'conflict'
                  ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40 hover:border-rose-300'
                  : finding.type === 'concern'
                  ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40 hover:border-amber-300'
                  : 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {finding.type === 'conflict' ? (
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    ) : finding.type === 'concern' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          finding.type === 'conflict'
                            ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : finding.type === 'concern'
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {finding.type === 'conflict'
                          ? 'Policy Conflict'
                          : finding.type === 'concern'
                          ? 'Operational Concern'
                          : 'Architecture Alignment'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {finding.title}
                    </h3>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {finding.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grounding Evidence Links */}
              {finding.evidence && finding.evidence.length > 0 && (
                <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Grounded Organizational Evidence:
                  </span>
                  <div className="grid gap-2">
                    {finding.evidence.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-white dark:bg-[#161922] border border-neutral-200/80 dark:border-neutral-700/80 text-xs text-neutral-700 dark:text-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white text-[11px]">
                            {ev.type === 'policy' && <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />}
                            {ev.type === 'document' && <FileText className="w-3.5 h-3.5 text-purple-500" />}
                            {ev.type === 'decision' && <Scale className="w-3.5 h-3.5 text-amber-500" />}
                            {ev.type === 'meeting' && <Video className="w-3.5 h-3.5 text-emerald-500" />}
                            {ev.type === 'discussion' && <MessageSquare className="w-3.5 h-3.5 text-sky-500" />}
                            <span>{ev.title}</span>
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                            "{ev.snippet}"
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {ev.type === 'policy' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => onOpenPolicy?.(ev.id)}
                              icon={<ExternalLink className="w-3 h-3" />}
                            >
                              View Policy
                            </Button>
                          )}
                          {ev.type === 'document' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => {
                                const doc = documents.find((d) => d.id === ev.id);
                                if (doc && onOpenDocument) onOpenDocument(doc);
                              }}
                              icon={<ExternalLink className="w-3 h-3" />}
                            >
                              View Document
                            </Button>
                          )}
                          {ev.type === 'decision' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => onOpenDecision?.(ev.id)}
                              icon={<ExternalLink className="w-3 h-3" />}
                            >
                              View Decision
                            </Button>
                          )}
                          {ev.type === 'meeting' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => onOpenMeeting?.(ev.id)}
                              icon={<ExternalLink className="w-3 h-3" />}
                            >
                              View Meeting
                            </Button>
                          )}
                          {ev.type === 'discussion' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => onOpenDiscussion?.(ev.id)}
                              icon={<ExternalLink className="w-3 h-3" />}
                            >
                              View Channel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Risks & Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identified Risks */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Identified Production Risks ({reviewResult.risks.length})</span>
          </h2>
          <div className="space-y-3">
            {reviewResult.risks.map((risk) => (
              <div
                key={risk.id}
                className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200 dark:border-neutral-800 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {risk.title}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      risk.severity === 'High'
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        : risk.severity === 'Medium'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    {risk.severity} Severity
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  Impact: {risk.impact}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Remediation Roadmap ({reviewResult.recommendations.length})</span>
          </h2>
          <div className="space-y-3">
            {reviewResult.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed pt-0.5">
                    {rec}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleCreateRemediationTask(rec)}
                  icon={<ListTodo className="w-3 h-3" />}
                >
                  Create Task
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Remediation Action Item Modal */}
      <CreateActionItemModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        initialTitle={actionTitle}
        initialAssignedTo={actionAssignee}
        initialDepartment="Core Architecture"
        initialPriority="High"
      />
    </div>
  );
};
