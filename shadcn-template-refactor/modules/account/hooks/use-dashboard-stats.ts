// =============================================================================
// useDashboardStats — Customer account dashboard stats
// =============================================================================
// TODO: Backend does NOT have customer-facing dashboard stats endpoints.
//       GET /account/dashboard and GET /account/activity do not exist.
//       These need backend implementation or frontend-side aggregation.
//       See: backend/docs/API-REGISTRY.md (no /account/* endpoints)
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import type { AccountDashboardStats, AccountActivity } from "../types";

// ---------------------------------------------------------------------------
// useDashboardStats
// ---------------------------------------------------------------------------

/**
 * Disabled — backend endpoint does not exist yet.
 * Returns `{ data: undefined, isPending: true, fetchStatus: 'idle' }`.
 */
export function useDashboardStats() {
  return useApiQuery<AccountDashboardStats>({
    queryKey: ["account", "dashboard-stats"],
    path: "/account/dashboard",
    staleTime: 60 * 1000,
    enabled: false, // Backend not implemented
  });
}

// ---------------------------------------------------------------------------
// useRecentActivity
// ---------------------------------------------------------------------------

/**
 * Disabled — backend endpoint does not exist yet.
 */
export function useRecentActivity(limit: number = 10) {
  return useApiQuery<AccountActivity[]>({
    queryKey: ["account", "recent-activity", limit],
    path: "/account/activity",
    axiosConfig: { params: { limit } },
    staleTime: 60 * 1000,
    enabled: false, // Backend not implemented
  });
}
