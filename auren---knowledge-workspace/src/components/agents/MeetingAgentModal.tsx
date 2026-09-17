import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Scale,
  ListTodo,
  FileText,
  HelpCircle,
  AlertTriangle,
  Clock,
  Search,
  MessageSquare,
  Users,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { CollaborationMeeting, MeetingParticipant } from '../../types/collaboration';
import { MeetingAgentAnalysis, MeetingTranscriptEntry } from '../../types/agents';
import { useCollaboration } from '../../context/CollaborationContext';
import { AurenDocument } from '../../types';
import { Button } from '../ui/Button';
import { CreateDecisionModal } from '../collaboration/CreateDecisionModal';
import { CreateActionItemModal } from '../collaboration/CreateActionItemModal';

interface MeetingAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: CollaborationMeeting | null;
  documents: AurenDocument[];
  onOpenDocument?: (doc: AurenDocument) => void;
  onAskAuren?: (prompt: string) => void;
}

export const MeetingAgentModal: React.FC<MeetingAgentModalProps> = ({
  isOpen,
  onClose,
  meeting,
  documents,
  onOpenDocument,
  onAskAuren,
}) => {
  const { analyzeMeetingWithAuren, isAnalyzingMeeting } = useCollaboration();

  const [activeTab, setActiveTab] = useState<'analysis' | 'transcript' | 'memory'>('analysis');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [analysisState, setAnalysisState] = useState<MeetingAgentAnalysis | null>(
    meeting?.meetingAnalysis || null
  );

  // Decision modal state
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [prefilledDecisionTitle, setPrefilledDecisionTitle] = useState('');
  const [prefilledDecisionText, setPrefilledDecisionText] = useState('');

  // Action item modal state
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [prefilledActionTitle, setPrefilledActionTitle] = useState('');
  const [prefilledAssignee, setPrefilledAssignee] = useState('Marcus Vance');
  const [prefilledDept, setPrefilledDept] = useState('Platform Engineering');
  const [prefilledPriority, setPrefilledPriority] = useState<'High' | 'Medium' | 'Low'>('High');

  if (!isOpen || !meeting) return null;

  const currentAnalysis = analysisState || meeting.meetingAnalysis;

  const handleRunAnalysis = async () => {
    try {
      const res = await analyzeMeetingWithAuren(meeting.id);
      setAnalysisState(res);
      setActiveTab('analysis');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDecisionFromAnalysis = (decTitle: string, decContext: string, evidence: string) => {
    setPrefilledDecisionTitle(decTitle);
    setPrefilledDecisionText(`${decContext}\n\nEvidence: "${evidence}"`);
    setIsDecisionModalOpen(true);
  };

  const handleCreateActionItemFromAnalysis = (
    task: string,
    owner: string,
    dept: string,
    priority: 'High' | 'Medium' | 'Low'
  ) => {
    setPrefilledActionTitle(task);
    setPrefilledAssignee(owner);
    setPrefilledDept(dept);
    setPrefilledPriority(priority);
    setIsActionModalOpen(true);
  };

  const handleOpenDocById = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc && onOpenDocument) {
      onOpenDocument(doc);
    }
  };

  // Filter transcript entries
  const transcriptEntries: MeetingTranscriptEntry[] = meeting?.transcript || [];
  const filteredTranscript = (transcriptEntries || []).filter(
    (t) =>
      t.text?.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      t.speakerName?.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      t.speakerDept?.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
        <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  AUREN Meeting Agent
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    meeting.status === 'completed'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {meeting.status.toUpperCase()}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                  {meeting.scheduledTime}
                </span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                {meeting.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunAnalysis}
                disabled={isAnalyzingMeeting}
                icon={<Sparkles className={`w-3.5 h-3.5 ${isAnalyzingMeeting ? 'animate-spin' : ''}`} />}
              >
                {isAnalyzingMeeting
                  ? 'Synthesizing...'
                  : currentAnalysis
                  ? 'Re-Analyze with AUREN'
                  : 'Analyze with AUREN'}
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between px-5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12141A]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('analysis')}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'analysis'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                AUREN Analysis
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('transcript')}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'transcript'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Transcript ({transcriptEntries.length} turns)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('memory')}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'memory'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                Organizational Memory
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {meeting.participants.length} Participants
              </span>
              <span>•</span>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {meeting.department || 'Platform'}
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isAnalyzingMeeting ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-400 animate-spin" />
                  </div>
                </div>
                <div className="space-y-1 max-w-sm">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Synthesizing Meeting Artifacts...
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Indexing transcript speaker turns, extracting ratified decisions, and cross-referencing organizational policies.
                  </p>
                </div>
              </div>
            ) : activeTab === 'analysis' ? (
              currentAnalysis ? (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div className="p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        Executive Summary
                      </h3>
                      <span className="text-[11px] text-purple-700/80 dark:text-purple-400/80 font-mono">
                        {currentAnalysis.analyzedAt}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                      {currentAnalysis.executiveSummary}
                    </p>
                  </div>

                  {/* Key Decisions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        Ratified Key Decisions ({currentAnalysis.keyDecisions.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setPrefilledDecisionTitle(currentAnalysis.keyDecisions[0]?.title || `Decision from ${meeting.title}`);
                          setPrefilledDecisionText(currentAnalysis.keyDecisions[0]?.context || '');
                          setIsDecisionModalOpen(true);
                        }}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <Scale className="w-3 h-3" />
                        Create Decision
                      </button>
                    </div>

                    <div className="grid gap-3">
                      {currentAnalysis.keyDecisions.map((dec) => (
                        <div
                          key={dec.id}
                          className="p-4 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200 dark:border-neutral-800 space-y-2.5 transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                                {dec.title}
                              </h4>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {dec.context}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() =>
                                handleCreateDecisionFromAnalysis(dec.title, dec.context, dec.evidence)
                              }
                              icon={<Scale className="w-3 h-3" />}
                            >
                              Ratify
                            </Button>
                          </div>

                          {dec.evidence && (
                            <div className="p-2.5 rounded-lg bg-white dark:bg-[#1C202B] border border-neutral-200/80 dark:border-neutral-700/80 text-[11px] text-neutral-600 dark:text-neutral-300 space-y-1">
                              <span className="font-semibold text-neutral-900 dark:text-neutral-200 block text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                Grounding Evidence
                              </span>
                              <p className="italic">"{dec.evidence}"</p>
                              {dec.evidenceDocId && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocById(dec.evidenceDocId!)}
                                  className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 pt-1 font-medium"
                                >
                                  <FileText className="w-3 h-3" />
                                  View Linked Source Document
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Items */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                        <ListTodo className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Assigned Action Items ({currentAnalysis.actionItems.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setPrefilledActionTitle(currentAnalysis.actionItems[0]?.task || '');
                          setPrefilledAssignee(currentAnalysis.actionItems[0]?.owner || 'Marcus Vance');
                          setPrefilledDept(currentAnalysis.actionItems[0]?.ownerDepartment || 'Platform Engineering');
                          setIsActionModalOpen(true);
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <ListTodo className="w-3 h-3" />
                        Create Action Item
                      </button>
                    </div>

                    <div className="grid gap-2">
                      {currentAnalysis.actionItems.map((act) => (
                        <div
                          key={act.id}
                          className="p-3 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  act.priority === 'High'
                                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                    : act.priority === 'Medium'
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                {act.priority}
                              </span>
                              <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                                {act.task}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-3">
                              <span>
                                Assignee: <strong className="text-neutral-700 dark:text-neutral-300">{act.owner}</strong> ({act.ownerDepartment})
                              </span>
                              <span>•</span>
                              <span>Target: {act.dueDate}</span>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              handleCreateActionItemFromAnalysis(
                                act.task,
                                act.owner,
                                act.ownerDepartment,
                                act.priority
                              )
                            }
                            icon={<ListTodo className="w-3 h-3" />}
                          >
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Open Questions & Identified Risks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Open Questions */}
                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200 dark:border-neutral-800 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                        Open Questions ({currentAnalysis.openQuestions.length})
                      </h4>
                      <ul className="space-y-2">
                        {currentAnalysis.openQuestions.map((q, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2 leading-relaxed"
                          >
                            <span className="text-neutral-400">•</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Identified Risks */}
                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200 dark:border-neutral-800 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Identified Risks ({currentAnalysis.risks.length})
                      </h4>
                      <div className="space-y-2">
                        {currentAnalysis.risks.map((r, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-white dark:bg-[#1C202B] border border-neutral-200/80 dark:border-neutral-700/80 space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                                {r.risk}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                  r.severity === 'High'
                                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {r.severity}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              Mitigation: {r.mitigation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Referenced Knowledge Artifacts */}
                  {currentAnalysis.referencedKnowledge && currentAnalysis.referencedKnowledge.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        Referenced Knowledge Artifacts ({currentAnalysis.referencedKnowledge.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentAnalysis.referencedKnowledge.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => handleOpenDocById(doc.id)}
                            className="p-3 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-800 transition-colors cursor-pointer space-y-1 group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center gap-1.5 truncate">
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                {doc.title}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-purple-600 transition-colors shrink-0" />
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                              {doc.snippet}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick grounding CTA */}
                  {onAskAuren && (
                    <div className="p-3 rounded-xl bg-neutral-100 dark:bg-[#161922] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                        <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Need further strategic clarification or follow-up draft generation?</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          onAskAuren(
                            `Based on the meeting "${meeting.title}", what are the outstanding architectural and security requirements we must fulfill?`
                          );
                          onClose();
                        }}
                        icon={<ArrowRight className="w-3 h-3" />}
                      >
                        Ask AUREN About This Meeting
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    No Meeting Analysis Generated Yet
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                    Run the AUREN Meeting Agent to parse transcript turns, ratify decisions, and map action items.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRunAnalysis}
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Analyze with AUREN
                  </Button>
                </div>
              )
            ) : activeTab === 'transcript' ? (
              <div className="space-y-4">
                {/* Search Transcript */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                    placeholder="Search dialogue by speaker, quote, or department..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>

                {filteredTranscript.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral-500 dark:text-neutral-400">
                    No transcript entries matched "{transcriptSearch}".
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTranscript.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl bg-neutral-50/80 dark:bg-[#161922] border border-neutral-200/80 dark:border-neutral-800 flex items-start gap-3"
                      >
                        <img
                          src={t.speakerAvatar}
                          alt={t.speakerName}
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                {t.speakerName}
                              </span>
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                {t.speakerRole} • {t.speakerDept}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                              {t.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                            {t.text}
                          </p>
                          {t.linkedCitation && (
                            <button
                              type="button"
                              onClick={() => handleOpenDocById(t.linkedCitation!.docId)}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-purple-50 dark:bg-purple-950/40 text-[11px] text-purple-700 dark:text-purple-300 font-medium hover:underline mt-1"
                            >
                              <FileText className="w-3 h-3" />
                              Cited Artifact: {t.linkedCitation.title}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Organizational Memory Trace */
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
                  <strong>Organizational Lineage:</strong> Every ratified decision and action item produced during "{meeting.title}" is structurally connected to organizational documents, channel discussion threads, and enterprise policies.
                </div>

                <div className="grid gap-3">
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200 dark:border-neutral-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      1. Grounding Documents
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {meeting.attachedDocumentIds.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleOpenDocById(id)}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#1C202B] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 hover:border-purple-400 flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          <span>{id === 'doc_arch_001' ? 'System Architecture v4' : id === 'doc_sec_002' ? 'Security Policy #12' : id}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200 dark:border-neutral-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      2. Discussion Channels & Threads
                    </span>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">
                      Grounded in discussions across <strong>#{meeting.channelId || 'dept_arch_general'}</strong> with 14 replies from Marcus Vance and Elena Rostova.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200 dark:border-neutral-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      3. Ratified Decisions & Open Tasks
                    </span>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">
                      Produces persistent ledger records in the organizational decision log and synchronizes action items to assigned department leads.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>AUREN Autonomous Organizational Intelligence</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      <CreateDecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        documents={documents}
        initialTitle={prefilledDecisionTitle}
        initialText={prefilledDecisionText}
        initialMeetingId={meeting.id}
        initialMeetingTitle={meeting.title}
      />

      {/* Action Item Modal */}
      <CreateActionItemModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        initialTitle={prefilledActionTitle}
        initialAssignedTo={prefilledAssignee}
        initialDepartment={prefilledDept}
        initialPriority={prefilledPriority}
        initialMeetingId={meeting.id}
        initialMeetingTitle={meeting.title}
      />
    </>
  );
};
