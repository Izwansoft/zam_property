// =============================================================================
// Jobs Module — Type Definitions
// =============================================================================
// Types for BullMQ job queue dashboard: health, queues, jobs, bulk ops.
// Backend uses non-standard response format: { jobs: [...], total: N }
// =============================================================================

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

export type JobStatus =
  | "active"
  | "waiting"
  | "completed"
  | "failed"
  | "delayed"
  | "paused";

export type QueueName =
  | "email"
  | "notification"
  | "search-index"
  | "media-processing"
  | "analytics"
  | "billing"
  | "cleanup"
  | string; // Allow unknown queue names from backend

// ---------------------------------------------------------------------------
// Queue Health
// ---------------------------------------------------------------------------

export interface QueueHealthSummary {
  totalQueues: number;
  activeJobs: number;
  failedJobs: number;
  waitingJobs: number;
  completedJobs: number;
  delayedJobs: number;
  queues: QueueStats[];
}

export interface QueueStats {
  name: string;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

// ---------------------------------------------------------------------------
// Job
// ---------------------------------------------------------------------------

export interface Job {
  id: string;
  name: string;
  queueName: string;
  data: Record<string, unknown>;
  status: JobStatus;
  progress: number;
  attempts: number;
  maxAttempts: number;
  failedReason: string | null;
  stackTrace: string[] | null;
  returnValue: unknown | null;
  createdAt: string;
  processedAt: string | null;
  completedAt: string | null;
  delay: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// DTOs & Params
// ---------------------------------------------------------------------------

export interface RetryJobDto {
  queueName: string;
  jobId: string;
}

export interface AddJobDto {
  queueName: string;
  name: string;
  data: Record<string, unknown>;
  delay?: number;
  priority?: number;
}

export interface CleanQueueDto {
  status?: "completed" | "failed";
  grace?: number; // milliseconds
}

export interface BulkExpireDto {
  daysStale?: number;
  dryRun?: boolean;
}

export interface BulkReindexDto {
  verticalType?: string;
  dryRun?: boolean;
}

export interface BulkOperationResult {
  success: boolean;
  message: string;
  affected?: number;
  jobId?: string;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface JobListFilters {
  page: number;
  pageSize: number;
  queueName?: string;
  status?: JobStatus;
  fromDate?: string;
  toDate?: string;
}

export const DEFAULT_JOB_LIST_FILTERS: JobListFilters = {
  page: 1,
  pageSize: 20,
};

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  active: "Active",
  waiting: "Waiting",
  completed: "Completed",
  failed: "Failed",
  delayed: "Delayed",
  paused: "Paused",
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  active: "blue",
  waiting: "yellow",
  completed: "green",
  failed: "red",
  delayed: "orange",
  paused: "secondary",
};

export const JOB_STATUSES: JobStatus[] = [
  "active",
  "waiting",
  "completed",
  "failed",
  "delayed",
  "paused",
];

/**
 * Format a queue name for display.
 * e.g. "search-index" → "Search Index"
 */
export function formatQueueName(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format a timestamp for display.
 */
export function formatJobTimestamp(ts: string | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}
