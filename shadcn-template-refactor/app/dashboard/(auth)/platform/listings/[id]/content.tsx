// =============================================================================
// Platform Listing Detail — Client Content
// =============================================================================
// Uses the existing ListingDetailView for a consistent detail view.
// Backend: GET /api/v1/admin/listings/:id
// =============================================================================

"use client";

import { useParams } from "next/navigation";
import { useAdminListingDetail } from "@/modules/admin/hooks/admin-listings";
import {
  ListingDetailView,
  ListingDetailSkeleton,
} from "@/modules/listing/components/listing-detail";
import { PageHeader } from "@/components/common/page-header";

export function PlatformListingDetailContent({
  listingId: listingIdProp,
  basePath: basePathProp,
  entityBasePath: entityBasePathProp,
}: {
  /** Override the listing ID (defaults to route param `id`) */
  listingId?: string;
  /** Override the back-link base path (defaults to /dashboard/platform/listings) */
  basePath?: string;
  /** Override related entity links base path (defaults to /dashboard/platform) */
  entityBasePath?: string;
} = {}) {
  const params = useParams<{ id: string }>();
  const id = listingIdProp ?? params.id;
  const basePath = basePathProp ?? "/dashboard/platform/listings";
  const entityBasePath = entityBasePathProp ?? "/dashboard/platform";
  const { data: listing, isLoading, error } = useAdminListingDetail(id);

  if (isLoading) {
    return <ListingDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Listing Detail"
          backHref={basePath}
          hideBreadcrumb
        />
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Failed to load Listing
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred."}
          </p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Listing Detail"
          backHref={basePath}
          hideBreadcrumb
        />
        <div className="rounded-md border bg-muted/50 p-6 text-center">
          <h2 className="text-lg font-semibold">Listing not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The listing you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
        </div>
      </div>
    );
  }

  // Cast AdminListing to ListingDetail — they share the same base Listing interface
  // AdminListing has partner+vendor, ListingDetail has vendor+media
  const listingWithDefaults = {
    ...listing,
    media: (listing as unknown as Record<string, unknown>).media ?? [],
  };

  return (
    <ListingDetailView
      listing={listingWithDefaults as Parameters<typeof ListingDetailView>[0]["listing"]}
      portal="partner"
      basePath={basePath}
      showVendor
      entityBasePath={entityBasePath}
    />
  );
}
