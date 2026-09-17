import React, { useState } from 'react';
import { X, Users, Lock, Check, ArrowRight } from 'lucide-react';
import { PlatformIcon } from '../ui/PlatformIcons';


interface ConnectSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectSource: (sourceType: string, scope: 'organization' | 'personal', name: string) => void;
  defaultScope?: 'organization' | 'personal';
}

interface SourceOption {
  type: string;
  name: string;
  description: string;
  category: string;
}

export const ConnectSourceModal: React.FC<ConnectSourceModalProps> = ({
  isOpen,
  onClose,
  onConnectSource,
  defaultScope = 'organization',
}) => {
  const [targetScope, setTargetScope] = useState<'organization' | 'personal'>(defaultScope);
  const [selectedSource, setSelectedSource] = useState<SourceOption | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const sources: SourceOption[] = [
    {
      type: 'github',
      name: 'GitHub Enterprise',
      description: 'Repositories, code trees, PRs, issues & commit history',
      category: 'Code & Specs',
    },
    {
      type: 'google_drive',
      name: 'Google Drive',
      description: 'Documents, shared drives, presentation slides & PDFs',
      category: 'Documents',
    },
    {
      type: 'slack',
      name: 'Slack',
      description: 'Public & private channels, threads & pinned briefs',
      category: 'Discussions',
    },
    {
      type: 'notion',
      name: 'Notion',
      description: 'Team wikis, databases, product roadmaps & specs',
      category: 'Knowledge',
    },
    {
      type: 'microsoft',
      name: 'Microsoft 365',
      description: 'OneDrive, SharePoint, Word documents & Excel sheets',
      category: 'Enterprise',
    },
    {
      type: 'jira',
      name: 'Jira Software',
      description: 'Epics, tickets, sprint backlogs & acceptance criteria',
      category: 'Project Tracking',
    },
    {
      type: 'linear',
      name: 'Linear',
      description: 'Engineering cycles, projects, issue trackers & roadmaps',
      category: 'Project Tracking',
    },
    {
      type: 'figma',
      name: 'Figma',
      description: 'Design system tokens, specs, components & comments',
      category: 'Design',
    },
  ];

  const handleSelectSource = (src: SourceOption) => {
    setSelectedSource(src);
  };

  const handleConfirmConnect = () => {
    if (!selectedSource) return;
    setIsConnecting(true);
    setTimeout(() => {
      onConnectSource(selectedSource.type, targetScope, selectedSource.name);
      setIsConnecting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div
        id="connect-source-modal"
        className="w-full max-w-xl bg-white dark:bg-[#121316] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
              Connect a knowledge source
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Select where this connection will be accessible and choose the platform.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-6 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Where should this connection live? */}
          <div>
            <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 block mb-2.5">
              Where should this connection live?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetScope('organization')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  targetScope === 'organization'
                    ? 'border-neutral-900 dark:border-white bg-neutral-50/70 dark:bg-neutral-800/60 ring-1 ring-neutral-900/10 dark:ring-white/10'
                    : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Organization
                    </span>
                  </div>
                  {targetScope === 'organization' && (
                    <Check className="w-4 h-4 text-neutral-900 dark:text-white" />
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Shared with authorized members
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('personal')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  targetScope === 'personal'
                    ? 'border-neutral-900 dark:border-white bg-neutral-50/70 dark:bg-neutral-800/60 ring-1 ring-neutral-900/10 dark:ring-white/10'
                    : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Personal
                    </span>
                  </div>
                  {targetScope === 'personal' && (
                    <Check className="w-4 h-4 text-neutral-900 dark:text-white" />
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Only available to you
                </p>
              </button>
            </div>
          </div>

          {/* Step 2: Choose a source */}
          <div>
            <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 block mb-2.5">
              Choose a source
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sources.map((src) => {
                const isSelected = selectedSource?.type === src.type;
                return (
                  <button
                    key={src.type}
                    type="button"
                    onClick={() => handleSelectSource(src)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-neutral-900 dark:border-white bg-neutral-50/90 dark:bg-neutral-800/80 shadow-xs'
                        : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <PlatformIcon platform={src.type} className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {src.name}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                        {src.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 flex items-center justify-between">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {selectedSource ? (
              <span>
                Connecting to <strong className="text-neutral-800 dark:text-neutral-200">{selectedSource.name}</strong> as{' '}
                <strong className="text-neutral-800 dark:text-neutral-200 capitalize">{targetScope}</strong>
              </span>
            ) : (
              'Select a source platform to proceed'
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedSource || isConnecting}
              onClick={handleConfirmConnect}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedSource && !isConnecting
                  ? 'bg-neutral-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
              }`}
            >
              {isConnecting ? (
                'Connecting...'
              ) : (
                <>
                  <span>Connect source</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
