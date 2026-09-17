import React, { useState } from 'react';
import {
  X,
  Volume2,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import type { BroadcastMeta, AttachedKnowledgeItem } from '../../types/collaboration';
import type { AurenDocument } from '../../types';
import { Button } from '../ui/button';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: AurenDocument[];
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  documents,
}) => {
  const { publishBroadcast } = useCollaboration();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<BroadcastMeta['priority']>('policy_update');
  const [requiresAcknowledgement, setRequiresAcknowledgement] = useState(true);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(['doc_sec_002']);
  const [audience, setAudience] = useState('All Organizational Personnel');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const attachedDocs: AttachedKnowledgeItem[] = documents
      .filter((d) => selectedDocIds.includes(d.id))
      .map((d) => ({
        id: d.id,
        title: d.title,
        filename: d.filename,
        type: d.type,
        department: d.scope === 'organization' ? 'Executive Governance' : 'Personal',
        minClearance: d.accessPolicy?.minClearance || 'L4_Senior',
        summary: d.title,
        fileSize: d.fileSize,
      }));

    publishBroadcast({
      title,
      message,
      priority,
      requiresAcknowledgement,
      attachedDocs,
      audience,
    });

    onClose();
  };

  const toggleDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#15171C] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Super Admin Official Broadcast
              </h3>
              <p className="text-xs text-neutral-400">
                Publish executive governance mandate to #broadcast
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Broadcast Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mandatory Security Policy Directive v4.2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Directive Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none"
              >
                <option value="policy_update">Mandatory Policy Update</option>
                <option value="critical_alert">Critical Alert (P0)</option>
                <option value="announcement">Organization Announcement</option>
                <option value="required_acknowledgement">Governance Certification</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Target Audience
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Directive Content
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detail the mandatory policy requirements, compliance timeline, and department obligations..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none resize-none focus:ring-1 focus:ring-neutral-400 leading-relaxed"
            />
          </div>

          {/* Attach Official Policy Documents */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
              Attach Official Policy Documents
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
              {documents.slice(0, 5).map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    className={`p-2 rounded cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                        : 'hover:bg-neutral-200/50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate font-medium">{doc.title}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60 shrink-0">{doc.filename}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Acknowledgement Requirement Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            <input
              type="checkbox"
              id="reqAck"
              checked={requiresAcknowledgement}
              onChange={(e) => setRequiresAcknowledgement(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="reqAck" className="text-xs cursor-pointer">
              <span className="font-semibold text-neutral-900 dark:text-white block">
                Require Mandatory Member Acknowledgement
              </span>
              <span className="text-[11px] text-neutral-400">
                Tracks individual personnel read-receipts and compliance acknowledgement metrics.
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Volume2 className="w-3.5 h-3.5" />}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Publish Broadcast
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
