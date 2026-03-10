// =============================================================================
// useRetryJob — Retry a specific failed job
// =============================================================================
// POST /api/v1/admin/jobs/retry
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { RetryJobDto } from "../types";

/**
 * Retry a specific failed job.
 * Invalidates the jobs list and health on success.
 */
export function useRetryJob() {
  return useApiMutation<unknown, RetryJobDto>({
    path: "/admin/jobs/retry",
    method: "POST",
    invalidateKeys: [queryKeys.jobs.all],
  });
}
