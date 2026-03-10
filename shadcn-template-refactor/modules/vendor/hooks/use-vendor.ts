// =============================================================================
// useVendor — TanStack Query hook for single vendor detail
// =============================================================================
// Fetches a single vendor by ID using standard single entity response.
// Uses partner-scoped query keys for proper cache isolation.
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { VendorDetail } from "../types";

/**
 * Fetch a single vendor by ID.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useVendor("vendor-001");
 * // data: VendorDetail
 * ```
 */
export function useVendor(vendorId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<VendorDetail>({
    queryKey: queryKeys.vendors.detail(partnerKey, vendorId),
    path: `/vendors/${vendorId}`,
    enabled: !!partnerId && !!vendorId,
  });
}
