// =============================================================================
// useQueueStats — Queue-specific stats
// =============================================================================
// GET /api/v1/admin/jobs/queues/:queueName
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { QueueStats } from "../types";

/**
 * Fetch stats for a specific queue.
 *
 * @param queueName - The queue to inspect.
 * @param pollingEnabled - If true, refetch every 10 seconds.
 */
export function useQueueStats(queueName: string, pollingEnabled = false) {
  return useApiQuery<QueueStats>({
    queryKey: queryKeys.jobs.queueStats(queueName),
    path: `/admin/jobs/queues/${queueName}`,
    staleTime: 10 * 1000,
    refetchInterval: pollingEnabled ? 10 * 1000 : undefined,
    enabled: !!queueName,
  });
}
