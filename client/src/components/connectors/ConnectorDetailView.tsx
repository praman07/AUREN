import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Shield,
  Clock,
  Search,
  MessageSquare,
  Radio,
  FileCode,
  Check,
  Sparkles,
  Database,
  FileText,
} from 'lucide-react';
import type { Connector, ConnectorDataItem, ConnectorPolicy } from '../../types';
import { PlatformIcon } from '../ui/PlatformIcons';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { ConnectorDetailModal } from '../library/ConnectorDetailModal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

interface ConnectorDetailViewProps {
  connectorId: string;
  backPageName?: string;
  onBack: () => void;
  onAskAuren?: (item: ConnectorDataItem) => void;
  onSyncConnector?: (id: string) => Promise<void>;
  onUpdatePolicy?: (id: string, policy: ConnectorPolicy) => Promise<void>;
}

export const ConnectorDetailView: React.FC<ConnectorDetailViewProps> = ({
  connectorId,
  backPageName = 'Connectors',
  onBack,
  onAskAuren,
  onSyncConnector,
  onUpdatePolicy,
}) => {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'resources' | 'access' | 'webhooks' | 'history'>('resources');
  const [connector, setConnector] = useState<Connector | null>(null);
  const [items, setItems] = useState<ConnectorDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ConnectorDataItem | null>(null);

  // Policy state for Department Head governance
  const [allowAllOrg, setAllowAllOrg] = useState(true);
  const [allowedDepartments, setAllowedDepartments] = useState<string[]>(['Core Architecture', 'Platform Engineering']);
  const [isPolicySaving, setIsPolicySaving] = useState(false);
  const [policySavedFeedback, setPolicySavedFeedback] = useState(false);

  // Load connector metadata and its specific items
  useEffect(() => {
    let isMounted = true;

    async function loadDetails() {
      setIsLoading(true);
      try {
        const [allConnectors, connectorItems] = await Promise.all([
          api.getConnectors(),
          api.getConnectorData({ connectorId: connectorId !== 'all' ? connectorId : undefined }),
        ]);

        if (!isMounted) return;

        const found = allConnectors.find((c) => c.id === connectorId) || allConnectors[0];
        if (found) {
          setConnector(found);
          setAllowAllOrg(found.policy?.allowAllOrg ?? (found.scope === 'organization'));
          setAllowedDepartments(found.policy?.allowedDepartments ?? ['Core Architecture', 'Platform Engineering']);
        }

        // Filter items specific to this connector
        const matchedItems = connectorItems.filter(
          (item) => item.connectorId === connectorId || (found && item.connectorType === found.type)
        );
        setItems(matchedItems);
      } catch (err) {
        console.error('Failed to load connector details:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [connectorId]);

  // Trigger sync for this connector
  const handleSyncNow = async () => {
    if (!connector) return;
    setIsSyncing(true);
    try {
      if (onSyncConnector) {
        await onSyncConnector(connector.id);
      } else {
        await api.syncConnector(connector.id);
      }
      addNotification({
        type: 'connector_connected',
        title: `${connector.name} Synchronized`,
        description: `Successfully re-indexed and refreshed knowledge embeddings for ${connector.name}.`,
      });
      // Refresh items
      const updatedItems = await api.getConnectorData({ connectorId: connector.id });
      setItems(updatedItems.filter((i) => i.connectorId === connector.id));
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save Department Head Policy
  const handleSavePolicy = async () => {
    if (!connector) return;
    setIsPolicySaving(true);
    try {
      const updatedPolicy: ConnectorPolicy = {
        ...connector.policy,
        allowAllOrg,
        allowedDepartments,
      };

      if (onUpdatePolicy) {
        await onUpdatePolicy(connector.id, updatedPolicy);
      } else {
        await api.updateConnectorPolicy(connector.id, updatedPolicy);
      }

      setPolicySavedFeedback(true);
      setTimeout(() => setPolicySavedFeedback(false), 3000);

      addNotification({
        type: 'permission_updated',
        title: 'Connector Access Policy Updated',
        description: `Permissions for ${connector.name} updated: ${allowAllOrg ? 'Entire Organization' : allowedDepartments.join(', ')}.`,
      });
    } catch (err) {
      console.error('Failed to save policy:', err);
    } finally {
      setIsPolicySaving(false);
    }
  };

  const toggleDepartment = (dept: string) => {
    setAllowedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  // Filter items by search & type
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.itemType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inParent = item.parentGroup.toLowerCase().includes(q);
        const inPath = item.nestedPath?.toLowerCase().includes(q);
        const inSummary = item.summary.toLowerCase().includes(q);
        if (!inTitle && !inParent && !inPath && !inSummary) return false;
      }
      return true;
    });
  }, [items, searchQuery, typeFilter]);

  if (isLoading && !connector) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-24 text-neutral-400">
        <RefreshCw className="w-5 h-5 animate-spin mb-2" />
        <span className="text-xs font-mono">Loading connector telemetry & resources...</span>
      </div>
    );
  }

  const conn = connector || {
    id: connectorId,
    type: 'github' as const,
    name: 'GitHub Enterprise',
    scope: 'organization' as const,
    connected: true,
    resourceCount: items.length || 48,
    status: 'active' as const,
    lastSyncAt: '5 min ago',
    account: 'auren-ai/enterprise',
    policy: {
      allowedUsers: [],
      allowedRoles: ['engineer' as const, 'lead' as const],
      allowedDepartments: ['Core Architecture', 'Platform Engineering'],
      allowAllOrg: true,
    },
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6">
      {/* Top Header with Back Routing Button: < {name of back page} */}
      <div className="flex flex-col gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer group py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>&lt; {backPageName}</span>
          </button>
        </div>

        {/* Connector Identity Card & Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-[#111215] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-center shrink-0 shadow-2xs">
              <PlatformIcon platform={conn.type} className="w-6 h-6" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  {conn.name}
                </h1>
                <Badge scope={conn.scope} size="xs" />
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{conn.status === 'active' || conn.connected ? 'Active & Healthy' : 'Needs Attention'}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="font-mono text-[11px] truncate">
                  {conn.account || `${conn.type}.internal/workspace`}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span>Last synced {conn.lastSyncAt || 'just now'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-500' : ''}`} />}
              onClick={handleSyncNow}
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Re-sync Now'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={() => {
                if (onAskAuren && items[0]) {
                  onAskAuren(items[0]);
                } else {
                  window.location.hash = '#chat';
                }
              }}
            >
              Ask AUREN
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#111215] border border-neutral-200/70 dark:border-neutral-800 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Synced Resources</span>
          <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
            {items.length || conn.resourceCount}
          </span>
          <span className="text-[10px] text-neutral-500">Across all nested trees</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#111215] border border-neutral-200/70 dark:border-neutral-800 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Ingestion Health</span>
          <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            100%
          </span>
          <span className="text-[10px] text-neutral-500">Sub-second vector lookup</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#111215] border border-neutral-200/70 dark:border-neutral-800 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Access Scope</span>
          <span className="text-xl font-bold text-neutral-900 dark:text-white truncate">
            {allowAllOrg ? 'Entire Org' : `${allowedDepartments.length} Depts`}
          </span>
          <span className="text-[10px] text-neutral-500">Controlled by Dept Head</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#111215] border border-neutral-200/70 dark:border-neutral-800 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Webhook Realtime</span>
          <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
            Active
          </span>
          <span className="text-[10px] text-neutral-500">Live delta sync on push</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-neutral-200/70 dark:border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'resources'
              ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Ingested Resources</span>
          <span className="text-[10px] font-mono opacity-70">({items.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('access')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'access'
              ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Department Access & Governance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'webhooks'
              ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Webhooks & Telemetry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Sync History</span>
        </button>
      </div>

      {/* TAB 1: Ingested Resources Explorer */}
      {activeTab === 'resources' && (
        <div className="flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${conn.name} resources...`}
                  className="w-56 sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-[#16171B] border border-neutral-200/60 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#16171B] border border-neutral-200/60 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Resource Types</option>
                <option value="repository">Repositories</option>
                <option value="pull_request">Pull Requests</option>
                <option value="file">Files & Code</option>
                <option value="document">Documents</option>
                <option value="page">Pages</option>
                <option value="issue">Issues</option>
                <option value="message">Messages</option>
              </select>
            </div>

            <span className="text-xs text-neutral-400">
              Showing {filteredItems.length} of {items.length} items
            </span>
          </div>

          {/* Resources Table */}
          <div className="border border-neutral-200/80 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#111215] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50/50 dark:bg-[#141518]/50">
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Parent Group / Path</th>
                    <th className="py-3 px-3">Author / Maintainer</th>
                    <th className="py-3 px-3">Synced</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400">
                        No resources found matching current search.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-neutral-50/80 dark:hover:bg-[#17181C]/60 transition-colors group cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        {/* Title */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5 max-w-sm">
                            <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                              {item.itemType === 'repository' || item.itemType === 'file' ? (
                                <FileCode className="w-3.5 h-3.5" />
                              ) : (
                                <FileText className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-neutral-900 dark:text-white truncate group-hover:underline">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-neutral-400 truncate font-mono">
                                {item.nestedPath || item.parentGroup} {item.sizeOrCount ? `• ${item.sizeOrCount}` : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {item.itemType.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Parent Group */}
                        <td className="py-3 px-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                          {item.parentGroup}
                        </td>

                        {/* Author */}
                        <td className="py-3 px-3 whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                          {item.author}
                        </td>

                        {/* Synced */}
                        <td className="py-3 px-3 whitespace-nowrap text-neutral-400 font-mono text-[11px]">
                          {item.syncedAt}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3 h-3" />
                            <span>Synced</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (onAskAuren) onAskAuren(item);
                                else {
                                  window.location.hash = '#chat';
                                }
                              }}
                              className="px-2 py-1 rounded text-xs font-medium text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Ask AUREN"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span className="hidden sm:inline">Ask</span>
                            </button>

                            {item.externalUrl && (
                              <a
                                href={item.externalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                title="Open Source"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Department Head Access Governance */}
      {activeTab === 'access' && (
        <div className="flex flex-col gap-6 max-w-4xl">
          <div className="p-5 sm:p-6 bg-white dark:bg-[#111215] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xs flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Department Head Access Governance
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Decide which departments can ground knowledge with this {conn.name} instance.
              </p>
            </div>

            {/* Radio / Toggle between Org-wide vs Restricted */}
            <div className="flex flex-col gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 hover:bg-neutral-50/50 dark:hover:bg-[#16171B]/50 cursor-pointer">
                <input
                  type="radio"
                  name="accessMode"
                  checked={allowAllOrg}
                  onChange={() => setAllowAllOrg(true)}
                  className="mt-0.5 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Allow Entire Organization
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    All authorized company members can ask questions and query data from this connector.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 hover:bg-neutral-50/50 dark:hover:bg-[#16171B]/50 cursor-pointer">
                <input
                  type="radio"
                  name="accessMode"
                  checked={!allowAllOrg}
                  onChange={() => setAllowAllOrg(false)}
                  className="mt-0.5 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Restrict to Specific Departments
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Only selected departments and their authorized subgroups can access this connector's knowledge.
                  </span>
                </div>
              </label>
            </div>

            {/* Department Checkbox List */}
            {!allowAllOrg && (
              <div className="flex flex-col gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Authorized Departments:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Core Architecture',
                    'Platform Engineering',
                    'Security & Compliance',
                    'Product & Design',
                    'QA & Infrastructure',
                  ].map((dept) => {
                    const isChecked = allowedDepartments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => toggleDepartment(dept)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-colors text-left cursor-pointer ${
                          isChecked
                            ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-400 dark:border-neutral-600 text-neutral-900 dark:text-white'
                            : 'bg-transparent border-neutral-200/80 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <span>{dept}</span>
                        {isChecked && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-xs text-neutral-400">
                {policySavedFeedback && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Policy updated and active in real time!
                  </span>
                )}
              </span>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSavePolicy}
                disabled={isPolicySaving}
              >
                {isPolicySaving ? 'Saving Policy...' : 'Save Department Policy'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Webhooks & Telemetry */}
      {activeTab === 'webhooks' && (
        <div className="flex flex-col gap-4 max-w-4xl">
          <div className="p-5 sm:p-6 bg-white dark:bg-[#111215] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xs flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Webhook Configuration & Event Stream
            </h3>

            <div className="p-3 bg-neutral-50 dark:bg-[#16171B] rounded-xl border border-neutral-200/60 dark:border-neutral-800 font-mono text-xs flex flex-col gap-1.5">
              <span className="text-neutral-400 text-[10px] uppercase">Listener Endpoint</span>
              <span className="text-neutral-800 dark:text-neutral-200 select-all">
                https://api.auren.internal/v1/connectors/{conn.id}/webhook
              </span>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Recent Ingestion Events
              </span>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 border border-neutral-200/60 dark:border-neutral-800 rounded-xl overflow-hidden text-xs">
                {[
                  {
                    event: 'push / commit_sync',
                    details: 'Branch main updated with 4 files in retrieval-service',
                    time: '3 min ago',
                    status: 'success',
                  },
                  {
                    event: 'pull_request.merged',
                    details: 'PR #108 merged into develop by Praman Singh Bhogal',
                    time: '14 min ago',
                    status: 'success',
                  },
                  {
                    event: 'delta_index_completed',
                    details: '14 Qdrant payload vectors inserted into org vault',
                    time: '15 min ago',
                    status: 'success',
                  },
                ].map((ev, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                          {ev.event}
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{ev.details}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono">{ev.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Sync History */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-4 max-w-4xl">
          <div className="p-5 sm:p-6 bg-white dark:bg-[#111215] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xs flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Historical Synchronization Logs
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { time: 'Today at 10:48 AM', author: 'Automatic Webhook', changes: '4 updated items, 0 deleted' },
                { time: 'Today at 09:30 AM', author: 'Praman Singh Bhogal', changes: 'Manual full re-index' },
                { time: 'Yesterday at 06:12 PM', author: 'Scheduled Sync', changes: '12 new pull requests indexed' },
                { time: 'Sep 6, 2026', author: 'System Ingestion', changes: 'Initial connector setup and vault partition' },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50/60 dark:bg-[#16171B]/60 text-xs border border-neutral-200/40 dark:border-neutral-800/40">
                  <div className="flex flex-col">
                    <span className="font-semibold text-neutral-900 dark:text-white">{log.changes}</span>
                    <span className="text-[11px] text-neutral-400">Triggered by {log.author}</span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-400">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal for inspecting individual resources */}
      <ConnectorDetailModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onAskAuren={(item) => {
          if (onAskAuren) onAskAuren(item);
          else {
            window.location.hash = '#chat';
          }
        }}
      />
    </div>
  );
};
