// =============================================================================
// useTenancies — TanStack Query hook for tenancy list
// =============================================================================
// Uses paginated query (Format A) with tenant-scoped data.
// Supports URL-driven filters, pagination, and sorting.
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Tenancy, TenancyFilters } from "../types";

/**
 * Clean filter params by removing undefined/null values.
 */
function cleanFilters(filters: TenancyFilters): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Fetch paginated tenancies for the current tenant.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTenancies({ status: "ACTIVE", page: 1 });
 * // data.items: Tenancy[], data.pagination: { page, pageSize, total, totalPages }
 * ```
 */
export function useTenancies(filters: TenancyFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanFilters(filters);

  return useApiPaginatedQuery<Tenancy>({
    queryKey: queryKeys.tenancies.list(partnerKey, cleanedParams),
    path: "/tenancies",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}
