// =============================================================================
// useCreateFeatureFlag — Create a new feature flag
// =============================================================================
// POST /api/v1/admin/feature-flags
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { FeatureFlag, CreateFeatureFlagDto } from "../types";

/**
 * Create a new feature flag (admin).
 * Invalidates the feature flag list cache on success.
 */
export function useCreateFeatureFlag() {
  return useApiMutation<FeatureFlag, CreateFeatureFlagDto>({
    path: "/admin/feature-flags",
    method: "POST",
    invalidateKeys: [queryKeys.featureFlags.all],
  });
}
