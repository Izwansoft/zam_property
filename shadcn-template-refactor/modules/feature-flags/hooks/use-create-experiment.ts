// =============================================================================
// useCreateExperiment — Create a new experiment
// =============================================================================
// POST /api/v1/admin/experiments
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { Experiment, CreateExperimentDto } from "../types";

/**
 * Create a new experiment (admin).
 * Invalidates the experiments list cache on success.
 */
export function useCreateExperiment() {
  return useApiMutation<Experiment, CreateExperimentDto>({
    path: "/admin/experiments",
    method: "POST",
    invalidateKeys: [queryKeys.experiments.all],
  });
}
