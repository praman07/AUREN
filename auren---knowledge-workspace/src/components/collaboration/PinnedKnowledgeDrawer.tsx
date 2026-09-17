import React, { useState } from 'react';
import {
  X,
  Paperclip,
  Plus,
  FileText,
  Code2,
  ExternalLink,
  Shield,
  Trash2,
  Search,
} from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { useAuth } from '../../context/AuthContext';
import { AurenDocument } from '../../types';

interface PinnedKnowledgeDrawerProps {
  documents: AurenDocument[];
  onOpenDocument?: (docId: string) => void;
  onOpenRbacPolicy?: () => void;
}

export const PinnedKnowledgeDrawer: React.FC<PinnedKnowledgeDrawerProps> = ({
  documents,
  onOpenDocument,
  onOpenRbacPolicy,
}) => {
  const {
    activeChannel,
    isPinnedKnowledgeOpen,
    setIsPinnedKnowledgeOpen,
    pinKnowledgeToChannel,
    unpinKnowledgeFromChannel,
  } = useCollaboration();
  const { user } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isPinnedKnowledgeOpen || !activeChannel) return null;

  const isPrivileged = Boolean(
    user?.role === 'super_admin' ||
    user?.isSuperAdmin ||
    user?.role === 'dept_head' ||
    user?.isDepartmentHead
  );

  const pinnedDocs = (documents || []).filter((d) =>
    (activeChannel.pinnedDocumentIds || []).includes(d.id)
  );

  const availableDocsToPin = (documents || []).filter(
    (d) =>
      !(activeChannel.pinnedDocumentIds || []).includes(d.id) &&
      (d.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        d.filename.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <aside className="w-80 lg:w-96 h-full bg-white dark:bg-[#121316] border-l border-neutral-200/70 dark:border-neutral-800/80 flex flex-col select-none shrink-0 z-20">
      {/* Header */}
      <div className="h-13 px-4 border-b border-neutral-200/70 dark:border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-neutral-500" />
          <span className="text-xs font-bold text-neutral-900 dark:text-white">
            Pinned Knowledge
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            ({pinnedDocs.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isPrivileged && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              title="Pin Knowledge Document"
              className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsPinnedKnowledgeOpen(false)}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pinned Documents List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {pinnedDocs.length === 0 ? (
          <div className="text-center py-12 px-4 text-neutral-400 space-y-2">
            <Paperclip className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
              No pinned knowledge yet
            </p>
            <p className="text-[11px] text-neutral-400">
              Pin core architectural RFCs, security policies, and schemas to keep them accessible to channel members.
            </p>
            {isPrivileged && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold cursor-pointer"
              >
                Pin Knowledge
              </button>
            )}
          </div>
        ) : (
          pinnedDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800 space-y-2 transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="p-1.5 rounded-md bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 mt-0.5 shrink-0">
                    {doc.type === 'code' ? (
                      <Code2 className="w-3.5 h-3.5" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {doc.title}
                    </h4>
                    <span className="text-[10px] font-mono text-neutral-400 block truncate">
                      {doc.filename}
                    </span>
                  </div>
                </div>

                {isPrivileged && (
                  <button
                    type="button"
                    onClick={() => unpinKnowledgeFromChannel(activeChannel.id, doc.id)}
                    title="Unpin from channel"
                    className="text-neutral-400 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                <span>{doc.fileSize}</span>
                <span>•</span>
                <span className="capitalize">{doc.scope} scope</span>
                {doc.accessPolicy?.minClearance && (
                  <>
                    <span>•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      {doc.accessPolicy.minClearance}
                    </span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-neutral-200/50 dark:border-neutral-800/60">
                {onOpenDocument && (
                  <button
                    type="button"
                    onClick={() => onOpenDocument(doc.id)}
                    className="flex-1 py-1 rounded bg-white dark:bg-[#1A1C22] border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                {onOpenRbacPolicy && (
                  <button
                    type="button"
                    onClick={onOpenRbacPolicy}
                    className="py-1 px-2.5 rounded text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Shield className="w-3 h-3 text-neutral-400" />
                    <span>Policy</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pin Knowledge Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-30">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-700 shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                Pin Document to #{activeChannel.name}
              </span>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search knowledge repository..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1">
              {availableDocsToPin.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    pinKnowledgeToChannel(activeChannel.id, doc.id);
                    setShowAddModal(false);
                  }}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                      {doc.title}
                    </span>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
