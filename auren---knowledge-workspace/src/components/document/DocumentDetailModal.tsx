import React, { useState } from 'react';
import {
  FileText,
  MessageSquare,
  Share2,
  Download,
  Clock,
  Shield,
  History,
  Activity,
  Layers,
  Sparkles,
  Check,
  ChevronRight,
  Code2,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { AurenDocument } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface DocumentDetailModalProps {
  document: AurenDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onAskAuren: (doc: AurenDocument) => void;
  onDiscussInCollaboration?: (doc: AurenDocument) => void;
  onSelectRelatedDoc?: (docId: string) => void;
  onEditDocument?: (doc: AurenDocument) => void;
}

type DetailTab = 'overview' | 'intelligence' | 'security' | 'versions' | 'related';

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  isOpen,
  onClose,
  onAskAuren,
  onDiscussInCollaboration,
  onSelectRelatedDoc,
  onEditDocument,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [copied, setCopied] = useState(false);

  if (!document) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([document.rawContent || document.title], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = document.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'intelligence', label: 'Document Intelligence' },
    { id: 'security', label: 'Security & Access' },
    { id: 'versions', label: 'History & Activity' },
    { id: 'related', label: 'Related Knowledge' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl" showCloseButton={true}>
      <div className="flex flex-col gap-6 -mt-2">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 mt-1 shrink-0">
              {document.type === 'code' ? (
                <Code2 className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  {document.title}
                </h2>
                <Badge scope={document.scope} size="xs" />
                <Badge status={document.status} size="xs" />
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1 font-mono">
                <span>{document.filename}</span>
                <span>•</span>
                <span>{document.fileSize}</span>
                <span>•</span>
                <span>
                  Updated {new Date(document.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {document.sourceMetadata?.repo && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
                      {document.sourceMetadata.repo} @ {document.sourceMetadata.commitSha}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onEditDocument && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Edit3 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                onClick={() => {
                  onEditDocument(document);
                }}
              >
                Edit Document
              </Button>
            )}
            {onDiscussInCollaboration && (
              <Button
                variant="secondary"
                size="sm"
                icon={<MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                onClick={() => {
                  onDiscussInCollaboration(document);
                  onClose();
                }}
              >
                Discuss in Channel
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={() => {
                onAskAuren(document);
                onClose();
              }}
            >
              Ask AUREN
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              onClick={handleCopyLink}
              title="Copy link"
            >
              {copied ? 'Copied' : 'Share'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownload}
              title="Download file"
            >
              Download
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-neutral-100 dark:border-neutral-800 pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content 1: Overview */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            {/* What is this document? */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#121316] border border-neutral-200/60 dark:border-neutral-800/80 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Document Purpose
              </span>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed">
                {document.intelligence?.documentPurpose ||
                  'Serves as an authoritative knowledge asset within the designated workspace.'}
              </p>
            </div>

            {/* AI Executive Summary */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Executive Summary
                </span>
                <span className="text-xs text-neutral-400">
                  Estimated read: {document.intelligence?.readingTimeMinutes || 4} min
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed bg-white dark:bg-[#141518] p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80">
                {document.intelligence?.executiveSummary ||
                  'No automatic summary generated yet. Document is currently queued in the ingestion pipeline.'}
              </p>
            </div>

            {/* Key Topics & Tags */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Key Topics & Concepts
              </span>
              <div className="flex flex-wrap gap-1.5">
                {document.intelligence?.keyTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-[#1C1E22] text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-800"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Important Sections */}
            {document.intelligence?.importantSections && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Structural Breakdown
                </span>
                <div className="flex flex-col gap-2">
                  {document.intelligence.importantSections.map((sec, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-neutral-50/70 dark:bg-[#151619] border border-neutral-200/50 dark:border-neutral-800/60 flex items-start justify-between gap-4"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {sec.title}
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {sec.summary}
                        </span>
                      </div>
                      {sec.page && (
                        <span className="text-[10px] font-mono text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 shrink-0">
                          Page {sec.page}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Deep Intelligence */}
        {activeTab === 'intelligence' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200/60 dark:border-neutral-800/80 flex flex-col gap-1">
                <span className="text-[11px] text-neutral-400">Document Type</span>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {document.intelligence?.documentType || 'General'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200/60 dark:border-neutral-800/80 flex flex-col gap-1">
                <span className="text-[11px] text-neutral-400">Reading Time</span>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  {document.intelligence?.readingTimeMinutes || 3} minutes
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200/60 dark:border-neutral-800/80 flex flex-col gap-1">
                <span className="text-[11px] text-neutral-400">Headings & Sections</span>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  {document.intelligence?.headingsCount || 12} headings
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200/60 dark:border-neutral-800/80 flex flex-col gap-1">
                <span className="text-[11px] text-neutral-400">Extracted Tables</span>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  {document.intelligence?.tablesCount || 0} tables
                </span>
              </div>
            </div>

            {/* Entities & Technologies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-[#141518] border border-neutral-200/60 dark:border-neutral-800/80 flex flex-col gap-2">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Referenced Technologies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {document.intelligence?.technologies?.map((tech, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#1E2024] text-neutral-700 dark:text-neutral-300 font-mono text-[11px]"
                    >
                      {tech}
                    </span>
                  )) || <span className="text-xs text-neutral-400">None detected</span>}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#141518] border border-neutral-200/60 dark:border-neutral-800/80 flex flex-col gap-2">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Named Entities & Policies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {document.intelligence?.entities?.map((ent, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#1E2024] text-neutral-700 dark:text-neutral-300 text-[11px]"
                    >
                      {ent}
                    </span>
                  )) || <span className="text-xs text-neutral-400">None detected</span>}
                </div>
              </div>
            </div>

            {/* Code / Repository details if available */}
            {document.intelligence?.codeDetails && (
              <div className="p-4 rounded-xl bg-neutral-900 text-neutral-100 flex flex-col gap-3 font-mono text-xs">
                <div className="flex items-center justify-between text-neutral-400 pb-2 border-b border-neutral-800">
                  <span>Language: {document.intelligence.codeDetails.language}</span>
                  <span>Framework: {document.intelligence.codeDetails.framework}</span>
                </div>
                <p className="text-neutral-300 font-sans text-xs">
                  {document.intelligence.codeDetails.projectOverview}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {document.intelligence.codeDetails.majorComponents.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 text-[11px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Security & Access Policy */}
        {activeTab === 'security' && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200/60 dark:border-neutral-800/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    DocumentAccessPolicy Configuration
                  </span>
                </div>
                <Badge scope={document.accessPolicy.scope} size="xs" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-600 dark:text-neutral-300 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/60">
                <div>
                  <span className="text-neutral-400 block mb-0.5 text-[11px]">Owner / Author:</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {document.accessPolicy.ownerName} ({document.accessPolicy.ownerId})
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-0.5 text-[11px]">Access Mode:</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {document.accessPolicy.isRestricted ? 'Restricted Private Vault' : 'Authorized Department Shared'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-0.5 text-[11px]">Authorized Roles:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {document.accessPolicy.allowedRoles.map((r, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-[10px] font-mono">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-0.5 text-[11px]">Authorized Departments:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {document.accessPolicy.allowedDepartments.map((dep, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-[10px]">
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed px-1">
              Cryptographic vector isolation guarantees that queries issued outside of this document’s permitted scope or unauthorized department accounts are strictly prevented from retrieving matching vector embeddings from Qdrant.
            </p>
          </div>
        )}

        {/* Tab Content 4: Version History & Activity Log */}
        {activeTab === 'versions' && (
          <div className="flex flex-col gap-6">
            {/* Version History */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-neutral-400" />
                <span>Version History</span>
              </span>
              <div className="flex flex-col gap-2">
                {document.versionHistory.map((vh, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-neutral-50 dark:bg-[#141518] border border-neutral-200/60 dark:border-neutral-800/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{vh.version}</span>
                        <span className="text-neutral-400">by {vh.author}</span>
                        {vh.commitSha && (
                          <span className="font-mono text-[10px] bg-neutral-200 dark:bg-neutral-800 px-1 rounded">
                            {vh.commitSha}
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">{vh.changeSummary}</p>
                    </div>
                    <span className="text-[10px] text-neutral-400 shrink-0 font-mono">
                      {new Date(vh.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Log */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-neutral-400" />
                <span>Pipeline Activity</span>
              </span>
              <div className="flex flex-col gap-2">
                {document.activityLog.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-lg bg-white dark:bg-[#141518] border border-neutral-200/60 dark:border-neutral-800/80 flex items-start justify-between text-xs"
                  >
                    <div>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{act.action}</span>
                      {act.details && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{act.details}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400 shrink-0 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 5: Related Documents */}
        {activeTab === 'related' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Discovered through semantic embeddings in Qdrant and authorized under your current workspace permissions.
            </span>
            <div className="flex flex-col gap-2.5">
              {document.relatedDocuments && document.relatedDocuments.length > 0 ? (
                document.relatedDocuments.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelatedDoc && onSelectRelatedDoc(rel.id)}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#141518] border border-neutral-200/70 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer group flex items-center justify-between gap-4"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-900 dark:group-hover:text-white truncate">
                          {rel.title}
                        </span>
                        <Badge scope={rel.scope} size="xs" />
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {rel.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        {(rel.similarityScore * 100).toFixed(0)}% match
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No related documents indexed with sufficient confidence score.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
