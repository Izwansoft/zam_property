// =============================================================================
// useListings — TanStack Query hook for listing list
// =============================================================================
// Uses paginated query (Format A) with partner-scoped query keys.
// Supports URL-driven filters, pagination, search, and sorting.
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Listing, ListingFilters } from "../types";
import { cleanFilters } from "../utils";

/**
 * Fetch paginated listings with filters.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useListings({ status: "PUBLISHED", page: 1 });
 * // data.items: Listing[], data.pagination: { page, pageSize, total, totalPages }
 * ```
 */
export function useListings(filters: ListingFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanFilters(filters) as Record<string, unknown>;

  return useApiPaginatedQuery<Listing>({
    queryKey: queryKeys.listings.list(partnerKey, cleanedParams),
    path: "/listings",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}
