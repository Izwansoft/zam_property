// =============================================================================
// useMaintenanceTickets — TanStack Query hook for maintenance ticket list
// =============================================================================
// Uses paginated query with partner-scoped data.
// Supports URL-driven filters, pagination, and sorting.
// API: GET /api/v1/maintenance
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Maintenance, MaintenanceFilters } from "../types";

/**
 * Clean filter params by removing undefined/null values.
 */
function cleanFilters(
  filters: MaintenanceFilters
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      if (key === "pageSize") {
        cleaned["limit"] = value;
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Fetch paginated maintenance tickets for the current user.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useMaintenanceTickets({ status: MaintenanceStatus.OPEN, page: 1 });
 * // data.items: Maintenance[], data.pagination: { page, pageSize, total, totalPages }
 * ```
 */
export function useMaintenanceTickets(filters: MaintenanceFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanFilters(filters);

  return useApiPaginatedQuery<Maintenance>({
    queryKey: queryKeys.maintenance.list(partnerKey, cleanedParams),
    path: "/maintenance",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}
