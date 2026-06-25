import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUploadStore } from '../../store/useUploadStore';
import { DropzoneArea } from './DropzoneArea';
import { UploadQueue } from './UploadQueue';

export const UploadDialog: React.FC = () => {
  const { isOpen, setIsOpen, files } = useUploadStore();

  // Close on Escape if no active uploads
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const hasActiveUploads = files.some(f => f.status === 'Uploading');
        if (!hasActiveUploads) setIsOpen(false);
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, files, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => {
          const hasActiveUploads = files.some(f => f.status === 'Uploading');
          if (!hasActiveUploads) setIsOpen(false);
        }}
      />
      
      {/* Modal Content */}
      <div 
        className="relative bg-white w-full max-w-lg rounded-xl shadow-lg border border-border flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Upload Documents</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Documents will be processed securely.</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex flex-col flex-1 overflow-hidden">
          <DropzoneArea />
          <UploadQueue />
        </div>
      </div>
    </div>
  );
};
