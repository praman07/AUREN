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
  Unplug
} from 'lucide-react';
import { 
  useConnectors, 
  useConnectConnector, 
  useSyncConnector, 
  useDisconnectConnector,
  useGetGoogleAuthUrl
} from '../api/connectorQueries';
import { useAuthStore } from '../../../core/auth/store/useAuthStore';

const iconMap: Record<string, React.ElementType> = {
  GITHUB: GitBranch,
  GMAIL: Mail,
  NOTION: Database,
  GOOGLE_DRIVE: HardDrive,
};

const providerDescriptions: Record<string, string> = {
  GOOGLE_DRIVE: 'Import and search documents, spreadsheets, and Google Docs from your Google Drive inside AUREN.',
  GITHUB: 'Index public and private repositories, pull requests, and codebase documentation.',
  GMAIL: 'Ingest team email threads and attachments into Universal Knowledge Core.',
  NOTION: 'Sync workspace pages, databases, and internal wikis.',
  SLACK: 'Index channel conversations, decisions, and shared files.',
};

export const ConnectorsList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSuperAdmin = useAuthStore((state) => state.user?.isSuperAdmin);

  const { data: connectors, isLoading, isError, error } = useConnectors();
  const getGoogleAuthUrlMutation = useGetGoogleAuthUrl();
  const connectMutation = useConnectConnector();
  const syncMutation = useSyncConnector();
  const disconnectMutation = useDisconnectConnector();

  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Handle OAuth Redirect URL Params
  useEffect(() => {
    const connectedParam = searchParams.get('connected');
    const errorParam = searchParams.get('error');

    if (connectedParam === 'GOOGLE_DRIVE') {
      setNotification({
        type: 'success',
        message: 'Google Drive connected successfully! Initial document sync is running in the background.',
      });
      navigate('/settings', { replace: true });
    } else if (errorParam) {
      const formattedError = decodeURIComponent(errorParam).replace(/_/g, ' ');
      setNotification({
        type: 'error',
        message: `Google Drive connection failed: ${formattedError}`,
      });
      navigate('/settings', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleConnect = async (provider: string) => {
    setNotification(null);
    if (provider === 'GOOGLE_DRIVE') {
      try {
        setConnectingProvider('GOOGLE_DRIVE');
        const res = await getGoogleAuthUrlMutation.mutateAsync();
        if (res?.url) {
          window.location.href = res.url;
          return;
        }
        throw new Error('Failed to retrieve authorization URL.');
      } catch (e: any) {
        setConnectingProvider(null);
        setNotification({
          type: 'error',
          message: e?.message || 'Could not initiate Google authentication.',
        });
      }
      return;
    }

    // Demo/Fallback Connect for other providers
    try {
      setConnectingProvider(provider);
      await connectMutation.mutateAsync({
        provider,
        accountId: `acc_${provider.toLowerCase()}_demo`,
        accountEmail: `admin@${provider.toLowerCase()}.com`,
        accessToken: `demo_token_${Date.now()}`,
      });
    } catch (e: any) {
      setNotification({
        type: 'error',
        message: e?.message || `Failed to connect ${provider}.`,
      });
    } finally {
      setConnectingProvider(null);
    }
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
          const hasError = syncStatus === 'FAILED' || Boolean(connector.account?.lastError);
          const isConnectingThis = connectingProvider === connector.provider;
          const description = providerDescriptions[connector.provider] || 'Connect external platform data to AUREN Knowledge Core.';

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
                    ) : isSyncing ? (
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
                      {connector.account.accountEmail && (
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          Account: {connector.account.accountEmail}
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
              {isSuperAdmin ? (
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {isConnected && connector.account?.id && (
                    <>
                      <button
                        onClick={() => handleSync(connector.account!.id)}
                        disabled={isSyncing}
                        className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                        title="Trigger Instant Knowledge Sync"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync now'}</span>
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
                      onClick={() => handleConnect(connector.provider)}
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
              ) : (
                <span className="text-xs text-slate-400 italic shrink-0">Read-Only View</span>
              )}
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
    </div>
  );
};
