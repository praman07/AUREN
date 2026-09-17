import React from 'react';
import {
  Video,
  Cpu,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Play,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sliders,
} from 'lucide-react';
import { GovernedAgent } from '../../types/agents';
import { Button } from '../ui/Button';

interface AgentCardProps {
  agent: GovernedAgent;
  onSelect: (agent: GovernedAgent) => void;
  onRunQuick: (agent: GovernedAgent) => void;
  onOpenPermissions: (agent: GovernedAgent) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onSelect,
  onRunQuick,
  onOpenPermissions,
}) => {
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

  const getClearanceBadgeClass = (level: string) => {
    switch (level) {
      case 'L5':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'L4':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'L3':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700';
    }
  };

  return (
    <div
      id={`agent-card-${agent.id}`}
      className="p-5 rounded-2xl bg-white dark:bg-[#12141A] border border-neutral-200/90 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-900/60 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between group"
    >
      <div>
        {/* Top Meta Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {getAgentIcon(agent.avatarIcon)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                {agent.name}
              </h3>
              <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                {agent.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getClearanceBadgeClass(
                agent.minClearance
              )}`}
            >
              {agent.minClearance} Clearance
            </span>
          </div>
        </div>

        {/* Purpose Description */}
        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-2 mb-4">
          {agent.purpose}
        </p>

        {/* Governed Scope & Tools pill preview */}
        <div className="space-y-2 mb-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-400 dark:text-neutral-500 font-medium">Department</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {agent.departmentScope}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-400 dark:text-neutral-500 font-medium">Knowledge Scope</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[180px] text-right" title={(agent.knowledgeScope || []).join(', ')}>
              {(agent.knowledgeScope || [])[0] || 'Organization'} {(agent.knowledgeScope || []).length > 1 ? `+${(agent.knowledgeScope || []).length - 1}` : ''}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-400 dark:text-neutral-500 font-medium">Tooling Authorization</span>
            <span className="font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {(agent.tools || []).filter((t) => t.status === 'allowed').length} Allowed • {(agent.restrictedTools || []).length} Restricted
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenPermissions(agent)}
          className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors font-medium cursor-pointer"
          title="Inspect Agent RBAC & Tool Permissions"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Permissions</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={() => onRunQuick(agent)}
            icon={<Play className="w-3 h-3 text-purple-600 dark:text-purple-400" />}
            className="text-xs"
          >
            Run
          </Button>

          <Button
            variant="primary"
            size="xs"
            onClick={() => onSelect(agent)}
            icon={<ArrowRight className="w-3 h-3" />}
            className="text-xs bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800"
          >
            Workspace
          </Button>
        </div>
      </div>
    </div>
  );
};
