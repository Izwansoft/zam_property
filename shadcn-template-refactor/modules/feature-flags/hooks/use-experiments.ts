// =============================================================================
// useExperiments — List all experiments (admin)
// =============================================================================
// GET /api/v1/admin/experiments
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { Experiment } from "../types";

/**
 * Fetch all experiments (admin view).
 */
export function useExperiments() {
  return useApiQuery<Experiment[]>({
    queryKey: queryKeys.experiments.list(),
    path: "/admin/experiments",
    staleTime: 30 * 1000,
  });
}
