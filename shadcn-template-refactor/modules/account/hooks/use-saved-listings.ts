// =============================================================================
// useSavedListings — Customer's saved / favorited listings
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { SavedListing, SavedListingFilters } from "../types";

function cleanSavedFilters(
  filters: SavedListingFilters
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  if (filters.page) cleaned.page = filters.page;
  if (filters.pageSize) cleaned.pageSize = filters.pageSize;
  if (filters.search) cleaned.search = filters.search;
  return cleaned;
}

export function useSavedListings(filters: SavedListingFilters = {}) {
  const cleanedParams = cleanSavedFilters(filters);

  return useApiPaginatedQuery<SavedListing>({
    queryKey: queryKeys.account.saved(cleanedParams),
    path: "/account/saved",
    params: cleanedParams,
    format: "A",
    staleTime: 60 * 1000,
  });
}

export function useUnsaveListing() {
  return useApiMutation<void, string>({
    path: (listingId) => `/account/saved/${listingId}`,
    method: "DELETE",
    invalidateKeys: [
      queryKeys.account.saved(),
      ["account", "dashboard-stats"],
    ],
  });
}

/**
 * Save (favourite) a listing.
 * POST /account/saved { listingId }
 */
export function useSaveListing() {
  return useApiMutation<void, { listingId: string }>({
    path: "/account/saved",
    method: "POST",
    invalidateKeys: [
      queryKeys.account.saved(),
      ["account", "dashboard-stats"],
    ],
  });
}
