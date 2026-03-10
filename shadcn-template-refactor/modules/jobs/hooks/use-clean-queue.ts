// =============================================================================
// useCleanQueue — Clean completed/failed jobs from a queue
// =============================================================================
// POST /api/v1/admin/jobs/queues/:queueName/clean
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";

interface CleanQueueVariables {
  queueName: string;
  status?: "completed" | "failed";
  grace?: number;
}

/**
 * Clean completed or failed jobs from a queue.
 * Invalidates the jobs health and list on success.
 */
export function useCleanQueue() {
  return useApiMutation<unknown, CleanQueueVariables>({
    path: (vars) => `/admin/jobs/queues/${vars.queueName}/clean`,
    method: "POST",
    invalidateKeys: [queryKeys.jobs.all],
  });
}
