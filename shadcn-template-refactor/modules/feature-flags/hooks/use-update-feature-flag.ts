// =============================================================================
// useUpdateFeatureFlag — Update a feature flag
// =============================================================================
// PATCH /api/v1/admin/feature-flags/:key
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { UpdateFeatureFlagDto } from "../types";

interface UpdateFlagVariables extends UpdateFeatureFlagDto {
  key: string;
}

/**
 * Update a feature flag (admin).
 * Invalidates both the list and the specific flag detail cache.
 */
export function useUpdateFeatureFlag() {
  return useApiMutation<{ id: string; key: string }, UpdateFlagVariables>({
    path: (variables) => `/admin/feature-flags/${variables.key}`,
    method: "PATCH",
    invalidateKeys: [queryKeys.featureFlags.all],
  });
}
