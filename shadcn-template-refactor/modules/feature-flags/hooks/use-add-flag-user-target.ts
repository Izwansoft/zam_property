// =============================================================================
// useAddFlagUserTarget — Add per-user targeting to a feature flag
// =============================================================================
// POST /api/v1/admin/feature-flags/:key/user-targets
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { AddFlagUserTargetDto } from "../types";

interface UserTargetVariables extends AddFlagUserTargetDto {
  flagKey: string;
}

/**
 * Add per-user feature flag targeting.
 * Invalidates the flag detail cache on success.
 */
export function useAddFlagUserTarget() {
  return useApiMutation<{ ok: boolean }, UserTargetVariables>({
    path: (variables) =>
      `/admin/feature-flags/${variables.flagKey}/user-targets`,
    method: "POST",
    invalidateKeys: [queryKeys.featureFlags.all],
  });
}
