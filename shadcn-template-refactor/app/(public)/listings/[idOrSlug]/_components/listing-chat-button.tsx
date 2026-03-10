// =============================================================================
// Listing Chat Button — "Chat with Agent" for listing detail sidebar
// =============================================================================
// Client component that wraps StartChatButton with listing context.
// Placed in the sidebar alongside vendor card and inquiry CTA.
// =============================================================================

"use client";

import type { PublicListingDetail } from "@/lib/api/public-api";
import { StartChatButton } from "@/modules/chat";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListingChatButtonProps {
  listing: PublicListingDetail;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingChatButton({ listing }: ListingChatButtonProps) {
  const vendor = listing.vendor;
  if (!vendor) return null;

  return (
    <StartChatButton
      vendorId={vendor.id}
      vendorName={vendor.name}
      listingId={listing.id}
      listingTitle={listing.title}
      listingImage={listing.primaryImage ?? undefined}
      variant="secondary"
      className="w-full"
      label="Chat with Agent"
    />
  );
}
