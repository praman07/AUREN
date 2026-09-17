import React, { useEffect, useRef } from 'react';
import {
  X,
  FileText,
  GitBranch,
  Globe,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import type { SourceCitation } from '../../types';

interface SourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  citations: SourceCitation[];
  highlightedTitleOrId?: string | null;
  onOpenDocument?: (docId: string, title?: string) => void;
}

export const SourceDrawer: React.FC<SourceDrawerProps> = ({
  isOpen,
  onClose,
  citations,
  highlightedTitleOrId,
  onOpenDocument,
}) => {
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Auto-scroll to highlighted citation if opened via inline link
  useEffect(() => {
    if (isOpen && highlightedTitleOrId) {
      const match = citations.find(
        (c) =>
          c.id === highlightedTitleOrId ||
          c.title.toLowerCase().includes(highlightedTitleOrId.toLowerCase()) ||
          highlightedTitleOrId.toLowerCase().includes(c.title.toLowerCase())
      );
      if (match && cardRefs.current[match.id]) {
        cardRefs.current[match.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isOpen, highlightedTitleOrId, citations]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/30 dark:bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer */}
      <div className="fixed top-0 right-0 z-50 h-screen w-88 max-w-[90vw] bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-xl flex flex-col transition-transform duration-200 ease-out select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Sources
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {citations.length} {citations.length === 1 ? 'source' : 'sources'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close sources drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Citations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {citations.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-400">
              No sources cited in this response yet.
            </div>
          ) : (
            citations.map((cit) => {
              const isHighlighted =
                highlightedTitleOrId &&
                (cit.id === highlightedTitleOrId ||
                  cit.title.toLowerCase().includes(highlightedTitleOrId.toLowerCase()) ||
                  highlightedTitleOrId.toLowerCase().includes(cit.title.toLowerCase()));

              // Parse sections from snippet
              const sections = cit.snippet
                ? cit.snippet.split('\n').filter((s) => s.trim().length > 0)
                : [];

              return (
                <div
                  key={cit.id}
                  ref={(el) => {
                    cardRefs.current[cit.id] = el;
                  }}
                  className={`p-3.5 rounded-lg border transition-colors ${
                    isHighlighted
                      ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-700'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  {/* Top Bar: Title & Confidence */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {cit.type === 'github' ? (
                        <GitBranch className="w-4 h-4 text-blue-500 shrink-0" />
                      ) : cit.type === 'web' ? (
                        <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {cit.title}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                      {(cit.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Sections or Snippet */}
                  <div className="mt-3 space-y-1 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {sections.length > 0 ? (
                      sections.map((sec, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-1.5">
                          <span className="text-neutral-400 select-none">•</span>
                          <span>{sec}</span>
                        </div>
                      ))
                    ) : (
                      <p className="line-clamp-3 text-neutral-500">{cit.snippet}</p>
                    )}
                  </div>

                  {/* Grounded Internal Asset Badge & Action */}
                  <div className="mt-3.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      {cit.repo ? `${cit.repo}` : 'Grounded Internal Asset'}
                    </span>

                    {cit.documentId && onOpenDocument && (
                      <button
                        type="button"
                        onClick={() => onOpenDocument(cit.documentId!, cit.title)}
                        className="text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        title="View document in library"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
