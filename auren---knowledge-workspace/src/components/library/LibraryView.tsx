import React, { useState } from 'react';
import {
  Upload,
  Search,
  FileText,
  Code2,
  Trash2,
  MessageSquare,
  ChevronDown,
  Filter,
  Plus,
  Layers,
  Database,
  Edit3,
} from 'lucide-react';
import { AurenDocument, Scope, DocumentType, Connector, ConnectorDataItem } from '../../types';
import { Button } from '../ui/Button';
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

  return (
    <div className="w-full max-w-full px-4 sm:px-6 lg:px-10 py-6 md:py-8 flex flex-col gap-6">
      {/* Top Header & Outlet Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Knowledge Library
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Organized documents, code repositories, and synchronized resources across your personal & team vaults.
          </p>
        </div>

        {/* Action Button for Upload (when in documents outlet) */}
        {activeOutlet === 'documents' && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => setIsUploadOpen(true)}
            >
              Upload Document
            </Button>
          </div>
        )}
      </div>

      {/* Outlet Switcher: Documents vs Connected Sources Data */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-[#16171B] border border-neutral-200/60 dark:border-neutral-800/80 w-fit">
        <button
          type="button"
          onClick={() => setActiveOutlet('documents')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeOutlet === 'documents'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Documents</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-700 dark:text-neutral-300">
            {documents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOutlet('connectors')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeOutlet === 'connectors'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Connector Data</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-700 dark:text-neutral-300">
            {connectors.length} sources
          </span>
        </button>
      </div>

      {/* Outlet View 1: Documents */}
      {activeOutlet === 'documents' && (
        <div className="flex flex-col gap-5">
          {/* Scope Tabs & Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200/60 dark:border-neutral-800/80">
            {/* Scope Tabs */}
            <div className="flex items-center gap-1">
              {(['all', 'personal', 'organization'] as Scope[]).map((tab) => {
                const isActive = activeScope === tab;
                const count = (documents || []).filter((d) => (tab === 'all' ? true : d.scope === tab)).length;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveScope(tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize ${
                      isActive
                        ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                    }`}
                  >
                    <span>{tab}</span>
                    <span className="text-[10px] opacity-70 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search & Type Filter */}
            <div className="flex items-center gap-2">
              {/* Search Box */}
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title, topic..."
                  className="w-48 sm:w-56 pl-8 pr-3 py-1 text-xs rounded-lg bg-neutral-100 dark:bg-[#16171B] border border-neutral-200/60 dark:border-neutral-800/80 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>

              {/* Type Dropdown */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs px-2 py-1 rounded-lg bg-neutral-100 dark:bg-[#16171B] border border-neutral-200/60 dark:border-neutral-800/80 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="markdown">Markdown</option>
                <option value="pdf">PDF</option>
                <option value="code">Code</option>
                <option value="spec">Spec</option>
              </select>
            </div>
          </div>

          {/* Documents Table */}
          <div className="w-full bg-white dark:bg-[#141518] border border-neutral-200/70 dark:border-neutral-800/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50/50 dark:bg-[#111215]/50">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Scope</th>
                    <th className="py-3 px-3">Source</th>
                    <th className="py-3 px-3">Updated</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400">
                        No documents found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-neutral-50/80 dark:hover:bg-[#191A1E]/60 transition-colors group cursor-pointer"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        {/* Title & Filename */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5 max-w-sm sm:max-w-md">
                            <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                              {doc.type === 'code' ? (
                                <Code2 className="w-3.5 h-3.5" />
                              ) : (
                                <FileText className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate group-hover:text-neutral-900 dark:group-hover:text-white">
                                {doc.title}
                              </span>
                              <span className="text-[10px] text-neutral-400 truncate font-mono">
                                {doc.filename} • {doc.fileSize}
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
                        <td className="py-3 px-3 whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                          {doc.source === 'github' ? (
                            <span className="font-mono text-[11px]">
                              {doc.sourceMetadata?.repo || 'GitHub'}
                            </span>
                          ) : (
                            <span>Upload</span>
                          )}
                        </td>

                        {/* Updated */}
                        <td className="py-3 px-3 whitespace-nowrap text-neutral-400 font-mono text-[11px]">
                          {new Date(doc.updatedAt).toLocaleDateString([], {
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
                          className="py-3 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingDoc(doc)}
                              className="px-2 py-1 rounded text-xs font-medium text-purple-700 hover:text-purple-950 dark:text-purple-300 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Edit document & clearance policy"
                            >
                              <Edit3 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onAskAuren(doc)}
                              className="px-2 py-1 rounded text-xs font-medium text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Ask AUREN about this document"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span className="hidden sm:inline">Ask</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteDocument(doc.id)}
                              className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
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

      {/* Outlet View 2: Connected Sources Data */}
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

