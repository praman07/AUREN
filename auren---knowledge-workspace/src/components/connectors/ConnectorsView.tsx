import React, { useState } from 'react';
import {
  Plus,
  ArrowUpRight,
  Users,
  Lock,
  ArrowRight,
  ChevronRight,
  Check,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Connector, ConnectorPolicy } from '../../types';
import { PlatformIcon } from '../ui/PlatformIcons';
import { Button } from '../ui/Button';
import { ConnectSourceModal } from './ConnectSourceModal';
import { ManageRepositoriesModal } from './ManageRepositoriesModal';
import { ManageAccessModal } from './ManageAccessModal';

interface ConnectorsViewProps {
  connectors?: Connector[];
  onSyncConnector?: (id: string) => Promise<void>;
  onUpdatePolicy?: (id: string, policy: ConnectorPolicy) => Promise<void>;
  onOpenGitHubDetail?: () => void;
  onOpenConnectorDetail?: (id: string, backPage?: string) => void;
  initialSelectedId?: string;
  initialScope?: 'organization' | 'personal';
}

interface ConnectorItem {
  id: string;
  type: string;
  name: string;
  subtitle?: string;
  scope: 'organization' | 'personal';
  status: 'connected' | 'not_connected' | 'syncing' | 'needs_attention';
  access?: string;
  resourceCountText?: string;
  lastSyncText?: string;
  connected: boolean;
  resourceCount: number;
}

const DEFAULT_ORG_CONNECTORS: ConnectorItem[] = [
  {
    id: 'conn_github_org',
    type: 'github',
    name: 'GitHub Enterprise',
    scope: 'organization',
    status: 'connected',
    access: 'Engineering',
    resourceCountText: '48 repositories',
    lastSyncText: '8 min ago',
    connected: true,
    resourceCount: 48,
  },
  {
    id: 'conn_gdrive_org',
    type: 'google_drive',
    name: 'Google Drive',
    scope: 'organization',
    status: 'connected',
    access: 'Engineering',
    resourceCountText: '142 files',
    lastSyncText: '14 min ago',
    connected: true,
    resourceCount: 142,
  },
  {
    id: 'conn_slack_org',
    type: 'slack',
    name: 'Slack',
    scope: 'organization',
    status: 'connected',
    access: 'Engineering',
    resourceCountText: '24 channels',
    lastSyncText: '3 min ago',
    connected: true,
    resourceCount: 24,
  },
  {
    id: 'conn_notion_org',
    type: 'notion',
    name: 'Notion',
    scope: 'organization',
    status: 'connected',
    access: 'Product + Engineering',
    resourceCountText: '642 pages',
    lastSyncText: 'Yesterday',
    connected: true,
    resourceCount: 642,
  },
  {
    id: 'conn_jira_org',
    type: 'jira',
    name: 'Jira Software',
    scope: 'organization',
    status: 'connected',
    access: 'Engineering',
    resourceCountText: '312 tickets',
    lastSyncText: '2 hours ago',
    connected: true,
    resourceCount: 312,
  },
  {
    id: 'conn_m365_org',
    type: 'microsoft',
    name: 'Microsoft 365',
    scope: 'organization',
    status: 'not_connected',
    access: '—',
    resourceCountText: '—',
    lastSyncText: '—',
    connected: false,
    resourceCount: 0,
  },
];

const DEFAULT_PERSONAL_CONNECTORS: ConnectorItem[] = [
  {
    id: 'conn_github_personal',
    type: 'github',
    name: 'GitHub',
    subtitle: 'My GitHub account',
    scope: 'personal',
    status: 'connected',
    access: 'Private to you',
    resourceCountText: '12 repositories',
    lastSyncText: 'Last synced 12 min ago',
    connected: true,
    resourceCount: 12,
  },
  {
    id: 'conn_gdrive_personal',
    type: 'google_drive',
    name: 'Google Drive',
    subtitle: 'My Drive',
    scope: 'personal',
    status: 'connected',
    access: 'Private to you',
    resourceCountText: '318 files',
    lastSyncText: 'Last synced 21 min ago',
    connected: true,
    resourceCount: 318,
  },
  {
    id: 'conn_notion_personal',
    type: 'notion',
    name: 'Notion',
    subtitle: 'My workspace',
    scope: 'personal',
    status: 'not_connected',
    access: '—',
    resourceCountText: '—',
    lastSyncText: '—',
    connected: false,
    resourceCount: 0,
  },
  {
    id: 'conn_gmail_personal',
    type: 'gmail',
    name: 'Gmail',
    subtitle: 'pramanbhogal13@gmail.com',
    scope: 'personal',
    status: 'connected',
    access: 'Private to you',
    resourceCountText: '88 threads',
    lastSyncText: 'Last synced 45 min ago',
    connected: true,
    resourceCount: 88,
  },
  {
    id: 'conn_onedrive_personal',
    type: 'onedrive',
    name: 'OneDrive',
    subtitle: 'Personal Vault',
    scope: 'personal',
    status: 'connected',
    access: 'Private to you',
    resourceCountText: '56 files',
    lastSyncText: 'Last synced 1 hour ago',
    connected: true,
    resourceCount: 56,
  },
];

export const ConnectorsView: React.FC<ConnectorsViewProps> = ({
  connectors = [],
  onSyncConnector,
  onUpdatePolicy,
  onOpenGitHubDetail,
  onOpenConnectorDetail,
  initialSelectedId,
  initialScope = 'organization',
}) => {
  // Active scope switcher: organization by default
  const [activeScope, setActiveScope] = useState<'organization' | 'personal'>(initialScope);

  // List of connectors state
  const [orgConnectors, setOrgConnectors] = useState<ConnectorItem[]>(DEFAULT_ORG_CONNECTORS);
  const [personalConnectors, setPersonalConnectors] = useState<ConnectorItem[]>(DEFAULT_PERSONAL_CONNECTORS);

  // Selected connector
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>('conn_github_org');

  // Modals state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isRepositoriesModalOpen, setIsRepositoriesModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [activeModalConnector, setActiveModalConnector] = useState<Connector | null>(null);

  // Active list according to scope
  const currentList = activeScope === 'organization' ? orgConnectors : personalConnectors;

  // Find active selected item
  const selectedItem =
    currentList.find((c) => c.id === selectedConnectorId) ||
    (activeScope === 'organization'
      ? orgConnectors.find((c) => c.id === selectedConnectorId) || orgConnectors[0]
      : personalConnectors.find((c) => c.id === selectedConnectorId) || personalConnectors[0]);

  // Convert selected ConnectorItem into full Connector type for modals
  const currentDrawerConnector: Connector | null = selectedItem
    ? {
        id: selectedItem.id,
        type: selectedItem.type as any,
        name: selectedItem.name,
        scope: selectedItem.scope,
        connected: selectedItem.connected,
        resourceCount: selectedItem.resourceCount,
        status:
          selectedItem.status === 'connected'
            ? 'active'
            : selectedItem.status === 'needs_attention'
            ? 'error'
            : selectedItem.status === 'syncing'
            ? 'syncing'
            : 'disconnected',
        lastSyncAt: selectedItem.lastSyncText,
        policy: {
          allowedUsers: ['usr_praman_101'],
          allowedRoles: ['engineer', 'lead', 'admin'],
          allowedDepartments: selectedItem.access ? [selectedItem.access] : ['Engineering'],
          allowAllOrg: selectedItem.scope === 'organization',
        },
      }
    : null;

  // Handlers
  const handleSelectRow = (item: ConnectorItem) => {
    setSelectedConnectorId(item.id);
    if (onOpenConnectorDetail) {
      onOpenConnectorDetail(item.id, 'Connectors');
      return;
    }
    const conn: Connector = {
      id: item.id,
      type: item.type as any,
      name: item.name,
      scope: item.scope,
      connected: item.connected,
      resourceCount: item.resourceCount,
      status: item.status === 'connected' ? 'active' : item.status === 'needs_attention' ? 'error' : item.status === 'syncing' ? 'syncing' : 'disconnected',
      policy: { allowedUsers: [], allowedRoles: [], allowedDepartments: [], allowAllOrg: true },
    };
    setActiveModalConnector(conn);
    if (item.status === 'connected') {
      if (item.type === 'github') {
        setIsRepositoriesModalOpen(true);
      } else {
        setIsAccessModalOpen(true);
      }
    } else {
      setIsConnectModalOpen(true);
    }
  };

  const handleSync = async (id: string) => {
    if (onSyncConnector) {
      await onSyncConnector(id);
    }
    // Update local state
    const updater = (prev: ConnectorItem[]) =>
      prev.map((c) => (c.id === id ? { ...c, lastSyncText: 'Just now' } : c));
    setOrgConnectors(updater);
    setPersonalConnectors(updater);
  };

  const handleDisconnect = (id: string) => {
    const updater = (prev: ConnectorItem[]) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              connected: false,
              status: 'not_connected' as const,
              resourceCountText: '—',
              lastSyncText: '—',
            }
          : c
      );
    setOrgConnectors(updater);
    setPersonalConnectors(updater);
  };

  const handleConnectNewSource = (sourceType: string, scope: 'organization' | 'personal', name: string) => {
    const newId = `conn_${sourceType}_${Date.now()}`;
    const newItem: ConnectorItem = {
      id: newId,
      type: sourceType,
      name: name,
      subtitle: scope === 'personal' ? 'My connected account' : undefined,
      scope: scope,
      status: 'connected',
      access: scope === 'organization' ? 'Engineering' : 'Private to you',
      resourceCountText: 'Connected (Initial sync in progress)',
      lastSyncText: 'Just now',
      connected: true,
      resourceCount: 1,
    };

    if (scope === 'organization') {
      setOrgConnectors((prev) => [newItem, ...prev]);
      setActiveScope('organization');
    } else {
      setPersonalConnectors((prev) => [newItem, ...prev]);
      setActiveScope('personal');
    }

    setSelectedConnectorId(newId);
  };

  return (
    <div
      id="connectors-workspace-view"
      className="flex-1 h-screen flex flex-col bg-[#FAFAF9] dark:bg-[#0C0D0E] text-[#18181B] dark:text-[#EDEDED] overflow-hidden"
    >
      {/* 1. Global Page Header */}
      <header className="px-8 pt-8 pb-6 border-b border-neutral-200/70 dark:border-neutral-800/80 bg-white/70 dark:bg-[#0E0F12]/70 backdrop-blur-md shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Connectors
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl leading-relaxed">
            Manage the sources AUREN can use for your organization and your personal workspace.
          </p>
        </div>

        {/* Top-right: + Connect source */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            onClick={() => setIsConnectModalOpen(true)}
            className="text-xs font-semibold px-4 py-2 bg-neutral-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 rounded-xl shadow-xs cursor-pointer"
          >
            Connect source
          </Button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-7 flex flex-col gap-6">
          {/* 2. THE MOST IMPORTANT CONTROL: [ Organization ] [ Personal ] */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div className="flex items-center gap-4">
              <div
                id="scope-segmented-control"
                className="inline-flex p-1 bg-neutral-200/60 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl"
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveScope('organization');
                    setSelectedConnectorId('conn_github_org');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeScope === 'organization'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Organization</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveScope('personal');
                    setSelectedConnectorId('conn_github_personal');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeScope === 'personal'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Personal</span>
                </button>
              </div>

              {/* Scope Explanatory Text */}
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {activeScope === 'organization'
                  ? 'Shared with your authorized team'
                  : 'Only available to you'}
              </span>
            </div>
          </div>

          {/* 3. Section Title & Description */}
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
              {activeScope === 'organization' ? 'Organization connections' : 'Personal connections'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {activeScope === 'organization'
                ? 'Knowledge sources shared with people in your authorized organization.'
                : 'Sources connected to your personal AUREN workspace. Only available to you.'}
            </p>
          </div>

          {/* 4. Refined Table/List Layout */}
          <div className="border border-neutral-200/80 dark:border-neutral-800 rounded-2xl bg-white dark:bg-[#111215] overflow-hidden shadow-2xs">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              <div className="col-span-4 sm:col-span-3">SOURCE</div>
              <div className="col-span-3 sm:col-span-2">STATUS</div>
              <div className="col-span-3 sm:col-span-2">ACCESS</div>
              <div className="hidden sm:block sm:col-span-3">RESOURCES</div>
              <div className="hidden sm:block sm:col-span-1">LAST SYNC</div>
              <div className="col-span-2 sm:col-span-1 text-right">ACTION</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {currentList.map((item) => {
                const isSelected = selectedConnectorId === item.id;
                const isConnected = item.status === 'connected';
                const isNeedsAttention = item.status === 'needs_attention';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectRow(item)}
                    className={`grid grid-cols-12 items-center px-6 py-4 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-50 dark:bg-neutral-800/50'
                        : 'hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30'
                    }`}
                  >
                    {/* SOURCE Column */}
                    <div className="col-span-4 sm:col-span-3 flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-center shrink-0">
                        <PlatformIcon platform={item.type} className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-neutral-900 dark:text-white truncate">
                          {item.name}
                        </span>
                        {item.subtitle && (
                          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* STATUS Column */}
                    <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                      {isNeedsAttention ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                          <span className="text-neutral-700 dark:text-neutral-300 truncate">
                            Needs attention
                          </span>
                        </>
                      ) : isConnected ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-neutral-700 dark:text-neutral-300 truncate">
                            Connected
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 shrink-0" />
                          <span className="text-neutral-400 dark:text-neutral-500 truncate">
                            Not connected
                          </span>
                        </>
                      )}
                    </div>

                    {/* ACCESS Column */}
                    <div className="col-span-3 sm:col-span-2 text-neutral-600 dark:text-neutral-400 truncate pr-2">
                      {item.access || '—'}
                    </div>

                    {/* RESOURCES Column */}
                    <div className="hidden sm:block sm:col-span-3 text-neutral-600 dark:text-neutral-400 truncate pr-2">
                      {item.resourceCountText || '—'}
                    </div>

                    {/* LAST SYNC Column */}
                    <div className="hidden sm:block sm:col-span-1 text-neutral-500 dark:text-neutral-400 truncate">
                      {item.lastSyncText || '—'}
                    </div>

                    {/* ACTION Column */}
                    <div className="col-span-2 sm:col-span-1 text-right">
                      {isConnected ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRow(item);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsConnectModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 dark:text-white hover:underline transition-colors cursor-pointer"
                        >
                          <span>Connect</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Context Notice for Personal vs Org */}
          {activeScope === 'personal' && (
            <div className="p-4 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800 flex items-start gap-3">
              <Lock className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  Personal Isolation Guarantee
                </span>
                <span>
                  Personal connectors are completely isolated to your private account. Other members of your organization and department cannot query, ground, or view your private sources.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connect Source Modal */}
      <ConnectSourceModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        defaultScope={activeScope}
        onConnectSource={handleConnectNewSource}
      />

      {/* Manage Repositories Modal (GitHub) */}
      <ManageRepositoriesModal
        connector={activeModalConnector || currentDrawerConnector}
        isOpen={isRepositoriesModalOpen}
        onClose={() => setIsRepositoriesModalOpen(false)}
        onSave={(repoIds) => {
          const count = repoIds.length;
          setOrgConnectors((prev) =>
            prev.map((c) =>
              c.type === 'github'
                ? { ...c, resourceCountText: `${count} repositories`, resourceCount: count }
                : c
            )
          );
        }}
      />

      {/* Manage Access Modal */}
      <ManageAccessModal
        connector={activeModalConnector || currentDrawerConnector}
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        onSave={(connId, policy) => {
          if (onUpdatePolicy) {
            onUpdatePolicy(connId, policy as ConnectorPolicy);
          }
        }}
      />
    </div>
  );
};
