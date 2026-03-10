// =============================================================================
// useReceipt — Query hook to fetch a single payment receipt
// =============================================================================
// GET /api/v1/rent-payments/:id
// Returns the full payment record, including receipt number and receipt URL.
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner/hooks/use-partner";
import type { PaymentStatusResponse } from "../types";

interface UseReceiptOptions {
  /** Payment ID to fetch receipt for */
  paymentId: string | undefined;
  /** Whether the query is enabled */
  enabled?: boolean;
}

/**
 * Fetch the payment receipt details for a given payment ID.
 *
 * @example
 * ```ts
 * const { data: receipt, isLoading } = useReceipt({
 *   paymentId: "payment-001",
 * });
 * ```
 */
export function useReceipt({ paymentId, enabled = true }: UseReceiptOptions) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<PaymentStatusResponse>({
    queryKey: queryKeys.rentPayments.detail(partnerKey, paymentId ?? ""),
    path: `/rent-payments/${paymentId}`,
    enabled: enabled && !!paymentId && !!partnerId,
    staleTime: 5 * 60 * 1000, // 5 minutes — receipt data rarely changes
  });
}
