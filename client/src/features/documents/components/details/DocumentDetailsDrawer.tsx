import React, { useEffect } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useDocument } from '../../api/documentQueries';
import { X, Star, MoreHorizontal, Download, FolderInput, Share2, Trash2 } from 'lucide-react';
import { OverviewSection, SecuritySection, AISection } from './sections/MetadataSections';
import { VersionHistory } from './sections/VersionHistory';
import { ActivityTimeline } from './sections/ActivityTimeline';

export const DocumentDetailsDrawer: React.FC = () => {
  const { selectedDocumentId, setSelectedDocument } = useDocumentStore();
  const { data: details, isLoading } = useDocument(selectedDocumentId || '');

  // Handle Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDocument(null);
    };
    if (selectedDocumentId) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDocumentId, setSelectedDocument]);

  return (
    <>
      {/* Backdrop for mobile, invisible on desktop but captures clicks */}
      {selectedDocumentId && (
        <div 
          className="fixed inset-0 z-40 bg-transparent xl:bg-transparent"
          onClick={() => setSelectedDocument(null)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-[400px] bg-white border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          selectedDocumentId ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm animate-pulse">
            Loading details...
          </div>
        ) : details ? (
          <>
            {/* Header */}
            <div className="flex flex-col p-4 border-b border-border bg-slate-50 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <button className="p-1 hover:bg-slate-200 rounded text-muted-foreground transition-colors">
                  <Star size={16} />
                </button>
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-slate-200 rounded text-muted-foreground transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                  <button 
                    onClick={() => setSelectedDocument(null)}
                    className="p-1 hover:bg-slate-200 rounded text-muted-foreground transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <h2 className="text-base font-semibold text-foreground truncate pr-2" title={details.title}>
                {details.title}
              </h2>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <OverviewSection doc={details} />
              <SecuritySection doc={details} />
              <AISection doc={details} />
              <VersionHistory doc={details} />
              <ActivityTimeline doc={details} />
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border bg-white flex flex-col gap-2 shrink-0">
              <div className="flex gap-2">
                <button className="flex-1 h-8 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  <Download size={14} /> Download
                </button>
                <button className="flex-1 h-8 border border-border bg-white text-foreground rounded-md text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                  <Share2 size={14} /> Share
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
                <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <FolderInput size={12} /> Move
                </button>
                <button className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No document selected
          </div>
        )}
      </div>
    </>
  );
};
