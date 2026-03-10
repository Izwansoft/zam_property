// =============================================================================
// useAddFlagOverride — Add partner/vertical override to a feature flag
// =============================================================================
// POST /api/v1/admin/feature-flags/:key/overrides
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { AddFlagOverrideDto } from "../types";

interface OverrideVariables extends AddFlagOverrideDto {
  flagKey: string;
}

/**
 * Add or update an override for a feature flag.
 * Invalidates the flag detail cache on success.
 */
export function useAddFlagOverride() {
  return useApiMutation<{ id: string }, OverrideVariables>({
    path: (variables) => `/admin/feature-flags/${variables.flagKey}/overrides`,
    method: "POST",
    invalidateKeys: [queryKeys.featureFlags.all],
  });
}
