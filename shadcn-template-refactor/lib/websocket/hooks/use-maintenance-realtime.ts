// =============================================================================
// useMaintenanceRealtime — Maintenance-specific real-time event handling
// =============================================================================
// Subscribes to maintenance WebSocket events and handles updates:
// - maintenance:updated — when ticket details change
// - maintenance:status_changed — when status transitions
// - maintenance:comment_added — when a new comment is added
// - maintenance:assigned — when ticket is assigned to contractor
// =============================================================================

"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "../use-socket-event";
import { MAINTENANCE_EVENTS, type MaintenanceEventPayload } from "../types";
import { queryKeys } from "@/lib/query";
import { showInfo } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseMaintenanceRealtimeOptions {
  /** Current partner ID for scoped cache invalidation */
  partnerId: string | null;
  /** Ticket ID to watch (optional — watches all if not specified) */
  ticketId?: string;
  /** Show toasts for events (default: true) */
  showToasts?: boolean;
  /** Callback when status changes */
  onStatusChanged?: (data: MaintenanceEventPayload) => void;
  /** Callback when new comment is added */
  onCommentAdded?: (data: MaintenanceEventPayload) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Handle real-time maintenance events for live updates.
 *
 * @example
 * ```tsx
 * useMaintenanceRealtime({
 *   partnerId,
 *   ticketId: ticket.id,
 *   onStatusChanged: (data) => console.log('Status changed:', data.status),
 * });
 * ```
 */
export function useMaintenanceRealtime({
  partnerId,
  ticketId,
  showToasts = true,
  onStatusChanged,
  onCommentAdded,
}: UseMaintenanceRealtimeOptions): void {
  const queryClient = useQueryClient();
  const partnerKey = partnerId ?? "__no_partner__";

  // Handle maintenance updated event
  useSocketEvent<MaintenanceEventPayload>(
    MAINTENANCE_EVENTS.UPDATED,
    useCallback(
      (data) => {
        if (ticketId && data.maintenanceId !== ticketId) return;

        // Invalidate detail cache
        queryClient.invalidateQueries({
          queryKey: queryKeys.maintenance.detail(partnerKey, data.maintenanceId),
        });
        // Invalidate list cache
        queryClient.invalidateQueries({
          queryKey: queryKeys.maintenance.all(partnerKey),
        });
      },
      [queryClient, partnerKey, ticketId]
    )
  );

  // Handle status change event
  useSocketEvent<MaintenanceEventPayload>(
    MAINTENANCE_EVENTS.STATUS_CHANGED,
    useCallback(
      (data) => {
        if (ticketId && data.maintenanceId !== ticketId) return;

        queryClient.invalidateQueries({
          queryKey: queryKeys.maintenance.detail(partnerKey, data.maintenanceId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.maintenance.all(partnerKey),
        });

        if (showToasts && data.status) {
          const statusLabel = data.status.replace(/_/g, " ").toLowerCase();
          showInfo(
            `Maintenance ticket ${data.ticketNumber ?? ""} status changed to ${statusLabel}`.trim()
          );
        }

        onStatusChanged?.(data);
      },
      [queryClient, partnerKey, ticketId, showToasts, onStatusChanged]
    )
  );

  // Handle comment added event
  useSocketEvent<MaintenanceEventPayload>(
    MAINTENANCE_EVENTS.COMMENT_ADDED,
    useCallback(
      (data) => {
        if (ticketId && data.maintenanceId !== ticketId) return;

        queryClient.invalidateQueries({
          queryKey: queryKeys.maintenance.detail(partnerKey, data.maintenanceId),
        });

        if (showToasts && data.updatedByName) {
          showInfo(`${data.updatedByName} added a comment`);
        }

        onCommentAdded?.(data);
      },
      [queryClient, partnerKey, ticketId, showToasts, onCommentAdded]
    )
  );

  // Handle assigned event
  useSocketEvent<MaintenanceEventPayload>(
    MAINTENANCE_EVENTS.ASSIGNED,
    useCallback(
      (data) => {
        if (ticketId && data.maintenanceId !== ticketId) return;

        queryClient.invalidateQueries({
          queryKey: queryKeys.maintenance.detail(partnerKey, data.maintenanceId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.maintenance.all(partnerKey),
        });

        if (showToasts) {
          showInfo(
            `Maintenance ticket ${data.ticketNumber ?? ""} has been assigned`.trim()
          );
        }
      },
      [queryClient, partnerKey, ticketId, showToasts]
    )
  );
}

export default useMaintenanceRealtime;
