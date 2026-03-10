// =============================================================================
// useContractRealtime — Contract-specific real-time event handling
// =============================================================================
// Subscribes to contract WebSocket events and handles updates:
// - contract:signed — when a signer completes signing
// - contract:executed — when all parties have signed
// - contract:voided — when contract is cancelled
// =============================================================================

"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "../use-socket-event";
import { CONTRACT_EVENTS, type ContractEventPayload } from "../types";
import { contractQueryKeys } from "@/modules/contract/hooks/useContract";
import { queryKeys } from "@/lib/query";
import { showSuccess, showInfo } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseContractRealtimeOptions {
  /** Current partner ID for scoped cache invalidation */
  partnerId: string | null;
  /** Contract ID to watch (optional - watches all if not specified) */
  contractId?: string;
  /** Tenancy ID (used for cache invalidation) */
  tenancyId?: string;
  /** Show toasts for events (default: true) */
  showToasts?: boolean;
  /** Callback when contract is fully executed */
  onExecuted?: (data: ContractEventPayload) => void;
  /** Callback when a signer signs */
  onSigned?: (data: ContractEventPayload) => void;
}

interface UseContractRealtimeReturn {
  /** Whether the contract was just fully executed */
  isJustExecuted: boolean;
  /** Reset the just executed state */
  resetExecuted: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Handle real-time contract events for live updates and celebrations.
 *
 * @example
 * ```tsx
 * const { isJustExecuted, resetExecuted } = useContractRealtime({
 *   partnerId,
 *   contractId: contract.id,
 *   onExecuted: () => setShowCelebration(true),
 * });
 * ```
 */
export function useContractRealtime({
  partnerId,
  contractId,
  tenancyId,
  showToasts = true,
  onExecuted,
  onSigned,
}: UseContractRealtimeOptions): UseContractRealtimeReturn {
  const queryClient = useQueryClient();
  const [isJustExecuted, setIsJustExecuted] = useState(false);

  const partnerKey = partnerId ?? "__no_partner__";

  // Handle contract signed event
  useSocketEvent<ContractEventPayload>(
    CONTRACT_EVENTS.SIGNED,
    useCallback(
      (data) => {
        // Only handle if watching this specific contract or watching all
        if (contractId && data.contractId !== contractId) return;

        // Invalidate contract cache
        queryClient.invalidateQueries({
          queryKey: contractQueryKeys.detail(partnerKey, data.contractId),
        });

        // Also invalidate by tenancy
        if (data.tenancyId) {
          queryClient.invalidateQueries({
            queryKey: contractQueryKeys.byTenancy(partnerKey, data.tenancyId),
          });
        }

        // Invalidate tenancies
        queryClient.invalidateQueries({
          queryKey: queryKeys.tenancies.all(partnerKey),
        });

        if (showToasts && data.signerName) {
          showInfo(`${data.signerName} has signed the contract`);
        }

        onSigned?.(data);
      },
      [queryClient, partnerKey, contractId, showToasts, onSigned]
    )
  );

  // Handle contract fully executed event
  useSocketEvent<ContractEventPayload>(
    CONTRACT_EVENTS.EXECUTED,
    useCallback(
      (data) => {
        // Only handle if watching this specific contract or watching all
        if (contractId && data.contractId !== contractId) return;

        // Invalidate all related caches
        queryClient.invalidateQueries({
          queryKey: contractQueryKeys.all(partnerKey),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.tenancies.all(partnerKey),
        });

        if (showToasts) {
          showSuccess("Contract fully executed! All parties have signed.");
        }

        setIsJustExecuted(true);
        onExecuted?.(data);
      },
      [queryClient, partnerKey, contractId, showToasts, onExecuted]
    )
  );

  // Handle contract voided event
  useSocketEvent<ContractEventPayload>(
    CONTRACT_EVENTS.VOIDED,
    useCallback(
      (data) => {
        if (contractId && data.contractId !== contractId) return;

        queryClient.invalidateQueries({
          queryKey: contractQueryKeys.detail(partnerKey, data.contractId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.tenancies.all(partnerKey),
        });

        if (showToasts) {
          showInfo("Contract has been voided");
        }
      },
      [queryClient, partnerKey, contractId, showToasts]
    )
  );

  // Reset executed state
  const resetExecuted = useCallback(() => {
    setIsJustExecuted(false);
  }, []);

  return {
    isJustExecuted,
    resetExecuted,
  };
}

export default useContractRealtime;
