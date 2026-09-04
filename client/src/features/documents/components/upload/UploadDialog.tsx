import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUploadStore } from '../../store/useUploadStore';
import { DropzoneArea } from './DropzoneArea';
import { UploadQueue } from './UploadQueue';

export const UploadDialog: React.FC = () => {
  const { isOpen, setIsOpen, files, targetScope, lockedScope, setTargetScope } = useUploadStore();

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
            <p className="text-xs text-muted-foreground mt-0.5">Documents will be processed securely into vector storage.</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Scope Selection */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-700">Target Scope:</span>
            {lockedScope && (
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-medium rounded-full border border-amber-200">
                Route Enforced ({lockedScope === 'PERSONAL' ? 'Personal' : 'Organization'})
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className={`inline-flex items-center gap-1.5 text-xs text-slate-700 ${lockedScope ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="radio"
                name="targetScope"
                value="ORGANIZATION"
                checked={targetScope === 'ORGANIZATION'}
                disabled={Boolean(lockedScope)}
                onChange={() => setTargetScope('ORGANIZATION')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-indigo-900">Org Knowledge</span>
            </label>

            <label className={`inline-flex items-center gap-1.5 text-xs text-slate-700 ${lockedScope ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="radio"
                name="targetScope"
                value="PERSONAL"
                checked={targetScope === 'PERSONAL'}
                disabled={Boolean(lockedScope)}
                onChange={() => setTargetScope('PERSONAL')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-emerald-900">Personal Vault</span>
            </label>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1 overflow-hidden">
          <DropzoneArea />
          <UploadQueue />
        </div>
      </div>
    </div>
  );
};
