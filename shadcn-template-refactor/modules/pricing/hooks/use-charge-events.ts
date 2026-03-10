// =============================================================================
// useChargeEvents — Paginated charge events list
// =============================================================================
// GET /api/v1/pricing/charges — with filters and pagination
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { ChargeEvent, ChargeEventFilters } from "../types";

/**
 * Fetch paginated charge events with optional filters.
 *
 * @example
 * ```ts
 * const { data, isLoading } = useChargeEvents({ page: 1, pageSize: 20 });
 * const items = data?.items ?? [];
 * ```
 */
export function useChargeEvents(filters: ChargeEventFilters) {
  const { page, pageSize, ...rest } = filters;

  const params: Record<string, unknown> = { page, pageSize };
  if (rest.partnerId) params.partnerId = rest.partnerId;
  if (rest.vendorId) params.vendorId = rest.vendorId;
  if (rest.chargeType) params.chargeType = rest.chargeType;
  if (rest.status) params.status = rest.status;
  if (rest.startDate) params.startDate = rest.startDate;
  if (rest.endDate) params.endDate = rest.endDate;

  return useApiPaginatedQuery<ChargeEvent>({
    queryKey: queryKeys.pricing.chargeEvents(params),
    path: "/pricing/charges",
    params: params as Record<string, unknown> & {
      page?: number;
      pageSize?: number;
    },
    format: "B",
    staleTime: 30 * 1000,
  });
}
