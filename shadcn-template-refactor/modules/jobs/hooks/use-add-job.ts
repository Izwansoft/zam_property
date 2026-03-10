// =============================================================================
// useAddJob — Manually add a job to a queue
// =============================================================================
// POST /api/v1/admin/jobs/add
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { AddJobDto } from "../types";

/**
 * Manually add a job to a queue.
 * Invalidates the jobs list and health on success.
 */
export function useAddJob() {
  return useApiMutation<unknown, AddJobDto>({
    path: "/admin/jobs/add",
    method: "POST",
    invalidateKeys: [queryKeys.jobs.all],
  });
}
