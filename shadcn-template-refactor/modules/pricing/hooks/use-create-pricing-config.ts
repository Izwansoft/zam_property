// =============================================================================
// useCreatePricingConfig — Create a new pricing config
// =============================================================================
// POST /api/v1/pricing/configs
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { PricingConfig, CreatePricingConfigDto } from "../types";

/**
 * Create a new pricing config.
 * Invalidates the pricing configs list cache on success.
 */
export function useCreatePricingConfig() {
  return useApiMutation<PricingConfig, CreatePricingConfigDto>({
    path: "/pricing/configs",
    method: "POST",
    invalidateKeys: [queryKeys.pricing.all],
  });
}
