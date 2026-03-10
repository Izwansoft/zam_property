// =============================================================================
// useContract — TanStack Query hook for single contract detail
// =============================================================================
// Fetches a single contract by ID.
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { usePartnerId } from "@/modules/partner";
import type { ContractDetail } from "../types";

/**
 * Query key factory for contracts
 */
export const contractQueryKeys = {
  all: (partnerId: string) => ["partner", partnerId, "contracts"] as const,
  list: (partnerId: string, params?: Record<string, unknown>) =>
    [...contractQueryKeys.all(partnerId), "list", params] as const,
  detail: (partnerId: string, contractId: string) =>
    [...contractQueryKeys.all(partnerId), "detail", contractId] as const,
  byTenancy: (partnerId: string, tenancyId: string) =>
    [...contractQueryKeys.all(partnerId), "tenancy", tenancyId] as const,
};

/**
 * Fetch a single contract by ID.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useContract("contract-001");
 * // data: ContractDetail (with signers, terms, events)
 * ```
 */
export function useContract(contractId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<ContractDetail>({
    queryKey: contractQueryKeys.detail(partnerKey, contractId),
    path: `/contracts/${contractId}`,
    enabled: !!partnerId && !!contractId,
  });
}

/**
 * Fetch contract by tenancy ID.
 * Returns the primary/active contract for a tenancy.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useContractByTenancy("tenancy-001");
 * ```
 */
export function useContractByTenancy(tenancyId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<ContractDetail>({
    queryKey: contractQueryKeys.byTenancy(partnerKey, tenancyId),
    path: `/contracts/tenancy/${tenancyId}`,
    enabled: !!partnerId && !!tenancyId,
  });
}

/**
 * Get contract PDF URL.
 * This is fetched separately as it may require a new presigned URL.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useContractPdf("contract-001");
 * // data: { url: "https://..." }
 * ```
 */
export function useContractPdf(contractId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<{ url: string; expiresAt: string }>({
    queryKey: [...contractQueryKeys.detail(partnerKey, contractId), "pdf"],
    path: `/contracts/${contractId}/download`,
    enabled: !!partnerId && !!contractId,
    // PDFs URLs expire, so we need to refetch more often
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
