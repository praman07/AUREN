import React, { useState } from 'react';
import {
  X,
  Scale,
  ListTodo,
  CheckCircle2,
  Plus,
  FileText,
  Calendar,
  User,
  Check,
} from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { Button } from '../ui/Button';

interface DecisionsDrawerProps {
  onOpenCreateDecision?: () => void;
  onOpenCreateActionItem?: () => void;
  onOpenDocument?: (docId: string) => void;
}

export const DecisionsDrawer: React.FC<DecisionsDrawerProps> = ({
  onOpenCreateDecision,
  onOpenCreateActionItem,
  onOpenDocument,
}) => {
  const {
    isDecisionsOpen,
    setIsDecisionsOpen,
    decisions,
    actionItems,
    toggleActionItemComplete,
  } = useCollaboration();

  const [activeTab, setActiveTab] = useState<'decisions' | 'actions'>('decisions');

  if (!isDecisionsOpen) return null;

  return (
    <aside className="w-80 lg:w-96 h-full bg-white dark:bg-[#121316] border-l border-neutral-200/70 dark:border-neutral-800/80 flex flex-col select-none shrink-0 z-20">
      {/* Header with Tabs */}
      <div className="h-13 px-4 border-b border-neutral-200/70 dark:border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('decisions')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'decisions'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Decisions</span>
            <span className="text-[10px] font-mono opacity-80">({decisions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'actions'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Action Items</span>
            <span className="text-[10px] font-mono opacity-80">({actionItems.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsDecisionsOpen(false)}
          className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'decisions' ? (
          <>
            {onOpenCreateDecision && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={onOpenCreateDecision}
                className="w-full justify-center"
              >
                Record New Decision
              </Button>
            )}

            {decisions.length === 0 ? (
              <div className="text-center py-12 px-4 text-neutral-400 space-y-2">
                <Scale className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  No decisions logged yet
                </p>
                <p className="text-[11px] text-neutral-400">
                  Record architectural consensus and policy determinations directly into the channel ledger.
                </p>
              </div>
            ) : (
              decisions.map((dec) => (
                <div
                  key={dec.id}
                  className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                      {dec.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      {dec.status}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {dec.decisionText}
                  </p>

                  {dec.sources && dec.sources.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                        Referenced Knowledge:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {dec.sources.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => onOpenDocument && onOpenDocument(s.id)}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 transition-colors flex items-center gap-1 cursor-pointer truncate max-w-xs"
                          >
                            <FileText className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{s.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-neutral-400 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/60">
                    <span className="flex items-center gap-1">
                      <User className="w-2.5 h-2.5" />
                      {dec.owner}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {dec.date}
                    </span>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {onOpenCreateActionItem && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={onOpenCreateActionItem}
                className="w-full justify-center"
              >
                Create Action Item
              </Button>
            )}

            {actionItems.length === 0 ? (
              <div className="text-center py-12 px-4 text-neutral-400 space-y-2">
                <ListTodo className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  No action items assigned
                </p>
                <p className="text-[11px] text-neutral-400">
                  Assign tasks, deployment deadlines, and audits with assignees and due dates.
                </p>
              </div>
            ) : (
              actionItems.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActionItemComplete(act.id)}
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                        act.status === 'Completed'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-500'
                      }`}
                    >
                      {act.status === 'Completed' && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold text-neutral-900 dark:text-white ${
                          act.status === 'Completed' ? 'line-through text-neutral-400' : ''
                        }`}
                      >
                        {act.title}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-neutral-400 mt-1">
                        <span>Assigned to: <strong className="text-neutral-700 dark:text-neutral-300">{act.assignedTo}</strong></span>
                        <span>•</span>
                        <span>Due {act.dueDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </aside>
  );
};
