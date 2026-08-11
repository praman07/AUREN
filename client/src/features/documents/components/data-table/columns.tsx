import type { ColumnDef } from '@tanstack/react-table';
import type { Document } from '../../api/documentQueries';
import { FileText, MoreHorizontal } from 'lucide-react';
import { ClassificationBadge, AIStatusBadge } from '../ui/DocumentStatusBadges';

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
    accessorKey: 'title',
    header: 'Document Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-2 font-medium w-[250px] truncate">
        <FileText size={14} className="text-muted-foreground shrink-0" />
        <span className="truncate">{row.getValue('title')}</span>
      </div>
    ),
  },
  {
    id: 'owner',
    header: 'Owner',
    cell: ({ row }) => {
      const owner = row.original.owner;
      return <div className="truncate w-[120px]">{owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown'}</div>;
    }
  },
  {
    accessorKey: 'classification',
    header: 'Classification',
    cell: ({ row }) => <ClassificationBadge classification={row.getValue('classification')} />
  },
  {
    accessorKey: 'sizeBytes',
    header: 'Size',
    cell: ({ row }) => {
      const bytes = row.getValue('sizeBytes') as number;
      const mb = (bytes / (1024 * 1024)).toFixed(2);
      return <span className="text-muted-foreground">{mb} MB</span>;
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Uploaded',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return <span className="text-muted-foreground">{date.toLocaleDateString()}</span>;
    }
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const jobs = row.original.jobs;
      const status = jobs && jobs.length > 0 ? jobs[0].status : 'READY';
      return <AIStatusBadge status={status as any} />;
    }
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
