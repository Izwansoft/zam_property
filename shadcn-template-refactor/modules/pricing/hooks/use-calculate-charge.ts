// =============================================================================
// useCalculateCharge — Preview charge calculation
// =============================================================================
// POST /api/v1/pricing/calculate
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import type { CalculateChargeResult, CalculateChargeDto } from "../types";

/**
 * Calculate a charge preview for the given parameters.
 * Does NOT create a charge event — read-only calculation.
 *
 * @example
 * ```ts
 * const { mutateAsync } = useCalculateCharge();
 * const result = await mutateAsync({ chargeType: "LISTING" });
 * ```
 */
export function useCalculateCharge() {
  return useApiMutation<CalculateChargeResult, CalculateChargeDto>({
    path: "/pricing/calculate",
    method: "POST",
    invalidateKeys: [], // no cache invalidation — read-only
  });
}
