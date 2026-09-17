import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Folder,
  GitPullRequest,
  FileCode,
  FileText,
  Mail,
  CheckSquare,
  Hash,
  Database,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Layers,
  List,
} from 'lucide-react';
import type { ConnectorDataItem, ConnectorItemType, Scope, Connector } from '../../types';
import { PlatformIcon } from '../ui/PlatformIcons';
import { Badge } from '../ui/Badge';
import { api } from '../../services/api';

import { ConnectorDetailModal } from './ConnectorDetailModal';

interface ConnectorDataViewProps {
  connectors: Connector[];
  onAskAuren: (item: ConnectorDataItem) => void;
  onOpenConnectorDetail?: (connectorId: string, backPage?: string) => void;
  activeScope: Scope;
  onScopeChange: (scope: Scope) => void;
}

interface NestedConnectorGroup {
  connector: Connector | { id: string; name: string; type: any; scope: 'personal' | 'organization' };
  parentGroups: Record<string, ConnectorDataItem[]>;
  totalCount: number;
}

export const ConnectorDataView: React.FC<ConnectorDataViewProps> = ({
  connectors,
  onAskAuren,
  onOpenConnectorDetail,
  activeScope,
  onScopeChange,
}) => {
  const [items, setItems] = useState<ConnectorDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ConnectorDataItem | null>(null);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus] = useState<string>('all');

  const [sortBy, setSortBy] = useState<string>('synced_desc');
  const [viewMode, setViewMode] = useState<'nested' | 'flat'>('nested');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({});

  // Load connector data from server
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getConnectorData({
        scope: activeScope,
        connectorId: selectedConnectorId,
        search: searchQuery,
        type: selectedType,
        status: selectedStatus,
        sort: sortBy,
      });
      setItems(data);
    } catch (err) {
      console.error('Failed to load connector data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeScope, selectedConnectorId, selectedType, selectedStatus, sortBy]);

  // Handle single item sync
  const handleSyncItem = async (itemId: string) => {
    setSyncingIds((prev) => ({ ...prev, [itemId]: true }));
    try {
      const res = await api.syncConnectorItem(itemId);
      if (res.success && res.item) {
        setItems((prev) => prev.map((item) => (item.id === itemId ? res.item : item)));
        if (selectedItem && selectedItem.id === itemId) {
          setSelectedItem(res.item);
        }
      }
    } catch (err) {
      console.error('Failed to sync item:', err);
    } finally {
      setTimeout(() => {
        setSyncingIds((prev) => ({ ...prev, [itemId]: false }));
      }, 800);
    }
  };

  // Toggle collapse state for nested groups
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Filter items in-memory for instant search responsiveness
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchParent = item.parentGroup.toLowerCase().includes(q);
      const matchPath = (item.nestedPath || '').toLowerCase().includes(q);
      const matchAuthor = item.author.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      const matchTags = item.tags?.some((t) => t.toLowerCase().includes(q));
      const matchMeta =
        item.metadata?.commitSha?.toLowerCase().includes(q) ||
        item.metadata?.issueKey?.toLowerCase().includes(q);
      return matchTitle || matchParent || matchPath || matchAuthor || matchSummary || matchTags || matchMeta;
    });
  }, [items, searchQuery]);

  // Nested grouping by Connector and then ParentGroup
  const nestedGroups = useMemo(() => {
    const groups: Record<string, NestedConnectorGroup> = {};

    filteredItems.forEach((item) => {
      if (!groups[item.connectorId]) {
        const foundConn = connectors.find((c) => c.id === item.connectorId) || {
          id: item.connectorId,
          name: item.connectorName,
          type: item.connectorType,
          scope: item.scope,
        };
        groups[item.connectorId] = {
          connector: foundConn,
          parentGroups: {},
          totalCount: 0,
        };
      }

      groups[item.connectorId].totalCount += 1;

      if (!groups[item.connectorId].parentGroups[item.parentGroup]) {
        groups[item.connectorId].parentGroups[item.parentGroup] = [];
      }
      groups[item.connectorId].parentGroups[item.parentGroup].push(item);
    });

    return groups;
  }, [filteredItems, connectors]);

  // Helper for item type icon
  const renderItemIcon = (type: ConnectorItemType) => {
    switch (type) {
      case 'repository':
        return <Folder className="w-3.5 h-3.5 text-neutral-500" />;
      case 'pull_request':
        return <GitPullRequest className="w-3.5 h-3.5 text-purple-500" />;
      case 'file':
        return <FileCode className="w-3.5 h-3.5 text-blue-500" />;
      case 'document':
      case 'page':
        return <FileText className="w-3.5 h-3.5 text-emerald-500" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-amber-500" />;
      case 'issue':
        return <CheckSquare className="w-3.5 h-3.5 text-orange-500" />;
      case 'message':
        return <Hash className="w-3.5 h-3.5 text-pink-500" />;
      default:
        return <Database className="w-3.5 h-3.5 text-neutral-500" />;
    }
  };

  // Scope counts for connector items
  const personalCount = items.filter((i) => i.scope === 'personal').length;
  const orgCount = items.filter((i) => i.scope === 'organization').length;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Scope & Primary Connector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/60 dark:border-neutral-800/80">
        {/* Scope Tabs: All / Personal / Organization */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onScopeChange('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize ${
              activeScope === 'all'
                ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <span>All Sources</span>
            <span className="text-[10px] opacity-70 font-mono">({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onScopeChange('personal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize ${
              activeScope === 'personal'
                ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Personal</span>
            <span className="text-[10px] opacity-70 font-mono">({personalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onScopeChange('organization')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize ${
              activeScope === 'organization'
                ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Organization</span>
            <span className="text-[10px] opacity-70 font-mono">({orgCount})</span>
          </button>
        </div>

        {/* View Mode Switcher (Nested Hierarchy vs Flat Table) */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-[#16171A] p-0.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800/80">
          <button
            type="button"
            onClick={() => setViewMode('nested')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'nested'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
            title="View grouped by source connector and repositories/folders"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Nested View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('flat')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'flat'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
            title="View flat structured table of all synced resources"
          >
            <List className="w-3.5 h-3.5" />
            <span>Flat Table</span>
          </button>
        </div>
      </div>

      {/* 2. Nested Connector Pill Filter (Filter by specific connector) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider shrink-0 mr-1">
          Filter Connector:
        </span>

        <button
          type="button"
          onClick={() => setSelectedConnectorId('all')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            selectedConnectorId === 'all'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold'
              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          All Connectors
        </button>

        {connectors.map((c) => {
          const isSelected = selectedConnectorId === c.id;
          const matchCount = items.filter((i) => i.connectorId === c.id).length;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedConnectorId(c.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold'
                  : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <PlatformIcon platform={c.type} className="w-3.5 h-3.5" />
              <span>{c.name}</span>
              <span className="text-[10px] opacity-70 font-mono">({matchCount})</span>
            </button>
          );
        })}
      </div>

      {/* 3. Toolbar: Search Input, Type Filter, Sort Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search synced files, PRs, issues, notes, commit SHAs..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-[#16171B] border border-neutral-200/60 dark:border-neutral-800/80 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
        </div>

        {/* Filters and Sorting */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Resource Type Dropdown */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-neutral-400 hidden sm:inline text-[11px]">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#16171B] border border-neutral-200/60 dark:border-neutral-800/80 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Resource Types</option>
              <option value="repository">Repositories</option>
              <option value="pull_request">Pull Requests</option>
              <option value="file">Code & Files</option>
              <option value="document">Documents & Specs</option>
              <option value="page">Pages & Notes</option>
              <option value="email">Emails</option>
              <option value="issue">Issues & Tickets</option>
              <option value="message">Slack Messages</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-neutral-400 hidden sm:inline text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#16171B] border border-neutral-200/60 dark:border-neutral-800/80 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="synced_desc">Recently Synced</option>
              <option value="synced_asc">Oldest Synced</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
              <option value="connector">Connector Source</option>
              <option value="type">Resource Type</option>
            </select>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={loadData}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Refresh connector resources"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Main Content Area: Nested Hierarchy or Flat Table */}
      {filteredItems.length === 0 ? (
        <div className="w-full bg-white dark:bg-[#141518] border border-neutral-200/70 dark:border-neutral-800/80 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-2">
          <Database className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            No connector resources found
          </h3>
          <p className="text-xs text-neutral-400 max-w-sm">
            {searchQuery
              ? `No synced resources matching "${searchQuery}". Try clearing filters.`
              : 'No resources ingested for this scope and connector. Connect sources in the Connectors view.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs text-neutral-900 dark:text-neutral-100 font-medium underline cursor-pointer"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : viewMode === 'nested' ? (
        /* --- NESTED HIERARCHICAL VIEW --- */
        <div className="flex flex-col gap-4">
          {(Object.entries(nestedGroups) as [string, NestedConnectorGroup][]).map(([connId, group]) => {
            const isCollapsed = Boolean(collapsedGroups[connId]);
            return (
              <div
                key={connId}
                className="bg-white dark:bg-[#141518] border border-neutral-200/70 dark:border-neutral-800/80 rounded-xl overflow-hidden shadow-2xs"
              >
                {/* Connector Group Header */}
                <div
                  onClick={() => toggleGroupCollapse(connId)}
                  className="flex items-center justify-between p-3.5 sm:px-4 bg-neutral-50/70 dark:bg-[#111215]/70 border-b border-neutral-200/50 dark:border-neutral-800/60 cursor-pointer hover:bg-neutral-100/60 dark:hover:bg-[#17181C] transition-colors select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <PlatformIcon platform={group.connector.type} className="w-4 h-4 shrink-0" />
                    <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100">
                      {group.connector.name}
                    </span>
                    <Badge scope={group.connector.scope} size="xs" />
                    <span className="text-[11px] text-neutral-400 font-mono">
                      ({group.totalCount} {group.totalCount === 1 ? 'item' : 'items'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] text-neutral-400 hidden sm:inline">
                      {Object.keys(group.parentGroups).length} nested groups
                    </span>
                    {onOpenConnectorDetail && (
                      <button
                        type="button"
                        onClick={() => onOpenConnectorDetail(group.connector.id, 'Knowledge Library')}
                        className="px-2 py-1 rounded text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Open full-screen connector detail view"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Nested Content */}
                {!isCollapsed && (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    {(Object.entries(group.parentGroups) as [string, ConnectorDataItem[]][]).map(([parentName, groupItems]) => (
                      <div key={parentName} className="p-3 sm:px-4 flex flex-col gap-2">
                        {/* Nested Sub-group Title (e.g., Repository or Folder Name) */}
                        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                          <Folder className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                            {parentName}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            • {groupItems.length} resources
                          </span>
                        </div>

                        {/* List of items under this parent group */}
                        <div className="flex flex-col gap-1.5 pl-5 sm:pl-6 border-l border-neutral-200/50 dark:border-neutral-800/60 ml-2 mt-1">
                          {groupItems.map((item) => {
                            const isSyncing = syncingIds[item.id];
                            return (
                              <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-[#18191D] transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 shrink-0">
                                    {renderItemIcon(item.itemType)}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-xs text-neutral-900 dark:text-neutral-100 truncate group-hover:text-neutral-900 dark:group-hover:text-white">
                                        {item.title}
                                      </span>
                                      {item.metadata?.commitSha && (
                                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1 rounded">
                                          {item.metadata.commitSha}
                                        </span>
                                      )}
                                      {item.metadata?.issueKey && (
                                        <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1 rounded">
                                          {item.metadata.issueKey}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono truncate">
                                      <span>{item.author}</span>
                                      <span>•</span>
                                      <span>{item.nestedPath || item.parentGroup}</span>
                                      {item.sizeOrCount && (
                                        <>
                                          <span>•</span>
                                          <span>{item.sizeOrCount}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Item Quick Actions */}
                                <div
                                  className="flex items-center gap-1.5 shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="text-[11px] font-mono text-neutral-400 hidden md:inline">
                                    {new Date(item.syncedAt).toLocaleDateString([], {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleSyncItem(item.id)}
                                    className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                    title="Sync resource"
                                  >
                                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-neutral-900 dark:text-white' : ''}`} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onAskAuren(item)}
                                    className="px-2 py-0.5 rounded text-xs font-medium text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    title="Ask AUREN about this resource"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    <span className="hidden sm:inline">Ask</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* --- FLAT STRUCTURED TABLE VIEW --- */
        <div className="w-full bg-white dark:bg-[#141518] border border-neutral-200/70 dark:border-neutral-800/80 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50/50 dark:bg-[#111215]/50">
                  <th className="py-3 px-4">Resource & Path</th>
                  <th className="py-3 px-3">Connector</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Scope</th>
                  <th className="py-3 px-3">Author</th>
                  <th className="py-3 px-3">Synced</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {filteredItems.map((item) => {
                  const isSyncing = syncingIds[item.id];
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-neutral-50/80 dark:hover:bg-[#191A1E]/60 transition-colors group cursor-pointer"
                    >
                      {/* Resource Name & Path */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 max-w-sm sm:max-w-md">
                          <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                            {renderItemIcon(item.itemType)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate group-hover:text-neutral-900 dark:group-hover:text-white">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-neutral-400 truncate font-mono">
                              {item.parentGroup} {item.nestedPath ? `• ${item.nestedPath}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Connector Source */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <PlatformIcon platform={item.connectorType} className="w-3.5 h-3.5" />
                          <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                            {item.connectorName}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono capitalize bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {item.itemType.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Scope */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge scope={item.scope} size="xs" />
                      </td>

                      {/* Author */}
                      <td className="py-3 px-3 whitespace-nowrap text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                        {item.author}
                      </td>

                      {/* Synced Date */}
                      <td className="py-3 px-3 whitespace-nowrap text-neutral-400 font-mono text-[11px]">
                        {new Date(item.syncedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Synced</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleSyncItem(item.id)}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            title="Sync resource"
                          >
                            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-neutral-900 dark:text-white' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onAskAuren(item)}
                            className="px-2 py-1 rounded text-xs font-medium text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Ask AUREN about this resource"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span className="hidden sm:inline">Ask</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Inspection Modal */}
      <ConnectorDetailModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onAskAuren={onAskAuren}
        onSyncItem={handleSyncItem}
      />
    </div>
  );
};
