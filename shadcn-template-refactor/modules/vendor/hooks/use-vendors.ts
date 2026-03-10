// =============================================================================
// useVendors — TanStack Query hook for vendor list
// =============================================================================
// Uses paginated query (Format A) with partner-scoped query keys.
// Supports URL-driven filters, pagination, search, and sorting.
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Vendor, VendorFilters } from "../types";
import { cleanVendorFilters } from "../utils";

/**
 * Fetch paginated vendors with filters.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useVendors({ status: "PENDING", page: 1 });
 * // data.items: Vendor[], data.pagination: { page, pageSize, total, totalPages }
 * ```
 */
export function useVendors(filters: VendorFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanVendorFilters(filters as Record<string, unknown>);

  return useApiPaginatedQuery<Vendor>({
    queryKey: queryKeys.vendors.list(partnerKey, cleanedParams),
    path: "/vendors",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}
