// =============================================================================
// useExperimentDetail — Get experiment by key (admin)
// =============================================================================
// GET /api/v1/admin/experiments/:key
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { Experiment } from "../types";

/**
 * Fetch a single experiment by key (admin detail view).
 */
export function useExperimentDetail(key: string | undefined) {
  return useApiQuery<Experiment>({
    queryKey: queryKeys.experiments.detail(key ?? ""),
    path: `/admin/experiments/${key}`,
    enabled: !!key,
    staleTime: 30 * 1000,
  });
}
