// =============================================================================
// usePricingConfigs — Paginated pricing config list
// =============================================================================
// GET /api/v1/pricing/configs — with filters and pagination
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { PricingConfig, PricingConfigFilters } from "../types";

/**
 * Fetch paginated pricing configs with optional filters.
 *
 * @example
 * ```ts
 * const { data, isLoading } = usePricingConfigs({ page: 1, pageSize: 20 });
 * const items = data?.items ?? [];
 * ```
 */
export function usePricingConfigs(filters: PricingConfigFilters) {
  const { page, pageSize, ...rest } = filters;

  // Build clean params — omit undefined values
  const params: Record<string, unknown> = { page, pageSize };
  if (rest.search) params.search = rest.search;
  if (rest.chargeType) params.chargeType = rest.chargeType;
  if (rest.pricingModel) params.pricingModel = rest.pricingModel;
  if (rest.isActive !== undefined) params.isActive = rest.isActive;

  return useApiPaginatedQuery<PricingConfig>({
    queryKey: queryKeys.pricing.configs(params),
    path: "/pricing/configs",
    params: params as Record<string, unknown> & {
      page?: number;
      pageSize?: number;
    },
    format: "B",
    staleTime: 30 * 1000,
  });
}
