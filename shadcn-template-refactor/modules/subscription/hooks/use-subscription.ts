// =============================================================================
// useSubscription — TanStack Query hook for current partner subscription
// =============================================================================
// Fetches the current partner's active subscription.
// Backend endpoint: GET /api/v1/subscriptions/current (partner-scoped)
// Response format: Single entity (ApiResponse<Subscription>)
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Subscription } from "../types";

/**
 * Fetch the current partner's subscription with plan details.
 *
 * @example
 * ```tsx
 * const { data: subscription, isLoading } = useSubscription();
 * // subscription.status, subscription.plan.name, etc.
 * ```
 */
export function useSubscription() {
  const partnerId = usePartnerId();

  return useApiQuery<Subscription>({
    queryKey: queryKeys.subscriptions.current(partnerId ?? ""),
    path: "/subscriptions/current",
    enabled: !!partnerId,
    staleTime: 60 * 1000, // 1 min stale
  });
}
