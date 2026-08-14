import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, FileText, Clock, ChevronRight } from 'lucide-react';
import { useSemanticSearch } from '../api/searchQueries';
import { useDocumentStore } from '../../documents/store/useDocumentStore';
import { DocumentDetailsDrawer } from '../../documents/components/details/DocumentDetailsDrawer';

export const SearchPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { setSelectedDocument } = useDocumentStore();

  const { data, isLoading, isError, error } = useSemanticSearch(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchQuery(inputValue.trim());
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('semantic-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Semantic Search</h1>
        <p className="text-sm text-muted-foreground mt-1">Search through enterprise knowledge across all accessible documents.</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl liquid-border">
          <div className="liquid-glass-input rounded-2xl p-1.5 flex items-center gap-2">
            <div className="pl-3 text-slate-400">
              <SearchIcon className="h-5 w-5 text-blue-400" />
            </div>
            <input
              id="semantic-search-input"
              type="text"
              className="flex-1 bg-transparent border-none text-sm text-slate-100 placeholder:text-slate-400/70 py-2.5 outline-none"
              placeholder="Ask a question or search for concepts..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] active:scale-95 shadow-md shadow-blue-600/30"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto pr-2 pb-6">
        {isLoading && (
          <div className="flex items-center gap-3 text-muted-foreground text-sm">
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Searching knowledge base...
          </div>
        )}

        {isError && (
          <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm flex items-center gap-2">
            <div className="font-medium">Search failed:</div>
            {(error as any)?.message || 'An unexpected error occurred'}
          </div>
        )}

        {!isLoading && !isError && data && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <span className="font-medium text-foreground">{data.totalFound} results found</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {data.executionTimeMs}ms</span>
            </div>

            {data.chunks.length === 0 ? (
              <div className="p-8 border border-border rounded-lg bg-card text-center flex flex-col items-center">
                <SearchIcon className="h-8 w-8 text-muted-foreground mb-3 opacity-20" />
                <h3 className="text-sm font-medium text-foreground">No matches found</h3>
                <p className="text-xs text-muted-foreground mt-1">Try rephrasing your search or using different keywords.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.chunks.map((chunk) => (
                  <div key={chunk.id} className="p-5 border border-border rounded-lg bg-card hover:border-border/80 transition-colors group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText size={16} className="text-primary" />
                        <span className="font-semibold text-foreground">{chunk.metadata.documentTitle || 'Unknown Document'}</span>
                        {chunk.metadata.page && (
                          <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground font-medium">
                            Page {chunk.metadata.page}
                          </span>
                        )}
                        {chunk.metadata.section && (
                          <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground font-medium">
                            {chunk.metadata.section}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded">
                        Score: {chunk.score.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="text-sm text-foreground/80 leading-relaxed mb-3">
                      {chunk.content}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <div className="text-[10px] text-muted-foreground">
                        Indexed: {new Date(chunk.metadata.createdAt).toLocaleDateString()}
                      </div>
                      <button 
                        onClick={() => setSelectedDocument(chunk.documentId)}
                        className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View Document <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <DocumentDetailsDrawer />
    </div>
  );
};
