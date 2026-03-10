// =============================================================================
// useJobsHealth — Queue health summary
// =============================================================================
// GET /api/v1/admin/jobs/health
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { QueueHealthSummary } from "../types";

/**
 * Fetch queue health summary with active/failed/waiting counts.
 *
 * @param pollingEnabled - If true, refetch every 10 seconds.
 */
export function useJobsHealth(pollingEnabled = false) {
  return useApiQuery<QueueHealthSummary>({
    queryKey: queryKeys.jobs.health(),
    path: "/admin/jobs/health",
    staleTime: 10 * 1000,
    refetchInterval: pollingEnabled ? 10 * 1000 : undefined,
  });
}
