// =============================================================================
// useDeposits — TanStack Query hooks for deposit management
// =============================================================================
// Fetches deposits by tenancy with proper caching and partner scoping.
// =============================================================================

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  Deposit,
  DepositSummary,
  DepositFilters,
  RefundCalculation,
  DepositTransaction,
  CreateDepositPayload,
  CollectDepositPayload,
  AddDeductionPayload,
  RefundDepositPayload,
  FinalizeDepositPayload,
} from "../types";

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch all deposits for a tenancy.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDepositsByTenancy("tenancy-001");
 * // data: Deposit[]
 * ```
 */
export function useDepositsByTenancy(tenancyId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<Deposit[]>({
    queryKey: queryKeys.deposits.byTenancy(partnerKey, tenancyId),
    path: `/deposits/tenancy/${tenancyId}`,
    enabled: !!partnerId && !!tenancyId,
  });
}

/**
 * Fetch deposit summary for a tenancy.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDepositSummary("tenancy-001");
 * // data: DepositSummary
 * ```
 */
export function useDepositSummary(tenancyId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<DepositSummary>({
    queryKey: queryKeys.deposits.summary(partnerKey, tenancyId),
    path: `/deposits/tenancy/${tenancyId}/summary`,
    enabled: !!partnerId && !!tenancyId,
  });
}

/**
 * Fetch a single deposit by ID.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDeposit("deposit-001");
 * // data: Deposit
 * ```
 */
export function useDeposit(depositId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<Deposit>({
    queryKey: queryKeys.deposits.detail(partnerKey, depositId),
    path: `/deposits/${depositId}`,
    enabled: !!partnerId && !!depositId,
  });
}

/**
 * Fetch deposit list with filters (for admin views).
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDeposits({ status: "PENDING" });
 * // data: { data: Deposit[], total: number, page: number }
 * ```
 */
export function useDeposits(filters?: DepositFilters) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<{ data: Deposit[]; total: number; page: number }>({
    queryKey: queryKeys.deposits.list(partnerKey, filters as Record<string, unknown>),
    path: "/deposits",
    axiosConfig: { params: filters },
    enabled: !!partnerId,
  });
}

/**
 * Fetch refund calculation for a deposit.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useRefundCalculation("deposit-001");
 * // data: RefundCalculation
 * ```
 */
export function useRefundCalculation(depositId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<RefundCalculation>({
    queryKey: queryKeys.deposits.refundCalculation(partnerKey, depositId),
    path: `/deposits/${depositId}/refund-calculation`,
    enabled: !!partnerId && !!depositId,
  });
}

/**
 * Fetch transaction history for a deposit.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDepositTransactions("deposit-001");
 * // data: DepositTransaction[]
 * ```
 */
export function useDepositTransactions(depositId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<DepositTransaction[]>({
    queryKey: queryKeys.deposits.transactions(partnerKey, depositId),
    path: `/deposits/${depositId}/transactions`,
    enabled: !!partnerId && !!depositId,
  });
}

// ---------------------------------------------------------------------------
// Mutation Hooks
// ---------------------------------------------------------------------------

/**
 * Create a new deposit.
 */
export function useCreateDeposit() {
  const queryClient = useQueryClient();
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useMutation({
    mutationFn: async (payload: CreateDepositPayload) => {
      const response = await apiClient.post<Deposit>("/deposits", payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate deposits for the tenancy
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.byTenancy(partnerKey, variables.tenancyId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.summary(partnerKey, variables.tenancyId),
      });
    },
  });
}

/**
 * Collect (mark as received) a deposit.
 */
export function useCollectDeposit() {
  const queryClient = useQueryClient();
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useMutation({
    mutationFn: async ({
      depositId,
      payload,
    }: {
      depositId: string;
      payload?: CollectDepositPayload;
    }) => {
      const response = await apiClient.post<Deposit>(
        `/deposits/${depositId}/collect`,
        payload ?? {}
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate specific deposit and summary
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.detail(partnerKey, data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.byTenancy(partnerKey, data.tenancyId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.summary(partnerKey, data.tenancyId),
      });
    },
  });
}

/**
 * Add a deduction to a deposit.
 */
export function useAddDeduction() {
  const queryClient = useQueryClient();
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useMutation({
    mutationFn: async ({
      depositId,
      payload,
    }: {
      depositId: string;
      payload: AddDeductionPayload;
    }) => {
      const response = await apiClient.post<Deposit>(
        `/deposits/${depositId}/deduction`,
        payload
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.detail(partnerKey, data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.byTenancy(partnerKey, data.tenancyId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.summary(partnerKey, data.tenancyId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.refundCalculation(partnerKey, data.id),
      });
    },
  });
}

/**
 * Process deposit refund.
 */
export function useRefundDeposit() {
  const queryClient = useQueryClient();
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useMutation({
    mutationFn: async ({
      depositId,
      payload,
    }: {
      depositId: string;
      payload?: RefundDepositPayload;
    }) => {
      const response = await apiClient.post<Deposit>(
        `/deposits/${depositId}/refund`,
        payload ?? {}
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.detail(partnerKey, data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.byTenancy(partnerKey, data.tenancyId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.summary(partnerKey, data.tenancyId),
      });
    },
  });
}

/**
 * Forfeit a deposit.
 */
export function useForfeitDeposit() {
  const queryClient = useQueryClient();
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useMutation({
    mutationFn: async ({
      depositId,
      notes,
    }: {
      depositId: string;
      notes?: string;
    }) => {
      const response = await apiClient.post<Deposit>(
        `/deposits/${depositId}/forfeit`,
        { notes }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.detail(partnerKey, data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.byTenancy(partnerKey, data.tenancyId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.summary(partnerKey, data.tenancyId),
      });
    },
  });
}

/**
 * Finalize deposit with claim deductions.
 */
export function useFinalizeDeposit() {
  const queryClient = useQueryClient();
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useMutation({
    mutationFn: async ({
      depositId,
      payload,
    }: {
      depositId: string;
      payload?: FinalizeDepositPayload;
    }) => {
      const response = await apiClient.post<Deposit>(
        `/deposits/${depositId}/finalize`,
        payload ?? {}
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.detail(partnerKey, data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.byTenancy(partnerKey, data.tenancyId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.deposits.summary(partnerKey, data.tenancyId),
      });
    },
  });
}
