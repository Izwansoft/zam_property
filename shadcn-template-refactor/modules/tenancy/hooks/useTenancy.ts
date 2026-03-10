// =============================================================================
// useTenancy — TanStack Query hook for single tenancy detail
// =============================================================================
// Fetches a single tenancy by ID using Format A (standard single entity).
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { TenancyDetail } from "../types";

/**
 * Fetch a single tenancy by ID.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTenancy("tenancy-001");
 * // data: TenancyDetail (with contract, financial, statusHistory)
 * ```
 */
export function useTenancy(tenancyId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<TenancyDetail>({
    queryKey: queryKeys.tenancies.detail(partnerKey, tenancyId),
    path: `/tenancies/${tenancyId}`,
    enabled: !!partnerId && !!tenancyId,
  });
}
