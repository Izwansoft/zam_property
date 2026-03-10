/**
 * Listing Location Map
 *
 * Shows a single-pin map for the listing's location on the detail page.
 * Only renders when latitude/longitude coordinates are available.
 */

"use client";

import { MapPin as MapPinIcon } from "lucide-react";

import type { PublicListingDetail } from "@/lib/api/public-api";
import { LazyListingMap } from "@/components/common/lazy-map";

interface ListingLocationMapProps {
  listing: PublicListingDetail;
}

export function ListingLocationMap({ listing }: ListingLocationMapProps) {
  const { latitude, longitude } = listing.location ?? {};

  if (!latitude || !longitude) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <MapPinIcon className="h-4 w-4" />
          Location
        </h2>
        <div className="overflow-hidden rounded-2xl">
          <LazyListingMap
            lat={latitude}
            lng={longitude}
            title={listing.title}
            height="280px"
          />
        </div>
        {listing.location?.address && (
          <p className="mt-3 text-sm text-muted-foreground">
            {[
              listing.location.address,
              listing.location.city,
              listing.location.state,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
