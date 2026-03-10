// =============================================================================
// useAuditActionTypes — Distinct action types for filter dropdowns
// =============================================================================
// GET /api/v1/audit/action-types
// Response: { actionTypes: string[] }
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { ActionTypesResponse } from "../types";

/**
 * Fetch distinct action types from backend for filter dropdowns.
 * Results are cached for 10 minutes — these rarely change.
 * MUST NOT be hardcoded per Part-14 §14.3.
 */
export function useAuditActionTypes() {
  return useApiQuery<ActionTypesResponse>({
    queryKey: queryKeys.audit.actionTypes(),
    path: "/audit/action-types",
    unwrap: false, // Response is { actionTypes: [...] }, not { data: ... }
    staleTime: 10 * 60 * 1000, // 10 min
  });
}
