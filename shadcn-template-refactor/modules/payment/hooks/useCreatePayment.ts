// =============================================================================
// useCreatePayment — Mutation hook for creating a rent payment intent
// =============================================================================
// POST /api/v1/rent-payments/intent
// Returns a PaymentIntent with status, clientSecret (for Stripe), or bank details.
// Invalidates billing detail & payment list caches on success.
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner/hooks/use-partner";
import type { PaymentIntent, CreatePaymentDto } from "../types";

/**
 * Create a new payment for a billing record.
 *
 * @example
 * ```ts
 * const createPayment = useCreatePayment();
 * createPayment.mutate({
 *   billingId: "billing-001",
 *   amount: 1600,
 *   method: PaymentMethod.CARD,
 * });
 * ```
 */
export function useCreatePayment() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<PaymentIntent, CreatePaymentDto>({
    path: "/rent-payments/intent",
    method: "POST",
    invalidateKeys: [
      queryKeys.rentPayments.all(partnerKey),
    ],
  });
}
