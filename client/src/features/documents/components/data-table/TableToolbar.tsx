import React from 'react';
import { Search, Filter, Plus, Download, Trash2, FolderInput } from 'lucide-react';
import { useUploadStore } from '../../store/useUploadStore';

interface TableToolbarProps {
  selectedCount: number;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({ selectedCount, globalFilter, setGlobalFilter }) => {
  const { setIsOpen } = useUploadStore();

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <div className="relative w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search documents..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white"
          />
        </div>
        <button className="flex items-center gap-2 h-9 px-3 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors text-foreground bg-white shadow-sm">
          <Filter size={14} className="text-muted-foreground" />
          Filters
        </button>
      </div>

      <div className="flex items-center gap-2">
        {selectedCount > 0 ? (
          <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-sm text-muted-foreground mr-2">{selectedCount} selected</span>
            <button className="h-9 px-3 border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2 text-sm">
              <Download size={14} /> Download
            </button>
            <button className="h-9 px-3 border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2 text-sm">
              <FolderInput size={14} /> Move
            </button>
            <button className="h-9 px-3 border border-red-200 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center gap-2 text-sm">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Plus size={14} />
            Upload Document
          </button>
        )}
      </div>
    </div>
  );
};
