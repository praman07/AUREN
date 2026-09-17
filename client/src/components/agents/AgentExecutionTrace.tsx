import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  Scale,
  Video,
  ExternalLink,
  Sparkles,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import type { AgentExecutionSimulation } from '../../services/governedAgentsData';
import { Button } from '../ui/button';

interface AgentExecutionTraceProps {
  simulation: AgentExecutionSimulation;
  agentName: string;
  onOpenDocument?: (docId: string) => void;
  onOpenDecision?: (decisionId: string) => void;
  onOpenMeeting?: (meetingId: string) => void;
  onAskAuren?: (prompt: string) => void;
  onActionExecuted?: (actionId: string, actionLabel: string, requiresApproval: boolean) => void;
}

export const AgentExecutionTrace: React.FC<AgentExecutionTraceProps> = ({
  simulation,
  agentName,
  onOpenDocument,
  onOpenDecision,
  onOpenMeeting,
  onAskAuren,
  onActionExecuted,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(simulation.steps.length);
  const [isCompleted, setIsCompleted] = useState(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const handleStartRun = () => {
    setIsRunning(true);
    setIsCompleted(false);
    setActiveStepIndex(0);
    setActionSuccessMessage(null);

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setActiveStepIndex(current);
      if (current >= simulation.steps.length) {
        clearInterval(interval);
        setIsRunning(false);
        setIsCompleted(true);
      }
    }, 450);
  };

  const getStepStatusIcon = (status: string, isCurrent: boolean) => {
    if (isCurrent) {
      return <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-spin" />;
    }
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />;
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  const getResultStatusBadge = (status: string) => {
    switch (status) {
      case 'NEEDS_REVIEW':
      case 'CONFLICT_DETECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{simulation.result.statusLabel}</span>
          </span>
        );
      case 'APPROVED':
      case 'COMPLIANT':
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{simulation.result.statusLabel}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
            <span>{simulation.result.statusLabel}</span>
          </span>
        );
    }
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'document':
      case 'policy':
        return <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'decision':
        return <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'meeting':
        return <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <FileText className="w-4 h-4 text-neutral-500" />;
    }
  };

  const handleEvidenceClick = (item: { id: string; type: string }) => {
    if (item.type === 'document' || item.type === 'policy') {
      if (onOpenDocument) onOpenDocument(item.id);
    } else if (item.type === 'decision') {
      if (onOpenDecision) onOpenDecision(item.id);
    } else if (item.type === 'meeting') {
      if (onOpenMeeting) onOpenMeeting(item.id);
    }
  };

  const handleActionClick = (action: { id: string; label: string; requiresApproval: boolean }) => {
    if (onActionExecuted) {
      onActionExecuted(action.id, action.label, action.requiresApproval);
    }
    if (action.requiresApproval) {
      setActionSuccessMessage(
        `Approval Request submitted for: "${action.label}". Sent to Super Admin / Lead queue.`
      );
    } else {
      setActionSuccessMessage(
        `Action executed successfully: "${action.label}". Updated organization records.`
      );
    }
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Target Spec Header & Run Trigger */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Active Evaluation Target
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {simulation.targetType}
            </span>
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-1">
            {simulation.targetName}
          </h3>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartRun}
            disabled={isRunning}
            icon={
              isRunning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )
            }
            className="bg-purple-600 hover:bg-purple-700 text-white border-purple-700 font-semibold"
          >
            {isRunning ? 'Executing Agent Tools...' : 'Run Agent Simulation'}
          </Button>

          {onAskAuren && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onAskAuren(
                  `Can you review the latest findings for ${simulation.targetName} analyzed by ${agentName}?`
                )
              }
              icon={<MessageSquare className="w-3.5 h-3.5 text-neutral-500" />}
            >
              Ask AUREN
            </Button>
          )}
        </div>
      </div>

      {/* Action Toast feedback */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Execution Timeline Trace */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Tool Execution Trace
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              Sequential Deterministic Run
            </span>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {activeStepIndex} / {simulation.steps.length} steps
          </span>
        </div>

        <div className="space-y-3 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
          {simulation.steps.slice(0, activeStepIndex).map((step, idx) => {
            const isCurrentlyRunning = isRunning && idx === activeStepIndex - 1;
            return (
              <div key={step.id} className="relative group animate-fadeIn">
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-[#12141A] flex items-center justify-center">
                  {getStepStatusIcon(step.status, isCurrentlyRunning)}
                </div>

                <div className="p-3 rounded-xl bg-neutral-50/70 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        {step.toolName}
                      </span>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {step.message}
                      </span>
                    </div>
                    {step.durationMs && (
                      <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                        {step.durationMs}ms
                      </span>
                    )}
                  </div>

                  {step.detail && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 pl-1 leading-relaxed">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {isRunning && (
            <div className="relative pl-6 py-2">
              <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-white dark:bg-[#12141A] flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 text-purple-600 animate-spin" />
              </div>
              <span className="text-xs text-neutral-400 italic">
                Executing next tool in pipeline...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Structured Result Section (Requirement 6) */}
      {isCompleted && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6 animate-fadeIn">
          {/* Result Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Synthesized Assessment
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {agentName.toUpperCase()} FINDINGS
              </h3>
            </div>
            <div>{getResultStatusBadge(simulation.result.status)}</div>
          </div>

          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
            <span className="font-bold text-neutral-900 dark:text-white">Executive Summary: </span>
            {simulation.result.summary}
          </div>

          {/* FINDINGS */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
              Detailed Findings
            </h4>
            <div className="space-y-2.5">
              {simulation.result.findings.map((f, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    f.type === 'error'
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                      : f.type === 'warning'
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {f.type === 'error' ? (
                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    ) : f.type === 'warning' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                    <span>{f.title}</span>
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300 pl-5.5">{f.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RISKS & RECOMMENDATIONS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Risks */}
            <div className="p-4 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/30 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Identified Operational Risks
              </h4>
              <div className="space-y-2">
                {simulation.result.risks.map((r, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          r.level === 'High'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {r.level} Risk
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {r.title}
                      </span>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-0.5 text-[11px] pl-1">
                      {r.impact}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-4 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/30 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Actionable Recommendations
              </h4>
              <ol className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300 list-decimal list-inside leading-relaxed">
                {simulation.result.recommendations.map((rec, i) => (
                  <li key={i} className="font-medium text-neutral-800 dark:text-neutral-200">
                    <span className="text-neutral-600 dark:text-neutral-300">{rec}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* EVIDENCE SECTION (Clickable real links) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5">
              Verified Organizational Evidence
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {simulation.result.evidence.map((ev, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleEvidenceClick(ev)}
                  className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-750 hover:border-purple-300 dark:hover:border-purple-800 transition-colors text-left flex items-start justify-between gap-2 group cursor-pointer"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{getEvidenceIcon(ev.type)}</div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {ev.title}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {ev.reference}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-purple-600 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>

          {/* ACTIONS BAR (Requirement 7 & 8) */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Take direct action on these findings:
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {simulation.result.availableActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.primary ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  className={
                    action.primary
                      ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-700 font-semibold'
                      : ''
                  }
                >
                  {action.label}
                  {action.requiresApproval && (
                    <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      Approval Req.
                    </span>
                  )}
                </Button>
              ))}

              {onAskAuren && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    onAskAuren(
                      `I want to investigate the findings for ${simulation.targetName}. Can you explain why the policy conflict with Security Policy #12 occurred?`
                    )
                  }
                  icon={<Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                >
                  Ask AUREN About This Review
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
