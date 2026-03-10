// =============================================================================
// useContractMutations — TanStack Query mutation hooks for contracts
// =============================================================================
// Mutations for contract actions (sign, resend, void).
// =============================================================================

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { usePartnerId } from "@/modules/partner";
import { queryKeys } from "@/lib/query";
import { contractQueryKeys } from "./useContract";
import type { ContractDetail, ContractSigner } from "../types";

// ---------------------------------------------------------------------------
// Sign Contract DTO
// ---------------------------------------------------------------------------

export interface SignContractDto {
  /** Signature data (base64 image or typed signature) */
  signature?: string;
  /** Typed name for signature */
  typedName?: string;
  /** Accept terms checkbox value */
  acceptTerms: boolean;
  /** IP address (auto-captured) */
  ipAddress?: string;
}

// ---------------------------------------------------------------------------
// useSignContract
// ---------------------------------------------------------------------------

/**
 * Sign a contract as the current user.
 *
 * @example
 * ```tsx
 * const signContract = useSignContract("contract-001");
 *
 * signContract.mutate({
 *   typedName: "John Doe",
 *   acceptTerms: true,
 * });
 * ```
 */
export function useSignContract(contractId: string) {
  const queryClient = useQueryClient();
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<ContractDetail, SignContractDto>({
    path: `/contracts/${contractId}/record-signature`,
    method: "POST",
    onSuccess: (data) => {
      // Update contract detail cache
      queryClient.setQueryData(
        contractQueryKeys.detail(partnerKey, contractId),
        data
      );
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.all(partnerKey),
      });
      // Also invalidate tenancies as contract status affects tenancy
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenancies.all(partnerKey),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// useResendContractEmail
// ---------------------------------------------------------------------------

export interface ResendEmailDto {
  /** Specific signer ID to resend to, or all if not specified */
  signerId?: string;
  /** Custom message to include in email */
  message?: string;
}

/**
 * Resend contract email to signers.
 *
 * @example
 * ```tsx
 * const resendEmail = useResendContractEmail("contract-001");
 *
 * resendEmail.mutate({ signerId: "signer-001" });
 * ```
 */
export function useResendContractEmail(contractId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const queryClient = useQueryClient();

  return useApiMutation<{ success: boolean; sentTo: string[] }, ResendEmailDto>({
    path: `/contracts/${contractId}/resend-signature`,
    method: "POST",
    onSuccess: () => {
      // Invalidate to refresh contract events
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.detail(partnerKey, contractId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// useVoidContract
// ---------------------------------------------------------------------------

export interface VoidContractDto {
  /** Reason for voiding */
  reason: string;
}

/**
 * Void/cancel a contract.
 *
 * @example
 * ```tsx
 * const voidContract = useVoidContract("contract-001");
 *
 * voidContract.mutate({ reason: "Partner withdrew" });
 * ```
 */
export function useVoidContract(contractId: string) {
  const queryClient = useQueryClient();
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<ContractDetail, VoidContractDto>({
    path: `/contracts/${contractId}/void-signatures`,
    method: "POST",
    onSuccess: (data) => {
      queryClient.setQueryData(
        contractQueryKeys.detail(partnerKey, contractId),
        data
      );
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.all(partnerKey),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenancies.all(partnerKey),
      });
    },
  });
}
