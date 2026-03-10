// =============================================================================
// useJobDetail — Single job detail
// =============================================================================
// GET /api/v1/admin/jobs/:queueName/:jobId
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { Job } from "../types";

/**
 * Fetch a single job's full detail including data, stack trace, attempts.
 *
 * @param queueName - The queue the job belongs to.
 * @param jobId - The job identifier.
 */
export function useJobDetail(queueName: string, jobId: string) {
  return useApiQuery<Job>({
    queryKey: queryKeys.jobs.detail(queueName, jobId),
    path: `/admin/jobs/${queueName}/${jobId}`,
    staleTime: 15 * 1000,
    enabled: !!queueName && !!jobId,
  });
}
