import React from 'react';
import { ArrowUp, Sparkles, Paperclip, FileText, CheckCircle2, Loader2, X, Zap, Brain, BookOpen } from 'lucide-react';
import { chatService } from '../services/chatService';
import { useChatStore } from '../store/useChatStore';
import { useUploadDocument, useDocument } from '../../documents/api/documentQueries';

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'indexing' | 'completed' | 'error';
  documentId?: string;
}

export const ChatInput: React.FC = () => {
  const [input, setInput] = React.useState('');
  const [activeUpload, setActiveUpload] = React.useState<UploadingFile | null>(null);
  const { isStreaming, executionMode, setExecutionMode, useKnowledgeBase, setUseKnowledgeBase } = useChatStore();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const uploadDocumentMutation = useUploadDocument();

  const activeDocId = activeUpload?.status === 'indexing' ? activeUpload.documentId || '' : '';
  const { data: polledDoc } = useDocument(activeDocId);

  React.useEffect(() => {
    if (!polledDoc || activeUpload?.status !== 'indexing') return;

    const latestJob = polledDoc.jobs && polledDoc.jobs.length > 0 ? polledDoc.jobs[0] : null;
    const jobStatus = latestJob?.status;

    if (jobStatus === 'READY' || jobStatus === 'COMPLETED') {
      setActiveUpload(prev => prev ? { ...prev, progress: 100, status: 'completed' } : null);
    } else if (jobStatus === 'FAILED' || jobStatus === 'PARTIALLY_FAILED') {
      setActiveUpload(prev => prev ? { ...prev, progress: 0, status: 'error' } : null);
    }
  }, [polledDoc, activeUpload?.status]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setActiveUpload({
      file,
      progress: 25,
      status: 'uploading'
    });

    try {
      // Step 1: Upload document
      const result: any = await uploadDocumentMutation.mutateAsync(file);
      const docId = result?.data?.documentId || result?.documentId || result?.data?.id || result?.id;

      setActiveUpload({
        file,
        progress: 50,
        status: 'indexing',
        documentId: docId
      });
    } catch (err) {
      console.error('File upload failed:', err);
      setActiveUpload({
        file,
        progress: 0,
        status: 'error'
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const clearUpload = () => {
    setActiveUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    let queryText = input.trim();
    chatService.streamChat(queryText);
    setInput('');
    clearUpload();
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const setSuggestion = (text: string) => {
    setInput(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="p-4 pb-28 flex-shrink-0 relative z-20 bg-white">
      {/* Contextual Suggestion Chips (Light Glass) */}
      <div className="flex flex-wrap gap-2 justify-center mb-4 max-w-3xl mx-auto opacity-0 animate-spring-up stagger-1">
        <button
          type="button"
          onClick={() => setSuggestion('What is our leave policy?')}
          className="px-4 py-2 rounded-full text-xs text-slate-700 font-medium transition-colors duration-200 liquid-glass-chip-light hover:bg-slate-100 hover:text-slate-900"
        >
          What is our leave policy?
        </button>
        <button
          type="button"
          onClick={() => setSuggestion('How do I request equipment?')}
          className="px-4 py-2 rounded-full text-xs text-slate-700 font-medium transition-colors duration-200 liquid-glass-chip-light hover:bg-slate-100 hover:text-slate-900"
        >
          How do I request equipment?
        </button>
        <button
          type="button"
          onClick={() => setSuggestion('What are the latest security requirements?')}
          className="px-4 py-2 rounded-full text-xs text-slate-700 font-medium transition-colors duration-200 liquid-glass-chip-light hover:bg-slate-100 hover:text-slate-900"
        >
          What are the latest security requirements?
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.txt,.docx,.csv,.md,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff,.svg,image/*"
      />

      {/* AI Composer Field with Light Mode Liquid Glass */}
      <div className="max-w-3xl mx-auto relative flex flex-col gap-2">
        {/* Toolbar Row: Execution Mode + KB Toggle */}
        <div className="flex items-center justify-between px-1.5 mb-1 select-none">
          <div className="flex items-center gap-1 p-0.5 bg-slate-200/60 rounded-full border border-slate-200/50 shadow-xs backdrop-blur-xs">
            <button
              type="button"
              onClick={() => setExecutionMode('FAST')}
              disabled={isStreaming}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all duration-200 ${
                executionMode === 'FAST'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/30'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/20'
              }`}
            >
              <Zap size={11} className={executionMode === 'FAST' ? 'text-blue-500 font-bold' : 'text-slate-400'} />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setExecutionMode('DEEP')}
              disabled={isStreaming}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all duration-200 ${
                executionMode === 'DEEP'
                  ? 'bg-white text-purple-600 shadow-xs border border-slate-200/30'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/20'
              }`}
            >
              <Brain size={11} className={executionMode === 'DEEP' ? 'text-purple-500' : 'text-slate-400'} />
              <span>Reasoning</span>
            </button>
          </div>

          {/* Org Knowledge Base Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="kb-toggle-btn"
              onClick={() => setUseKnowledgeBase(!useKnowledgeBase)}
              disabled={isStreaming}
              title={useKnowledgeBase ? 'Org Knowledge Base: ON — searching org docs + personal docs for every query' : 'Org Knowledge Base: OFF — personal docs always active'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all duration-200 border ${
                useKnowledgeBase
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm shadow-emerald-100'
                  : 'bg-slate-100/70 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              } disabled:opacity-40`}
            >
              <BookOpen
                size={11}
                className={useKnowledgeBase ? 'text-emerald-600' : 'text-slate-400'}
              />
              <span>{useKnowledgeBase ? 'Org KB: On' : 'Org KB: Off'}</span>
            </button>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              {useKnowledgeBase
                ? 'Searching org docs + personal docs for every query'
                : 'Personal RAG active (Org KB off)'}
            </span>
          </div>
        </div>
        {/* Attachment Card & Indexing Feedback */}
        {activeUpload && (
          <div className="flex items-center justify-between p-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 shadow-xs animate-fadeIn">
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-blue-600 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 truncate max-w-[240px]">
                  {activeUpload.file.name}
                </span>
                <span className="text-[10px] text-slate-500">
                  {activeUpload.status === 'uploading' && 'Uploading document...'}
                  {activeUpload.status === 'indexing' && 'Indexing RAG vectors...'}
                  {activeUpload.status === 'completed' && 'Ready for RAG Querying'}
                  {activeUpload.status === 'error' && 'Upload failed'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeUpload.status === 'uploading' || activeUpload.status === 'indexing' ? (
                <div className="flex items-center gap-2 text-blue-600 font-medium">
                  <Loader2 size={14} className="animate-spin" />
                  <span>{activeUpload.progress}%</span>
                </div>
              ) : activeUpload.status === 'completed' ? (
                <div className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 size={14} />
                  <span>Indexed</span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={clearUpload}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl overflow-hidden liquid-glass-input-light p-2 flex items-end gap-2 border border-slate-200/80 shadow-lg">
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming || !!activeUpload}
            title="Attach internal document for RAG indexing"
            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors duration-200 mb-1"
          >
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your organization..."
            className="flex-1 max-h-[200px] min-h-[48px] bg-transparent resize-none outline-none text-sm text-slate-900 placeholder:text-slate-400 p-3 leading-relaxed font-sans"
            rows={1}
            disabled={isStreaming}
          />
          
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming}
            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors duration-200 shadow-md shadow-blue-600/25 mb-1"
          >
            {isStreaming ? (
              <Sparkles size={18} className="animate-pulse text-white" />
            ) : (
              <ArrowUp size={18} className="text-white font-bold" />
            )}
          </button>
        </div>
      </div>
      <div className="text-center mt-3">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Auren AI can make mistakes. Verify critical facts.</span>
      </div>
    </div>
  );
};


