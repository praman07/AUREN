import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Bookmark,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  Code2,
  ExternalLink,
  Shield,
  ShieldAlert,
  ThumbsUp,
  Rocket,
  Plus,
  Scale,
  ListTodo,
} from 'lucide-react';
import type { CollaborationMessage } from '../../types/collaboration';
import { useCollaboration } from '../../context/CollaborationContext';
import { useAuth } from '../../context/AuthContext';

interface MessageItemProps {
  message: CollaborationMessage;
  onOpenDocument?: (docId: string) => void;
  onOpenRbacPolicy?: () => void;
  onAskAurenMessage?: (msg: CollaborationMessage, prompt: string) => void;
  onCreateDecisionFromMessage?: (msg: CollaborationMessage) => void;
  onCreateActionItemFromMessage?: (msg: CollaborationMessage) => void;
  isInsideThread?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onOpenDocument,
  onOpenRbacPolicy,
  onAskAurenMessage,
  onCreateDecisionFromMessage,
  onCreateActionItemFromMessage,
  isInsideThread = false,
}) => {
  const {
    acknowledgeBroadcast,
    addReaction,
    openThread,
    toggleSaveMessage,
    decisions,
    actionItems,
    toggleActionItemComplete,
  } = useCollaboration();
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [_showMoreActions, _setShowMoreActions] = useState(false);

  const currentUserId = user?.id || 'usr_praman_101';
  const isBroadcast = Boolean(message.isBroadcast && message.broadcastMeta);
  const hasUserAcknowledged = isBroadcast
    ? message.broadcastMeta?.acknowledgedUserIds.includes(currentUserId)
    : false;

  const linkedDecision = message.decisionId
    ? decisions.find((d) => d.id === message.decisionId)
    : null;

  const linkedActionItem = message.actionItemId
    ? actionItems.find((a) => a.id === message.actionItemId)
    : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'critical_alert':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Critical Directive
          </span>
        );
      case 'policy_update':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Mandatory Policy Update
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Executive Notice
          </span>
        );
    }
  };

  return (
    <div
      className={`group relative flex gap-3.5 px-4 py-3.5 rounded-lg transition-colors ${
        message.isAurenAi
          ? 'bg-neutral-50/80 dark:bg-[#141519] border border-neutral-200/70 dark:border-neutral-800/80 border-l-2 border-l-neutral-900 dark:border-l-neutral-200'
          : isBroadcast
          ? 'bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/40 border-l-2 border-l-amber-500'
          : 'hover:bg-neutral-50/80 dark:hover:bg-neutral-900/30'
      }`}
    >
      {/* Sender Avatar */}
      <div className="shrink-0 mt-0.5">
        {message.isAurenAi ? (
          <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-xs font-bold shadow-xs">
            A
          </div>
        ) : (
          <img
            src={
              message.senderAvatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
            alt={message.senderName}
            className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
          />
        )}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Sender Meta Line */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-neutral-900 dark:text-white">
            {message.senderName}
          </span>

          {message.senderRole && (
            <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
              {message.senderRole}
            </span>
          )}

          {message.senderDepartment && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-mono">
              {message.senderDepartment}
            </span>
          )}

          {message.senderClearance && (
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-700 dark:text-neutral-300">
              {message.senderClearance}
            </span>
          )}

          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 ml-auto">
            {message.timestamp}
          </span>
        </div>

        {/* Official Broadcast Header (if broadcast) */}
        {isBroadcast && message.broadcastMeta && (
          <div className="p-3 rounded-lg bg-white dark:bg-[#16171B] border border-amber-200 dark:border-amber-800/60 shadow-2xs space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  {message.broadcastMeta.title}
                </span>
              </div>
              {getPriorityBadge(message.broadcastMeta.priority)}
            </div>

            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-3">
              <span>Audience: <strong>{message.broadcastMeta.audience}</strong></span>
              <span>•</span>
              <span>Certified by Super Admin</span>
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Linked Decision Card */}
        {linkedDecision && (
          <div className="p-3 rounded-lg bg-white dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  Decision: {linkedDecision.title}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {linkedDecision.status}
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
              {linkedDecision.decisionText}
            </p>
            <div className="flex items-center gap-3 text-[10px] text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <span>Owner: {linkedDecision.owner}</span>
              <span>•</span>
              <span>Ratified {linkedDecision.date}</span>
            </div>
          </div>
        )}

        {/* Linked Action Item Card */}
        {linkedActionItem && (
          <div className="p-3 rounded-lg bg-white dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleActionItemComplete(linkedActionItem.id)}
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                    linkedActionItem.status === 'Completed'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-500'
                  }`}
                >
                  {linkedActionItem.status === 'Completed' && <Check className="w-3 h-3" />}
                </button>
                <span
                  className={`text-xs font-medium text-neutral-900 dark:text-white ${
                    linkedActionItem.status === 'Completed' ? 'line-through text-neutral-400' : ''
                  }`}
                >
                  {linkedActionItem.title}
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                Due {linkedActionItem.dueDate}
              </span>
            </div>
            <div className="text-[10px] text-neutral-500 pl-6">
              Assigned to: <strong>{linkedActionItem.assignedTo}</strong> ({linkedActionItem.assignedToDepartment})
            </div>
          </div>
        )}

        {/* First-Class Knowledge Objects (Attached Documents) */}
        {message.attachedKnowledge && message.attachedKnowledge.length > 0 && (
          <div className="space-y-2 pt-1">
            {message.attachedKnowledge.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-lg bg-white dark:bg-[#16171B] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5">
                    {doc.type === 'code' ? (
                      <Code2 className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        {doc.title}
                      </span>
                      {doc.minClearance && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {doc.minClearance}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                      {doc.summary || doc.filename}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 mt-1">
                      <span>{doc.filename}</span>
                      {doc.fileSize && <span>• {doc.fileSize}</span>}
                      {doc.department && <span>• {doc.department}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-9 sm:pl-0">
                  {onOpenDocument && (
                    <button
                      type="button"
                      onClick={() => onOpenDocument(doc.id)}
                      className="px-2.5 py-1 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                  {onOpenRbacPolicy && (
                    <button
                      type="button"
                      onClick={onOpenRbacPolicy}
                      title="View Access Policy in RBAC"
                      className="px-2 py-1 rounded text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3 text-neutral-400" />
                      <span>Policy</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cited Sources (for AUREN responses) */}
        {message.sources && message.sources.length > 0 && (
          <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/80 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Verified Sources
            </span>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((src) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => src.documentId && onOpenDocument && onOpenDocument(src.documentId)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer flex items-center gap-1 border border-neutral-200/60 dark:border-neutral-700/60"
                >
                  <FileText className="w-2.5 h-2.5 text-neutral-500" />
                  <span className="truncate max-w-xs">{src.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Broadcast Acknowledgement Bar */}
        {isBroadcast && message.broadcastMeta?.requiresAcknowledgement && (
          <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                Acknowledged by{' '}
                <strong>
                  {message.broadcastMeta.acknowledgedCount} / {message.broadcastMeta.totalTargetCount}
                </strong>{' '}
                members
              </span>
            </div>

            <button
              type="button"
              onClick={() => acknowledgeBroadcast(message.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                hasUserAcknowledged
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{hasUserAcknowledged ? 'Acknowledged' : 'Acknowledge Policy'}</span>
            </button>
          </div>
        )}

        {/* Reactions & Thread Reply Indicator */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {message.reactions?.map((reaction) => {
            const hasReacted = reaction.users.includes(currentUserId);
            return (
              <button
                key={reaction.emoji}
                type="button"
                onClick={() => addReaction(message.id, reaction.emoji)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-colors cursor-pointer ${
                  hasReacted
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                }`}
              >
                <span>{reaction.emoji}</span>
                <span className="font-mono text-[10px]">{reaction.count}</span>
              </button>
            );
          })}

          {/* Quick Reaction Add on Click */}
          <button
            type="button"
            onClick={() => addReaction(message.id, '👍')}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
            title="React with 👍"
          >
            <Plus className="w-3 h-3" />
          </button>

          {/* Thread Reply Link (if not inside thread panel) */}
          {!isInsideThread && message.replyCount !== undefined && message.replyCount > 0 && (
            <button
              type="button"
              onClick={() => openThread(message)}
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:underline cursor-pointer"
            >
              <MessageSquare className="w-3 h-3 text-neutral-500" />
              <span>
                {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Hover Floating Action Bar */}
      <div className="absolute right-4 -top-3 hidden group-hover:flex items-center gap-0.5 p-0.5 rounded-lg bg-white dark:bg-[#1C1E24] border border-neutral-200 dark:border-neutral-700 shadow-md z-10">
        {/* Quick Reactions */}
        <button
          type="button"
          onClick={() => addReaction(message.id, '👍')}
          className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="React 👍"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => addReaction(message.id, '🚀')}
          className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="React 🚀"
        >
          <Rocket className="w-3.5 h-3.5" />
        </button>

        {/* Reply in Thread */}
        {!isInsideThread && (
          <button
            type="button"
            onClick={() => openThread(message)}
            className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Reply in thread"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Ask AUREN about this message */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAiMenu(!showAiMenu)}
            className="p-1 rounded text-purple-600 dark:text-purple-400 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors"
            title="Ask AUREN about this message"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {showAiMenu && (
            <div className="absolute right-0 top-full mt-1 w-52 rounded-lg bg-white dark:bg-[#1C1E24] border border-neutral-200 dark:border-neutral-700 shadow-lg py-1 z-20">
              <button
                type="button"
                onClick={() => {
                  setShowAiMenu(false);
                  onAskAurenMessage && onAskAurenMessage(message, 'Summarize this discussion and identify key points.');
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Summarize message
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAiMenu(false);
                  onAskAurenMessage && onAskAurenMessage(message, 'Identify all decisions and action items in this message.');
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Identify decisions
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAiMenu(false);
                  onAskAurenMessage && onAskAurenMessage(message, 'Find related documentation and compliance policies for this topic.');
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Find related knowledge
              </button>
            </div>
          )}
        </div>

        {/* Create Decision from message */}
        {onCreateDecisionFromMessage && (
          <button
            type="button"
            onClick={() => onCreateDecisionFromMessage(message)}
            className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Record Decision from message"
          >
            <Scale className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Create Action Item from message */}
        {onCreateActionItemFromMessage && (
          <button
            type="button"
            onClick={() => onCreateActionItemFromMessage(message)}
            className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Create Action Item from message"
          >
            <ListTodo className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Save message */}
        <button
          type="button"
          onClick={() => toggleSaveMessage(message.id)}
          className={`p-1 rounded transition-colors ${
            message.isSaved
              ? 'text-amber-500 hover:bg-amber-100/50'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title={message.isSaved ? 'Remove from saved' : 'Save message'}
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>

        {/* Copy text */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Copy text"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
