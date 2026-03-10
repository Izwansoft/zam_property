// =============================================================================
// AuditLogList — DataTable view with client-side pagination
// =============================================================================

"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  DataTableColumnHeader,
  type RowAction,
} from "@/components/common/data-table";

import type { AuditLogEntry, AuditLogFilters } from "../types";
import { useAuditLogs } from "../hooks/use-audit-logs";
import { AuditLogDetailModal } from "./audit-log-detail-modal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return "—";
  }
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<AuditLogEntry, unknown>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Timestamp" />
    ),
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap w-35 block">
        {formatTimestamp(row.original.timestamp)}
      </span>
    ),
  },
  {
    id: "actor",
    accessorFn: (row) =>
      row.actorEmail ?? row.actorId ?? row.actorType ?? "—",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actor" />
    ),
    cell: ({ row }) => {
      const entry = row.original;
      return (
        <div className="min-w-0 w-50">
          <p className="text-sm truncate">
            {entry.actorEmail ?? entry.actorId ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">{entry.actorType}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "actionType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Action" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs font-mono">
        {row.original.actionType}
      </Badge>
    ),
  },
  {
    id: "target",
    accessorFn: (row) =>
      [row.targetType, row.targetId].filter(Boolean).join("/"),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Target" />
    ),
    cell: ({ row }) => {
      const entry = row.original;
      return (
        <div className="min-w-0 w-40">
          <p className="text-sm truncate">{entry.targetType}</p>
          {entry.targetId && (
            <p className="text-xs text-muted-foreground truncate">
              {entry.targetId}
            </p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "requestId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Request ID" />
    ),
    cell: ({ row }) => (
      <span className="text-xs font-mono text-muted-foreground truncate block max-w-30">
        {row.original.requestId ?? "—"}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AuditLogListProps {
  /** Pre-set filter values (e.g. from URL params) */
  initialFilters?: Partial<AuditLogFilters>;
  /** Title shown above the table */
  title?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuditLogList({ initialFilters, title }: AuditLogListProps) {
  const { data, isLoading, error } = useAuditLogs({
    page: 1,
    pageSize: 100,
    ...initialFilters,
  });

  const items = React.useMemo(
    () => (data?.items ?? []) as AuditLogEntry[],
    [data?.items],
  );

  const [selectedLog, setSelectedLog] = React.useState<AuditLogEntry | null>(
    null,
  );

  const rowActions = React.useCallback(
    (entry: AuditLogEntry): RowAction<AuditLogEntry>[] => [
      {
        type: "item" as const,
        label: "View Details",
        icon: Eye,
        onClick: () => setSelectedLog(entry),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {title && <h2 className="text-lg font-semibold">{title}</h2>}

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load audit logs. Please try again.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          searchPlaceholder="Search audit logs..."
          onRowClick={(entry) => setSelectedLog(entry)}
          emptyMessage="No audit logs found."
          pageSize={20}
          enableExport
          exportFileName="audit-logs"
          rowActions={rowActions}
        />
      )}

      <AuditLogDetailModal
        entry={selectedLog}
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
