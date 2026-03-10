// =============================================================================
// JobFilters — Filter bar for job list
// =============================================================================

"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import type { JobListFilters, JobStatus } from "../types";
import { JOB_STATUSES, JOB_STATUS_LABELS, formatQueueName } from "../types";
import type { QueueHealthSummary } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JobFiltersProps {
  filters: JobListFilters;
  onFiltersChange: (filters: JobListFilters) => void;
  healthData?: QueueHealthSummary | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JobFilters({
  filters,
  onFiltersChange,
  healthData,
}: JobFiltersProps) {
  const queueNames = healthData?.queues.map((q) => q.name) ?? [];

  const hasFilters = !!(
    filters.queueName ||
    filters.status ||
    filters.fromDate ||
    filters.toDate
  );

  const resetFilters = () => {
    onFiltersChange({
      page: 1,
      pageSize: filters.pageSize,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Queue filter */}
      <Select
        value={filters.queueName ?? "all"}
        onValueChange={(v) =>
          onFiltersChange({
            ...filters,
            page: 1,
            queueName: v === "all" ? undefined : v,
          })
        }
      >
        <SelectTrigger className="w-45">
          <SelectValue placeholder="All Queues" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Queues</SelectItem>
          {queueNames.map((name) => (
            <SelectItem key={name} value={name}>
              {formatQueueName(name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={filters.status ?? "all"}
        onValueChange={(v) =>
          onFiltersChange({
            ...filters,
            page: 1,
            status: v === "all" ? undefined : (v as JobStatus),
          })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {JOB_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {JOB_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range */}
      <Input
        type="date"
        className="w-40"
        placeholder="From Date"
        value={filters.fromDate ?? ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            page: 1,
            fromDate: e.target.value || undefined,
          })
        }
      />
      <Input
        type="date"
        className="w-40"
        placeholder="To Date"
        value={filters.toDate ?? ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            page: 1,
            toDate: e.target.value || undefined,
          })
        }
      />

      {/* Reset */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <XIcon className="mr-1 h-4 w-4" />
          Reset
        </Button>
      )}
    </div>
  );
}

