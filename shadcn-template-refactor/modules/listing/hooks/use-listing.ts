// =============================================================================
// useListing — TanStack Query hook for single listing detail
// =============================================================================
// Fetches a single listing by ID using Format A (standard single entity).
// Uses partner-scoped query keys for proper cache isolation.
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { ListingDetail } from "../types";

/**
 * Fetch a single listing by ID.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useListing("listing-001");
 * // data: ListingDetail (with vendor, media)
 * ```
 */
export function useListing(listingId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<ListingDetail>({
    queryKey: queryKeys.listings.detail(partnerKey, listingId),
    path: `/listings/${listingId}`,
    enabled: !!partnerId && !!listingId,
  });
}
