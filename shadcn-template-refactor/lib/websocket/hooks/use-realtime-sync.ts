// =============================================================================
// useRealtimeSync — Master event→query invalidation hook
// =============================================================================
// Subscribes to all domain WebSocket events and invalidates the corresponding
// TanStack Query caches so data refreshes without a page reload.
//
// Must be mounted once per portal layout (inside SocketProvider).
// =============================================================================

"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "../use-socket-event";
import {
  LISTING_EVENTS,
  INTERACTION_EVENTS,
  VENDOR_EVENTS,
  REVIEW_EVENTS,
  SUBSCRIPTION_EVENTS,
  type ListingEventPayload,
  type InteractionEventPayload,
  type InteractionMessagePayload,
  type VendorEventPayload,
  type ReviewEventPayload,
} from "../types";
import { showInfo, showSuccess } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseRealtimeSyncOptions {
  /** Current partner ID for scoped cache invalidation */
  partnerId: string | null;
  /** Show toasts for important live events (default: true) */
  showToasts?: boolean;
}

/**
 * Master real-time sync hook — maps WebSocket events to TanStack Query
 * cache invalidations.
 *
 * Covers 30+ event types across listings, interactions, vendors, reviews,
 * and subscriptions. Each event invalidates the minimum set of query keys
 * needed to keep the UI fresh.
 *
 * @example
 * ```tsx
 * function RealtimeSyncProvider({ children }: { children: React.ReactNode }) {
 *   const partnerId = usePartnerId();
 *   useRealtimeSync({ partnerId });
 *   return <>{children}</>;
 * }
 * ```
 */
export function useRealtimeSync({
  partnerId,
  showToasts = true,
}: UseRealtimeSyncOptions): void {
  const queryClient = useQueryClient();

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /** Invalidate queries whose key starts with the given prefix */
  const invalidate = useCallback(
    (...keyParts: unknown[]) => {
      queryClient.invalidateQueries({ queryKey: keyParts });
    },
    [queryClient],
  );

  /** Build a partner-scoped key prefix */
  const partnerKey = useCallback(
    (resource: string) =>
      partnerId ? ["partner", partnerId, resource] : [resource],
    [partnerId],
  );

  // -----------------------------------------------------------------------
  // Listing Events
  // -----------------------------------------------------------------------

  useSocketEvent<ListingEventPayload>(
    LISTING_EVENTS.CREATED,
    useCallback(
      () => {
        invalidate(...partnerKey("listings"));
        if (showToasts) showInfo("A new listing has been created");
      },
      [invalidate, partnerKey, showToasts],
    ),
  );

  useSocketEvent<ListingEventPayload>(
    LISTING_EVENTS.UPDATED,
    useCallback(
      (data) => {
        invalidate(...partnerKey("listings"));
        if (data.listingId) {
          invalidate(...partnerKey("listings"), "detail", data.listingId);
        }
      },
      [invalidate, partnerKey],
    ),
  );

  useSocketEvent<ListingEventPayload>(
    LISTING_EVENTS.PUBLISHED,
    useCallback(
      (data) => {
        invalidate(...partnerKey("listings"));
        if (data.listingId) {
          invalidate(...partnerKey("listings"), "detail", data.listingId);
        }
        if (showToasts) showSuccess("A listing has been published");
      },
      [invalidate, partnerKey, showToasts],
    ),
  );

  useSocketEvent<ListingEventPayload>(
    LISTING_EVENTS.UNPUBLISHED,
    useCallback(
      (data) => {
        invalidate(...partnerKey("listings"));
        if (data.listingId) {
          invalidate(...partnerKey("listings"), "detail", data.listingId);
        }
      },
      [invalidate, partnerKey],
    ),
  );

  useSocketEvent<ListingEventPayload>(
    LISTING_EVENTS.DELETED,
    useCallback(
      () => {
        invalidate(...partnerKey("listings"));
      },
      [invalidate, partnerKey],
    ),
  );

  // -----------------------------------------------------------------------
  // Interaction Events
  // -----------------------------------------------------------------------

  useSocketEvent<InteractionEventPayload>(
    INTERACTION_EVENTS.NEW,
    useCallback(
      () => {
        invalidate(...partnerKey("interactions"));
        if (showToasts) showInfo("New inquiry received");
      },
      [invalidate, partnerKey, showToasts],
    ),
  );

  useSocketEvent<InteractionEventPayload>(
    INTERACTION_EVENTS.UPDATED,
    useCallback(
      (data) => {
        invalidate(...partnerKey("interactions"));
        if (data.interactionId) {
          invalidate(
            ...partnerKey("interactions"),
            "detail",
            data.interactionId,
          );
        }
      },
      [invalidate, partnerKey],
    ),
  );

  useSocketEvent<InteractionMessagePayload>(
    INTERACTION_EVENTS.MESSAGE,
    useCallback(
      (data) => {
        if (data.interactionId) {
          // Invalidate the specific interaction detail to refresh messages
          invalidate(
            ...partnerKey("interactions"),
            "detail",
            data.interactionId,
          );
        }
        if (showToasts) {
          showInfo(
            data.message?.senderName
              ? `New message from ${data.message.senderName}`
              : "New message received",
          );
        }
      },
      [invalidate, partnerKey, showToasts],
    ),
  );

  // -----------------------------------------------------------------------
  // Vendor Events
  // -----------------------------------------------------------------------

  useSocketEvent<VendorEventPayload>(
    VENDOR_EVENTS.APPROVED,
    useCallback(
      (data) => {
        invalidate(...partnerKey("vendors"));
        if (data.vendorId) {
          invalidate(...partnerKey("vendors"), "detail", data.vendorId);
        }
        if (showToasts) showSuccess("A vendor has been approved");
      },
      [invalidate, partnerKey, showToasts],
    ),
  );

  useSocketEvent<VendorEventPayload>(
    VENDOR_EVENTS.SUSPENDED,
    useCallback(
      (data) => {
        invalidate(...partnerKey("vendors"));
        if (data.vendorId) {
          invalidate(...partnerKey("vendors"), "detail", data.vendorId);
        }
      },
      [invalidate, partnerKey],
    ),
  );

  // -----------------------------------------------------------------------
  // Review Events
  // -----------------------------------------------------------------------

  useSocketEvent<ReviewEventPayload>(
    REVIEW_EVENTS.CREATED,
    useCallback(
      (data) => {
        invalidate(...partnerKey("reviews"));
        if (data.vendorId) {
          invalidate(...partnerKey("vendors"), "detail", data.vendorId);
        }
        if (showToasts) showInfo("A new review has been submitted");
      },
      [invalidate, partnerKey, showToasts],
    ),
  );

  // -----------------------------------------------------------------------
  // Subscription Events
  // -----------------------------------------------------------------------

  useSocketEvent(
    SUBSCRIPTION_EVENTS.CHANGED,
    useCallback(
      () => {
        invalidate(...partnerKey("subscriptions"));
        if (showToasts) showInfo("Subscription has been updated");
      },
      [invalidate, partnerKey, showToasts],
    ),
  );
}
