// =============================================================================
// useListingViewerCount — Live viewer count for a listing detail page
// =============================================================================
// Joins the listing room and listens for `listing:viewers` events.
// Returns the current viewer count (including the current user).
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useSocketEvent } from "../use-socket-event";
import { useSocketRoom } from "../use-socket-room";
import { LISTING_EVENTS, type ListingViewersPayload } from "../types";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Track live viewer count for a specific listing.
 *
 * Automatically joins the `listing:{id}` room on mount and leaves on unmount.
 * Listens for `listing:viewers` events that carry the current count.
 *
 * @param listingId — The listing to track. Pass `null` to disable.
 * @returns `{ viewerCount, joined }` — current viewer count and room join status.
 *
 * @example
 * ```tsx
 * function ListingHeader({ listingId }: { listingId: string }) {
 *   const { viewerCount } = useListingViewerCount(listingId);
 *   return viewerCount > 1 ? <span>{viewerCount} viewing</span> : null;
 * }
 * ```
 */
export function useListingViewerCount(listingId: string | null): {
  viewerCount: number;
  joined: boolean;
} {
  const [viewerCount, setViewerCount] = useState(0);

  // Join the listing-specific room
  const { joined } = useSocketRoom(listingId ? `listing:${listingId}` : null);

  // Listen for viewer count updates
  useSocketEvent<ListingViewersPayload>(
    LISTING_EVENTS.VIEWERS,
    useCallback(
      (data) => {
        if (data.listingId === listingId) {
          setViewerCount(data.count);
        }
      },
      [listingId],
    ),
    [listingId],
  );

  return { viewerCount, joined };
}
