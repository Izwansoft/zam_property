// =============================================================================
// usePricingRules — Paginated pricing rules list
// =============================================================================
// GET /api/v1/pricing/rules — with filters and pagination
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { PricingRule, PricingRuleFilters } from "../types";

/**
 * Fetch paginated pricing rules with optional filters.
 *
 * @example
 * ```ts
 * const { data, isLoading } = usePricingRules({ page: 1, pageSize: 20 });
 * const items = data?.items ?? [];
 * ```
 */
export function usePricingRules(filters: PricingRuleFilters) {
  const { page, pageSize, ...rest } = filters;

  const params: Record<string, unknown> = { page, pageSize };
  if (rest.pricingConfigId) params.pricingConfigId = rest.pricingConfigId;
  if (rest.isActive !== undefined) params.isActive = rest.isActive;

  return useApiPaginatedQuery<PricingRule>({
    queryKey: queryKeys.pricing.rules(params),
    path: "/pricing/rules",
    params: params as Record<string, unknown> & {
      page?: number;
      pageSize?: number;
    },
    format: "B",
    staleTime: 30 * 1000,
  });
}
