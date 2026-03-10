// =============================================================================
// ChargeEventsList — DataTable with detail modal
// =============================================================================

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  type RowAction,
  type FacetedFilterConfig,
} from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EyeIcon } from "lucide-react";
import { format } from "date-fns";
import { useChargeEvents } from "../hooks/use-charge-events";
import type { ChargeEvent } from "../types";
import {
  CHARGE_TYPES,
  CHARGE_TYPE_LABELS,
  CHARGE_TYPE_COLORS,
  CHARGE_EVENT_STATUSES,
  CHARGE_EVENT_STATUS_LABELS,
  CHARGE_EVENT_STATUS_COLORS,
  formatAmount,
} from "../types";

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<ChargeEvent, unknown>[] = [
  {
    accessorKey: "partnerId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Partner" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.partnerId.slice(0, 8)}...
      </span>
    ),
  },
  {
    accessorKey: "vendorId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vendor" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.vendorId.slice(0, 8)}...
      </span>
    ),
  },
  {
    accessorKey: "chargeType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Charge Type" />
    ),
    cell: ({ row }) => {
      const ct = row.original.chargeType;
      return (
        <Badge variant="secondary" className={CHARGE_TYPE_COLORS[ct]}>
          {CHARGE_TYPE_LABELS[ct]}
        </Badge>
      );
    },
    filterFn: (row, id, value) =>
      value.includes(row.getValue(id)),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => (
      <span className="text-right font-mono">
        {formatAmount(row.original.amount, row.original.currency)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant="secondary" className={CHARGE_EVENT_STATUS_COLORS[status]}>
          {CHARGE_EVENT_STATUS_LABELS[status]}
        </Badge>
      );
    },
    filterFn: (row, id, value) =>
      value.includes(row.getValue(id)),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Timestamp" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.original.createdAt), "dd MMM yyyy, HH:mm")}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Faceted filters
// ---------------------------------------------------------------------------

const facetedFilters: FacetedFilterConfig[] = [
  {
    columnId: "chargeType",
    title: "Charge Type",
    options: CHARGE_TYPES.map((ct) => ({
      label: CHARGE_TYPE_LABELS[ct],
      value: ct,
    })),
  },
  {
    columnId: "status",
    title: "Status",
    options: CHARGE_EVENT_STATUSES.map((s) => ({
      label: CHARGE_EVENT_STATUS_LABELS[s],
      value: s,
    })),
  },
];

// ---------------------------------------------------------------------------
// Charge Event Detail Modal
// ---------------------------------------------------------------------------

function ChargeEventDetailModal({
  event,
  open,
  onClose,
}: {
  event: ChargeEvent | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Charge Event Details</DialogTitle>
          <DialogDescription>
            Full breakdown for charge event {event.id.slice(0, 8)}...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Partner ID</span>
              <p className="font-mono text-xs mt-0.5">{event.partnerId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Vendor ID</span>
              <p className="font-mono text-xs mt-0.5">{event.vendorId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Charge Type</span>
              <p className="mt-0.5">
                <Badge variant="secondary" className={CHARGE_TYPE_COLORS[event.chargeType]}>
                  {CHARGE_TYPE_LABELS[event.chargeType]}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <p className="mt-0.5">
                <Badge variant="secondary" className={CHARGE_EVENT_STATUS_COLORS[event.status]}>
                  {CHARGE_EVENT_STATUS_LABELS[event.status]}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Amount</span>
              <p className="font-mono font-semibold mt-0.5">
                {formatAmount(event.amount, event.currency)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Timestamp</span>
              <p className="mt-0.5">
                {format(new Date(event.createdAt), "dd MMM yyyy, HH:mm:ss")}
              </p>
            </div>
          </div>

          {event.description && (
            <div className="text-sm">
              <span className="text-muted-foreground">Description</span>
              <p className="mt-0.5">{event.description}</p>
            </div>
          )}

          {event.calculationBreakdown && (
            <div className="text-sm">
              <span className="text-muted-foreground">Calculation Breakdown</span>
              <pre className="mt-1 rounded-md bg-muted p-3 text-xs font-mono overflow-auto max-h-48">
                {JSON.stringify(event.calculationBreakdown, null, 2)}
              </pre>
            </div>
          )}

          {event.metadata && (
            <div className="text-sm">
              <span className="text-muted-foreground">Metadata</span>
              <pre className="mt-1 rounded-md bg-muted p-3 text-xs font-mono overflow-auto max-h-48">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ChargeEventsList
// ---------------------------------------------------------------------------

export function ChargeEventsList() {
  const { data, isLoading, error } = useChargeEvents({ page: 1, pageSize: 100 });
  const items = React.useMemo(
    () => (data?.items ?? []) as ChargeEvent[],
    [data?.items],
  );
  const [selectedEvent, setSelectedEvent] = React.useState<ChargeEvent | null>(null);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load charge events. Please try again.
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        searchPlaceholder="Search charge events..."
        facetedFilters={facetedFilters}
        emptyMessage="No charge events found matching your filters."
        rowActions={(event) => [
          {
            type: "item",
            label: "View Details",
            icon: EyeIcon,
            onClick: () => setSelectedEvent(event),
          },
        ]}
      />

      {/* Detail Modal */}
      <ChargeEventDetailModal
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
