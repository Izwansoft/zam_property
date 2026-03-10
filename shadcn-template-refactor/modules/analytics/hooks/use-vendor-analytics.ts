// =============================================================================
// useVendorAnalytics — TanStack Query hooks for vendor analytics
// =============================================================================
// Fetches vendor-level analytics overview and listing breakdown.
// Backend endpoints:
//   GET /api/v1/analytics/vendor/overview
//   GET /api/v1/analytics/vendor/listings
// Response format: Single entity (ApiResponse<T>)
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  VendorAnalyticsOverview,
  VendorListingAnalytics,
  AnalyticsDateRange,
} from "../types";

// ---------------------------------------------------------------------------
// Vendor Overview
// ---------------------------------------------------------------------------

export interface UseVendorAnalyticsParams extends Partial<AnalyticsDateRange> {
  vendorId: string;
}

/**
 * Fetch vendor-level analytics overview (totals).
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useVendorAnalytics({
 *   vendorId: "vendor-001",
 *   startDate: "2024-01-01",
 *   endDate: "2024-01-31",
 * });
 * // data.totals.viewsCount, data.totals.leadsCount, etc.
 * ```
 */
export function useVendorAnalytics(params: UseVendorAnalyticsParams) {
  const partnerId = usePartnerId();

  const queryParams: Record<string, unknown> = {
    vendorId: params.vendorId,
  };
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;

  return useApiQuery<VendorAnalyticsOverview>({
    queryKey: queryKeys.analytics.vendor(
      partnerId ?? "",
      params.vendorId,
      queryParams
    ),
    path: "/analytics/vendor/overview",
    axiosConfig: { params: queryParams },
    enabled: !!partnerId && !!params.vendorId,
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Vendor Listing Analytics
// ---------------------------------------------------------------------------

/**
 * Fetch per-listing analytics breakdown for a vendor.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useVendorListingAnalytics({
 *   vendorId: "vendor-001",
 *   startDate: "2024-01-01",
 *   endDate: "2024-01-31",
 * });
 * // data.items — ListingAnalyticsItem[]
 * ```
 */
export function useVendorListingAnalytics(params: UseVendorAnalyticsParams) {
  const partnerId = usePartnerId();

  const queryParams: Record<string, unknown> = {
    vendorId: params.vendorId,
  };
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;

  return useApiQuery<VendorListingAnalytics>({
    queryKey: queryKeys.analytics.vendor(
      partnerId ?? "",
      params.vendorId,
      { ...queryParams, scope: "listings" }
    ),
    path: "/analytics/vendor/listings",
    axiosConfig: { params: queryParams },
    enabled: !!partnerId && !!params.vendorId,
    staleTime: 5 * 60 * 1000,
  });
}
