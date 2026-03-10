// =============================================================================
// useUpdatePricingConfig — Update an existing pricing config
// =============================================================================
// PATCH /api/v1/pricing/configs/:id
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { PricingConfig, UpdatePricingConfigDto } from "../types";

interface UpdatePricingConfigVariables extends UpdatePricingConfigDto {
  id: string;
}

/**
 * Update a pricing config.
 * Invalidates the pricing configs list and detail cache on success.
 */
export function useUpdatePricingConfig() {
  return useApiMutation<PricingConfig, UpdatePricingConfigVariables>({
    path: (variables) => `/pricing/configs/${variables.id}`,
    method: "PATCH",
    invalidateKeys: [queryKeys.pricing.all],
  });
}
