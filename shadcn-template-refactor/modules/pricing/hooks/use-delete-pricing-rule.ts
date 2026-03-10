// =============================================================================
// useDeletePricingRule — Delete a pricing rule
// =============================================================================
// DELETE /api/v1/pricing/rules/:id
// =============================================================================

"use client";

import { useApiDelete } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";

/**
 * Delete a pricing rule by ID.
 * Invalidates the pricing rules and configs cache on success.
 */
export function useDeletePricingRule() {
  return useApiDelete({
    basePath: "/pricing/rules",
    invalidateKeys: [queryKeys.pricing.all],
  });
}
