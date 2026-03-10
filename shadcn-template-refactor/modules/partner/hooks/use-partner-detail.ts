// =============================================================================
// usePartnerDetail — TanStack Query hook for single partner (Platform Admin)
// =============================================================================
// Fetches a single partner by ID using standard single entity response.
// Uses platform-scoped query keys (no partnerId needed).
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { PartnerDetail } from "../types";

/**
 * Fetch a single partner by ID (platform admin only).
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePartnerDetail("partner-001");
 * // data: PartnerDetail
 * ```
 */
export function usePartnerDetail(partnerId: string) {
  return useApiQuery<PartnerDetail>({
    queryKey: queryKeys.partners.detail(partnerId),
    path: `/admin/partners/${partnerId}`,
    enabled: !!partnerId,
  });
}
