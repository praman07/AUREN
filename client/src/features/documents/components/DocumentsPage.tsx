import React, { useState, useEffect } from 'react';
import { DataTable } from './data-table/DataTable';
import { columns } from './data-table/columns';
import { TableToolbar } from './data-table/TableToolbar';
import { mockDocuments } from '../mock/documents.mock';
import { Document } from '../types';
import { UploadDialog } from './upload/UploadDialog';
import { DocumentDetailsDrawer } from './details/DocumentDetailsDrawer';

export const DocumentsPage: React.FC = () => {
  const [data, setData] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);

  // Simulate network latency
  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockDocuments);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-300">
        
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Documents</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage, classify, and securely share enterprise knowledge.
            </p>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="flex-1 flex flex-col min-h-0">
          <TableToolbar selectedCount={selectedCount} />
          
          {isLoading ? (
            <div className="w-full h-96 border border-border rounded-md bg-slate-50 animate-pulse flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Loading enterprise data...</span>
            </div>
          ) : (
            <DataTable columns={columns} data={data} />
          )}
        </div>
        
      </div>

      {/* Global Modals for this Feature */}
      <UploadDialog />
      <DocumentDetailsDrawer />
    </>
  );
};
