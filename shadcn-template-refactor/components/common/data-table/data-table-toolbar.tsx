// =============================================================================
// DataTableToolbar — Generic toolbar with search, filters, export, print
// =============================================================================

"use client";

import { useCallback, useState } from "react";
import { Table } from "@tanstack/react-table";
import { Download, Printer, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DataTableViewOptions } from "./data-table-view-options";
import {
  DataTableFacetedFilter,
  type FacetedFilterOption,
} from "./data-table-faceted-filter";

// ---------------------------------------------------------------------------
// CSV Helpers
// ---------------------------------------------------------------------------

function toCSV(
  data: Record<string, unknown>[],
  columns?: Record<string, string>,
): string {
  if (data.length === 0) return "";
  const keys = columns ? Object.keys(columns) : Object.keys(data[0]);
  const headers = columns ? keys.map((k) => columns[k]) : keys;
  const rows = data.map((row) =>
    keys
      .map((key) => {
        const val = row[key];
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

function downloadBlob(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FacetedFilterConfig {
  columnId: string;
  title: string;
  options: FacetedFilterOption[];
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  /** Placeholder for the search input */
  searchPlaceholder?: string;
  /** Column ID to filter by search input */
  searchColumnId?: string;
  /** Faceted filter configurations */
  facetedFilters?: FacetedFilterConfig[];
  /** Enable export CSV */
  enableExport?: boolean;
  /** Export file name (without extension) */
  exportFileName?: string;
  /** Column mapping for CSV export — key → display header */
  exportColumns?: Record<string, string>;
  /** Enable print */
  enablePrint?: boolean;
  /** Additional actions (right side of toolbar) */
  actions?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = "Search...",
  searchColumnId,
  facetedFilters = [],
  enableExport = true,
  exportFileName = "export",
  exportColumns,
  enablePrint = true,
  actions,
}: DataTableToolbarProps<TData>) {
  const [isExporting, setIsExporting] = useState(false);
  const isFiltered = table.getState().columnFilters.length > 0;

  // Get global filter value for search
  const searchValue = searchColumnId
    ? ((table.getColumn(searchColumnId)?.getFilterValue() as string) ?? "")
    : (table.getState().globalFilter ?? "");

  const handleSearch = (value: string) => {
    if (searchColumnId) {
      table.getColumn(searchColumnId)?.setFilterValue(value);
    } else {
      table.setGlobalFilter(value);
    }
  };

  const handleExportCSV = useCallback(() => {
    setIsExporting(true);
    try {
      const rows = table.getFilteredRowModel().rows;
      const data = rows.map((row) => row.original as Record<string, unknown>);
      const csv = toCSV(data, exportColumns);
      downloadBlob(csv, `${exportFileName}.csv`, "text/csv;charset=utf-8;");
    } finally {
      setIsExporting(false);
    }
  }, [table, exportColumns, exportFileName]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-8 w-37.5 lg:w-62.5"
        />
        {facetedFilters.map((filter) => {
          const column = table.getColumn(filter.columnId);
          return column ? (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={column}
              title={filter.title}
              options={filter.options}
            />
          ) : null;
        })}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {enableExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={
                  isExporting ||
                  table.getFilteredRowModel().rows.length === 0
                }
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {enablePrint && (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
        )}
        <DataTableViewOptions table={table} />
        {actions}
      </div>
    </div>
  );
}
