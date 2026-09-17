import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  MessageSquare,
  Code2,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';
import type { SearchResult, Scope, AurenDocument } from '../../types';
import { Badge } from '../ui/Badge';


interface SearchViewProps {
  documents: AurenDocument[];
  onOpenDocument: (doc: AurenDocument) => void;
  onOpenConversation: (convId: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  documents,
  onOpenDocument,
  onOpenConversation,
}) => {
  const [query, setQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<Scope>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await api.search(query, scopeFilter, typeFilter);
        setResults(data.results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, scopeFilter, typeFilter]);

  const handleResultClick = (r: SearchResult) => {
    if (r.documentId) {
      const doc = documents.find((d) => d.id === r.documentId);
      if (doc) onOpenDocument(doc);
    } else if (r.type === 'conversation') {
      const convId = r.id.replace('sr_conv_', '');
      onOpenConversation(convId);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Universal Knowledge Search
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Query across personal notes, team repositories, documents, and discussions.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for architecture specs, AST chunking, Qdrant vectors, policies..."
          autoFocus
          className="w-full bg-white dark:bg-[#141518] text-sm md:text-base text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 rounded-xl border border-neutral-200/80 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-all pl-10 pr-4 py-3 shadow-2xs"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-neutral-200/60 dark:border-neutral-800/80 text-xs">
        <span className="text-neutral-400 font-medium mr-1">Filter by:</span>

        {/* Scope selector */}
        <div className="flex items-center rounded-lg bg-neutral-100 dark:bg-[#16171B] p-0.5 border border-neutral-200/60 dark:border-neutral-800/80">
          {(['all', 'personal', 'organization'] as Scope[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScopeFilter(s)}
              className={`px-2.5 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                scopeFilter === s
                  ? 'bg-white dark:bg-[#222429] text-neutral-900 dark:text-white font-medium shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Type selector */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-[#16171B] border border-neutral-200/60 dark:border-neutral-800/80 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
        >
          <option value="all">All Content Types</option>
          <option value="document">Documents</option>
          <option value="code">Code</option>
          <option value="conversation">Conversations</option>
        </select>
      </div>

      {/* Search Results */}
      <div className="flex flex-col gap-3">
        {isLoading && (
          <div className="py-8 text-center text-xs text-neutral-400">
            Searching semantic vector indices...
          </div>
        )}

        {!isLoading && query.trim() && results.length === 0 && (
          <div className="py-12 text-center text-xs text-neutral-400">
            No matching items found in {scopeFilter} knowledge.
          </div>
        )}

        {!isLoading && !query.trim() && (
          <div className="py-12 text-center text-xs text-neutral-400">
            Type a query to search across all authorized knowledge sources.
          </div>
        )}

        {!isLoading &&
          results.map((res) => (
            <div
              key={res.id}
              onClick={() => handleResultClick(res)}
              className="p-4 rounded-xl bg-white dark:bg-[#141518] border border-neutral-200/70 dark:border-neutral-800/80 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer group flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {res.type === 'code' ? (
                    <Code2 className="w-4 h-4 text-blue-500 shrink-0" />
                  ) : res.type === 'conversation' ? (
                    <MessageSquare className="w-4 h-4 text-purple-500 shrink-0" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                    {res.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge scope={res.scope} size="xs" />
                  <span className="text-[10px] font-mono text-neutral-400">
                    {res.sourceName}
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                {res.snippet}
              </p>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                <span>
                  Updated{' '}
                  {new Date(res.updatedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 font-medium group-hover:translate-x-0.5 transition-transform">
                  View item <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
