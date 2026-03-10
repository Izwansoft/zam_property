// =============================================================================
// useOwnerBillingSummary — TanStack Query hook for owner billing stats
// =============================================================================
// Backend: GET /api/v1/rent-billings/automation/status
// Returns billing automation dashboard with aggregate stats.
// TODO: Backend may need a dedicated /rent-billings/summary endpoint
//       for owner-specific billing summaries.
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { BillingSummary } from "../types";

/**
 * Fetch billing summary stats for the owner.
 * Uses the billing automation status endpoint as the closest match.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useOwnerBillingSummary();
 * ```
 */
export function useOwnerBillingSummary(tenancyId?: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const params: Record<string, unknown> = {};
  if (tenancyId) params.tenancyId = tenancyId;

  return useApiQuery<BillingSummary>({
    queryKey: queryKeys.rentBillings.summary(partnerKey, params),
    path: "/rent-billings/automation/status",
    axiosConfig: tenancyId ? { params: { tenancyId } } : undefined,
    enabled: !!partnerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
