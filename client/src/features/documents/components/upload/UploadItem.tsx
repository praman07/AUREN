import React from 'react';
import { useUploadStore, UploadFile } from '../../store/useUploadStore';
import { FileText, File, X, RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const UploadItem: React.FC<{ item: UploadFile }> = ({ item }) => {
  const { removeFile, retryUpload, cancelUpload } = useUploadStore();
  const { file, progress, status, errorMessage } = item;

  const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

  const isUploading = status === 'Uploading';
  const isFailed = status === 'Failed';
  const isUploaded = status === 'Uploaded';

  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-white shadow-sm mb-2 group">
      {/* File Icon */}
      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0 border border-border">
        <FileText size={16} className="text-muted-foreground" />
      </div>

      {/* Details & Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-foreground truncate pr-4" title={file.name}>
            {file.name}
          </p>
          <span className="text-[10px] text-muted-foreground font-mono shrink-0">{sizeMB} MB</span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="flex items-center gap-2">
          {isUploading && (
            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
              />
            </div>
          )}
          
          <div className="flex items-center gap-1 text-[11px] font-medium">
            {isUploading && <span className="text-primary">{progress}% • {status}</span>}
            {isFailed && <span className="text-red-600 flex items-center gap-1"><AlertCircle size={12}/> {errorMessage}</span>}
            {isUploaded && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={12}/> Complete</span>}
            {status === 'Cancelled' && <span className="text-muted-foreground">Cancelled</span>}
            {status === 'Queued' && <span className="text-muted-foreground">Queued...</span>}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {isFailed && (
          <button 
            onClick={() => retryUpload(item.id)}
            className="p-1.5 hover:bg-muted rounded text-muted-foreground transition-colors"
            title="Retry"
          >
            <RotateCw size={14} />
          </button>
        )}
        {isUploading ? (
          <button 
            onClick={() => cancelUpload(item.id)}
            className="p-1.5 hover:bg-muted rounded text-muted-foreground transition-colors"
            title="Cancel"
          >
            <X size={14} />
          </button>
        ) : (
          <button 
            onClick={() => removeFile(item.id)}
            className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-muted-foreground transition-colors"
            title="Remove"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
