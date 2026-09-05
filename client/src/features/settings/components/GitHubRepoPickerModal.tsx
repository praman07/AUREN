import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Lock, 
  Globe, 
  GitBranch, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  X,
  FolderGit2
} from 'lucide-react';
import { useGetGitHubRepos, useSelectGitHubRepos, type GitHubRepo } from '../api/connectorQueries';

interface GitHubRepoPickerModalProps {
  connectorId: string;
  isOpen: boolean;
  onClose: () => void;
  initialSelectedRepos?: string[];
  onSuccessNotification?: (msg: string) => void;
}

export const GitHubRepoPickerModal: React.FC<GitHubRepoPickerModalProps> = ({
  connectorId,
  isOpen,
  onClose,
  initialSelectedRepos = [],
  onSuccessNotification,
}) => {
  const { data: repos, isLoading, isError, error, refetch } = useGetGitHubRepos(connectorId, isOpen);
  const selectReposMutation = useSelectGitHubRepos();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set(initialSelectedRepos));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize selection state when modal opens or initialSelectedRepos changes
  useEffect(() => {
    if (isOpen) {
      setSelectedRepos(new Set(initialSelectedRepos));
      setSearchQuery('');
      setErrorMessage(null);
    }
  }, [isOpen, initialSelectedRepos]);

  if (!isOpen) return null;

  const repoList: GitHubRepo[] = repos || [];

  const filteredRepos = repoList.filter((repo) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      repo.fullName.toLowerCase().includes(q) ||
      repo.name.toLowerCase().includes(q) ||
      repo.owner.login.toLowerCase().includes(q) ||
      (repo.description && repo.description.toLowerCase().includes(q))
    );
  });

  const toggleRepo = (fullName: string) => {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) {
        next.delete(fullName);
      } else {
        if (next.size >= 50) {
          setErrorMessage('Maximum limit of 50 repositories reached.');
          return prev;
        }
        next.delete(fullName); // clear any exact case duplicate
        next.add(fullName);
      }
      setErrorMessage(null);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      filteredRepos.forEach((repo) => {
        if (next.size < 50) {
          next.add(repo.fullName);
        }
      });
      return next;
    });
  };

  const handleDeselectAllFiltered = () => {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      filteredRepos.forEach((repo) => next.delete(repo.fullName));
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setErrorMessage(null);
      const repositories = Array.from(selectedRepos);
      await selectReposMutation.mutateAsync({
        connectorId,
        repositories,
      });

      if (onSuccessNotification) {
        onSuccessNotification(`Successfully saved ${repositories.length} selected repository identifier(s).`);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save repository selection.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-600 dark:text-blue-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                Select GitHub Repositories
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose repositories authorized for synchronization into AUREN Knowledge Core.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Toolbar */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search repositories by name, owner, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          {filteredRepos.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0 text-xs">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-2.5 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg font-medium transition-all"
              >
                Select All
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={handleDeselectAllFiltered}
                className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-all"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Error Callout */}
        {errorMessage && (
          <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-800/40 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body / Repository List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[250px]">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fetching accessible GitHub repositories...
              </p>
            </div>
          ) : isError ? (
            <div className="py-12 px-6 text-center space-y-3 border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 rounded-xl">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                Failed to load repositories
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 max-w-md mx-auto">
                {(error as any)?.message || 'Could not fetch repository list from GitHub API.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/40 transition-all shadow-2xs"
              >
                Retry Request
              </button>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <FolderGit2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {searchQuery ? 'No repositories match your search query.' : 'No accessible GitHub repositories found.'}
              </p>
            </div>
          ) : (
            filteredRepos.map((repo) => {
              const isChecked = selectedRepos.has(repo.fullName);
              return (
                <div
                  key={repo.id}
                  onClick={() => toggleRepo(repo.fullName)}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all flex items-start gap-3.5 ${
                    isChecked
                      ? 'border-blue-500/60 dark:border-blue-500/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by row click
                    className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 font-mono">
                        {repo.fullName}
                      </span>
                      {repo.private ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <GitBranch className="w-3 h-3" /> {repo.defaultBranch}
                      </span>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-relaxed">
                        {repo.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span>{selectedRepos.size}</span> repository identifier(s) selected
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={selectReposMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-2xs flex items-center gap-2 disabled:opacity-50"
            >
              {selectReposMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Selection</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
