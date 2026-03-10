// =============================================================================
// usePayouts — TanStack Query hook for owner payout list
// =============================================================================
// Fetches payouts for the current vendor with filtering and pagination.
// API: GET /api/v1/payouts
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Payout, PayoutFilters } from "../types";

/**
 * Clean filter params by removing undefined/null values.
 */
function cleanFilters(filters: PayoutFilters): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Fetch paginated payouts for the owner (vendor).
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePayouts({
 *   status: PayoutStatus.COMPLETED,
 *   page: 1,
 *   pageSize: 20,
 * });
 * ```
 */
export function usePayouts(filters: PayoutFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanFilters(filters);

  return useApiPaginatedQuery<Payout>({
    queryKey: queryKeys.ownerPayouts.list(partnerKey, cleanedParams),
    path: "/payouts",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}
