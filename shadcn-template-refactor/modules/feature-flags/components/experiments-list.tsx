// =============================================================================
// ExperimentsList — List all experiments with create action
// =============================================================================

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  type RowAction,
  type FacetedFilterConfig,
} from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EyeIcon, PlusIcon } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

import { useExperiments } from "../hooks/use-experiments";
import type { Experiment } from "../types";
import { ExperimentCreateDialog } from "./experiment-create-dialog";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeExperimentStatus(exp: Experiment): string {
  const now = new Date();
  const startsAt = new Date(exp.startsAt);
  const endsAt = new Date(exp.endsAt);
  if (endsAt < now) return "Ended";
  if (exp.isActive && startsAt <= now && endsAt >= now) return "Running";
  if (exp.isActive && startsAt > now) return "Scheduled";
  return "Inactive";
}

function statusBadge(status: string) {
  switch (status) {
    case "Running":
      return (
        <Badge className="bg-green-600/10 text-green-700 dark:text-green-400">
          Running
        </Badge>
      );
    case "Scheduled":
      return <Badge variant="outline">Scheduled</Badge>;
    case "Ended":
      return <Badge variant="secondary">Ended</Badge>;
    default:
      return <Badge variant="secondary">Inactive</Badge>;
  }
}

// ---------------------------------------------------------------------------
// Columns (static, outside component)
// ---------------------------------------------------------------------------

const columns: ColumnDef<Experiment, unknown>[] = [
  {
    accessorKey: "key",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Key" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/dashboard/platform/experiments/${row.original.key}`}
        className="font-mono text-sm text-primary hover:underline"
      >
        {row.original.key}
      </Link>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => (
      <span className="max-w-50 truncate block text-sm text-muted-foreground">
        {row.original.description}
      </span>
    ),
  },
  {
    id: "experimentStatus",
    accessorFn: (exp) => computeExperimentStatus(exp),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ getValue }) => statusBadge(getValue() as string),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "variants",
    header: "Variants",
    cell: ({ row }) => (
      <div className="flex gap-1 flex-wrap">
        {row.original.variants.map((v) => (
          <Badge key={v.key} variant="outline" className="text-xs">
            {v.key}: {v.weight}%
          </Badge>
        ))}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "startsAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Period" />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {format(new Date(row.original.startsAt), "PP")} —{" "}
        {format(new Date(row.original.endsAt), "PP")}
      </span>
    ),
  },
  {
    accessorKey: "owner",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Owner" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.original.owner}</span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Faceted Filters (static, outside component)
// ---------------------------------------------------------------------------

const experimentFacetedFilters: FacetedFilterConfig[] = [
  {
    columnId: "experimentStatus",
    title: "Status",
    options: [
      { label: "Running", value: "Running" },
      { label: "Scheduled", value: "Scheduled" },
      { label: "Ended", value: "Ended" },
      { label: "Inactive", value: "Inactive" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExperimentsList() {
  const router = useRouter();
  const { data: experiments, isLoading, error } = useExperiments();
  const items = React.useMemo(
    () => (experiments ?? []) as Experiment[],
    [experiments]
  );
  const [showCreate, setShowCreate] = React.useState(false);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center">
        <p className="text-destructive">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        searchPlaceholder="Search experiments..."
        searchColumnId="key"
        facetedFilters={experimentFacetedFilters}
        pageSize={20}
        emptyMessage="No experiments configured."
        onRowClick={(exp) => router.push(`/dashboard/platform/experiments/${exp.key}`)}
        rowActions={[
          {
            type: "item",
            label: "View",
            icon: EyeIcon,
            onClick: (exp) => {
              router.push(`/dashboard/platform/experiments/${exp.key}`);
            },
          },
        ]}
        toolbarActions={
          <Button onClick={() => setShowCreate(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Experiment
          </Button>
        }
      />

      <ExperimentCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
      />
    </div>
  );
}
