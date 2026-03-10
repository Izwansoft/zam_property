// =============================================================================
// DataTable — Generic reusable data table with TanStack React Table
// =============================================================================
// Features: sorting, filtering, pagination, column visibility, row selection,
// global search, faceted filters, CSV export, print
// =============================================================================

"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import {
  DataTableRowActions,
  type RowAction,
} from "./data-table-row-actions";
import {
  DataTableToolbar,
  type FacetedFilterConfig,
} from "./data-table-toolbar";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Enable row selection (default: false) */
  enableRowSelection?: boolean;
  /** Default page size (default: 20) */
  pageSize?: number;
  /** Placeholder for search input */
  searchPlaceholder?: string;
  /** Column ID to bind search input to (if not set, uses global filter) */
  searchColumnId?: string;
  /** Faceted filter configs */
  facetedFilters?: FacetedFilterConfig[];
  /** Enable CSV export (default: true) */
  enableExport?: boolean;
  /** Export file name */
  exportFileName?: string;
  /** Column mapping for CSV export */
  exportColumns?: Record<string, string>;
  /** Enable print button (default: true) */
  enablePrint?: boolean;
  /** Additional toolbar actions */
  toolbarActions?: React.ReactNode;
  /** Callback when a row is clicked */
  onRowClick?: (row: TData) => void;
  /** isLoading state placeholder */
  isLoading?: boolean;
  /** Custom empty message */
  emptyMessage?: string;
  /**
   * Row actions for the 3-dot menu. When provided, an actions column is
   * automatically appended as the last column.
   * Can be a static array (same actions for every row) or a function
   * that receives the row data and returns actions (dynamic per row).
   */
  rowActions?: RowAction<TData>[] | ((data: TData) => RowAction<TData>[]);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EMPTY_ARRAY: unknown[] = [];

export function DataTable<TData, TValue>({
  columns,
  data,
  enableRowSelection = false,
  pageSize = 20,
  searchPlaceholder,
  searchColumnId,
  facetedFilters,
  enableExport = true,
  exportFileName,
  exportColumns,
  enablePrint = true,
  toolbarActions,
  onRowClick,
  isLoading = false,
  emptyMessage = "No results.",
  rowActions,
}: DataTableProps<TData, TValue>) {
  // Auto-append actions column when rowActions is provided
  const mergedColumns = React.useMemo(() => {
    if (!rowActions) return columns;
    const actionsCol: ColumnDef<TData, unknown> = {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const resolved =
          typeof rowActions === "function"
            ? rowActions(row.original)
            : rowActions;
        return <DataTableRowActions row={row} actions={resolved} />;
      },
      enableSorting: false,
      enableHiding: false,
    };
    return [...columns, actionsCol as ColumnDef<TData, TValue>];
  }, [columns, rowActions]);
  // Defer data processing until after mount to prevent
  // "Can't perform a React state update on a component that hasn't mounted"
  // caused by TanStack Table's lazy faceted model computations.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => { setHydrated(true); }, []);

  const tableData = hydrated ? data : (EMPTY_ARRAY as TData[]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data: tableData,
    columns: mergedColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
    enableRowSelection,
    autoResetPageIndex: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar
        table={table}
        searchPlaceholder={searchPlaceholder}
        searchColumnId={searchColumnId}
        facetedFilters={facetedFilters}
        enableExport={enableExport}
        exportFileName={exportFileName}
        exportColumns={exportColumns}
        enablePrint={enablePrint}
        actions={toolbarActions}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading || !hydrated ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {mergedColumns.map((_, j) => (
                    <TableCell key={`skeleton-${i}-${j}`}>
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? "cursor-pointer" : undefined}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={mergedColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
