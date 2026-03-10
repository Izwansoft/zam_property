// =============================================================================
// useChargeEvent — Single charge event detail
// =============================================================================
// GET /api/v1/pricing/charges/:id
// NOTE: Backend only has GET /pricing/charges (list) and /charges/summary.
// Individual charge detail may need backend implementation.
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { ChargeEvent } from "../types";

/**
 * Fetch a single charge event by ID.
 *
 * @example
 * ```ts
 * const { data, isLoading } = useChargeEvent("event-123");
 * ```
 */
export function useChargeEvent(id: string | null) {
  return useApiQuery<ChargeEvent>({
    queryKey: queryKeys.pricing.chargeEventDetail(id ?? ""),
    path: `/pricing/charges/${id}`,
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 min — charge events are immutable
  });
}
