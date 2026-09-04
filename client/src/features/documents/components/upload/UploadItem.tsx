import React, { useEffect } from 'react';
import { useUploadStore } from '../../store/useUploadStore';
import type { UploadFile } from '../../store/useUploadStore';
import { FileText, X, RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUploadDocument, useDocument } from '../../api/documentQueries';

export const UploadItem: React.FC<{ item: UploadFile }> = ({ item }) => {
  const { removeFile, retryUpload, cancelUpload, updateFile, targetScope } = useUploadStore();
  const { file, status, errorMessage, documentId } = item;
  const { mutateAsync: uploadDocument } = useUploadDocument();

  const activeDocId = (status === 'Uploading' || status === 'Uploaded') && documentId ? documentId : '';
  const { data: polledDoc } = useDocument(activeDocId);

  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

  const isUploading = status === 'Uploading';
  const isFailed = status === 'Failed';
  const isUploaded = status === 'Uploaded';

  useEffect(() => {
    if (status === 'Queued') {
      updateFile(item.id, { status: 'Uploading', progress: 50 });
      uploadDocument({ file, scope: targetScope })
        .then((res: any) => {
          const docId = res?.data?.id || res?.id || res?.data?.documentId || res?.documentId;
          const uploadStatus = res?.data?.status || res?.status;
          if (uploadStatus === 'EXISTS') {
            updateFile(item.id, { status: 'Uploaded', progress: 100, documentId: docId });
          } else {
            updateFile(item.id, { status: 'Uploading', progress: 75, documentId: docId });
          }
        })
        .catch((err: any) => {
          updateFile(item.id, { status: 'Failed', progress: 0, errorMessage: err.message || 'Upload failed' });
        });
    }
  }, [status, file, item.id, updateFile, uploadDocument]);

  useEffect(() => {
    if (!polledDoc || !documentId) return;

    const jobs = polledDoc.jobs || [];
    const qdrantJob = jobs.find((j: any) => j.queueName === 'qdrant-indexing');
    const failedJob = jobs.find((j: any) => j.status === 'FAILED');

    if (qdrantJob?.status === 'COMPLETED') {
      updateFile(item.id, { status: 'Uploaded', progress: 100 });
    } else if (failedJob) {
      updateFile(item.id, { status: 'Failed', progress: 0, errorMessage: failedJob.error || 'Indexing failed' });
    }
  }, [polledDoc, documentId, item.id, updateFile]);

  // Helper to determine state of each pipeline stage from real backend jobs & document state
  const getStageStatus = (stageName: string): 'completed' | 'processing' | 'pending' | 'failed' => {
    const jobs = polledDoc?.jobs || [];
    const findJob = (qName: string) => jobs.find((j: any) => j.queueName === qName);

    const ocrJob = findJob('ocr');
    const chunkingJob = findJob('chunking');
    const embeddingJob = findJob('embedding');
    const qdrantJob = findJob('qdrant-indexing');

    switch (stageName) {
      case 'Upload':
        // Once documentId exists, HTTP upload has completed
        return documentId || isUploaded ? 'completed' : isUploading ? 'processing' : 'pending';
      case 'Queued':
        if (!documentId && !isUploaded) return 'pending';
        return ocrJob || chunkingJob || embeddingJob || qdrantJob || isUploaded ? 'completed' : 'processing';
      case 'OCR':
        if (ocrJob?.status === 'FAILED') return 'failed';
        if (ocrJob?.status === 'COMPLETED' || chunkingJob || embeddingJob || qdrantJob || isUploaded) return 'completed';
        if (ocrJob?.status === 'PROCESSING') return 'processing';
        return 'pending';
      case 'Chunking':
        if (chunkingJob?.status === 'FAILED') return 'failed';
        if (chunkingJob?.status === 'COMPLETED' || embeddingJob || qdrantJob || isUploaded) return 'completed';
        if (chunkingJob?.status === 'PROCESSING') return 'processing';
        return 'pending';
      case 'Embedding':
        if (embeddingJob?.status === 'FAILED') return 'failed';
        if (embeddingJob?.status === 'COMPLETED' || qdrantJob || isUploaded) return 'completed';
        if (embeddingJob?.status === 'PROCESSING') return 'processing';
        return 'pending';
      case 'Qdrant Indexing':
        if (qdrantJob?.status === 'FAILED') return 'failed';
        if (qdrantJob?.status === 'COMPLETED' || isUploaded) return 'completed';
        if (qdrantJob?.status === 'PROCESSING') return 'processing';
        return 'pending';
      case 'Ready':
        const anyFailed = jobs.some((j: any) => j.status === 'FAILED');
        if (anyFailed) return 'failed';
        if (qdrantJob?.status === 'COMPLETED' || isUploaded) return 'completed';
        return 'pending';
      default:
        return 'pending';
    }
  };

  const stages = [
    { label: 'Upload', key: 'Upload' },
    { label: 'Queued', key: 'Queued' },
    { label: 'OCR', key: 'OCR' },
    { label: 'Chunking', key: 'Chunking' },
    { label: 'Embedding', key: 'Embedding' },
    { label: 'Qdrant', key: 'Qdrant Indexing' },
    { label: 'Ready', key: 'Ready' }
  ];

  return (
    <div className="flex flex-col p-3 border border-border rounded-md bg-white shadow-sm mb-2 group">
      <div className="flex items-center gap-3">
        {/* File Icon */}
        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0 border border-border">
          <FileText size={16} className="text-muted-foreground" />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground truncate pr-4" title={file.name}>
              {file.name}
            </p>
            <span className="text-[10px] text-muted-foreground font-mono shrink-0">{sizeMB} MB</span>
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

      {/* Real Pipeline Stage Stepper */}
      <div className="mt-3 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
          {stages.map((st, idx) => {
            const stState = getStageStatus(st.key);
            return (
              <React.Fragment key={st.key}>
                <div className="flex items-center gap-1 shrink-0">
                  {stState === 'completed' && <CheckCircle2 size={13} className="text-green-600 shrink-0" />}
                  {stState === 'processing' && <RotateCw size={13} className="text-primary animate-spin shrink-0" />}
                  {stState === 'pending' && <span className="w-3 h-3 rounded-full border border-muted-foreground/30 shrink-0" />}
                  {stState === 'failed' && <AlertCircle size={13} className="text-red-600 shrink-0" />}
                  <span className={`text-[11px] font-medium ${
                    stState === 'completed' ? 'text-foreground' :
                    stState === 'processing' ? 'text-primary font-semibold' :
                    stState === 'failed' ? 'text-red-600 font-semibold' :
                    'text-muted-foreground/70'
                  }`}>
                    {st.label}
                  </span>
                </div>
                {idx < stages.length - 1 && (
                  <div className={`h-[1px] flex-1 min-w-[8px] ${stState === 'completed' ? 'bg-green-600/40' : 'bg-border'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error message detail if failed */}
        {isFailed && errorMessage && (
          <div className="mt-1.5 text-[11px] text-red-600 font-mono bg-red-50 p-1.5 rounded border border-red-100 truncate">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};
