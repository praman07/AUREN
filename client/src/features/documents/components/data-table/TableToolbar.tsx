import React from 'react';
import { Search, Filter, Plus, Download, Trash2, FolderInput } from 'lucide-react';
import { useUploadStore } from '../../store/useUploadStore';
import { useDeleteAllDocuments } from '../../api/documentQueries';
import { Button } from '../../../../components/ui/button';

interface TableToolbarProps {
  selectedCount: number;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  currentScope?: 'ORGANIZATION' | 'PERSONAL' | 'ALL';
}

export const TableToolbar: React.FC<TableToolbarProps> = ({ 
  selectedCount, 
  globalFilter, 
  setGlobalFilter,
  currentScope = 'ORGANIZATION'
}) => {
  const { openUploadDialog } = useUploadStore();
  const deleteAllDocs = useDeleteAllDocuments();

  const handleUploadClick = () => {
    if (currentScope === 'PERSONAL') {
      openUploadDialog('PERSONAL');
    } else if (currentScope === 'ORGANIZATION') {
      openUploadDialog('ORGANIZATION');
    } else {
      openUploadDialog(null);
    }
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search documents..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all bg-white text-slate-900"
          />
        </div>
        <Button variant="outline" size="sm" className="h-10 px-3.5 border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50">
          <Filter size={14} className="text-slate-500 mr-1.5" />
          Filters
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => {
            if (window.confirm('TESTING UTILITY: Are you sure you want to delete ALL documents?')) {
              deleteAllDocs.mutate();
            }
          }}
          disabled={deleteAllDocs.isPending}
          variant="outline"
          size="sm"
          className="h-10 px-3 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 rounded-xl font-medium text-xs flex items-center gap-1.5"
        >
          <Trash2 size={14} />
          {deleteAllDocs.isPending ? 'Deleting...' : 'Delete All Docs (Test)'}
        </Button>

        {selectedCount > 0 ? (
          <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-sm text-slate-500 mr-2">{selectedCount} selected</span>
            <Button variant="outline" size="sm" className="h-10 px-3 rounded-xl border-slate-200 text-slate-700">
              <Download size={14} className="mr-1.5" /> Download
            </Button>
            <Button variant="outline" size="sm" className="h-10 px-3 rounded-xl border-slate-200 text-slate-700">
              <FolderInput size={14} className="mr-1.5" /> Move
            </Button>
            <Button variant="destructive" size="sm" className="h-10 px-3 rounded-xl">
              <Trash2 size={14} className="mr-1.5" /> Delete
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleUploadClick}
            size="sm"
            className="h-10 px-4 bg-slate-900 text-white rounded-xl font-medium text-xs hover:bg-slate-800 shadow-xs flex items-center"
          >
            <Plus size={14} className="mr-1.5" />
            {currentScope === 'PERSONAL' ? 'Upload Personal Doc' : currentScope === 'ORGANIZATION' ? 'Upload Org Doc' : 'Upload Document'}
          </Button>
        )}
      </div>
    </div>
  );
};

