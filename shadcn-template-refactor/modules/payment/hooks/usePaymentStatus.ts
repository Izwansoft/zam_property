// =============================================================================
// usePaymentStatus — Polling hook for payment status updates
// =============================================================================
// GET /api/v1/rent-payments/:id
// Polls the payment status until terminal state (COMPLETED, FAILED, REFUNDED).
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner/hooks/use-partner";
import { PaymentStatus } from "@/modules/billing/types";
import type { PaymentStatusResponse } from "../types";

/** Terminal payment states — stop polling when reached */
const TERMINAL_STATES: PaymentStatus[] = [
  PaymentStatus.COMPLETED,
  PaymentStatus.FAILED,
  PaymentStatus.REFUNDED,
  PaymentStatus.DISPUTED,
];

interface UsePaymentStatusOptions {
  /** Payment ID to poll */
  paymentId: string | null | undefined;
  /** Whether polling is enabled (default: true when paymentId exists) */
  enabled?: boolean;
  /** Poll interval in ms (default: 2000) */
  pollInterval?: number;
}

/**
 * Poll the status of a payment until it reaches a terminal state.
 *
 * @example
 * ```ts
 * const { data, isLoading, isTerminal } = usePaymentStatus({
 *   paymentId: "payment-001",
 * });
 * ```
 */
export function usePaymentStatus({
  paymentId,
  enabled = true,
  pollInterval = 2000,
}: UsePaymentStatusOptions) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  const query = useApiQuery<PaymentStatusResponse>({
    queryKey: queryKeys.rentPayments.detail(partnerKey, paymentId ?? ""),
    path: `/rent-payments/${paymentId}`,
    enabled: enabled && !!paymentId && !!partnerId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && TERMINAL_STATES.includes(data.status)) {
        return false; // Stop polling
      }
      return pollInterval;
    },
    staleTime: 0, // Always refetch when polling
  });

  const isTerminal =
    !!query.data && TERMINAL_STATES.includes(query.data.status);

  return {
    ...query,
    isTerminal,
    isSuccess: query.data?.status === PaymentStatus.COMPLETED,
    isFailed: query.data?.status === PaymentStatus.FAILED,
    isProcessing:
      !!query.data &&
      [PaymentStatus.PENDING, PaymentStatus.PROCESSING].includes(
        query.data.status
      ),
  };
}
