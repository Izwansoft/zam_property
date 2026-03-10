// =============================================================================
// useFeatureFlags — List all feature flags (admin)
// =============================================================================
// GET /api/v1/admin/feature-flags
// Returns array of FeatureFlag (non-paginated, wrapped in ApiResponse)
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { FeatureFlag } from "../types";

/**
 * Fetch all feature flags (admin view).
 * Returns the full list — not paginated.
 */
export function useFeatureFlags() {
  return useApiQuery<FeatureFlag[]>({
    queryKey: queryKeys.featureFlags.list(),
    path: "/admin/feature-flags",
    staleTime: 30 * 1000,
  });
}
