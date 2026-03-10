// =============================================================================
// usePaymentsByBilling — TanStack Query hook for payments by billing ID
// =============================================================================
// Fetches all payments associated with a specific billing record.
// Uses paginated query (Format A) against /rent-payments?billingId=xxx
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { BillingPayment } from "../types";

/**
 * Fetch paginated payments for a specific billing.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePaymentsByBilling("billing-001");
 * // data.items: BillingPayment[]
 * ```
 */
export function usePaymentsByBilling(billingId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiPaginatedQuery<BillingPayment>({
    queryKey: queryKeys.rentPayments.byBilling(partnerKey, billingId ?? ""),
    path: "/rent-payments",
    params: { billingId, limit: 50 },
    format: "A",
    enabled: !!partnerId && !!billingId,
  });
}
