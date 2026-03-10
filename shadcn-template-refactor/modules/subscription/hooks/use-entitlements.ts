// =============================================================================
// useEntitlements — TanStack Query hook for resolved entitlements
// =============================================================================
// Fetches resolved entitlements (plan + overrides merged) for the current partner.
// Backend endpoint: GET /api/v1/subscriptions/entitlements (partner-scoped)
// Response format: Single entity (ApiResponse<ResolvedEntitlements>)
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { ResolvedEntitlements } from "../types";

/**
 * Fetch resolved entitlements for the current partner.
 * Entitlements = plan base + subscription overrides merged.
 *
 * @example
 * ```tsx
 * const { data: entitlements, isLoading } = useEntitlements();
 * // entitlements.listings?.limit → 50
 * // entitlements.features?.includes("analytics") → true
 * ```
 */
export function useEntitlements() {
  const partnerId = usePartnerId();

  return useApiQuery<ResolvedEntitlements>({
    queryKey: queryKeys.subscriptions.entitlements(partnerId ?? ""),
    path: "/subscriptions/entitlements",
    enabled: !!partnerId,
    staleTime: 5 * 60 * 1000, // 5 min stale — entitlements cached on backend (1hr TTL)
  });
}
