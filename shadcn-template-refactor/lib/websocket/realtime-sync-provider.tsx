// =============================================================================
// RealtimeSyncProvider — Combines all real-time hooks into one provider
// =============================================================================
// Mount this inside SocketProvider in portal layouts.
// It initializes: useRealtimeSync, useRealtimeNotifications,
// useReconnectionHandler, and PM-specific realtime hooks.
// =============================================================================

"use client";

import React from "react";
import { usePartnerId } from "@/modules/partner/hooks/use-partner";
import { useRealtimeNotifications } from "@/modules/notification/hooks/use-realtime-notifications";
import { useRealtimeSync } from "./hooks/use-realtime-sync";
import { useReconnectionHandler } from "./hooks/use-reconnection-handler";
import { useTenancyRealtime } from "./hooks/use-tenancy-realtime";
import { useBillingPaymentRealtime } from "./hooks/use-billing-payment-realtime";
import { usePropertyOpsRealtime } from "./hooks/use-property-ops-realtime";

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface RealtimeSyncProviderProps {
  children: React.ReactNode;
}

/**
 * Composite provider that activates all real-time sync hooks.
 *
 * Must be placed **inside** `<SocketProvider>` and **inside** `<PartnerProvider>`
 * so that both socket context and partner context are available.
 *
 * @example
 * ```tsx
 * <SocketProvider token={token} portal="partner">
 *   <RealtimeSyncProvider>
 *     {children}
 *   </RealtimeSyncProvider>
 * </SocketProvider>
 * ```
 */
export function RealtimeSyncProvider({ children }: RealtimeSyncProviderProps) {
  const partnerId = usePartnerId();

  // Master event → query invalidation (listings, interactions, vendors, reviews, subscriptions)
  useRealtimeSync({ partnerId });

  // Notification socket events → toast + cache update
  useRealtimeNotifications();

  // Reconnection → refetch stale queries
  useReconnectionHandler();

  // PM: Tenancy lifecycle events
  useTenancyRealtime({ partnerId });

  // PM: Billing, payment, and payout events
  useBillingPaymentRealtime({ partnerId });

  // PM: Deposit, inspection, and claim events
  usePropertyOpsRealtime({ partnerId });

  return <>{children}</>;
}
