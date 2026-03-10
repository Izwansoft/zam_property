// =============================================================================
// useUsage — TanStack Query hook for partner usage metrics
// =============================================================================
// Fetches usage counters for the current billing period.
// Backend endpoint: GET /api/v1/subscriptions/usage (partner-scoped)
// Response format: Single entity wrapping UsageMetric[]
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { UsageMetric } from "../types";

export interface UseUsageParams {
  /** Optional: filter to a specific metric key */
  metricKey?: string;
}

/**
 * Fetch usage metrics for the current partner's billing period.
 *
 * @example
 * ```tsx
 * const { data: metrics, isLoading } = useUsage();
 * // metrics: UsageMetric[] — all metrics
 *
 * const { data: metric } = useUsage({ metricKey: "listings_created" });
 * // metric: UsageMetric — single metric
 * ```
 */
export function useUsage(params: UseUsageParams = {}) {
  const partnerId = usePartnerId();

  const cleanedParams: Record<string, unknown> = {};
  if (params.metricKey) cleanedParams.metricKey = params.metricKey;

  return useApiQuery<UsageMetric[] | UsageMetric>({
    queryKey: queryKeys.subscriptions.usage(partnerId ?? "", cleanedParams),
    path: "/subscriptions/usage",
    axiosConfig: {
      params: cleanedParams,
    },
    enabled: !!partnerId,
    staleTime: 30 * 1000, // 30 sec stale — usage changes frequently
  });
}
