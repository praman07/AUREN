import React, { useRef, useEffect } from 'react';
import type { CollaborationMessage } from '../../types/collaboration';
import { MessageItem } from './MessageItem';
import { Hash, Volume2 } from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';

interface MessageListProps {
  messages: CollaborationMessage[];
  onOpenDocument?: (docId: string) => void;
  onOpenRbacPolicy?: () => void;
  onAskAurenMessage?: (msg: CollaborationMessage, prompt: string) => void;
  onCreateDecisionFromMessage?: (msg: CollaborationMessage) => void;
  onCreateActionItemFromMessage?: (msg: CollaborationMessage) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onOpenDocument,
  onOpenRbacPolicy,
  onAskAurenMessage,
  onCreateDecisionFromMessage,
  onCreateActionItemFromMessage,
}) => {
  const { activeChannel, channelSearchQuery } = useCollaboration();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const filteredMessages = channelSearchQuery
    ? (messages || []).filter(
        (m) =>
          m.content.toLowerCase().includes(channelSearchQuery.toLowerCase()) ||
          m.senderName.toLowerCase().includes(channelSearchQuery.toLowerCase()) ||
          m.attachedKnowledge?.some((k) =>
            k.title.toLowerCase().includes(channelSearchQuery.toLowerCase())
          )
      )
    : (messages || []);

  if (filteredMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 flex items-center justify-center mb-3">
          {activeChannel?.type === 'broadcast' ? (
            <Volume2 className="w-6 h-6" />
          ) : (
            <Hash className="w-6 h-6" />
          )}
        </div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {channelSearchQuery
            ? 'No matching messages found'
            : `Welcome to #${activeChannel?.name || 'channel'}`}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
          {channelSearchQuery
            ? `No messages matched "${channelSearchQuery}". Try a different keyword.`
            : activeChannel?.description || 'Start the technical collaboration or attach organizational knowledge below.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-1">
      {filteredMessages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          onOpenDocument={onOpenDocument}
          onOpenRbacPolicy={onOpenRbacPolicy}
          onAskAurenMessage={onAskAurenMessage}
          onCreateDecisionFromMessage={onCreateDecisionFromMessage}
          onCreateActionItemFromMessage={onCreateActionItemFromMessage}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
