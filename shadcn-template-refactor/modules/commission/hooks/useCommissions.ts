// =============================================================================
// Commission Hooks — TanStack Query hooks for commissions
// =============================================================================
// Covers list, detail, create, approve, pay, cancel,
// agent-specific commissions and summary.
// =============================================================================

"use client";

import { useApiPaginatedQuery, useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  Commission,
  CommissionDetail,
  CommissionFilters,
  CommissionSummary,
  CreateCommissionDto,
  ApproveCommissionDto,
  PayCommissionDto,
} from "../types";
import { cleanCommissionFilters } from "../types";

// ---------------------------------------------------------------------------
// useCommissions — paginated list (all commissions)
// ---------------------------------------------------------------------------

/**
 * Fetch paginated commissions with filters.
 */
export function useCommissions(filters: CommissionFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanCommissionFilters(filters);

  return useApiPaginatedQuery<Commission>({
    queryKey: queryKeys.commissions.list(partnerKey, cleanedParams),
    path: "/commissions",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}

// ---------------------------------------------------------------------------
// useCommission — single detail
// ---------------------------------------------------------------------------

/**
 * Fetch a single commission by ID.
 */
export function useCommission(commissionId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<CommissionDetail>({
    queryKey: queryKeys.commissions.detail(partnerKey, commissionId),
    path: `/commissions/${commissionId}`,
    enabled: !!partnerId && !!commissionId,
  });
}

// ---------------------------------------------------------------------------
// useAgentCommissions — agent's commissions (paginated)
// ---------------------------------------------------------------------------

/**
 * Fetch commissions for a specific agent.
 */
export function useAgentCommissions(
  agentId: string,
  filters: Omit<CommissionFilters, "agentId"> = {}
) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanCommissionFilters(filters);

  return useApiPaginatedQuery<Commission>({
    queryKey: queryKeys.commissions.agentCommissions(
      partnerKey,
      agentId,
      cleanedParams
    ),
    path: `/agents/${agentId}/commissions`,
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId && !!agentId,
  });
}

// ---------------------------------------------------------------------------
// useAgentCommissionSummary — agent's commission summary
// ---------------------------------------------------------------------------

/**
 * Fetch commission summary for a specific agent.
 */
export function useAgentCommissionSummary(agentId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<CommissionSummary>({
    queryKey: queryKeys.commissions.agentSummary(partnerKey, agentId),
    path: `/agents/${agentId}/commissions/summary`,
    enabled: !!partnerId && !!agentId,
  });
}

// ---------------------------------------------------------------------------
// useCreateCommission — POST /commissions
// ---------------------------------------------------------------------------

export function useCreateCommission() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Commission, CreateCommissionDto>({
    path: "/commissions",
    method: "POST",
    invalidateKeys: [queryKeys.commissions.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// useApproveCommission — POST /commissions/:id/approve
// ---------------------------------------------------------------------------

export function useApproveCommission() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<
    Commission,
    { commissionId: string; data?: ApproveCommissionDto }
  >({
    path: (vars) => `/commissions/${vars.commissionId}/approve`,
    method: "POST",
    invalidateKeys: [queryKeys.commissions.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// usePayCommission — POST /commissions/:id/pay
// ---------------------------------------------------------------------------

export function usePayCommission() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<
    Commission,
    { commissionId: string; data?: PayCommissionDto }
  >({
    path: (vars) => `/commissions/${vars.commissionId}/pay`,
    method: "POST",
    invalidateKeys: [
      queryKeys.commissions.all(partnerKey),
      queryKeys.agents.all(partnerKey),
    ],
  });
}

// ---------------------------------------------------------------------------
// useCancelCommission — POST /commissions/:id/cancel
// ---------------------------------------------------------------------------

export function useCancelCommission() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Commission, { commissionId: string }>({
    path: (vars) => `/commissions/${vars.commissionId}/cancel`,
    method: "POST",
    invalidateKeys: [queryKeys.commissions.all(partnerKey)],
  });
}
