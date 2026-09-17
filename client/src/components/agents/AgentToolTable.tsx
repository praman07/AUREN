import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  FileText,
  PlusCircle,
  Edit3,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import type { AgentTool } from '../../types/agents';

interface AgentToolTableProps {
  allowedTools: AgentTool[];
  restrictedTools: AgentTool[];
  agentName: string;
}

export const AgentToolTable: React.FC<AgentToolTableProps> = ({
  allowedTools,
  restrictedTools,
  agentName,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const allTools = [
    ...(allowedTools || []),
    ...(restrictedTools || []),
  ];

  const filteredTools = (allTools || []).filter((tool) => {
    if (selectedCategory !== 'all' && tool.category !== selectedCategory) return false;
    if (
      filterQuery &&
      !tool.name.toLowerCase().includes(filterQuery.toLowerCase()) &&
      !tool.description.toLowerCase().includes(filterQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getToolStatusBadge = (status: AgentTool['status']) => {
    switch (status) {
      case 'allowed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>✓ Allowed</span>
          </span>
        );
      case 'approval_required':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>⚠ Requires Approval</span>
          </span>
        );
      case 'restricted':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>✕ Not Allowed</span>
          </span>
        );
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'search':
        return <Search className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'read':
        return <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
      case 'create':
        return <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'modify':
        return <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'compliance':
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Lock className="w-3.5 h-3.5 text-neutral-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Governed Tool Catalog ({allTools.length})
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Explicitly provisioned functions and cryptographic boundaries accessible to {agentName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter tools..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-1 focus:ring-purple-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 outline-none focus:ring-1 focus:ring-purple-400"
          >
            <option value="all">All Types</option>
            <option value="search">Search</option>
            <option value="read">Read</option>
            <option value="create">Create</option>
            <option value="modify">Modify</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
      </div>

      {/* Tool Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#12141A] shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-50/80 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              <th className="py-3 px-4">Tool Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Capability Description</th>
              <th className="py-3 px-4 text-right">Governed Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {filteredTools.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs text-neutral-400">
                  No tools found matching "{filterQuery}".
                </td>
              </tr>
            ) : (
              filteredTools.map((tool) => (
                <tr
                  key={tool.id}
                  className="hover:bg-neutral-50/70 dark:hover:bg-neutral-850/40 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-neutral-100 dark:bg-neutral-800">
                        {getCategoryIcon(tool.category)}
                      </div>
                      <span>{tool.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                    {tool.category || 'General'}
                  </td>
                  <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300 max-w-md">
                    {tool.description}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {getToolStatusBadge(tool.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Security Confinement Callout */}
      <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 flex items-start gap-3 text-xs text-purple-900 dark:text-purple-300">
        <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Constitutional Tool Boundary:</span> AUREN agents are
          cryptographically sandboxed to the tools listed above. Actions that modify core source documents,
          delete audit records, or alter clearance levels are strictly rejected by the AUREN Kernel enforcer.
        </div>
      </div>
    </div>
  );
};
