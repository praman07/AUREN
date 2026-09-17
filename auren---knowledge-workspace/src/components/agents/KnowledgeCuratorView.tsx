import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Clock,
  AlertOctagon,
  FileQuestion,
  CheckCircle2,
  GitMerge,
  Archive,
  Ban,
  BellRing,
  Sparkles,
  Bot,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { KnowledgeAuditResult, KnowledgeAuditItem } from '../../types/agents';
import { runKnowledgeAudit } from '../../services/agentData';
import { AurenDocument } from '../../types';
import { Button } from '../ui/Button';

interface KnowledgeCuratorViewProps {
  documents: AurenDocument[];
  onOpenDocument?: (doc: AurenDocument) => void;
  onAskAuren?: (prompt: string) => void;
}

export const KnowledgeCuratorView: React.FC<KnowledgeCuratorViewProps> = ({
  documents,
  onOpenDocument,
  onAskAuren,
}) => {
  const [auditResult, setAuditResult] = useState<KnowledgeAuditResult>(runKnowledgeAudit());
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'duplicate' | 'stale' | 'conflict' | 'unverified'
  >('all');
  const [isAuditing, setIsAuditing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleRunFreshAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setAuditResult(runKnowledgeAudit());
      setIsAuditing(false);
      showFeedback('Knowledge audit completed: 4 optimization issues identified.');
    }, 700);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleDeprecate = (itemId: string, title: string) => {
    setAuditResult((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === itemId ? { ...it, status: 'resolved' as const } : it
      ),
      summary: {
        ...prev.summary,
        resolvedIssues: prev.summary.resolvedIssues + 1,
      },
    }));
    showFeedback(`Document "${title}" has been marked as Deprecated with banner notification.`);
  };

  const handleArchive = (itemId: string, title: string) => {
    setAuditResult((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === itemId ? { ...it, status: 'resolved' as const } : it
      ),
      summary: {
        ...prev.summary,
        resolvedIssues: prev.summary.resolvedIssues + 1,
      },
    }));
    showFeedback(`Document "${title}" has been archived to vault and excluded from search indexing.`);
  };

  const handleMerge = (itemId: string, source: string, target: string) => {
    setAuditResult((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === itemId ? { ...it, status: 'resolved' as const } : it
      ),
      summary: {
        ...prev.summary,
        resolvedIssues: prev.summary.resolvedIssues + 1,
      },
    }));
    showFeedback(`Successfully initiated automated merge: "${source}" merged into canonical "${target}".`);
  };

  const handleSendReminder = (owner: string, title: string) => {
    showFeedback(`Verification reminder sent to ${owner} regarding "${title}".`);
  };

  const filteredItems = (auditResult?.items || []).filter((item) => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                AUREN Knowledge Curator
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Continuous Repository Quality & Hygiene
              </span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Enterprise Knowledge Repository Audit
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunFreshAudit}
              disabled={isAuditing}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />}
            >
              {isAuditing ? 'Auditing Vault...' : 'Scan Repository'}
            </Button>
            {onAskAuren && (
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  onAskAuren(
                    'Summarize all detected knowledge conflicts and stale documents in the library, and suggest a consolidation plan.'
                  )
                }
                icon={<Bot className="w-3.5 h-3.5" />}
              >
                Ask AUREN to Summarize
              </Button>
            )}
          </div>
        </div>

        {/* Hygiene Health Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-center">
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200/70 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Health Score</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {auditResult.summary.repositoryHealthScore}%
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200/70 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Duplicates</span>
            <span className="text-lg font-black text-purple-600 dark:text-purple-400">
              {auditResult.summary.duplicatePairs}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200/70 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Stale Docs</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">
              {auditResult.summary.staleDocuments}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200/70 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Conflicts</span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400">
              {auditResult.summary.conflictingClaims}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200/70 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Unverified</span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400">
              {auditResult.summary.unverifiedAssertions}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Content */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Curation Findings & Recommended Actions
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
              {filteredItems.length} Issues
            </span>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-[#15171C] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('duplicate')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                activeFilter === 'duplicate'
                  ? 'bg-white dark:bg-[#15171C] text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              <Copy className="w-3 h-3" />
              Duplicates
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('stale')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                activeFilter === 'stale'
                  ? 'bg-white dark:bg-[#15171C] text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              <Clock className="w-3 h-3" />
              Stale
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('conflict')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                activeFilter === 'conflict'
                  ? 'bg-white dark:bg-[#15171C] text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              <AlertOctagon className="w-3 h-3" />
              Conflicts
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unverified')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                activeFilter === 'unverified'
                  ? 'bg-white dark:bg-[#15171C] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              <FileQuestion className="w-3 h-3" />
              Unverified
            </button>
          </div>
        </div>

        {/* Findings List */}
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-xl border space-y-3.5 transition-all ${
                item.status === 'resolved'
                  ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-900/20 border-neutral-200 dark:border-neutral-800'
                  : item.type === 'conflict'
                  ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40 hover:border-rose-300'
                  : item.type === 'duplicate'
                  ? 'bg-purple-50/20 dark:bg-purple-950/10 border-purple-200 dark:border-purple-900/40 hover:border-purple-300'
                  : item.type === 'stale'
                  ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40 hover:border-amber-300'
                  : 'bg-blue-50/20 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/40 hover:border-blue-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        item.type === 'conflict'
                          ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : item.type === 'duplicate'
                          ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          : item.type === 'stale'
                          ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {item.type.toUpperCase()}
                    </span>

                    {item.similarityScore && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800 font-bold">
                        {item.similarityScore}% Semantic Overlap
                      </span>
                    )}

                    {item.lastUpdatedDaysAgo && (
                      <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300">
                        Last edited {item.lastUpdatedDaysAgo} days ago
                      </span>
                    )}

                    {item.status === 'resolved' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        RESOLVED
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="text-xs text-neutral-400 shrink-0">
                  <span>Owner: <strong>{item.owner}</strong> ({item.department})</span>
                </div>
              </div>

              {/* Linked Document Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {item.documents.map((docRef) => (
                  <div
                    key={docRef.id}
                    onClick={() => {
                      const doc = documents.find((d) => d.id === docRef.id);
                      if (doc && onOpenDocument) onOpenDocument(doc);
                    }}
                    className="p-2.5 rounded-lg bg-white dark:bg-[#161922] border border-neutral-200 dark:border-neutral-700/80 hover:border-amber-400 transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-500 shrink-0" />
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white truncate">
                        {docRef.title}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              {item.status !== 'resolved' && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                  {item.type === 'duplicate' && (
                    <>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() =>
                          handleMerge(
                            item.id,
                            item.documents[1]?.title || 'Secondary spec',
                            item.documents[0]?.title || 'Primary spec'
                          )
                        }
                        icon={<GitMerge className="w-3 h-3" />}
                      >
                        Merge Documents
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() =>
                          handleArchive(item.id, item.documents[1]?.title || item.title)
                        }
                        icon={<Archive className="w-3 h-3" />}
                      >
                        Archive Duplicate
                      </Button>
                    </>
                  )}

                  {item.type === 'stale' && (
                    <>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() =>
                          handleDeprecate(item.id, item.documents[0]?.title || item.title)
                        }
                        icon={<Ban className="w-3 h-3" />}
                      >
                        Deprecate Document
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleSendReminder(item.owner, item.title)}
                        icon={<BellRing className="w-3 h-3" />}
                      >
                        Send Verification Reminder
                      </Button>
                    </>
                  )}

                  {item.type === 'conflict' && (
                    <>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() =>
                          onAskAuren?.(
                            `Resolve the conflict between "${item.documents[0]?.title}" and "${item.documents[1]?.title}". What is the canonical policy?`
                          )
                        }
                        icon={<Sparkles className="w-3 h-3" />}
                      >
                        Resolve with AUREN
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() =>
                          handleDeprecate(item.id, item.documents[0]?.title || item.title)
                        }
                        icon={<Ban className="w-3 h-3" />}
                      >
                        Deprecate Conflicting Clause
                      </Button>
                    </>
                  )}

                  {item.type === 'unverified' && (
                    <>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleSendReminder(item.owner, item.title)}
                        icon={<BellRing className="w-3 h-3" />}
                      >
                        Request Owner Verification
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() =>
                          onAskAuren?.(
                            `Cross-reference the unverified assertion in "${item.title}" against organizational logs and verify if it is factual.`
                          )
                        }
                        icon={<Sparkles className="w-3 h-3" />}
                      >
                        Auto-Verify with Engine
                      </Button>
                    </>
                  )}

                  {onAskAuren && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() =>
                        onAskAuren(
                          `Compare and summarize key differences between "${item.documents[0]?.title}" and "${item.documents[1]?.title || item.title}".`
                        )
                      }
                      icon={<Bot className="w-3 h-3" />}
                    >
                      Summarize Differences
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
