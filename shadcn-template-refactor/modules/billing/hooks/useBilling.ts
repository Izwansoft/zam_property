// =============================================================================
// useBilling — TanStack Query hook for single billing detail
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Billing } from "../types";

/**
 * Fetch a single billing record by ID.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useBilling("bill-uuid");
 * // data: Billing (with lineItems, tenancy, reminders)
 * ```
 */
export function useBilling(billingId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<Billing>({
    queryKey: queryKeys.rentBillings.detail(partnerKey, billingId ?? ""),
    path: `/rent-billings/${billingId}`,
    enabled: !!partnerId && !!billingId,
  });
}
