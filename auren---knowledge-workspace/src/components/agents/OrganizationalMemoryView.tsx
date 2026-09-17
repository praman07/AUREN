import React, { useState } from 'react';
import {
  Share2,
  FileText,
  MessageSquare,
  Video,
  Scale,
  ListTodo,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  Bot,
  Calendar,
  Layers,
  Network,
} from 'lucide-react';
import { OrganizationalMemoryTrace, OrganizationalMemoryNode } from '../../types/agents';
import {
  MOCK_ORGANIZATIONAL_MEMORY_TRACES,
  getOrganizationalMemoryTrace,
} from '../../services/agentData';
import { AurenDocument } from '../../types';
import { Button } from '../ui/Button';

interface OrganizationalMemoryViewProps {
  documents: AurenDocument[];
  onOpenDocument?: (doc: AurenDocument) => void;
  onOpenMeeting?: (meetingId: string) => void;
  onOpenDecision?: (decisionId: string) => void;
  onOpenChannel?: (channelId: string) => void;
  onAskAuren?: (prompt: string) => void;
}

export const OrganizationalMemoryView: React.FC<OrganizationalMemoryViewProps> = ({
  documents,
  onOpenDocument,
  onOpenMeeting,
  onOpenDecision,
  onOpenChannel,
  onAskAuren,
}) => {
  const traces = Object.values(MOCK_ORGANIZATIONAL_MEMORY_TRACES);
  const [selectedTraceId, setSelectedTraceId] = useState<string>(traces[0]?.id || 'trace_dec_001');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentTrace: OrganizationalMemoryTrace | undefined =
    MOCK_ORGANIZATIONAL_MEMORY_TRACES[selectedTraceId] || traces[0] || Object.values(MOCK_ORGANIZATIONAL_MEMORY_TRACES)[0];

  const selectedNode = currentTrace?.nodes?.find((n) => n.id === selectedNodeId) || currentTrace?.nodes?.[0] || null;

  const filteredNodes = (currentTrace?.nodes || []).filter((node) => {
    if (filterType !== 'all' && node.type !== filterType) return false;
    if (
      searchQuery &&
      !node.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !node.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getNodeIcon = (type: OrganizationalMemoryNode['type']) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'thread':
      case 'message':
        return <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'meeting':
        return <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'decision':
        return <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'action_item':
        return <ListTodo className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'policy':
        return <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getNodeTypeBadge = (type: OrganizationalMemoryNode['type']) => {
    switch (type) {
      case 'document':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Document
          </span>
        );
      case 'thread':
      case 'message':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Channel Thread
          </span>
        );
      case 'meeting':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Meeting
          </span>
        );
      case 'decision':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Ratified Decision
          </span>
        );
      case 'action_item':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Action Item
          </span>
        );
      case 'policy':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Policy
          </span>
        );
    }
  };

  const handleOpenSourceArtifact = (node: OrganizationalMemoryNode) => {
    if (node.type === 'document') {
      const doc = documents.find((d) => d.id === node.referenceId);
      if (doc && onOpenDocument) onOpenDocument(doc);
    } else if (node.type === 'meeting') {
      onOpenMeeting?.(node.referenceId);
    } else if (node.type === 'decision') {
      onOpenDecision?.(node.referenceId);
    } else if (node.type === 'thread' || node.type === 'message') {
      onOpenChannel?.('dept_arch_general');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Network className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                AUREN Organizational Memory
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Cross-Artifact Lineage & Decision Evolution
              </span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Organizational Knowledge Lineage Graph
            </h1>
          </div>

          {onAskAuren && (
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                onAskAuren(
                  `Explain the historical evolution of "${currentTrace.title}". How did early team discussions transform into our approved production architecture?`
                )
              }
              icon={<Bot className="w-3.5 h-3.5" />}
            >
              Ask AUREN About This Lineage
            </Button>
          )}
        </div>

        {/* Trace Selection Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Active Memory Trace:
            </span>
            <select
              value={selectedTraceId}
              onChange={(e) => {
                setSelectedTraceId(e.target.value);
                setSelectedNodeId(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-400"
            >
              {traces.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            <span>{currentTrace.nodes.length} connected artifacts</span>
            <span>•</span>
            <span>{currentTrace.connections.length} causal links</span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {currentTrace.description}
        </p>
      </div>

      {/* Main Interactive Stage: Trace Graph + Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline / Lineage List */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter lineage nodes..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-400"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'document', 'thread', 'meeting', 'decision', 'action_item'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors capitalize ${
                    filterType === t
                      ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-bold'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Sequential Memory Flow */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-purple-400 before:via-blue-400 before:to-emerald-400">
            {filteredNodes.map((node, index) => {
              const isSelected = selectedNodeId === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-400 dark:border-purple-600 shadow-md ring-1 ring-purple-400/30'
                      : 'bg-neutral-50/80 dark:bg-[#161922] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  {/* Step Marker */}
                  <div
                    className={`absolute -left-[30px] top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      isSelected
                        ? 'bg-purple-600 border-white text-white'
                        : 'bg-white dark:bg-[#12141A] border-purple-400 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getNodeIcon(node.type)}
                        {getNodeTypeBadge(node.type)}
                        <span className="text-[11px] font-mono text-neutral-400">
                          {node.timestamp}
                        </span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 text-neutral-400 transition-transform ${
                          isSelected ? 'rotate-90 text-purple-600' : 'group-hover:translate-x-0.5'
                        }`}
                      />
                    </div>

                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {node.title}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {node.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
                      <span>
                        Originator: <strong className="text-neutral-700 dark:text-neutral-300">{node.author}</strong> ({node.department})
                      </span>
                      {node.referenceId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSourceArtifact(node);
                          }}
                          className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          <span>Open Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Node Inspector & Causal Graph */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Artifact Inspector</span>
          </h2>

          {selectedNode ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#161922] border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center gap-2">
                  {getNodeIcon(selectedNode.type)}
                  {getNodeTypeBadge(selectedNode.type)}
                </div>

                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {selectedNode.title}
                </h3>

                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {selectedNode.description}
                </p>

                <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  <div>
                    Author: <strong className="text-neutral-900 dark:text-white">{selectedNode.author}</strong>
                  </div>
                  <div>
                    Department: <strong className="text-neutral-900 dark:text-white">{selectedNode.department}</strong>
                  </div>
                  <div>
                    Logged: <span className="font-mono">{selectedNode.timestamp}</span>
                  </div>
                  <div>
                    Internal Ref ID: <span className="font-mono text-purple-600 dark:text-purple-400">{selectedNode.referenceId}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => handleOpenSourceArtifact(selectedNode)}
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  Jump to Source Artifact
                </Button>
              </div>

              {/* Related Causal Connections */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Causal Connections
                </h4>

                <div className="space-y-2">
                  {(currentTrace?.connections || [])
                    .filter(
                      (c) => c.fromNodeId === selectedNode?.id || c.toNodeId === selectedNode?.id
                    )
                    .map((conn, idx) => {
                      const otherNodeId =
                        conn.fromNodeId === selectedNode?.id ? conn.toNodeId : conn.fromNodeId;
                      const otherNode = currentTrace?.nodes?.find((n) => n.id === otherNodeId);
                      const isOutgoing = conn.fromNodeId === selectedNode?.id;

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedNodeId(otherNodeId)}
                          className="p-3 rounded-lg bg-neutral-50 dark:bg-[#161922] border border-neutral-200 dark:border-neutral-800 hover:border-purple-400 cursor-pointer space-y-1 transition-colors"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className={isOutgoing ? 'text-purple-600' : 'text-blue-600'}>
                              {isOutgoing ? `→ ${conn.relationship}` : `← Preceded by`}
                            </span>
                            <span className="text-neutral-400 font-mono">
                              {otherNode?.type}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                            {otherNode?.title || otherNodeId}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-2 text-neutral-400">
              <Share2 className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600" />
              <p className="text-xs font-medium">Select any step in the lineage to inspect its causal dependencies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
