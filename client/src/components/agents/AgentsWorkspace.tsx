import React, { useState } from 'react';
import {
  Video,
  Cpu,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Play,
  ArrowLeft,
  Sliders,
  CheckCircle2,
  Search,
  ShieldCheck,
  Database,
  Lock,
  Bell,
} from 'lucide-react';
import type { GovernedAgent, AgentActivityItem, AgentApprovalRequest } from '../../types/agents';
import {
  INITIAL_GOVERNED_AGENTS,
  MOCK_AGENT_EXECUTIONS,
  INITIAL_AGENT_ACTIVITIES,
  INITIAL_APPROVAL_REQUESTS,
} from '../../services/governedAgentsData';
import { AgentCard } from './AgentCard';
import { AgentToolTable } from './AgentToolTable';
import { AgentExecutionTrace } from './AgentExecutionTrace';
import { AgentPermissionEditor } from './AgentPermissionEditor';
import { AgentApprovalModal } from './AgentApprovalModal';
import { Button } from '../ui/button';

interface AgentsWorkspaceProps {
  onOpenDocument?: (docId: string) => void;
  onOpenDecision?: (decisionId: string) => void;
  onOpenMeeting?: (meetingId: string) => void;
  onAskAuren?: (prompt: string) => void;
  initialAgentId?: string | null;
}

export const AgentsWorkspace: React.FC<AgentsWorkspaceProps> = ({
  onOpenDocument,
  onOpenDecision,
  onOpenMeeting,
  onAskAuren,
  initialAgentId = null,
}) => {
  // State
  const [agents, setAgents] = useState<GovernedAgent[]>(INITIAL_GOVERNED_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(initialAgentId);
  const [activeDetailTab, setActiveDetailTab] = useState<
    'overview' | 'tools' | 'trace' | 'knowledge' | 'permissions' | 'activity'
  >('overview');

  // Governance & Approvals State
  const [activities, setActivities] = useState<AgentActivityItem[]>(INITIAL_AGENT_ACTIVITIES);
  const [approvalRequests, setApprovalRequests] = useState<AgentApprovalRequest[]>(
    INITIAL_APPROVAL_REQUESTS
  );
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Directory Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [clearanceFilter, setClearanceFilter] = useState('all');

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  // Trigger toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Quick Run from directory card
  const handleQuickRun = (agent: GovernedAgent) => {
    setSelectedAgentId(agent.id);
    setActiveDetailTab('trace');
  };

  // Open permissions tab
  const handleOpenPermissions = (agent: GovernedAgent) => {
    setSelectedAgentId(agent.id);
    setActiveDetailTab('permissions');
  };

  // Agent permissions update
  const handleUpdateAgent = (updatedAgent: GovernedAgent) => {
    setAgents((prev) => prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a)));
    showToast(`Governance configuration updated for ${updatedAgent.name}.`);
  };

  // Action executed from execution simulation
  const handleActionExecuted = (
    _actionId: string,
    actionLabel: string,
    requiresApproval: boolean
  ) => {
    if (requiresApproval) {
      const newReq: AgentApprovalRequest = {
        id: `appr_${Date.now()}`,
        agentId: selectedAgent?.id || 'agent',
        agentName: selectedAgent?.name || 'AUREN Agent',
        title: actionLabel,
        reason: 'Automated remediation generated from agent simulation analysis.',
        affectedCount: 2,
        affectedItems: ['Target Specification', 'Security Policy Reference'],
        risk: 'Medium',
        status: 'pending',
        createdAt: 'Just now',
        requiresRole: 'Super Admin or Department Head',
      };
      setApprovalRequests((prev) => [newReq, ...prev]);
    }

    const newActivity: AgentActivityItem = {
      id: `act_${Date.now()}`,
      agentId: selectedAgent?.id || 'agent',
      agentName: selectedAgent?.name || 'AUREN Agent',
      action: actionLabel,
      target: selectedAgent?.name || 'Target',
      targetType: 'document',
      department: selectedAgent?.departmentScope || 'Engineering',
      timestamp: 'Just now',
      status: requiresApproval ? 'pending_approval' : 'completed',
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  // Approve request
  const handleApproveRequest = (requestId: string) => {
    setApprovalRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'approved' } : r))
    );
    showToast('Approval granted. Agent action has been dispatched to production ledger.');
    setIsApprovalModalOpen(false);
  };

  // Reject request
  const handleRejectRequest = (requestId: string) => {
    setApprovalRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
    );
    showToast('Action rejected. Agent prohibited from executing proposed changes.');
    setIsApprovalModalOpen(false);
  };

  // Filtered agents in directory
  const filteredAgents = (agents || []).filter((agent) => {
    if (departmentFilter !== 'all' && agent.departmentScope !== departmentFilter) return false;
    if (clearanceFilter !== 'all' && agent.minClearance !== clearanceFilter) return false;
    if (
      searchQuery &&
      !agent.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !agent.purpose.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !agent.role.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const pendingApprovalsCount = (approvalRequests || []).filter((r) => r.status === 'pending').length;

  const getAgentIcon = (iconName: string) => {
    switch (iconName) {
      case 'Video':
        return <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] dark:bg-[#0E0F12] text-neutral-900 dark:text-neutral-100 overflow-y-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 p-3.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-lg flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Human-in-the-Loop Approval Modal */}
      <AgentApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        requests={(approvalRequests || []).filter((r) => r.status === 'pending')}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
      />

      {/* Top Banner for Pending Approvals */}
      {pendingApprovalsCount > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold">
              Human-in-the-Loop Gate:{' '}
              <span className="font-normal">
                {pendingApprovalsCount} sensitive agent action{pendingApprovalsCount > 1 ? 's require' : ' requires'} human approval.
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsApprovalModalOpen(true)}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
          >
            Review Approval Queue ({pendingApprovalsCount})
          </button>
        </div>
      )}

      {/* WORKSPACE VIEW: DIRECTORY OR AGENT DETAIL */}
      {!selectedAgent ? (
        /* ==================================================================== */
        /* DIRECTORY VIEW                                                       */
        /* ==================================================================== */
        <div className="max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
          {/* Main Title & Subtitle */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Governed AI Operations
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {agents.length} AGENTS ACTIVE
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
                <span>AUREN Governed AI Agents</span>
              </h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                First-class governed agents operating within organizational boundaries, RBAC tiers,
                and constitutional tool allowances.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsApprovalModalOpen(true)}
                icon={<Bell className="w-3.5 h-3.5 text-amber-500" />}
              >
                Approvals ({pendingApprovalsCount})
              </Button>

              {onAskAuren && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAskAuren('Which governed agents are currently available and what are their clearances?')}
                  icon={<Sparkles className="w-3.5 h-3.5 text-purple-200" />}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-purple-700"
                >
                  Ask AUREN
                </Button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200/90 dark:border-neutral-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search agents by name, purpose, or capability..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-1 focus:ring-purple-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 outline-none focus:ring-1 focus:ring-purple-400"
              >
                <option value="all">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Organization">Organization</option>
                <option value="Security & Compliance">Security & Compliance</option>
                <option value="Operations & Infrastructure">Operations</option>
              </select>

              <select
                value={clearanceFilter}
                onChange={(e) => setClearanceFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 outline-none focus:ring-1 focus:ring-purple-400"
              >
                <option value="all">All Clearances</option>
                <option value="L3">L3 Clearance</option>
                <option value="L4">L4 Clearance</option>
                <option value="L5">L5 Clearance</option>
              </select>
            </div>
          </div>

          {/* Directory Cards Grid (The 5 Governed Agents) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onSelect={(a) => {
                  setSelectedAgentId(a.id);
                  setActiveDetailTab('overview');
                }}
                onRunQuick={handleQuickRun}
                onOpenPermissions={handleOpenPermissions}
              />
            ))}
          </div>

          {/* Global Recent Activity Log Preview */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Tamper-Evident Agent Activity Ledger
                </h3>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                Organization-wide Audit Feed
              </span>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {activities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start sm:items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                      <Cpu className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <span>{act.agentName}</span>
                        <span className="text-neutral-300 dark:text-neutral-700">•</span>
                        <span className="font-normal text-neutral-600 dark:text-neutral-400">
                          {act.action}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Target: <span className="font-medium text-neutral-600 dark:text-neutral-300">{act.target}</span> ({act.department})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        act.status === 'approved' || act.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : act.status === 'needs_review'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      {act.status.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {act.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ==================================================================== */
        /* INDIVIDUAL AGENT DETAIL VIEW                                         */
        /* ==================================================================== */
        <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
          {/* Breadcrumb Navigation Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <button
                type="button"
                onClick={() => setSelectedAgentId(null)}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Agents Directory</span>
              </button>
              <span>/</span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {selectedAgent.name}
              </span>
              <span>/</span>
              <span className="capitalize text-purple-600 dark:text-purple-400 font-mono text-[11px] px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
                {activeDetailTab}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedAgentId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Directory</span>
            </button>
          </div>

          {/* Agent Header (Requirement 3) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0 shadow-2xs">
                  {getAgentIcon(selectedAgent.avatarIcon)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                      {selectedAgent.name}
                    </h2>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      AVAILABLE
                    </span>
                  </div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {selectedAgent.role}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 max-w-2xl leading-relaxed">
                    {selectedAgent.purpose}
                  </p>
                </div>
              </div>

              {/* Quick Actions Header */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveDetailTab('permissions')}
                  icon={<Sliders className="w-3.5 h-3.5" />}
                >
                  Permissions
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveDetailTab('trace')}
                  icon={<Play className="w-3.5 h-3.5" />}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-purple-700 font-semibold"
                >
                  Run Agent
                </Button>
              </div>
            </div>

            {/* Governed Boundaries Bar */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800">
                <span className="text-[10px] font-medium text-neutral-400 block">Department Scope</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {selectedAgent.departmentScope}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800">
                <span className="text-[10px] font-medium text-neutral-400 block">Minimum Clearance</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {selectedAgent.minClearance} Clearance
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800">
                <span className="text-[10px] font-medium text-neutral-400 block">Tool Status</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {(selectedAgent.tools || []).filter((t) => t.status === 'allowed').length} Allowed • {(selectedAgent.restrictedTools || []).length} Restricted
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800">
                <span className="text-[10px] font-medium text-neutral-400 block">Last Executed</span>
                <span className="font-mono text-neutral-700 dark:text-neutral-300">
                  {selectedAgent.lastRun}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto pb-px">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'tools', label: `Tools (${selectedAgent.tools.length + selectedAgent.restrictedTools.length})` },
              { id: 'trace', label: 'Run & Simulation' },
              { id: 'knowledge', label: 'Knowledge Scope' },
              { id: 'permissions', label: 'Permissions & RBAC' },
              { id: 'activity', label: 'Activity Log' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveDetailTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeDetailTab === tab.id
                    ? 'border-purple-600 text-purple-700 dark:text-purple-300 bg-white dark:bg-[#12141A]'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENTS */}
          {activeDetailTab === 'overview' && (
            <div className="space-y-6">
              {/* Access Explanation Callout (Requirement 12) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                      Access Explanation — "Why Can This Agent Access This?"
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {selectedAgent.accessExplanation.decision}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
                    <span className="text-[10px] text-neutral-400 font-medium block mb-1">
                      Organization
                    </span>
                    <div className="font-bold text-neutral-900 dark:text-white">
                      {selectedAgent.accessExplanation.organization}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
                    <span className="text-[10px] text-neutral-400 font-medium block mb-1">
                      Department
                    </span>
                    <div className="font-bold text-neutral-900 dark:text-white">
                      {selectedAgent.accessExplanation.department}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
                    <span className="text-[10px] text-neutral-400 font-medium block mb-1">
                      Clearance Minimum
                    </span>
                    <div className="font-bold text-neutral-900 dark:text-white">
                      {selectedAgent.accessExplanation.clearance}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
                    <span className="text-[10px] text-neutral-400 font-medium block mb-1">
                      Governing Policy
                    </span>
                    <div className="font-bold text-neutral-900 dark:text-white truncate" title={selectedAgent.accessExplanation.policy}>
                      {selectedAgent.accessExplanation.policy}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-300 leading-relaxed">
                  Queries performed by <strong>{selectedAgent.name}</strong> strictly inherit the
                  active user's clearance floor. If a document requires L5 clearance and the executing
                  user holds L4, retrieval returns zero results without leakage.
                </div>
              </div>

              {/* Capabilities & Quick Trigger */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Key Capabilities & Operational Scope
                  </h4>
                  <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{selectedAgent.purpose}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>
                        Equipped with {(selectedAgent.tools || []).filter((t) => t.status === 'allowed').length} authorized tools across search, inspection, and analysis.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>
                        Enforces constitutional gates on destructive operations and mandates human review.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                      Execute Evaluation Pipeline
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      Run the deterministic simulation across organizational repositories and inspect findings, policy conflicts, and evidence.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveDetailTab('trace')}
                    icon={<Play className="w-3.5 h-3.5" />}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold self-start"
                  >
                    Open Execution Simulation
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeDetailTab === 'tools' && (
            <AgentToolTable
              allowedTools={selectedAgent.tools}
              restrictedTools={selectedAgent.restrictedTools}
              agentName={selectedAgent.name}
            />
          )}

          {activeDetailTab === 'trace' && (
            <AgentExecutionTrace
              simulation={
                MOCK_AGENT_EXECUTIONS[selectedAgent.id] ||
                MOCK_AGENT_EXECUTIONS['architecture-reviewer']
              }
              agentName={selectedAgent.name}
              onOpenDocument={onOpenDocument}
              onOpenDecision={onOpenDecision}
              onOpenMeeting={onOpenMeeting}
              onAskAuren={onAskAuren}
              onActionExecuted={handleActionExecuted}
            />
          )}

          {activeDetailTab === 'knowledge' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Knowledge Scope & Boundary Confinement
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Authorized repositories and vaults accessible to {selectedAgent.name}.
                </p>
              </div>

              {/* Accessible Vaults */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Authorized Knowledge Vaults</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedAgent.knowledgeScope.map((scope, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {scope}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        READ / INDEX
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Restricted Vaults */}
              <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>Restricted / Excluded Knowledge</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedAgent.restrictedKnowledge.map((res, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-rose-50/30 dark:bg-rose-950/10 border border-rose-200/60 dark:border-rose-900/40 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-rose-600" />
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {res}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold">
                        ACCESS PROHIBITED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeDetailTab === 'permissions' && (
            <AgentPermissionEditor
              agent={selectedAgent}
              onUpdateAgent={handleUpdateAgent}
            />
          )}

          {activeDetailTab === 'activity' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  {selectedAgent.name} Audit Ledger
                </h3>
                <span className="text-xs text-neutral-400 font-mono">
                  {(activities || []).filter((a) => a.agentId === selectedAgent.id).length} recorded actions
                </span>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {(activities || [])
                  .filter((a) => a.agentId === selectedAgent.id)
                  .map((act) => (
                    <div
                      key={act.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-neutral-900 dark:text-white">
                          {act.action}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          Target: {act.target} ({act.department})
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            act.status === 'completed' || act.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {act.status.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {act.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
