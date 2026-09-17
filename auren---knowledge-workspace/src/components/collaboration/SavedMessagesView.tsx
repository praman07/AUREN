import React from 'react';
import { Bookmark, MessageSquare, ArrowRight, Trash2 } from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { MessageItem } from './MessageItem';

interface SavedMessagesViewProps {
  onOpenDocument?: (docId: string) => void;
  onOpenRbacPolicy?: () => void;
  onCloseSavedView?: () => void;
}

export const SavedMessagesView: React.FC<SavedMessagesViewProps> = ({
  onOpenDocument,
  onOpenRbacPolicy,
  onCloseSavedView,
}) => {
  const { savedMessages, toggleSaveMessage, selectChannel } = useCollaboration();

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0E0F12] select-none">
      <div className="h-13 px-4 border-b border-neutral-200/70 dark:border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
            Saved Knowledge & Messages
          </h2>
          <span className="text-xs font-mono text-neutral-400">({savedMessages.length})</span>
        </div>

        {onCloseSavedView && (
          <button
            type="button"
            onClick={onCloseSavedView}
            className="px-2.5 py-1 rounded text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Back to Channels
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {savedMessages.length === 0 ? (
          <div className="text-center py-16 px-4 text-neutral-400 space-y-2">
            <Bookmark className="w-10 h-10 mx-auto opacity-40 text-amber-500" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No saved items
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Hover any message in collaboration channels and click the bookmark icon to save technical snippets, decisions, and instructions here.
            </p>
          </div>
        ) : (
          savedMessages.map((msg) => (
            <div
              key={msg.id}
              className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800 space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-neutral-400 pb-1 border-b border-neutral-200/50 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    selectChannel(msg.channelId);
                    onCloseSavedView && onCloseSavedView();
                  }}
                  className="font-medium hover:underline text-neutral-600 dark:text-neutral-300 flex items-center gap-1"
                >
                  <span>Go to #{msg.channelId}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleSaveMessage(msg.id)}
                  className="hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <MessageItem
                message={msg}
                onOpenDocument={onOpenDocument}
                onOpenRbacPolicy={onOpenRbacPolicy}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
