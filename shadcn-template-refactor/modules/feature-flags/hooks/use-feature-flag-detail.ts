// =============================================================================
// useFeatureFlagDetail — Get a single feature flag by key (admin)
// =============================================================================
// GET /api/v1/admin/feature-flags/:key
// Returns the flag with overrides and user targets.
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { FeatureFlagDetail } from "../types";

/**
 * Fetch a single feature flag by key (admin detail view).
 */
export function useFeatureFlagDetail(key: string | undefined) {
  return useApiQuery<FeatureFlagDetail>({
    queryKey: queryKeys.featureFlags.detail(key ?? ""),
    path: `/admin/feature-flags/${key}`,
    enabled: !!key,
    staleTime: 30 * 1000,
  });
}
