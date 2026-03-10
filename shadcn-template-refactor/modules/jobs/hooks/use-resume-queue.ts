// =============================================================================
// useResumeQueue — Resume a paused queue
// =============================================================================
// POST /api/v1/admin/jobs/queues/:queueName/resume
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";

/**
 * Resume a paused queue. The mutation variable is the queue name string.
 * Invalidates the jobs health on success.
 */
export function useResumeQueue() {
  return useApiMutation<unknown, string>({
    path: (queueName) => `/admin/jobs/queues/${queueName}/resume`,
    method: "POST",
    invalidateKeys: [queryKeys.jobs.all],
  });
}
