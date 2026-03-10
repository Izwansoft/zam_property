// =============================================================================
// usePayout — TanStack Query hook for single payout detail
// =============================================================================
// Fetches a single payout record with line items for the detail view.
// API: GET /api/v1/payouts/:id
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Payout } from "../types";

/**
 * Fetch a single payout record by ID.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePayout("payout-001");
 * // data: Payout (with lineItems, bank details, processing info)
 * ```
 */
export function usePayout(payoutId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<Payout>({
    queryKey: queryKeys.ownerPayouts.detail(partnerKey, payoutId ?? ""),
    path: `/payouts/${payoutId}`,
    enabled: !!partnerId && !!payoutId,
  });
}
