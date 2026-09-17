import React, { useState, useEffect } from 'react';
import { X, Scale, FileText, Video } from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { AurenDocument } from '../../types';
import { Button } from '../ui/Button';

interface CreateDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: AurenDocument[];
  initialTitle?: string;
  initialText?: string;
  initialMeetingId?: string;
  initialMeetingTitle?: string;
}

export const CreateDecisionModal: React.FC<CreateDecisionModalProps> = ({
  isOpen,
  onClose,
  documents,
  initialTitle = '',
  initialText = '',
  initialMeetingId,
  initialMeetingTitle,
}) => {
  const { createDecision } = useCollaboration();

  const [title, setTitle] = useState(initialTitle);
  const [decisionText, setDecisionText] = useState(initialText);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setDecisionText(initialText);
    }
  }, [isOpen, initialTitle, initialText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !decisionText.trim()) return;

    const sources = documents
      .filter((d) => selectedDocIds.includes(d.id))
      .map((d) => ({ id: d.id, title: d.title }));

    createDecision({
      title,
      decisionText,
      sources,
      status: 'Approved',
      meetingId: initialMeetingId,
      meetingTitle: initialMeetingTitle,
    });

    onClose();
  };

  const toggleDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#15171C] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Record Organizational Decision
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Decision Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Adopt AVX-512 Vector Quantization"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Ratified Determination & Technical Rationale
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain what was decided, why, and the technical scope..."
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              className="w-full p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Link Referenced Knowledge
            </label>
            <div className="max-h-28 overflow-y-auto space-y-1 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
              {documents.slice(0, 5).map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    className={`p-1.5 rounded cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium'
                        : 'hover:bg-neutral-200/60 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className="truncate">{doc.title}</span>
                    <span className="text-[10px] font-mono text-neutral-400">{doc.filename}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Scale className="w-3.5 h-3.5" />}
            >
              Ratify Decision
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
