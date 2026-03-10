// =============================================================================
// Admin Listings Hooks — All 8 admin listing moderation hooks
// =============================================================================
// Queries:  useAdminListings, useAdminListingDetail
// Mutations: useAdminPublishListing, useAdminUnpublishListing,
//            useAdminExpireListing, useAdminArchiveListing,
//            useAdminFeatureListing, useAdminUnfeatureListing
// =============================================================================

"use client";

import { useApiQuery, useApiPaginatedQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { AdminListing, AdminListingFilters } from "../types";
import { cleanAdminFilters } from "../types";

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch paginated admin listings (cross-partner).
 * GET /api/v1/admin/listings
 * @param partnerScope — if set, scopes to a specific partner via X-Partner-ID header
 */
export function useAdminListings(
  filters: AdminListingFilters = {},
  opts?: { partnerScope?: string },
) {
  const { partnerId: _partnerId, ...rest } = filters;
  const cleanedParams = cleanAdminFilters(rest) as Record<string, unknown>;

  return useApiPaginatedQuery<AdminListing>({
    queryKey: queryKeys.adminListings.list(cleanedParams),
    path: "/admin/listings",
    params: cleanedParams,
    partnerScope: opts?.partnerScope,
    format: "A",
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single admin listing detail.
 * GET /api/v1/admin/listings/:id
 */
export function useAdminListingDetail(id: string | undefined) {
  return useApiQuery<AdminListing>({
    queryKey: queryKeys.adminListings.detail(id ?? ""),
    path: `/admin/listings/${id}`,
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Mutation Hooks
// ---------------------------------------------------------------------------

/**
 * Admin publish listing (bypass vendor).
 * POST /api/v1/admin/listings/:id/publish
 */
export function useAdminPublishListing() {
  return useApiMutation<unknown, string>({
    path: (id) => `/admin/listings/${id}/publish`,
    method: "POST",
    invalidateKeys: [queryKeys.adminListings.all],
  });
}

/**
 * Admin unpublish listing.
 * POST /api/v1/admin/listings/:id/unpublish
 */
export function useAdminUnpublishListing() {
  return useApiMutation<unknown, { id: string; reason?: string }>({
    path: (vars) => `/admin/listings/${vars.id}/unpublish`,
    method: "POST",
    invalidateKeys: [queryKeys.adminListings.all],
  });
}

/**
 * Admin force expire listing.
 * POST /api/v1/admin/listings/:id/expire
 */
export function useAdminExpireListing() {
  return useApiMutation<unknown, { id: string; reason?: string }>({
    path: (vars) => `/admin/listings/${vars.id}/expire`,
    method: "POST",
    invalidateKeys: [queryKeys.adminListings.all],
  });
}

/**
 * Admin archive listing.
 * POST /api/v1/admin/listings/:id/archive
 */
export function useAdminArchiveListing() {
  return useApiMutation<unknown, { id: string; reason?: string }>({
    path: (vars) => `/admin/listings/${vars.id}/archive`,
    method: "POST",
    invalidateKeys: [queryKeys.adminListings.all],
  });
}

/**
 * Feature a listing (promoted).
 * POST /api/v1/admin/listings/:id/feature
 */
export function useAdminFeatureListing() {
  return useApiMutation<unknown, string>({
    path: (id) => `/admin/listings/${id}/feature`,
    method: "POST",
    invalidateKeys: [queryKeys.adminListings.all],
  });
}

/**
 * Remove featured status from a listing.
 * POST /api/v1/admin/listings/:id/unfeature
 */
export function useAdminUnfeatureListing() {
  return useApiMutation<unknown, string>({
    path: (id) => `/admin/listings/${id}/unfeature`,
    method: "POST",
    invalidateKeys: [queryKeys.adminListings.all],
  });
}
