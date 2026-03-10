// =============================================================================
// useMaintenanceTicket — TanStack Query hook for single maintenance detail
// =============================================================================
// API: GET /api/v1/maintenance/:id
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Maintenance } from "../types";

/**
 * Fetch a single maintenance ticket by ID.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useMaintenanceTicket("ticket-uuid");
 * // data: Maintenance (with attachments, updates, tenancy)
 * ```
 */
export function useMaintenanceTicket(ticketId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<Maintenance>({
    queryKey: queryKeys.maintenance.detail(partnerKey, ticketId ?? ""),
    path: `/maintenance/${ticketId}`,
    enabled: !!partnerId && !!ticketId,
  });
}
