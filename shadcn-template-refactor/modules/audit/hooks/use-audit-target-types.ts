// =============================================================================
// useAuditTargetTypes — Distinct target types for filter dropdowns
// =============================================================================
// GET /api/v1/audit/target-types
// Response: { targetTypes: string[] }
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { TargetTypesResponse } from "../types";

/**
 * Fetch distinct target types from backend for filter dropdowns.
 * Results are cached for 10 minutes — these rarely change.
 * MUST NOT be hardcoded per Part-14 §14.3.
 */
export function useAuditTargetTypes() {
  return useApiQuery<TargetTypesResponse>({
    queryKey: queryKeys.audit.targetTypes(),
    path: "/audit/target-types",
    unwrap: false, // Response is { targetTypes: [...] }, not { data: ... }
    staleTime: 10 * 60 * 1000, // 10 min
  });
}
