// =============================================================================
// JobList — Paginated, filterable job list with actions
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EyeIcon, RotateCcwIcon, AlertTriangleIcon } from "lucide-react";

import { useJobsList } from "../hooks/use-jobs-list";
import { useRetryJob } from "../hooks/use-retry-job";
import { JobDetailDialog } from "./job-detail";
import type { Job, JobStatus } from "../types";
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  formatQueueName,
  formatJobTimestamp,
} from "../types";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "failed":
      return "destructive";
    case "active":
      return "default";
    case "completed":
      return "outline";
    default:
      return "secondary";
  }
}

// ---------------------------------------------------------------------------
// Columns (static, outside component)
// ---------------------------------------------------------------------------

const columns: ColumnDef<Job, unknown>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Job ID" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.id.length > 12
          ? `${row.original.id.slice(0, 12)}…`
          : row.original.id}
      </span>
    ),
  },
  {
    accessorKey: "queueName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Queue" />
    ),
    cell: ({ row }) => <span>{formatQueueName(row.original.queueName)}</span>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="max-w-50 truncate block">
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge variant={statusBadgeVariant(row.original.status)}>
        {JOB_STATUS_LABELS[row.original.status as JobStatus] ??
          row.original.status}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "attempts",
    accessorFn: (job) => `${job.attempts}/${job.maxAttempts}`,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Attempts" />
    ),
    cell: ({ row }) => (
      <span>
        {row.original.attempts}/{row.original.maxAttempts}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <span className="text-xs">
        {formatJobTimestamp(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: "processedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Processed" />
    ),
    cell: ({ row }) => (
      <span className="text-xs">
        {formatJobTimestamp(row.original.processedAt)}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Faceted Filters (static, outside component)
// ---------------------------------------------------------------------------

const jobFacetedFilters: FacetedFilterConfig[] = [
  {
    columnId: "status",
    title: "Status",
    options: [
      { label: "Active", value: "active" },
      { label: "Completed", value: "completed" },
      { label: "Failed", value: "failed" },
      { label: "Delayed", value: "delayed" },
      { label: "Waiting", value: "waiting" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JobListProps {
  pollingEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JobList({ pollingEnabled }: JobListProps) {
  const { data, isLoading, error } = useJobsList(
    { page: 1, pageSize: 100 },
    pollingEnabled
  );
  const items = React.useMemo(() => (data?.items ?? []) as Job[], [data?.items]);
  const retryJob = useRetryJob();

  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [retryTarget, setRetryTarget] = React.useState<Job | null>(null);

  const handleRetry = async () => {
    if (!retryTarget) return;
    try {
      await retryJob.mutateAsync({
        queueName: retryTarget.queueName,
        jobId: retryTarget.id,
      });
      showSuccess(`Job ${retryTarget.id} queued for retry`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetryTarget(null);
    }
  };

  if (error && !data) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center">
        <AlertTriangleIcon className="mx-auto h-8 w-8 text-destructive mb-2" />
        <p className="text-sm text-muted-foreground">
          Failed to load jobs: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        searchPlaceholder="Search jobs..."
        searchColumnId="name"
        facetedFilters={jobFacetedFilters}
        pageSize={20}
        enableExport
        exportFileName="jobs"
        emptyMessage="No jobs match the current filters."
        rowActions={(job) => [
          {
            type: "item",
            label: "View Details",
            icon: EyeIcon,
            onClick: () => setSelectedJob(job),
          },
          { type: "separator" },
          {
            type: "item",
            label: "Retry",
            icon: RotateCcwIcon,
            onClick: () => setRetryTarget(job),
            hidden: job.status !== "failed",
          },
        ]}
      />

      {/* Job Detail Dialog */}
      <JobDetailDialog
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={(open) => !open && setSelectedJob(null)}
        onRetry={(job) => {
          setSelectedJob(null);
          setRetryTarget(job);
        }}
      />

      {/* Retry Confirmation */}
      <AlertDialog
        open={!!retryTarget}
        onOpenChange={(open) => !open && setRetryTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retry Job</AlertDialogTitle>
            <AlertDialogDescription>
              Retry job <strong>{retryTarget?.id}</strong> in queue{" "}
              <strong>
                {retryTarget ? formatQueueName(retryTarget.queueName) : ""}
              </strong>
              ?
              {retryTarget && retryTarget.failedReason && (
                <span className="block mt-2 text-xs text-destructive">
                  Last error: {retryTarget.failedReason}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRetry}>
              Retry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
