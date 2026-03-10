// =============================================================================
// Listing Mutations — Create, Update, Publish hooks
// =============================================================================
// Wraps useApiMutation for listing write operations.
// Uses partner-scoped query key invalidation.
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { ListingDetail } from "../types";

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface CreateListingDto {
  vendorId: string;
  verticalType: string;
  schemaVersion: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  priceType?: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  attributes?: Record<string, unknown>;
}

export interface UpdateListingDto {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  priceType?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  attributes?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// useCreateListing
// ---------------------------------------------------------------------------

/**
 * Create a new listing draft.
 *
 * @example
 * ```tsx
 * const create = useCreateListing();
 * create.mutate({ verticalType: "REAL_ESTATE", ... });
 * ```
 */
export function useCreateListing() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<ListingDetail, CreateListingDto>({
    path: "/listings",
    method: "POST",
    invalidateKeys: [queryKeys.listings.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// useUpdateListing
// ---------------------------------------------------------------------------

/**
 * Update an existing listing.
 * Variable must include `id` field alongside update fields.
 *
 * @example
 * ```tsx
 * const update = useUpdateListing();
 * update.mutate({ id: "listing-001", title: "Updated Title" });
 * ```
 */
export function useUpdateListing() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<ListingDetail, UpdateListingDto & { id: string }>({
    path: (variables) => `/listings/${variables.id}`,
    method: "PATCH",
    invalidateKeys: [queryKeys.listings.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// usePublishListing
// ---------------------------------------------------------------------------

/**
 * Publish a listing (DRAFT/EXPIRED/ARCHIVED → PUBLISHED).
 *
 * @example
 * ```tsx
 * const publish = usePublishListing();
 * publish.mutate("listing-001");
 * ```
 */
export function usePublishListing() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<ListingDetail, string>({
    path: (listingId) => `/listings/${listingId}/publish`,
    method: "PATCH",
    invalidateKeys: [queryKeys.listings.all(partnerKey)],
  });
}
