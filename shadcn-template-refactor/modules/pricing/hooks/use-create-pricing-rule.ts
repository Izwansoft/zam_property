// =============================================================================
// useCreatePricingRule — Create a new pricing rule
// =============================================================================
// POST /api/v1/pricing/rules
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { PricingRule, CreatePricingRuleDto } from "../types";

/**
 * Create a new pricing rule.
 * Invalidates the pricing rules and configs cache on success.
 */
export function useCreatePricingRule() {
  return useApiMutation<PricingRule, CreatePricingRuleDto>({
    path: "/pricing/rules",
    method: "POST",
    invalidateKeys: [queryKeys.pricing.all],
  });
}
