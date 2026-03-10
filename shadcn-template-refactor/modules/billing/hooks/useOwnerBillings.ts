// =============================================================================
// useOwnerBillings — TanStack Query hook for owner billing list
// =============================================================================
// Fetches billings across all properties owned by the current vendor.
// Supports filters, pagination, and property grouping.
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Billing, OwnerBillingFilters } from "../types";

/**
 * Clean filter params by removing undefined/null values.
 */
function cleanFilters(
  filters: OwnerBillingFilters
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      if (key === "pageSize") {
        cleaned["limit"] = value;
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Fetch paginated billings for the owner (vendor) across all properties.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useOwnerBillings({
 *   status: BillingStatus.OVERDUE,
 *   page: 1,
 *   pageSize: 20,
 * });
 * ```
 */
export function useOwnerBillings(filters: OwnerBillingFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanFilters(filters);

  return useApiPaginatedQuery<Billing>({
    queryKey: queryKeys.rentBillings.list(partnerKey, {
      ...cleanedParams,
      scope: "owner",
    }),
    path: "/rent-billings",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}
