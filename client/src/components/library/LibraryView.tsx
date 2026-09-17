import React, { useState } from 'react';
import {
  Upload,
  Search,
  FileText,
  Code2,
  Trash2,
  MessageSquare,
  Database,
  Edit3,
  X,
} from 'lucide-react';
import type { AurenDocument, Scope, Connector, ConnectorDataItem } from '../../types';
import { Badge } from '../ui/Badge';

import { UploadModal } from './UploadModal';
import { DocumentDetailModal } from '../document/DocumentDetailModal';
import { EditDocumentModal } from '../document/EditDocumentModal';
import { ConnectorDataView } from './ConnectorDataView';
import { useAuth } from '../../context/AuthContext';

interface LibraryViewProps {
  documents: AurenDocument[];
  connectors?: Connector[];
  onRefreshDocuments: () => void;
  onAskAuren: (doc: AurenDocument) => void;
  onAskAurenAboutConnectorData?: (item: ConnectorDataItem) => void;
  onOpenConnectorDetail?: (connectorId: string, backPage?: string) => void;
  onDeleteDocument: (docId: string) => void;
  onNavigateToRbac?: (docId?: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  documents,
  connectors = [],
  onRefreshDocuments,
  onAskAuren,
  onAskAurenAboutConnectorData,
  onOpenConnectorDetail,
  onDeleteDocument,
  onNavigateToRbac,
}) => {
  const { activeScope, setActiveScope } = useAuth();
  const [activeOutlet, setActiveOutlet] = useState<'documents' | 'connectors'>('documents');
  const [selectedDoc, setSelectedDoc] = useState<AurenDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<AurenDocument | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter by scope, search, and type
  const filteredDocs = (documents || []).filter((doc) => {
    if (activeScope !== 'all' && doc.scope !== activeScope) return false;
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = doc.title.toLowerCase().includes(q);
      const inFilename = doc.filename.toLowerCase().includes(q);
      const inTopic = doc.intelligence?.keyTopics.some((t) => t.toLowerCase().includes(q));
      if (!inTitle && !inFilename && !inTopic) return false;
    }
    return true;
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setActiveScope('all');
  };

  const isFiltered = searchQuery.trim() !== '' || typeFilter !== 'all' || activeScope !== 'all';

  return (
    <div className="w-full flex flex-col gap-6 font-sans antialiased text-neutral-900 dark:text-neutral-100">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Knowledge Library
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Synchronized documents, repositories, and governance specifications across your workspace.
          </p>
        </div>

        {activeOutlet === 'documents' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. OUTLET NAVIGATION TABS */}
      <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveOutlet('documents')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer border-b-2 ${
            activeOutlet === 'documents'
              ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 bg-neutral-100/60 dark:bg-neutral-800/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Documents</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            {documents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOutlet('connectors')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer border-b-2 ${
            activeOutlet === 'connectors'
              ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 bg-neutral-100/60 dark:bg-neutral-800/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Connector Data</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            {connectors.length} sources
          </span>
        </button>
      </div>

      {/* 3. DOCUMENTS OUTLET */}
      {activeOutlet === 'documents' && (
        <div className="flex flex-col gap-4">
          {/* SEARCH + FILTER TOOLBAR */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Scope Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1">
              {(['all', 'personal', 'organization'] as Scope[]).map((tab) => {
                const isActive = activeScope === tab;
                const count = (documents || []).filter((d) => (tab === 'all' ? true : d.scope === tab)).length;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveScope(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-semibold'
                        : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span>{tab}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input & Type Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title, filename, topic..."
                  className="w-full sm:w-64 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 rounded-lg pl-9 pr-3 py-1.5 outline-none focus:border-neutral-900 dark:focus:border-neutral-100 transition-colors"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="markdown">Markdown</option>
                <option value="pdf">PDF</option>
                <option value="code">Code</option>
                <option value="spec">Spec</option>
              </select>

              {isFiltered && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 px-2 py-1 rounded transition-colors cursor-pointer"
                  title="Clear filters"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* KNOWLEDGE RESULTS TABLE */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-950/80">
                    <th className="py-3 px-4">Artifact Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Scope</th>
                    <th className="py-3 px-3">Source</th>
                    <th className="py-3 px-3">Updated</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs text-neutral-400">
                        No documents found matching current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        {/* Title & Filename */}
                        <td className="py-3 px-4 min-w-[200px] max-w-xs sm:max-w-md">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
                              {doc.type === 'code' ? (
                                <Code2 className="w-3.5 h-3.5" />
                              ) : (
                                <FileText className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-medium text-xs text-neutral-900 dark:text-neutral-100 truncate">
                                {doc.title}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono truncate mt-0.5">
                                {doc.filename} • {doc.fileSize || '1.2 MB'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge docType={doc.type} size="xs" />
                        </td>

                        {/* Scope */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge scope={doc.scope} size="xs" />
                        </td>

                        {/* Source */}
                        <td className="py-3 px-3 whitespace-nowrap text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                          {doc.source === 'github' ? (
                            <span>{doc.sourceMetadata?.repo || 'GitHub'}</span>
                          ) : (
                            <span>Upload</span>
                          )}
                        </td>

                        {/* Updated */}
                        <td className="py-3 px-3 whitespace-nowrap text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                          {new Date(doc.updatedAt || doc.createdAt || Date.now()).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge status={doc.status} size="xs" />
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-4 text-right whitespace-nowrap shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingDoc(doc)}
                              className="px-2 py-1 rounded text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Edit policy"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span className="hidden sm:inline">Policy</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onAskAuren(doc)}
                              className="px-2 py-1 rounded text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Query AUREN"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span className="hidden sm:inline">Query</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteDocument(doc.id)}
                              className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONNECTORS OUTLET */}
      {activeOutlet === 'connectors' && (
        <ConnectorDataView
          connectors={connectors}
          onAskAuren={
            onAskAurenAboutConnectorData ||
            ((item) => {
              console.log('Ask about item:', item);
            })
          }
          onOpenConnectorDetail={onOpenConnectorDetail}
          activeScope={activeScope}
          onScopeChange={setActiveScope}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={onRefreshDocuments}
      />

      {/* Document Detail Modal */}
      <DocumentDetailModal
        document={selectedDoc}
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        onAskAuren={onAskAuren}
        onEditDocument={(doc) => {
          setSelectedDoc(null);
          setEditingDoc(doc);
        }}
        onSelectRelatedDoc={(relId) => {
          const target = documents.find((d) => d.id === relId);
          if (target) setSelectedDoc(target);
        }}
      />

      {/* Edit Document & Clearance Policy Modal */}
      <EditDocumentModal
        document={editingDoc}
        isOpen={Boolean(editingDoc)}
        onClose={() => setEditingDoc(null)}
        onDocumentUpdated={(updatedDoc) => {
          onRefreshDocuments();
          if (selectedDoc?.id === updatedDoc.id) {
            setSelectedDoc(updatedDoc);
          }
        }}
        onNavigateToRbac={onNavigateToRbac}
      />
    </div>
  );
};
