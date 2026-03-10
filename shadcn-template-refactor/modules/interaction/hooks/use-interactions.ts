// =============================================================================
// useInteractions — TanStack Query hook for interaction list (inbox)
// =============================================================================
// Uses paginated query (Format A) with partner-scoped query keys.
// Supports URL-driven filters, pagination, search, and sorting.
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Interaction, InteractionFilters } from "../types";
import { cleanInteractionFilters } from "../utils";

/**
 * Fetch paginated interactions (inbox) with filters.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useInteractions({ status: "NEW", page: 1 });
 * // data.items: Interaction[], data.pagination: { page, pageSize, total, totalPages }
 * ```
 */
export function useInteractions(filters: InteractionFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanInteractionFilters(
    filters as Record<string, unknown>,
  );

  return useApiPaginatedQuery<Interaction>({
    queryKey: queryKeys.interactions.list(partnerKey, cleanedParams),
    path: "/interactions",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}
