// =============================================================================
// useJobsList — Paginated job list with filters
// =============================================================================
// GET /api/v1/admin/jobs/list
// NOTE: Response is non-standard format D: { jobs: [...], total: N }
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { Job, JobListFilters } from "../types";

/**
 * Fetch paginated job list with filters.
 * Uses format "D" (admin jobs non-standard response).
 *
 * @param filters - Page, pageSize, queue, status, date range.
 * @param pollingEnabled - If true, refetch every 10 seconds.
 */
export function useJobsList(
  filters: JobListFilters,
  pollingEnabled = false
) {
  const { page, pageSize, ...rest } = filters;

  const params: Record<string, unknown> = { page, pageSize };
  if (rest.queueName) params.queueName = rest.queueName;
  if (rest.status) params.status = rest.status;
  if (rest.fromDate) params.fromDate = rest.fromDate;
  if (rest.toDate) params.toDate = rest.toDate;

  return useApiPaginatedQuery<Job>({
    queryKey: queryKeys.jobs.list(params),
    path: "/admin/jobs/list",
    params: params as Record<string, unknown> & {
      page?: number;
      pageSize?: number;
    },
    format: "D",
    staleTime: 10 * 1000,
    refetchInterval: pollingEnabled ? 10 * 1000 : undefined,
  });
}
