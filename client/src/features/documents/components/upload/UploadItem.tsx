import React, { useEffect } from 'react';
import { useUploadStore } from '../../store/useUploadStore';
import type { UploadFile } from '../../store/useUploadStore';
import { FileText, X, RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUploadDocument } from '../../api/documentQueries';

export const UploadItem: React.FC<{ item: UploadFile }> = ({ item }) => {
  const { removeFile, retryUpload, cancelUpload, updateFile } = useUploadStore();
  const { file, progress, status, errorMessage } = item;
  const { mutateAsync: uploadDocument } = useUploadDocument();

  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

  const isUploading = status === 'Uploading';
  const isFailed = status === 'Failed';
  const isUploaded = status === 'Uploaded';

  useEffect(() => {
    if (status === 'Queued') {
      updateFile(item.id, { status: 'Uploading', progress: 50 });
      uploadDocument(file)
        .then((data) => {
          updateFile(item.id, { status: 'Uploaded', progress: 100, documentId: data.documentId });
        })
        .catch((err) => {
          updateFile(item.id, { status: 'Failed', progress: 0, errorMessage: err.message || 'Upload failed' });
        });
    }
  }, [status, file, item.id, updateFile, uploadDocument]);

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
