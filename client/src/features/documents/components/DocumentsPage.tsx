import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataTable } from './data-table/DataTable';
import { columns } from './data-table/columns';
import { TableToolbar } from './data-table/TableToolbar';
import { useDocuments, type Document } from '../api/documentQueries';
import { DocumentDetailsDrawer } from './details/DocumentDetailsDrawer';
import { Building2, User, Layers, ShieldCheck, Lock } from 'lucide-react';

export type ScopeTab = 'ORGANIZATION' | 'PERSONAL' | 'ALL';

export const DocumentsPage: React.FC = () => {
  const { scopeRoute } = useParams<{ scopeRoute?: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useDocuments();
  const [selectedCount] = useState(0);
  const [globalFilter, setGlobalFilter] = useState('');

  // Map route param to active scope
  const activeScope: ScopeTab = React.useMemo(() => {
    if (scopeRoute === 'personal') return 'PERSONAL';
    if (scopeRoute === 'all') return 'ALL';
    return 'ORGANIZATION';
  }, [scopeRoute]);

  const documents = data || [];

  const orgDocs = documents.filter(
    (doc: Document) => doc.scope === 'ORGANIZATION' || (!doc.scope && doc.visibility !== 'PRIVATE')
  );
  const personalDocs = documents.filter(
    (doc: Document) => doc.scope === 'PERSONAL' || doc.visibility === 'PRIVATE'
  );

  const filteredDocs = React.useMemo(() => {
    if (activeScope === 'ORGANIZATION') return orgDocs;
    if (activeScope === 'PERSONAL') return personalDocs;
    return documents;
  }, [activeScope, documents, orgDocs, personalDocs]);

  return (
    <>
      <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-300">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              {activeScope === 'PERSONAL' ? (
                <>
                  <User size={24} className="text-emerald-600" />
                  <span>Personal Knowledge Vault</span>
                </>
              ) : activeScope === 'ORGANIZATION' ? (
                <>
                  <Building2 size={24} className="text-indigo-600" />
                  <span>Organization Knowledge Base</span>
                </>
              ) : (
                <>
                  <Layers size={24} className="text-blue-600" />
                  <span>All Knowledge Documents</span>
                </>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeScope === 'PERSONAL'
                ? 'Private documents, notes, and owner-only assets. Uploads here are strictly assigned to your Personal scope.'
                : activeScope === 'ORGANIZATION'
                ? 'Shared company SOPs, architecture specs, and departmental knowledge. Uploads here are strictly assigned to your Organization scope.'
                : 'Comprehensive view of all authorized organization and personal documents with Zero-Trust access rules.'}
            </p>
          </div>

          {/* Scope View Toggle Pills (Routes) */}
          <div className="inline-flex p-1 bg-muted/60 rounded-lg border border-border/50 text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => navigate('/documents/org')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                activeScope === 'ORGANIZATION'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 size={14} className={activeScope === 'ORGANIZATION' ? 'text-indigo-600' : ''} />
              <span>Org Knowledge</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeScope === 'ORGANIZATION' ? 'bg-indigo-100 text-indigo-700' : 'bg-muted-foreground/15 text-muted-foreground'
              }`}>
                {orgDocs.length}
              </span>
            </button>

            <button
              onClick={() => navigate('/documents/personal')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                activeScope === 'PERSONAL'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User size={14} className={activeScope === 'PERSONAL' ? 'text-emerald-600' : ''} />
              <span>Personal Vault</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeScope === 'PERSONAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted-foreground/15 text-muted-foreground'
              }`}>
                {personalDocs.length}
              </span>
            </button>

            <button
              onClick={() => navigate('/documents/all')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                activeScope === 'ALL'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers size={14} className={activeScope === 'ALL' ? 'text-blue-600' : ''} />
              <span>All Catalog</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeScope === 'ALL' ? 'bg-blue-100 text-blue-700' : 'bg-muted-foreground/15 text-muted-foreground'
              }`}>
                {documents.length}
              </span>
            </button>
          </div>
        </div>

        {/* View Description Sub-Header */}
        <div className="flex items-center gap-2 text-xs px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-md text-slate-600">
          {activeScope === 'ORGANIZATION' && (
            <>
              <ShieldCheck size={14} className="text-indigo-600 shrink-0" />
              <span><strong>Organization Scope:</strong> Dedicated to shared organizational assets. Uploads on this route default exclusively to Organization scope.</span>
            </>
          )}
          {activeScope === 'PERSONAL' && (
            <>
              <Lock size={14} className="text-emerald-600 shrink-0" />
              <span><strong>Personal Scope:</strong> Dedicated to private user assets. Uploads on this route default exclusively to Personal scope.</span>
            </>
          )}
          {activeScope === 'ALL' && (
            <>
              <Layers size={14} className="text-blue-600 shrink-0" />
              <span><strong>Unified Catalog:</strong> Comprehensive view of all authorized organization and personal documents.</span>
            </>
          )}
        </div>

        {/* Main Table Container */}
        <div className="flex-1 flex flex-col min-h-0">
          <TableToolbar 
            selectedCount={selectedCount} 
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            currentScope={activeScope}
          />
          
          {isLoading ? (
            <div className="w-full h-96 border border-border rounded-md bg-slate-50 animate-pulse flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Loading enterprise data...</span>
            </div>
          ) : error ? (
            <div className="w-full h-96 border border-danger/30 rounded-md bg-danger/5 flex items-center justify-center text-danger text-sm">
              Failed to load documents: {error.message}
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={filteredDocs} 
              globalFilter={globalFilter}
            />
          )}
        </div>
        
      </div>

      {/* Global Modals for this Feature */}
      <DocumentDetailsDrawer />
    </>
  );
};
