import React from 'react';
import { flexRender, getCoreRowModel, useReactTable, getSortedRowModel, getPaginationRowModel, getFilteredRowModel } from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { useDocumentStore } from '../../store/useDocumentStore';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  globalFilter: string;
}

export function DataTable<TData, TValue>({ columns, data, globalFilter }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: { pageSize: 15 }
    }
  });

  return (
    <div className="w-full">
      <div className="rounded-md border border-border bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted sticky top-0 z-10 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="h-10 px-3 font-medium text-muted-foreground uppercase tracking-wider text-[11px] whitespace-nowrap">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr 
                  key={(row.original as any).id} 
                  className="hover:bg-slate-50 transition-colors data-[state=selected]:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    useDocumentStore.getState().setSelectedDocument((row.original as any).id, row.original as any);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 whitespace-nowrap text-foreground align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      <div className="flex items-center justify-between py-4">
        <div className="text-xs text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 text-xs border border-border rounded-md hover:bg-muted disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 text-xs border border-border rounded-md hover:bg-muted disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
