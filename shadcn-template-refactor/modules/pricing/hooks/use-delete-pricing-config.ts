// =============================================================================
// useDeletePricingConfig — Delete a pricing config
// =============================================================================
// DELETE /api/v1/pricing/configs/:id
// =============================================================================

"use client";

import { useApiDelete } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";

/**
 * Delete a pricing config by ID.
 * Invalidates the pricing configs list cache on success.
 */
export function useDeletePricingConfig() {
  return useApiDelete({
    basePath: "/pricing/configs",
    invalidateKeys: [queryKeys.pricing.all],
  });
}
