// =============================================================================
// useRetryAllFailed — Retry all failed jobs in a queue
// =============================================================================
// POST /api/v1/admin/jobs/retry-all/:queueName
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";

/**
 * Retry all failed jobs in a specific queue.
 * The mutation variable is the queue name string.
 */
export function useRetryAllFailed() {
  return useApiMutation<unknown, string>({
    path: (queueName) => `/admin/jobs/retry-all/${queueName}`,
    method: "POST",
    invalidateKeys: [queryKeys.jobs.all],
  });
}
