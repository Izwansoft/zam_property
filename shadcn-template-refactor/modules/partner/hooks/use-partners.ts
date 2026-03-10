// =============================================================================
// usePartners — TanStack Query hook for partner list (Platform Admin)
// =============================================================================
// Uses paginated query (Format A) with platform-scoped query keys.
// No partnerId needed — platform admin scope.
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { Partner, PartnerFilters } from "../types";
import { cleanPartnerFilters } from "../utils";

/**
 * Fetch paginated partners with filters (platform admin only).
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePartners({ status: "ACTIVE", page: 1 });
 * // data.items: Partner[], data.pagination: { page, pageSize, total, totalPages }
 * ```
 */
export function usePartners(filters: PartnerFilters = {}) {
  const cleanedParams = cleanPartnerFilters(filters as Record<string, unknown>);

  return useApiPaginatedQuery<Partner>({
    queryKey: queryKeys.partners.list(cleanedParams),
    path: "/admin/partners",
    params: cleanedParams,
    format: "A",
  });
}
