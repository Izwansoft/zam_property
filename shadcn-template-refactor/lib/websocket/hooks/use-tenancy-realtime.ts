// =============================================================================
// useTenancyRealtime — Tenancy-specific real-time event handling
// =============================================================================
// Subscribes to tenancy WebSocket events and handles updates:
// - tenancy:created — new tenancy booking
// - tenancy:updated — tenancy details changed
// - tenancy:activated — tenancy moved to active
// - tenancy:terminated — tenancy terminated
// =============================================================================

"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "../use-socket-event";
import { TENANCY_EVENTS, type TenancyEventPayload } from "../types";
import { queryKeys } from "@/lib/query";
import { showInfo, showSuccess } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseTenancyRealtimeOptions {
  /** Current partner ID for scoped cache invalidation */
  partnerId: string | null;
  /** Specific tenancy ID to watch (optional — watches all if not specified) */
  tenancyId?: string;
  /** Show toasts for events (default: true) */
  showToasts?: boolean;
  /** Callback when tenancy is activated */
  onActivated?: (data: TenancyEventPayload) => void;
  /** Callback when tenancy is terminated */
  onTerminated?: (data: TenancyEventPayload) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Handle real-time tenancy events for live updates.
 *
 * @example
 * ```tsx
 * useTenancyRealtime({
 *   partnerId,
 *   tenancyId: tenancy.id,
 *   onActivated: () => router.refresh(),
 * });
 * ```
 */
export function useTenancyRealtime({
  partnerId,
  tenancyId,
  showToasts = true,
  onActivated,
  onTerminated,
}: UseTenancyRealtimeOptions): void {
  const queryClient = useQueryClient();
  const partnerKey = partnerId ?? "__no_partner__";

  // Handle tenancy created
  useSocketEvent<TenancyEventPayload>(
    TENANCY_EVENTS.CREATED,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tenancies.all(partnerKey),
        });
        if (showToasts) showInfo("New tenancy booking received");
        // Also invalidate owner tenancies if relevant
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tenancies.owner(partnerKey, {}),
        });
      },
      [queryClient, partnerKey, showToasts],
    ),
  );

  // Handle tenancy updated
  useSocketEvent<TenancyEventPayload>(
    TENANCY_EVENTS.UPDATED,
    useCallback(
      (data) => {
        if (tenancyId && data.tenancyId !== tenancyId) return;

        queryClient.invalidateQueries({
          queryKey: queryKeys.tenancies.detail(partnerKey, data.tenancyId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.tenancies.all(partnerKey),
        });
      },
      [queryClient, partnerKey, tenancyId],
    ),
  );

  // Handle tenancy activated
  useSocketEvent<TenancyEventPayload>(
    TENANCY_EVENTS.ACTIVATED,
    useCallback(
      (data) => {
        if (tenancyId && data.tenancyId !== tenancyId) return;

        queryClient.invalidateQueries({
          queryKey: queryKeys.tenancies.detail(partnerKey, data.tenancyId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.tenancies.all(partnerKey),
        });
        // Also invalidate contracts (new contract may have been created)
        queryClient.invalidateQueries({
          queryKey: queryKeys.contracts.all(partnerKey),
        });

        if (showToasts) showSuccess("Tenancy has been activated");
        onActivated?.(data);
      },
      [queryClient, partnerKey, tenancyId, showToasts, onActivated],
    ),
  );

  // Handle tenancy terminated
  useSocketEvent<TenancyEventPayload>(
    TENANCY_EVENTS.TERMINATED,
    useCallback(
      (data) => {
        if (tenancyId && data.tenancyId !== tenancyId) return;

        queryClient.invalidateQueries({
          queryKey: queryKeys.tenancies.detail(partnerKey, data.tenancyId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.tenancies.all(partnerKey),
        });
        // Also invalidate deposits (refund may be triggered)
        queryClient.invalidateQueries({
          queryKey: queryKeys.deposits.all(partnerKey),
        });

        if (showToasts) showInfo("Tenancy has been terminated");
        onTerminated?.(data);
      },
      [queryClient, partnerKey, tenancyId, showToasts, onTerminated],
    ),
  );
}
