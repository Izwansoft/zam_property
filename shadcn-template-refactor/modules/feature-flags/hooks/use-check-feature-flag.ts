// =============================================================================
// useCheckFeatureFlag — Runtime flag evaluation (any role)
// =============================================================================
// GET /api/v1/feature-flags/check?key=...
// Lightweight hook for runtime feature flag checking in any portal.
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { FeatureFlagCheckResult } from "../types";

/**
 * Runtime feature flag check.
 * Usable by any authenticated role — not limited to admin.
 *
 * Caches for 5 minutes to minimize requests.
 *
 * @returns { enabled: boolean; loading: boolean }
 */
export function useCheckFeatureFlag(key: string) {
  const { data, isLoading } = useApiQuery<FeatureFlagCheckResult>({
    queryKey: queryKeys.featureFlags.check(key),
    path: "/feature-flags/check",
    axiosConfig: { params: { key } },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!key,
  });

  return {
    enabled: data?.enabled ?? false,
    variant: data?.variant,
    loading: isLoading,
  };
}
