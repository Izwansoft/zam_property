// =============================================================================
// Listing Viewing Scheduler — Wrapper for listing detail sidebar
// =============================================================================
// Client component that passes listing context to ViewingScheduler.
// =============================================================================

"use client";

import type { PublicListingDetail } from "@/lib/api/public-api";
import { ViewingScheduler } from "@/modules/viewing-scheduler";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListingViewingSchedulerProps {
  listing: PublicListingDetail;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingViewingScheduler({ listing }: ListingViewingSchedulerProps) {
  const vendor = listing.vendor;
  if (!vendor) return null;

  return (
    <ViewingScheduler
      listingId={listing.id}
      listingTitle={listing.title}
      vendorId={vendor.id}
      vendorName={vendor.name}
    />
  );
}
