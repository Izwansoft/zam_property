// =============================================================================
// usePayoutStatement — TanStack Query hook for payout statement PDF
// =============================================================================
// Fetches the statement download URL for a payout.
// API: GET /api/v1/payouts/:id/statement
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { usePartnerId } from "@/modules/partner";

interface PayoutStatementResponse {
  url: string;
  filename: string;
}

/**
 * Fetch the payout statement PDF URL.
 * Only fetches when explicitly enabled (e.g., on button click).
 *
 * @example
 * ```tsx
 * const { data, refetch, isFetching } = usePayoutStatement("payout-001");
 * // data?.url — PDF download URL
 * ```
 */
export function usePayoutStatement(
  payoutId: string | undefined,
  options?: { enabled?: boolean }
) {
  const partnerId = usePartnerId();

  return useApiQuery<PayoutStatementResponse>({
    queryKey: ["payout-statement", payoutId ?? ""],
    path: `/payouts/${payoutId}/statement`,
    enabled: !!partnerId && !!payoutId && (options?.enabled ?? false),
  });
}
