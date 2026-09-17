import React, { useState } from 'react';
import {
  Github,
  GitBranch,
  GitCommit,
  RefreshCw,
  ArrowLeft,
  Clock,
  Radio,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { useNotifications } from '../../context/NotificationContext';

interface GitHubDetailViewProps {
  onBack: () => void;
  onOpenCommitDoc?: (repo: string, commitSha: string) => void;
}

interface RepositoryItem {
  id: string;
  name: string;
  repoFullName: string;
  branch: string;
  status: 'synced' | 'syncing' | 'pending';
  lastSynced: string;
  scope: 'organization' | 'personal';
  lastCommit: {
    sha: string;
    message: string;
    author: string;
    timestamp: string;
  };
  indexedFiles: number;
  webhookActive: boolean;
}

export const GitHubDetailView: React.FC<GitHubDetailViewProps> = ({ onBack }) => {
  const { addNotification } = useNotifications();
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const [repositories, setRepositories] = useState<RepositoryItem[]>([
    {
      id: 'repo_auren',
      name: 'auren',
      repoFullName: 'auren-ai/auren',
      branch: 'main',
      status: 'synced',
      lastSynced: '2 minutes ago',
      scope: 'organization',
      lastCommit: {
        sha: 'a91c2e7',
        message: 'Fix document ingestion pipeline and Qdrant payload filters',
        author: 'Praman Singh Bhogal',
        timestamp: '14 minutes ago',
      },
      indexedFiles: 142,
      webhookActive: true,
    },
    {
      id: 'repo_retrieval',
      name: 'retrieval-service',
      repoFullName: 'auren-core/retrieval-service',
      branch: 'main',
      status: 'synced',
      lastSynced: '35 minutes ago',
      scope: 'organization',
      lastCommit: {
        sha: '7f9a2e1',
        message: 'Add zero-trust JWT claim verification to document retrieval',
        author: 'Architecture Guild',
        timestamp: '1 hour ago',
      },
      indexedFiles: 86,
      webhookActive: true,
    },
    {
      id: 'repo_vector',
      name: 'vector-pipeline',
      repoFullName: 'auren-core/vector-pipeline',
      branch: 'main',
      status: 'synced',
      lastSynced: '2 hours ago',
      scope: 'organization',
      lastCommit: {
        sha: '3c8e11a',
        message: 'Implement AST semantic chunking preserving function blocks',
        author: 'Alex Vance',
        timestamp: '3 hours ago',
      },
      indexedFiles: 54,
      webhookActive: true,
    },
    {
      id: 'repo_personal_notes',
      name: 'research-notes',
      repoFullName: 'praman-bhogal/research-notes',
      branch: 'main',
      status: 'synced',
      lastSynced: '4 hours ago',
      scope: 'personal',
      lastCommit: {
        sha: 'f41d902',
        message: 'Personal notes on hybrid BM25 and dense vector ranking',
        author: 'Praman Singh Bhogal',
        timestamp: '5 hours ago',
      },
      indexedFiles: 19,
      webhookActive: true,
    },
  ]);

  const handleSyncRepo = (repoId: string) => {
    setRepositories((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, status: 'syncing' } : r))
    );

    setTimeout(() => {
      const updatedTime = 'Just now';
      setRepositories((prev) =>
        prev.map((r) =>
          r.id === repoId
            ? {
                ...r,
                status: 'synced',
                lastSynced: updatedTime,
                lastCommit: {
                  ...r.lastCommit,
                  sha: Math.random().toString(36).substring(2, 9),
                  timestamp: 'Just now',
                },
              }
            : r
        )
      );

      const target = repositories.find((r) => r.id === repoId);
      addNotification({
        title: 'GitHub Synced',
        description: `Repository ${target?.repoFullName || 'repo'} synchronized successfully.`,
        type: 'github_sync',
        entityId: repoId,
      });
    }, 1200);
  };

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    setRepositories((prev) => prev.map((r) => ({ ...r, status: 'syncing' })));

    setTimeout(() => {
      setIsSyncingAll(false);
      setRepositories((prev) =>
        prev.map((r) => ({
          ...r,
          status: 'synced',
          lastSynced: 'Just now',
        }))
      );
      addNotification({
        title: 'GitHub Repositories Synchronized',
        description: 'All 4 connected GitHub repositories were indexed with latest commits.',
        type: 'github_sync',
      });
    }, 1500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 py-2 px-1 sm:px-4 animate-fadeIn">
      {/* Back button & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/70 dark:border-neutral-800/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  GitHub Enterprise
                </h1>
                <Badge variant="neutral" size="sm">
                  Connected
                </Badge>
              </div>

              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Account: <span className="font-medium text-neutral-800 dark:text-neutral-200">praman@example.com</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            isLoading={isSyncingAll}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />}
          >
            Sync All Repositories
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium">Synchronized Repositories</span>
          <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {repositories.length}
          </span>
          <span className="text-[10px] text-neutral-400">3 Organization • 1 Personal Vault</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium">Webhook Realtime Push</span>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mt-0.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Active & Listening</span>
          </div>
          <span className="text-[10px] text-neutral-400">Automated incremental commit indexing</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium">Total Code & Spec Artifacts</span>
          <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {repositories.reduce((sum, r) => sum + r.indexedFiles, 0)} Files
          </span>
          <span className="text-[10px] text-neutral-400">Markdown, TypeScript, YAML, RFCs</span>
        </div>
      </div>

      {/* Connected Repositories List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            Connected Repositories ({repositories.length})
          </h2>
          <span className="text-[11px] text-neutral-500 font-mono">
            Zero-Trust Scope Isolation Enforced
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {repositories.map((repo) => {
            const isRepoSyncing = repo.status === 'syncing';
            return (
              <div
                key={repo.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col gap-3 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Github className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0" />
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                      {repo.repoFullName}
                    </span>
                    <Badge
                      variant="neutral"
                      size="sm"
                    >

                      {repo.scope === 'personal' ? 'Personal' : 'Organization'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSyncRepo(repo.id)}
                      disabled={isRepoSyncing}
                      className="px-2.5 py-1 rounded-lg text-xs border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${isRepoSyncing ? 'animate-spin text-neutral-900 dark:text-white' : ''}`}
                      />
                      <span>{isRepoSyncing ? 'Syncing...' : 'Sync'}</span>
                    </button>
                  </div>
                </div>

                {/* Details Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span className="font-mono text-[11px] text-neutral-900 dark:text-neutral-100">
                      {repo.branch}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Synced {repo.lastSynced}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 sm:col-span-2">
                    <GitCommit className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 mr-1.5">
                      {repo.lastCommit.sha}
                    </span>
                    <span className="truncate text-[11px] text-neutral-500">
                      {repo.lastCommit.message}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
