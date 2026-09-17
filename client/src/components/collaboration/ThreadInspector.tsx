import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Sparkles,
  Scale,
  Send,
} from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { MessageItem } from './MessageItem';
import type { AurenDocument } from '../../types';

interface ThreadInspectorProps {
  documents: AurenDocument[];
  onOpenDocument?: (docId: string) => void;
  onOpenRbacPolicy?: () => void;
}

export const ThreadInspector: React.FC<ThreadInspectorProps> = ({
  documents: _documents,
  onOpenDocument,
  onOpenRbacPolicy,
}) => {
  const {
    activeThreadRootMessage,
    threadMessages,
    closeThread,
    sendThreadReply,
    sendAurenInquiry,
  } = useCollaboration();

  const [replyText, setReplyText] = useState('');

  if (!activeThreadRootMessage) return null;

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    sendThreadReply(activeThreadRootMessage.id, replyText);
    setReplyText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <aside className="w-80 lg:w-96 h-full bg-white dark:bg-[#121316] border-l border-neutral-200/70 dark:border-neutral-800/80 flex flex-col select-none shrink-0 z-20">
      {/* Header */}
      <div className="h-13 px-4 border-b border-neutral-200/70 dark:border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-bold text-neutral-900 dark:text-white">
            Thread Discussion
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            ({threadMessages.length} replies)
          </span>
        </div>
        <button
          type="button"
          onClick={closeThread}
          className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Thread Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Root Message Box */}
        <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
            Original Post
          </span>
          <MessageItem
            message={activeThreadRootMessage}
            onOpenDocument={onOpenDocument}
            onOpenRbacPolicy={onOpenRbacPolicy}
            isInsideThread={true}
          />
        </div>

        {/* Quick Thread AI Actions */}
        <div className="flex items-center gap-1.5 flex-wrap px-1">
          <button
            type="button"
            onClick={() =>
              sendAurenInquiry(
                'Summarize this thread and identify any unresolved action items or technical decisions.',
                undefined,
                activeThreadRootMessage
              )
            }
            className="px-2 py-1 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Summarize Thread</span>
          </button>
          <button
            type="button"
            onClick={() =>
              sendAurenInquiry(
                'Identify technical decisions ratified in this thread.',
                undefined,
                activeThreadRootMessage
              )
            }
            className="px-2 py-1 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Scale className="w-3 h-3" />
            <span>Extract Decisions</span>
          </button>
        </div>

        {/* Replies List */}
        <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          {threadMessages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onOpenDocument={onOpenDocument}
              onOpenRbacPolicy={onOpenRbacPolicy}
              isInsideThread={true}
            />
          ))}
        </div>
      </div>

      {/* Thread Composer */}
      <div className="p-3 border-t border-neutral-200/70 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#16171B]">
        <div className="flex items-center gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply in thread... (Enter to send)"
            rows={2}
            className="flex-1 bg-white dark:bg-[#1E2026] p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none resize-none focus:ring-1 focus:ring-neutral-400"
          />
          <button
            type="button"
            onClick={handleSendReply}
            disabled={!replyText.trim()}
            className="p-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer self-end"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
