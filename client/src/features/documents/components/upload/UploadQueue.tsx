import React from 'react';
import { useUploadStore } from '../../store/useUploadStore';
import { UploadItem } from './UploadItem';

export const UploadQueue: React.FC = () => {
  const { files, clearCompleted } = useUploadStore();

  if (files.length === 0) return null;

  const hasCompleted = files.some(f => f.status === 'Uploaded');

  return (
    <div className="mt-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Upload Queue ({files.length})
        </h3>
        {hasCompleted && (
          <button 
            onClick={clearCompleted}
            className="text-[11px] text-primary hover:underline"
          >
            Clear Completed
          </button>
        )}
      </div>
      
      <div className="overflow-y-auto pr-1 flex-1 min-h-[200px] max-h-[300px]">
        {files.map(file => (
          <UploadItem key={file.id} item={file} />
        ))}
      </div>
    </div>
  );
};
