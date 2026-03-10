// =============================================================================
// useOptInPartnerExperiment — Opt a partner in/out of an experiment
// =============================================================================
// POST /api/v1/admin/experiments/:key/partner-opt-in
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { PartnerOptInDto } from "../types";

interface OptInVariables extends PartnerOptInDto {
  experimentKey: string;
}

/**
 * Opt a partner in/out of an experiment.
 * Invalidates experiment detail cache on success.
 */
export function useOptInPartnerExperiment() {
  return useApiMutation<{ ok: boolean }, OptInVariables>({
    path: (variables) =>
      `/admin/experiments/${variables.experimentKey}/partner-opt-in`,
    method: "POST",
    invalidateKeys: [queryKeys.experiments.all],
  });
}
