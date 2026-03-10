// =============================================================================
// ExportButton — Export analytics data (CSV)
// =============================================================================
// Triggers a client-side CSV download from the provided data.
// Phase 1: CSV only. XLSX/PDF can be added later.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportButtonProps {
  /** Data rows to export */
  data: Record<string, unknown>[];
  /** File name (without extension) */
  fileName?: string;
  /** Column headers mapping: key → display label */
  columns?: Record<string, string>;
  /** Disabled state */
  disabled?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toCSV(
  data: Record<string, unknown>[],
  columns?: Record<string, string>
): string {
  if (data.length === 0) return "";

  const keys = columns ? Object.keys(columns) : Object.keys(data[0]);
  const headers = columns
    ? keys.map((k) => columns[k])
    : keys;

  const rows = data.map((row) =>
    keys
      .map((key) => {
        const val = row[key];
        if (val === null || val === undefined) return "";
        const str = String(val);
        // Escape CSV values containing commas/quotes/newlines
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
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
// Component
// ---------------------------------------------------------------------------

export function ExportButton({
  data,
  fileName = "analytics-export",
  columns,
  disabled = false,
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = useCallback(() => {
    setIsExporting(true);
    try {
      const csv = toCSV(data, columns);
      downloadBlob(csv, `${fileName}.csv`, "text/csv;charset=utf-8;");
    } finally {
      setIsExporting(false);
    }
  }, [data, columns, fileName]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || data.length === 0 || isExporting}
          className={className}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
