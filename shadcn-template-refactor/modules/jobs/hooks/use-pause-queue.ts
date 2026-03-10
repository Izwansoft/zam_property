// =============================================================================
// usePauseQueue — Pause a queue
// =============================================================================
// POST /api/v1/admin/jobs/queues/:queueName/pause
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";

/**
 * Pause a queue. The mutation variable is the queue name string.
 * Invalidates the jobs health on success.
 */
export function usePauseQueue() {
  return useApiMutation<unknown, string>({
    path: (queueName) => `/admin/jobs/queues/${queueName}/pause`,
    method: "POST",
    invalidateKeys: [queryKeys.jobs.all],
  });
}
