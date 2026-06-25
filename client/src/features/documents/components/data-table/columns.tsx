import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Document } from '../../types';
import { FileText, MoreHorizontal, MessageSquare, Download, FolderGit2 } from 'lucide-react';
import { AIStatusBadge, ClassificationBadge, SharingBadge } from '../ui/DocumentStatusBadges';

export const columns: ColumnDef<Document>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        className="rounded border-slate-300 text-primary focus:ring-primary h-3 w-3"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        className="rounded border-slate-300 text-primary focus:ring-primary h-3 w-3"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: 'Document Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-2 font-medium w-[250px] truncate">
        <FileText size={14} className="text-muted-foreground shrink-0" />
        <span className="truncate">{row.getValue('name')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'owner',
    header: 'Owner',
    cell: ({ row }) => <div className="truncate w-[100px]">{row.getValue('owner')}</div>
  },
  {
    accessorKey: 'department',
    header: 'Department',
  },
  {
    accessorKey: 'classification',
    header: 'Classification',
    cell: ({ row }) => <ClassificationBadge classification={row.getValue('classification')} />
  },
  {
    accessorKey: 'version',
    header: 'Version',
    cell: ({ row }) => <span className="text-muted-foreground font-mono">{row.getValue('version')}</span>
  },
  {
    accessorKey: 'size',
    header: 'Size',
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue('size')}</span>
  },
  {
    accessorKey: 'modifiedAt',
    header: 'Modified',
    cell: ({ row }) => {
      const date = new Date(row.getValue('modifiedAt'));
      return <span className="text-muted-foreground">{date.toLocaleDateString()}</span>;
    }
  },
  {
    accessorKey: 'aiStatus',
    header: 'AI Status',
    cell: ({ row }) => <AIStatusBadge status={row.getValue('aiStatus')} />
  },
  {
    accessorKey: 'sharingStatus',
    header: 'Sharing',
    cell: ({ row }) => <SharingBadge status={row.getValue('sharingStatus')} />
  },
  {
    id: 'actions',
    cell: () => (
      <button className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors">
        <MoreHorizontal size={14} />
      </button>
    )
  }
];
