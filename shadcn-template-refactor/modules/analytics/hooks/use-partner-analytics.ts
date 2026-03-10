// =============================================================================
// usePartnerAnalytics — TanStack Query hook for partner analytics overview
// =============================================================================
// Fetches marketplace-level analytics for partner admins.
// Backend endpoint: GET /api/v1/analytics/partner/overview
// Response format: Single entity (ApiResponse<PartnerAnalyticsOverview>)
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { PartnerAnalyticsOverview, AnalyticsDateRange } from "../types";

/**
 * Fetch partner-level analytics overview for the current partner.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePartnerAnalytics({
 *   startDate: "2024-01-01",
 *   endDate: "2024-01-31",
 * });
 * // data.totals.viewsCount, data.totals.leadsCount, etc.
 * ```
 */
export function usePartnerAnalytics(dateRange?: AnalyticsDateRange) {
  const partnerId = usePartnerId();

  const params: Record<string, unknown> = {};
  if (dateRange?.startDate) params.startDate = dateRange.startDate;
  if (dateRange?.endDate) params.endDate = dateRange.endDate;

  return useApiQuery<PartnerAnalyticsOverview>({
    queryKey: queryKeys.analytics.partner(partnerId ?? "", params),
    path: "/analytics/partner/overview",
    axiosConfig: { params },
    enabled: !!partnerId,
    staleTime: 5 * 60 * 1000, // 5 min — analytics data changes infrequently
  });
}
