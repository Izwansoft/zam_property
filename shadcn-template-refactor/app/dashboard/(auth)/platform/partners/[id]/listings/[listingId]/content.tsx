// =============================================================================
// Partner-scoped Listing Detail — Client Content
// =============================================================================
// Thin wrapper around PlatformListingDetailContent that binds partner context.
// URL: /dashboard/platform/partners/:id/listings/:listingId
// =============================================================================

"use client";

import { useParams } from "next/navigation";
import { PlatformListingDetailContent } from "@/app/dashboard/(auth)/platform/listings/[id]/content";

export function PartnerListingDetailContent() {
  const params = useParams<{ id: string; listingId: string }>();

  return (
    <PlatformListingDetailContent
      listingId={params.listingId}
      basePath={`/dashboard/platform/partners/${params.id}/listings`}
      entityBasePath="/dashboard/platform"
    />
  );
}
