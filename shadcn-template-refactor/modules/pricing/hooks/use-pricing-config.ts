// =============================================================================
// usePricingConfig — Single pricing config detail
// =============================================================================
// GET /api/v1/pricing/configs/:id
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { PricingConfig } from "../types";

/**
 * Fetch a single pricing config by ID.
 *
 * @example
 * ```ts
 * const { data, isLoading } = usePricingConfig("config-123");
 * ```
 */
export function usePricingConfig(id: string | null) {
  return useApiQuery<PricingConfig>({
    queryKey: queryKeys.pricing.configDetail(id ?? ""),
    path: `/pricing/configs/${id}`,
    enabled: !!id,
    staleTime: 60 * 1000, // 1 min
  });
}
