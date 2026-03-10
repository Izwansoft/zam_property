// =============================================================================
// Admin PM Hooks — Platform-wide Property Management queries & mutations
// =============================================================================
// Cross-partner PM data for Platform Admin (SUPER_ADMIN).
// Backend: GET /api/v1/admin/dashboard/pm-stats for dashboard,
// regular module endpoints with admin-level access for lists:
//   GET /tenancies (TenancyGuard → FULL access for admins)
//   GET /rent-billings (admin has full access)
//   GET /payouts (admin has full access)
// =============================================================================

import { useApiQuery, useApiPaginatedQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { Tenancy } from "@/modules/tenancy/types";
import type { Billing } from "@/modules/billing/types";
import type { Payout } from "@/modules/payout/types";
import type {
  AdminPMStats,
  AdminTenancyFilters,
  AdminBillingFilters,
  AdminPayoutFilters,
  AdminTransactionFilters,
  BulkApprovePayoutVariables,
  BulkProcessBillsVariables,
} from "../types/admin-pm";
import { cleanAdminPMFilters } from "../types/admin-pm";

// ---------------------------------------------------------------------------
// PM Stats (aggregate dashboard)
// ---------------------------------------------------------------------------

/**
 * Fetch platform-wide PM stats.
 * GET /api/v1/admin/dashboard/pm-stats
 */
export function useAdminPMStats() {
  return useApiQuery<AdminPMStats>({
    queryKey: queryKeys.adminPM.stats(),
    path: "/admin/dashboard/pm-stats",
    staleTime: 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Cross-partner Tenancy List
// ---------------------------------------------------------------------------

/**
 * Fetch all tenancies across all partners (admin has FULL access via TenancyGuard).
 * GET /api/v1/tenancies
 */
export function useAdminTenancies(
  filters: AdminTenancyFilters = {}
) {
  const cleanedParams = cleanAdminPMFilters(filters as Record<string, unknown>);
  return useApiPaginatedQuery<Tenancy>({
    queryKey: queryKeys.adminPM.tenancies(cleanedParams),
    path: "/tenancies",
    params: cleanedParams,
    format: "A",
    staleTime: 30 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Cross-partner Billing List
// ---------------------------------------------------------------------------

/**
 * Fetch all bills across all partners (admin has full access).
 * GET /api/v1/rent-billings
 */
export function useAdminBills(
  filters: AdminBillingFilters = {},
  opts?: { partnerScope?: string },
) {
  const cleanedParams = cleanAdminPMFilters(filters as Record<string, unknown>);
  return useApiPaginatedQuery<Billing>({
    queryKey: queryKeys.adminPM.bills(cleanedParams),
    path: "/rent-billings",
    params: cleanedParams,
    partnerScope: opts?.partnerScope,
    format: "A",
    staleTime: 30 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Cross-partner Payout List
// ---------------------------------------------------------------------------

/**
 * Fetch all payouts across all partners (admin has full access).
 * GET /api/v1/payouts
 * @param partnerScope — if set, scopes to a specific partner via X-Partner-ID header
 */
export function useAdminPayouts(
  filters: AdminPayoutFilters = {},
  opts?: { partnerScope?: string },
) {
  const { partnerId: _partnerId, ...rest } = filters;
  const cleanedParams = cleanAdminPMFilters(rest as Record<string, unknown>);
  return useApiPaginatedQuery<Payout>({
    queryKey: queryKeys.adminPM.payouts(cleanedParams),
    path: "/payouts",
    params: cleanedParams,
    partnerScope: opts?.partnerScope,
    format: "E", // Legacy format: { data: [], total, page, limit }
    staleTime: 30 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Cross-partner Transactions (Rent Payments)
// ---------------------------------------------------------------------------

/**
 * Fetch all rent payments across all partners (admin has full access).
 * GET /api/v1/rent-payments
 * @param partnerScope — if set, scopes to a specific partner via X-Partner-ID header
 */
export function useAdminTransactions(
  filters: AdminTransactionFilters = {},
  opts?: { partnerScope?: string },
) {
  const { partnerId: _partnerId, pageSize, ...rest } = filters;
  const cleanedParams = cleanAdminPMFilters({
    ...rest,
    limit: pageSize, // Backend uses 'limit' not 'pageSize'
  } as Record<string, unknown>);
  return useApiPaginatedQuery<unknown>({
    queryKey: queryKeys.adminPM.transactions(cleanedParams),
    path: "/rent-payments",
    params: cleanedParams,
    partnerScope: opts?.partnerScope,
    format: "E", // Legacy format: { data: [], total, page, limit, totalPages }
    staleTime: 30 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Bulk Mutations
// ---------------------------------------------------------------------------

/**
 * Bulk approve payouts.
 * POST /api/v1/payouts/process-batch
 * NOTE: Backend uses process-batch instead of bulk-approve.
 */
export function useBulkApprovePayout() {
  return useApiMutation<unknown, BulkApprovePayoutVariables>({
    path: "/payouts/process-batch",
    method: "POST",
    invalidateKeys: [queryKeys.adminPM.all],
  });
}

/**
 * Bulk process bills (send or write-off).
 * POST /rent-billings/bulk-process { billingIds, action }
 */
export function useBulkProcessBills() {
  return useApiMutation<unknown, BulkProcessBillsVariables>({
    path: "/rent-billings/bulk-process",
    method: "POST",
    invalidateKeys: [queryKeys.adminPM.all],
  });
}
