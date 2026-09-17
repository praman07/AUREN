import React, { useState } from 'react';
import { X, Search, GitBranch, Check, Lock, Globe } from 'lucide-react';
import type { Connector, GitHubRepo } from '../../types';


interface ManageRepositoriesModalProps {
  connector: Connector | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (selectedRepoIds: string[]) => void;
}

const MOCK_REPOSITORIES: GitHubRepo[] = [
  {
    id: 'repo_1',
    name: 'retrieval-service',
    fullName: 'auren-core/retrieval-service',
    private: true,
    defaultBranch: 'main',
    lastCommitSha: '7f9a2e1',
    lastCommitMessage: 'docs(arch): update llama.cpp topology and citation anchors',
    lastSyncAt: '8 minutes ago',
    syncedFilesCount: 32,
    status: 'synced',
  },
  {
    id: 'repo_2',
    name: 'security-policies',
    fullName: 'auren-core/security-policies',
    private: true,
    defaultBranch: 'main',
    lastCommitSha: '9b201f4',
    lastCommitMessage: 'feat(policy): automate commit verification rules',
    lastSyncAt: '25 minutes ago',
    syncedFilesCount: 16,
    status: 'synced',
  },
  {
    id: 'repo_3',
    name: 'core-contracts',
    fullName: 'auren-core/core-contracts',
    private: true,
    defaultBranch: 'main',
    lastCommitSha: '3a18e0f',
    lastCommitMessage: 'fix(proto): synchronize protobuf schemas for VLM parsing',
    lastSyncAt: '1 hour ago',
    syncedFilesCount: 24,
    status: 'synced',
  },
  {
    id: 'repo_4',
    name: 'inference-runtime',
    fullName: 'auren-core/inference-runtime',
    private: true,
    defaultBranch: 'main',
    lastCommitSha: 'e45c812',
    lastCommitMessage: 'perf(sse): lower token streaming latency on local weights',
    lastSyncAt: '2 hours ago',
    syncedFilesCount: 48,
    status: 'synced',
  },
  {
    id: 'repo_5',
    name: 'auth-guard',
    fullName: 'auren-core/auth-guard',
    private: true,
    defaultBranch: 'main',
    lastCommitSha: '11d9f80',
    lastCommitMessage: 'chore(deps): bump cryptographic token verification SDK',
    lastSyncAt: '3 hours ago',
    syncedFilesCount: 12,
    status: 'synced',
  },
  {
    id: 'repo_6',
    name: 'design-system',
    fullName: 'auren-core/design-system',
    private: false,
    defaultBranch: 'main',
    lastCommitSha: '90a3c27',
    lastCommitMessage: 'style(tokens): refine enterprise high-density typography tokens',
    lastSyncAt: 'Yesterday',
    syncedFilesCount: 64,
    status: 'synced',
  },
];

export const ManageRepositoriesModal: React.FC<ManageRepositoriesModalProps> = ({
  connector,
  isOpen,
  onClose,
  onSave,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(['repo_1', 'repo_2', 'repo_3', 'repo_4', 'repo_5', 'repo_6']);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !connector) return null;

  const filteredRepos = MOCK_REPOSITORIES.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRepo = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      if (onSave) onSave(selectedIds);
      setIsSaving(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div
        id="manage-repositories-modal"
        className="w-full max-w-xl bg-white dark:bg-[#121316] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
              Manage connected repositories
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Choose which repositories AUREN indexes and synchronizes into your organization workspace.
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

        {/* Search & Counter */}
        <div className="p-6 pb-3 flex flex-col gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search repositories by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
            <span>
              {selectedIds.length} of {MOCK_REPOSITORIES.length} repositories selected (48 total connected)
            </span>
            <button
              type="button"
              onClick={() => {
                if (selectedIds.length === MOCK_REPOSITORIES.length) {
                  setSelectedIds([]);
                } else {
                  setSelectedIds(MOCK_REPOSITORIES.map((r) => r.id));
                }
              }}
              className="text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:underline cursor-pointer"
            >
              {selectedIds.length === MOCK_REPOSITORIES.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
        </div>

        {/* Repository List */}
        <div className="px-6 pb-6 flex-1 max-h-[50vh] overflow-y-auto flex flex-col gap-2">
          {filteredRepos.map((repo) => {
            const isSelected = selectedIds.includes(repo.id);
            return (
              <div
                key={repo.id}
                onClick={() => toggleRepo(repo.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-neutral-900/40 dark:border-white/40 bg-neutral-50/60 dark:bg-neutral-800/40'
                    : 'border-neutral-200/70 dark:border-neutral-800/70 hover:bg-neutral-50/40 dark:hover:bg-neutral-900/40'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-neutral-900 border-neutral-900 dark:bg-white dark:border-white text-white dark:text-neutral-900'
                        : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        {repo.name}
                      </span>
                      {repo.private ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          <Lock className="w-2.5 h-2.5" />
                          Private
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          <Globe className="w-2.5 h-2.5" />
                          Public
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                      {repo.lastCommitMessage}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono justify-end">
                    <GitBranch className="w-3 h-3" />
                    <span>{repo.defaultBranch}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    {repo.syncedFilesCount} files synced
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 transition-colors shadow-xs cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save repository changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
