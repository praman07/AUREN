import React from 'react';
import { Database, GitBranch, Mail, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useConnectors, useConnectConnector, useSyncConnector, useDisconnectConnector } from '../api/connectorQueries';
import { useAuthStore } from '../../../core/auth/store/useAuthStore';

const iconMap: Record<string, React.ElementType> = {
  GITHUB: GitBranch,
  GMAIL: Mail,
  NOTION: Database,
};

export const ConnectorsList: React.FC = () => {
  const isSuperAdmin = useAuthStore((state) => state.user?.isSuperAdmin);
  const { data: connectors, isLoading, isError, error } = useConnectors();
  const connectMutation = useConnectConnector();
  const syncMutation = useSyncConnector();
  const disconnectMutation = useDisconnectConnector();

  const handleConnect = (provider: string) => {
    connectMutation.mutate({
      provider,
      accountId: `acc_${provider.toLowerCase()}_demo`,
      accountEmail: `admin@${provider.toLowerCase()}.com`,
      accessToken: `demo_token_${Date.now()}`,
    });
  };

  const handleDisconnect = (connectorId: string) => {
    disconnectMutation.mutate(connectorId);
  };

  const handleSync = (connectorId: string) => {
    syncMutation.mutate(connectorId);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center border border-border rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Loading connector governance status...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 border border-red-200 dark:border-red-900 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-xs">
        Failed to load connectors: {(error as any)?.message || 'Unknown error'}
      </div>
    );
  }

  const connectorList = connectors || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground">Data Connectors</h3>
        <p className="text-sm text-muted-foreground">
          Manage integrations with external platforms. Connected sources will be ingested into the Universal Knowledge Core.
        </p>
      </div>

      <div className="grid gap-4">
        {connectorList.map(connector => {
          const Icon = iconMap[connector.provider] || Database;
          const isConnected = connector.configured && Boolean(connector.account);
          const isSyncing = syncMutation.isPending && syncMutation.variables === connector.account?.id;

          return (
            <div key={connector.provider} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
                  <Icon className="w-5 h-5 text-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{connector.name} Core Connector</h4>
                  <div className="flex items-center gap-2.5 mt-1">
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        <AlertCircle className="w-3 h-3" /> Disconnected
                      </span>
                    )}
                    {isConnected && connector.account?.lastSyncAt && (
                      <span className="text-[11px] text-slate-500 font-mono">
                        Last sync: {new Date(connector.account.lastSyncAt).toLocaleTimeString()}
                      </span>
                    )}
                    {isConnected && connector.account?.accountEmail && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({connector.account.accountEmail})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {isSuperAdmin ? (
                <div className="flex items-center gap-2">
                  {isConnected && connector.account?.id && (
                    <button
                      onClick={() => handleSync(connector.account!.id)}
                      disabled={isSyncing}
                      className="p-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-xs flex items-center gap-1"
                      title="Force Instant Knowledge Sync"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                      <span className="hidden sm:inline">Sync</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (isConnected && connector.account?.id) {
                        handleDisconnect(connector.account.id);
                      } else {
                        handleConnect(connector.provider);
                      }
                    }}
                    disabled={connectMutation.isPending || disconnectMutation.isPending}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                      isConnected 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                  >
                    {isConnected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Read-Only View</span>
              )}
            </div>
          );
        })}
      </div>
      
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
