// =============================================================================
// usePlatformAnalytics — TanStack Query hook for admin dashboard stats
// =============================================================================
// Fetches platform-level dashboard statistics for super admins.
// Backend endpoint: GET /api/v1/admin/dashboard/stats
// Response format: Single entity (ApiResponse<AdminDashboardStats>)
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { AdminDashboardStats } from "../types";

/**
 * Fetch platform-level admin dashboard stats.
 * Only available to SUPER_ADMIN and PARTNER_ADMIN with admin:read permission.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePlatformAnalytics();
 * // data.vendorsByStatus, data.listingsByStatus, etc.
 * ```
 */
export function usePlatformAnalytics() {
  return useApiQuery<AdminDashboardStats>({
    queryKey: queryKeys.analytics.platform(),
    path: "/admin/dashboard/stats",
    staleTime: 5 * 60 * 1000, // 5 min stale
  });
}
