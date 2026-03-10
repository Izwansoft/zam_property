// =============================================================================
// useBillings — TanStack Query hook for billing list
// =============================================================================
// Uses paginated query (Format A) with tenant-scoped data.
// Supports URL-driven filters, pagination, and sorting.
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Billing, BillingFilters } from "../types";

/**
 * Clean filter params by removing undefined/null values.
 */
function cleanFilters(filters: BillingFilters): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Fetch paginated billings for the current tenant.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useBillings({ status: BillingStatus.SENT, page: 1 });
 * // data.items: Billing[], data.pagination: { page, pageSize, total, totalPages }
 * ```
 */
export function useBillings(filters: BillingFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanFilters(filters);

  return useApiPaginatedQuery<Billing>({
    queryKey: queryKeys.rentBillings.list(partnerKey, cleanedParams),
    path: "/rent-billings",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}
