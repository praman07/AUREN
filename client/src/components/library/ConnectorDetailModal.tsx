import React from 'react';
import {
  X,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  User,
  Folder,
  Tag,
  GitCommit,
  Database,
  Building2,
  Lock,
} from 'lucide-react';
import type { ConnectorDataItem } from '../../types';
import { PlatformIcon } from '../ui/PlatformIcons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/button';

interface ConnectorDetailModalProps {
  item: ConnectorDataItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAskAuren?: (item: ConnectorDataItem) => void;
  onSyncItem?: (itemId: string) => void;
  onOpenConnectorDetail?: (connectorId: string, backPage?: string) => void;
}

export const ConnectorDetailModal: React.FC<ConnectorDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onAskAuren,
  onSyncItem,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !item) return null;

  const handleCopyCitation = () => {
    const citation = `[Synced ${item.connectorName} Resource: ${item.title}] (${item.nestedPath || item.id})`;
    navigator.clipboard?.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#141518] rounded-xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 my-8">
        {/* Header Bar */}
        <div className="flex items-start justify-between p-5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#111215]/50">
          <div className="flex items-start gap-3 min-w-0 pr-4">
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5">
              <PlatformIcon platform={item.connectorType} className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {item.connectorName}
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <span className="text-xs text-neutral-400 font-mono capitalize">
                  {item.itemType.replace('_', ' ')}
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <Badge scope={item.scope} size="xs" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-1 leading-snug break-words">
                {item.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
          {/* Summary / Extracted Content */}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Ingested Summary & Context
            </h3>
            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#18191D] border border-neutral-200/60 dark:border-neutral-800/80 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {item.summary}
            </div>
          </div>

          {/* Details & Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Parent Group / Repository */}
            <div className="p-3 rounded-lg bg-neutral-50/70 dark:bg-[#16171A] border border-neutral-200/50 dark:border-neutral-800/60 flex items-start gap-2.5">
              <Folder className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-neutral-400">Parent Scope / Group</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200 font-medium truncate">
                  {item.parentGroup}
                </span>
              </div>
            </div>

            {/* Nested Path */}
            <div className="p-3 rounded-lg bg-neutral-50/70 dark:bg-[#16171A] border border-neutral-200/50 dark:border-neutral-800/60 flex items-start gap-2.5">
              <Database className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-neutral-400">Nested Resource Path</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200 font-medium truncate">
                  {item.nestedPath || 'Root directory'}
                </span>
              </div>
            </div>

            {/* Author / Synced by */}
            <div className="p-3 rounded-lg bg-neutral-50/70 dark:bg-[#16171A] border border-neutral-200/50 dark:border-neutral-800/60 flex items-start gap-2.5">
              <User className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-neutral-400">Author / Source Owner</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-medium truncate">
                  {item.author}
                </span>
              </div>
            </div>

            {/* Last Synced */}
            <div className="p-3 rounded-lg bg-neutral-50/70 dark:bg-[#16171A] border border-neutral-200/50 dark:border-neutral-800/60 flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-neutral-400">Last Synced to Vectors</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200 font-medium">
                  {new Date(item.syncedAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Extended Metadata (Commit SHA, Issue Key, Labels) */}
          {item.metadata && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Source Technical Metadata
              </h3>
              <div className="p-3 rounded-lg bg-neutral-50/70 dark:bg-[#16171A] border border-neutral-200/50 dark:border-neutral-800/60 flex flex-wrap items-center gap-3 text-xs">
                {item.metadata.commitSha && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <GitCommit className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-neutral-400">Commit:</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-semibold">
                      {item.metadata.commitSha}
                    </span>
                  </div>
                )}
                {item.metadata.branch && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-neutral-400">Branch:</span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {item.metadata.branch}
                    </span>
                  </div>
                )}
                {item.metadata.issueKey && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-neutral-400">Key:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {item.metadata.issueKey}
                    </span>
                  </div>
                )}
                {item.metadata.priority && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">Priority:</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {item.metadata.priority}
                    </span>
                  </div>
                )}
                {item.sizeOrCount && (
                  <div className="flex items-center gap-1.5 font-mono text-neutral-500 dark:text-neutral-400">
                    <span>{item.sizeOrCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Extracted Concepts & Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60"
                  >
                    <Tag className="w-2.5 h-2.5 opacity-60" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Security & Access Boundary Notice */}
          <div className="p-3 rounded-lg border border-neutral-200/60 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-[#121316] flex items-start gap-2.5 text-xs text-neutral-500 dark:text-neutral-400">
            {item.scope === 'personal' ? (
              <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <Building2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {item.scope === 'personal' ? 'Personal Vault Isolation' : 'Organization Workspace Scope'}
              </span>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                {item.scope === 'personal'
                  ? 'This resource is cryptographically isolated to your private personal account. It is never exposed in organization-wide searches or assistant synthesis for other team members.'
                  : 'This resource is indexed according to organization RBAC policies. Authorized engineers and team leads can ground conversational queries against this source.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#111215]/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCitation}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Copy citation anchor"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Citation Copied' : 'Copy Citation'}</span>
            </button>

            {item.externalUrl && (
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in {item.connectorName}</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSyncItem?.(item.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Now</span>
            </button>

            <Button
              variant="primary"
              size="sm"
              icon={<MessageSquare className="w-3.5 h-3.5" />}
              onClick={() => {
                onAskAuren?.(item);
                onClose();
              }}
            >

              Ask AUREN
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
