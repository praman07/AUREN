import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Save,
  RotateCcw,
  Info,
} from 'lucide-react';
import type { GovernedAgent, AgentTool } from '../../types/agents';
import { Button } from '../ui/button';

interface AgentPermissionEditorProps {
  agent: GovernedAgent;
  onUpdateAgent: (updatedAgent: GovernedAgent) => void;
  onClose?: () => void;
}

export const AgentPermissionEditor: React.FC<AgentPermissionEditorProps> = ({
  agent,
  onUpdateAgent,
  onClose: _onClose,
}) => {
  const [tools, setTools] = useState<AgentTool[]>([...agent.tools]);
  const [restrictedTools, setRestrictedTools] = useState<AgentTool[]>([
    ...agent.restrictedTools,
  ]);
  const [approvalActions, setApprovalActions] = useState<string[]>([
    ...agent.approvalActions,
  ]);
  const [minClearance, setMinClearance] = useState<'L1' | 'L2' | 'L3' | 'L4' | 'L5'>(
    agent.minClearance
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleToggleToolStatus = (toolId: string) => {
    setTools((prev) =>
      prev.map((t) => {
        if (t.id === toolId) {
          const nextStatus =
            t.status === 'allowed'
              ? 'approval_required'
              : t.status === 'approval_required'
              ? 'restricted'
              : 'allowed';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleToggleApprovalAction = (actionText: string) => {
    setApprovalActions((prev) =>
      prev.includes(actionText)
        ? prev.filter((a) => a !== actionText)
        : [...prev, actionText]
    );
  };

  const handleSave = () => {
    const updated: GovernedAgent = {
      ...agent,
      tools,
      restrictedTools,
      approvalActions,
      minClearance,
    };
    onUpdateAgent(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    setTools([...agent.tools]);
    setRestrictedTools([...agent.restrictedTools]);
    setApprovalActions([...agent.approvalActions]);
    setMinClearance(agent.minClearance);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {isSaved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            Agent governance permissions updated. Enforcement active in AUREN Kernel.
          </span>
        </div>
      )}

      {/* Access Explanation Callout (Requirement 12) */}
      <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
              Agent Access Explanation — "Why Can This Agent Access This?"
            </h4>
          </div>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            {agent.accessExplanation.decision}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700/70">
            <span className="text-[11px] text-neutral-400 font-medium block mb-1">
              Organization Boundary
            </span>
            <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{agent.accessExplanation.organization}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700/70">
            <span className="text-[11px] text-neutral-400 font-medium block mb-1">
              Department Clearance
            </span>
            <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{agent.accessExplanation.department}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700/70">
            <span className="text-[11px] text-neutral-400 font-medium block mb-1">
              Minimum RBAC Tier
            </span>
            <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{agent.accessExplanation.clearance}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700/70">
            <span className="text-[11px] text-neutral-400 font-medium block mb-1">
              Governing Policy
            </span>
            <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate" title={agent.accessExplanation.policy}>
                {agent.accessExplanation.policy}
              </span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed bg-white/70 dark:bg-neutral-850/60 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-750 flex items-start gap-2">
          <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
          <span>
            This agent is bound by strict zero-trust credential pass-through. Queries executed by this agent
            inherit the executing user's clearance floor. If a resource requires L5 and the agent is scoped to
            L4, retrieval is rejected with <span className="font-mono text-rose-600 dark:text-rose-400">ACCESS DENIED (Clearance Gap)</span>.
          </span>
        </div>
      </div>

      {/* Main Governance Matrix Editor */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              Agent Permission & Tool Governance Editor
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Configure allowed tools, approval gates, and authorization policies for {agent.name}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={handleReset}
              icon={<RotateCcw className="w-3 h-3" />}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="xs"
              onClick={handleSave}
              icon={<Save className="w-3 h-3" />}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Identity & Scope Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1.5">
              Department Scope
            </label>
            <div className="text-xs font-semibold text-neutral-900 dark:text-white">
              {agent.departmentScope}
            </div>
            <span className="text-[10px] text-neutral-400 mt-1 block">
              Constrained to {agent.departmentScope} data partition
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1.5">
              Minimum Clearance Level
            </label>
            <select
              value={minClearance}
              onChange={(e) => setMinClearance(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-400"
            >
              <option value="L1">L1 - Basic / Contractor</option>
              <option value="L2">L2 - Associate</option>
              <option value="L3">L3 - Junior Member</option>
              <option value="L4">L4 - Senior Engineer</option>
              <option value="L5">L5 - Principal / CISO</option>
            </select>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1.5">
              Knowledge Scope
            </label>
            <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
              {agent.knowledgeScope.join(', ')}
            </div>
            <span className="text-[10px] text-neutral-400 mt-1 block">
              {agent.knowledgeScope.length} authorized repositories
            </span>
          </div>
        </div>

        {/* Tool Authorization Toggles (Requirement 10) */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-1.5">
            <span>Allowed Tools Configuration</span>
            <span className="text-[10px] text-neutral-400 font-normal">
              (Click status to toggle Allowed ↔ Requires Approval ↔ Restricted)
            </span>
          </h4>

          <div className="space-y-2">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="p-3 rounded-xl bg-neutral-50/70 dark:bg-neutral-900/40 border border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between gap-3 hover:border-purple-200 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    {tool.name}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {tool.description}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleToolStatus(tool.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                    tool.status === 'allowed'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : tool.status === 'approval_required'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {tool.status === 'allowed' && '✓ Allowed'}
                  {tool.status === 'approval_required' && '⚠ Requires Approval'}
                  {tool.status === 'restricted' && '✕ Restricted'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Restricted Tools (Hard Enforced) */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-rose-500" />
            <span>Restricted Tools (Kernel Enforced Boundaries)</span>
          </h4>

          <div className="space-y-2">
            {restrictedTools.map((tool) => (
              <div
                key={tool.id}
                className="p-3 rounded-xl bg-rose-50/20 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/30 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>{tool.name}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {tool.description}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  ✕ Not Allowed
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Approval Required Actions (Requirement 10) */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Actions Requiring Human-in-the-Loop Approval</span>
          </h4>

          <div className="space-y-2">
            {agent.approvalActions.map((action, i) => (
              <label
                key={i}
                className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 cursor-pointer hover:bg-neutral-100/60 dark:hover:bg-neutral-850 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={approvalActions.includes(action)}
                  onChange={() => handleToggleApprovalAction(action)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                  {action}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            icon={<Save className="w-3.5 h-3.5" />}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
          >
            Apply Governance Rules
          </Button>
        </div>
      </div>
    </div>
  );
};
