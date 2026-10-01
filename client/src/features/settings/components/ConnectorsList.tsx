import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Database, 
  GitBranch, 
  Mail, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Loader2, 
  HardDrive,
  X,
  AlertTriangle,
  Unplug,
  FolderGit2,
  ShieldCheck
} from 'lucide-react';
import { 
  useConnectors, 
  useConnectConnector, 
  useSyncConnector, 
  useSyncGitHubConnector,
  useDisconnectConnector,
  useGetGoogleAuthUrl,
  useGetGitHubAuthUrl
} from '../api/connectorQueries';
import { GitHubRepoPickerModal } from './GitHubRepoPickerModal';
import { ConnectorPolicyModal } from './ConnectorPolicyModal';
import { ConnectorCredentialModal } from './ConnectorCredentialModal';

const iconMap: Record<string, React.ElementType> = {
  GITHUB: GitBranch,
  GMAIL: Mail,
  NOTION: Database,
  GOOGLE_DRIVE: HardDrive,
};

const providerDescriptions: Record<string, string> = {
  GOOGLE_DRIVE: 'Import and search documents, spreadsheets, and Google Docs from your Google Drive inside AUREN.',
  GITHUB: 'Connect public and private GitHub repositories for automated Organization Knowledge indexing.',
  GMAIL: 'Ingest team email threads and attachments into Universal Knowledge Core.',
  NOTION: 'Sync workspace pages, databases, and internal wikis.',
  SLACK: 'Index channel conversations, decisions, and shared files.',
};

export const ConnectorsList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: connectors, isLoading, isError, error } = useConnectors();
  const getGoogleAuthUrlMutation = useGetGoogleAuthUrl();
  const getGitHubAuthUrlMutation = useGetGitHubAuthUrl();
  const connectMutation = useConnectConnector();
  const syncMutation = useSyncConnector();
  const syncGitHubMutation = useSyncGitHubConnector();
  const disconnectMutation = useDisconnectConnector();

  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Repository Picker Modal state
  const [isRepoPickerOpen, setIsRepoPickerOpen] = useState(false);
  const [repoPickerConnectorId, setRepoPickerConnectorId] = useState<string | null>(null);
  const [initialSelectedRepos, setInitialSelectedRepos] = useState<string[]>([]);

  // Connector Policy Access Control Modal state
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyModalConnectorId, setPolicyModalConnectorId] = useState<string | null>(null);
  const [policyModalRepos, setPolicyModalRepos] = useState<string[]>([]);

  // Credential Modal state for direct token connectors
  const [credentialModalTarget, setCredentialModalTarget] = useState<{ provider: string; name: string } | null>(null);

  // Handle OAuth Redirect URL Params
  useEffect(() => {
    const connectedParam = searchParams.get('connected');
    const errorParam = searchParams.get('error');

    if (connectedParam === 'GOOGLE_DRIVE') {
      setNotification({
        type: 'success',
        message: 'Google Drive connected successfully! Initial document sync is running in the background.',
      });
      navigate('/settings?tab=connectors', { replace: true });
    } else if (connectedParam === 'GITHUB') {
      setNotification({
        type: 'success',
        message: 'GitHub connected successfully! Click "Manage repositories" to select target repositories.',
      });
      navigate('/settings?tab=connectors', { replace: true });
    } else if (errorParam) {
      const formattedError = decodeURIComponent(errorParam).replace(/_/g, ' ');
      setNotification({
        type: 'error',
        message: `Connection failed: ${formattedError}`,
      });
      navigate('/settings?tab=connectors', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleConnect = async (provider: string, name: string) => {
    setNotification(null);
    if (provider === 'GOOGLE_DRIVE') {
      try {
        setConnectingProvider('GOOGLE_DRIVE');
        const res = await getGoogleAuthUrlMutation.mutateAsync();
        if (res?.url) {
          window.location.href = res.url;
          return;
        }
        throw new Error('Failed to retrieve Google authorization URL.');
      } catch (e: any) {
        setConnectingProvider(null);
        setNotification({
          type: 'error',
          message: e?.message || 'Could not initiate Google authentication.',
        });
      }
      return;
    }

    if (provider === 'GITHUB') {
      try {
        setConnectingProvider('GITHUB');
        const res = await getGitHubAuthUrlMutation.mutateAsync();
        if (res?.url) {
          window.location.href = res.url;
          return;
        }
        throw new Error('Failed to retrieve GitHub authorization URL.');
      } catch (e: any) {
        setConnectingProvider(null);
        setNotification({
          type: 'error',
          message: e?.message || 'Could not initiate GitHub authentication.',
        });
      }
      return;
    }

    // Prompt user for real integration API credentials / tokens for Notion, Slack, Gmail, etc.
    setCredentialModalTarget({ provider, name });
  };

  const handleDisconnect = async (connectorId: string) => {
    try {
      await disconnectMutation.mutateAsync(connectorId);
      setNotification({
        type: 'success',
        message: 'Connector disconnected successfully.',
      });
    } catch (e: any) {
      setNotification({
        type: 'error',
        message: e?.message || 'Failed to disconnect connector.',
      });
    }
  };

  const handleSync = async (connectorId: string) => {
    try {
      await syncMutation.mutateAsync(connectorId);
      setNotification({
        type: 'success',
        message: 'Sync initiated successfully.',
      });
    } catch (e: any) {
      setNotification({
        type: 'error',
        message: e?.message || 'Failed to trigger manual sync.',
      });
    }
  };

  const handleGitHubSync = async (connectorId: string) => {
    try {
      const res = await syncGitHubMutation.mutateAsync(connectorId);
      const resData = res?.data?.result || res?.data;
      const fetched = resData?.resourcesFetched ?? 0;
      const upserted = resData?.documentsUpserted ?? 0;
      const versions = resData?.versionsCreated ?? 0;

      setNotification({
        type: 'success',
        message: `GitHub sync started. Fetched ${fetched} resource(s), upserted ${upserted} document(s) (${versions} new version(s)). Background processing queued.`,
      });
    } catch (e: any) {
      setNotification({
        type: 'error',
        message: e?.message || 'Failed to trigger GitHub sync.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading connector governance status...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 border border-red-200 dark:border-red-900 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
        <span>Failed to load connectors: {(error as any)?.message || 'Unknown error'}</span>
        <button 
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 rounded text-red-700 dark:text-red-300 font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const connectorList = connectors || [];

  return (
    <div className="space-y-6">
      {/* Banner Notifications for OAuth & Sync Events */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200 ${
          notification.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span className="font-medium leading-relaxed">{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Data Connectors</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage integrations with external platforms. Connected sources will be ingested into the Universal Knowledge Core.
        </p>
      </div>

      <div className="grid gap-4">
        {connectorList.map((connector) => {
          const Icon = iconMap[connector.provider] || Database;
          const isConnected = connector.configured && Boolean(connector.account);
          const syncStatus = connector.account?.lastSyncStatus;
          const isSyncing = syncStatus === 'PENDING' || syncStatus === 'SYNCING' || (syncMutation.isPending && syncMutation.variables === connector.account?.id);
          const isThisGitHub = connector.provider === 'GITHUB';
          const isSyncingThis = isSyncing || (isThisGitHub && syncGitHubMutation.isPending && syncGitHubMutation.variables === connector.account?.id);
          const hasError = syncStatus === 'FAILED' || Boolean(connector.account?.lastError);
          const isConnectingThis = connectingProvider === connector.provider;
          const description = providerDescriptions[connector.provider] || 'Connect external platform data to AUREN Knowledge Core.';
          const githubLogin = connector.account?.metadata?.githubLogin;
          const selectedRepos = connector.account?.metadata?.selectedRepos || [];

          return (
            <div 
              key={connector.provider} 
              className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 shrink-0 mt-0.5">
                  <Icon className="w-6 h-6 text-slate-800 dark:text-slate-200" />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {connector.name}
                    </h4>

                    {/* STATUS BADGES */}
                    {isConnectingThis ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        <Loader2 className="w-3 h-3 animate-spin" /> Connecting...
                      </span>
                    ) : isSyncingThis ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
                      </span>
                    ) : hasError ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                        <AlertCircle className="w-3 h-3" /> Sync Error
                      </span>
                    ) : isConnected ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        <AlertCircle className="w-3 h-3" /> Disconnected
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                    {description}
                  </p>

                  {/* ACCOUNT & SYNC METADATA */}
                  {isConnected && connector.account && (
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono pt-1 flex-wrap">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Connected as {githubLogin ? `@${githubLogin}` : connector.account.accountEmail || 'Connected'}
                      </span>
                      {selectedRepos.length > 0 && (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/60">
                          {selectedRepos.length} repo(s) selected
                        </span>
                      )}
                      {connector.account.lastSyncAt && (
                        <span>
                          • Last synced: {new Date(connector.account.lastSyncAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ERROR DISPLAY */}
                  {hasError && connector.account?.lastError && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-900/40 font-mono mt-2">
                      Error: {connector.account.lastError}
                    </p>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
                {isConnected && connector.account?.id && (
                  <>
                    {connector.provider === 'GITHUB' && (
                      <>
                        <button
                          onClick={() => {
                            setRepoPickerConnectorId(connector.account!.id);
                            setInitialSelectedRepos(connector.account?.metadata?.selectedRepos || []);
                            setIsRepoPickerOpen(true);
                          }}
                          className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-xs font-medium flex items-center gap-1.5"
                          title="Select GitHub Repositories"
                        >
                          <FolderGit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Manage repositories</span>
                        </button>

                        <button
                          onClick={() => {
                            setPolicyModalConnectorId(connector.account!.id);
                            setPolicyModalRepos(connector.account?.metadata?.selectedRepos || []);
                            setIsPolicyModalOpen(true);
                          }}
                          className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-xs font-medium flex items-center gap-1.5"
                          title="Configure Connector Access Policies"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Manage access</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => isThisGitHub ? handleGitHubSync(connector.account!.id) : handleSync(connector.account!.id)}
                      disabled={isSyncingThis}
                      className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                      title={isThisGitHub ? "Trigger GitHub Repository Knowledge Sync" : "Trigger Instant Knowledge Sync"}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin text-blue-600' : ''}`} />
                      <span>
                        {isSyncingThis 
                          ? 'Syncing...' 
                          : isThisGitHub 
                            ? 'Sync GitHub' 
                            : 'Sync now'
                        }
                      </span>
                    </button>

                    <button
                      onClick={() => handleDisconnect(connector.account!.id)}
                      disabled={disconnectMutation.isPending}
                      className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 transition-all text-xs font-medium flex items-center gap-1.5"
                      title="Disconnect Integration"
                    >
                      <Unplug className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </>
                )}

                {!isConnected && (
                  <button
                    onClick={() => handleConnect(connector.provider, connector.name)}
                    disabled={isConnectingThis || connectMutation.isPending}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-2xs flex items-center gap-2 disabled:opacity-50"
                  >
                    {isConnectingThis ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : hasError ? (
                      <span>Try again</span>
                    ) : (
                      <span>Connect {connector.name}</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Zero-Trust Governance Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex gap-3.5 text-amber-900 dark:text-amber-300">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div className="text-xs">
          <p className="font-bold mb-1 uppercase tracking-wider text-[11px]">Zero-Trust Connector Governance</p>
          <p className="leading-relaxed">
            Data ingested through connectors respects origin platform permissions. 
            All extracted vectors are automatically tagged with tenant, department, and role access controls before store commit.
          </p>
        </div>
      </div>

      {/* GitHub Repository Selection Modal */}
      {repoPickerConnectorId && (
        <GitHubRepoPickerModal
          connectorId={repoPickerConnectorId}
          isOpen={isRepoPickerOpen}
          onClose={() => setIsRepoPickerOpen(false)}
          initialSelectedRepos={initialSelectedRepos}
          onSuccessNotification={(msg) => setNotification({ type: 'success', message: msg })}
        />
      )}

      {/* Connector Policy Access Control Modal */}
      {policyModalConnectorId && (
        <ConnectorPolicyModal
          connectorId={policyModalConnectorId}
          isOpen={isPolicyModalOpen}
          onClose={() => setIsPolicyModalOpen(false)}
          selectedRepos={policyModalRepos}
          onSuccessNotification={(msg) => setNotification({ type: 'success', message: msg })}
        />
      )}

      {/* Real API Credential Modal for Notion, Slack, Gmail, etc. */}
      {credentialModalTarget && (
        <ConnectorCredentialModal
          provider={credentialModalTarget.provider}
          providerName={credentialModalTarget.name}
          isOpen={Boolean(credentialModalTarget)}
          onClose={() => setCredentialModalTarget(null)}
          onSuccessNotification={(msg) => setNotification({ type: 'success', message: msg })}
        />
      )}
    </div>
  );
};

