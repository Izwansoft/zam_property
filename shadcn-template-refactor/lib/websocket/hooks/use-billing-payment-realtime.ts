// =============================================================================
// useBillingPaymentRealtime — Real-time billing & payment event handling
// =============================================================================
// Subscribes to billing, payment, and payout WebSocket events:
// - billing:generated, billing:paid, billing:overdue
// - payment:received, payment:confirmed, payment:failed
// - payout:calculated, payout:approved, payout:processed
// =============================================================================

"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "../use-socket-event";
import {
  BILLING_EVENTS,
  PAYMENT_EVENTS,
  PAYOUT_EVENTS,
  type BillingEventPayload,
  type PaymentEventPayload,
  type PayoutEventPayload,
} from "../types";
import { queryKeys } from "@/lib/query";
import { showInfo, showSuccess, showWarning } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseBillingPaymentRealtimeOptions {
  /** Current partner ID for scoped cache invalidation */
  partnerId: string | null;
  /** Show toasts for events (default: true) */
  showToasts?: boolean;
  /** Callback when a payment is confirmed */
  onPaymentConfirmed?: (data: PaymentEventPayload) => void;
  /** Callback when a bill becomes overdue */
  onBillingOverdue?: (data: BillingEventPayload) => void;
  /** Callback when a payout is processed */
  onPayoutProcessed?: (data: PayoutEventPayload) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Handle real-time billing, payment, and payout events.
 *
 * @example
 * ```tsx
 * useBillingPaymentRealtime({
 *   partnerId,
 *   onPaymentConfirmed: () => confetti(),
 * });
 * ```
 */
export function useBillingPaymentRealtime({
  partnerId,
  showToasts = true,
  onPaymentConfirmed,
  onBillingOverdue,
  onPayoutProcessed,
}: UseBillingPaymentRealtimeOptions): void {
  const queryClient = useQueryClient();
  const partnerKey = partnerId ?? "__no_partner__";

  // --- Billing Events ---

  useSocketEvent<BillingEventPayload>(
    BILLING_EVENTS.GENERATED,
    useCallback(
      () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentBillings.all(partnerKey),
        });
        if (showToasts) showInfo("New bill has been generated");
      },
      [queryClient, partnerKey, showToasts],
    ),
  );

  useSocketEvent<BillingEventPayload>(
    BILLING_EVENTS.PAID,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentBillings.detail(partnerKey, data.billingId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentBillings.all(partnerKey),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentPayments.all(partnerKey),
        });
        if (showToasts) showSuccess("Bill has been paid");
      },
      [queryClient, partnerKey, showToasts],
    ),
  );

  useSocketEvent<BillingEventPayload>(
    BILLING_EVENTS.OVERDUE,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentBillings.all(partnerKey),
        });
        if (showToasts) showWarning("A bill is now overdue");
        onBillingOverdue?.(data);
      },
      [queryClient, partnerKey, showToasts, onBillingOverdue],
    ),
  );

  // --- Payment Events ---

  useSocketEvent<PaymentEventPayload>(
    PAYMENT_EVENTS.RECEIVED,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentPayments.all(partnerKey),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentBillings.detail(partnerKey, data.billingId),
        });
        if (showToasts) showInfo("Payment received");
      },
      [queryClient, partnerKey, showToasts],
    ),
  );

  useSocketEvent<PaymentEventPayload>(
    PAYMENT_EVENTS.CONFIRMED,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentPayments.all(partnerKey),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentBillings.all(partnerKey),
        });
        if (showToasts) showSuccess("Payment confirmed");
        onPaymentConfirmed?.(data);
      },
      [queryClient, partnerKey, showToasts, onPaymentConfirmed],
    ),
  );

  useSocketEvent<PaymentEventPayload>(
    PAYMENT_EVENTS.FAILED,
    useCallback(
      () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentPayments.all(partnerKey),
        });
        if (showToasts) showWarning("Payment processing failed");
      },
      [queryClient, partnerKey, showToasts],
    ),
  );

  // --- Payout Events ---

  useSocketEvent<PayoutEventPayload>(
    PAYOUT_EVENTS.CALCULATED,
    useCallback(
      () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.ownerPayouts.all(partnerKey),
        });
        if (showToasts) showInfo("Payout has been calculated");
      },
      [queryClient, partnerKey, showToasts],
    ),
  );

  useSocketEvent<PayoutEventPayload>(
    PAYOUT_EVENTS.APPROVED,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.ownerPayouts.all(partnerKey),
        });
        if (data.payoutId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.ownerPayouts.detail(partnerKey, data.payoutId),
          });
        }
        if (showToasts) showSuccess("Payout has been approved");
      },
      [queryClient, partnerKey, showToasts],
    ),
  );

  useSocketEvent<PayoutEventPayload>(
    PAYOUT_EVENTS.PROCESSED,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.ownerPayouts.all(partnerKey),
        });
        if (showToasts) showSuccess("Payout has been processed");
        onPayoutProcessed?.(data);
      },
      [queryClient, partnerKey, showToasts, onPayoutProcessed],
    ),
  );
}
