// =============================================================================
// usePropertyOpsRealtime — Deposit, Inspection, and Claim real-time events
// =============================================================================
// Subscribes to property operations WebSocket events:
// - deposit:collected, deposit:refund_initiated, deposit:refunded
// - inspection:scheduled, inspection:completed, inspection:report_ready
// - claim:submitted, claim:approved, claim:rejected
// =============================================================================

"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "../use-socket-event";
import {
  DEPOSIT_EVENTS,
  INSPECTION_EVENTS,
  CLAIM_EVENTS,
  type DepositEventPayload,
  type InspectionEventPayload,
  type ClaimEventPayload,
} from "../types";
import { queryKeys } from "@/lib/query";
import { showInfo, showSuccess } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UsePropertyOpsRealtimeOptions {
  /** Current partner ID for scoped cache invalidation */
  partnerId: string | null;
  /** Show toasts for events (default: true) */
  showToasts?: boolean;
  /** Callback when deposit is refunded */
  onDepositRefunded?: (data: DepositEventPayload) => void;
  /** Callback when inspection report is ready */
  onReportReady?: (data: InspectionEventPayload) => void;
  /** Callback when claim is resolved (approved or rejected) */
  onClaimResolved?: (data: ClaimEventPayload) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Handle real-time events for deposits, inspections, and claims.
 *
 * @example
 * ```tsx
 * usePropertyOpsRealtime({ partnerId, showToasts: true });
 * ```
 */
export function usePropertyOpsRealtime({
  partnerId,
  showToasts = true,
  onDepositRefunded,
  onReportReady,
  onClaimResolved,
}: UsePropertyOpsRealtimeOptions): void {
  const queryClient = useQueryClient();
  const partnerKey = partnerId ?? "__no_partner__";

  // --- Deposit Events ---

  useSocketEvent<DepositEventPayload>(
    DEPOSIT_EVENTS.COLLECTED,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.deposits.all(partnerKey),
        });
        if (data.tenancyId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.tenancies.detail(partnerKey, data.tenancyId),
          });
        }
        if (showToasts) showSuccess("Deposit has been collected");
      },
      [queryClient, partnerKey, showToasts],
    ),
  );

  useSocketEvent<DepositEventPayload>(
    DEPOSIT_EVENTS.REFUND_INITIATED,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.deposits.all(partnerKey),
        });
        if (data.depositId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.deposits.detail(partnerKey, data.depositId),
          });
        }
        if (showToasts) showInfo("Deposit refund has been initiated");
      },
      [queryClient, partnerKey, showToasts],
    ),
  );

  useSocketEvent<DepositEventPayload>(
    DEPOSIT_EVENTS.REFUNDED,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.deposits.all(partnerKey),
        });
        if (showToasts) showSuccess("Deposit has been refunded");
        onDepositRefunded?.(data);
      },
      [queryClient, partnerKey, showToasts, onDepositRefunded],
    ),
  );

  // --- Inspection Events ---

  useSocketEvent<InspectionEventPayload>(
    INSPECTION_EVENTS.SCHEDULED,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.inspections.all(partnerKey),
        });
        if (data.tenancyId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.tenancies.detail(partnerKey, data.tenancyId),
          });
        }
        if (showToasts) showInfo("Inspection has been scheduled");
      },
      [queryClient, partnerKey, showToasts],
    ),
  );

  useSocketEvent<InspectionEventPayload>(
    INSPECTION_EVENTS.COMPLETED,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.inspections.all(partnerKey),
        });
        if (data.inspectionId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.inspections.detail(
              partnerKey,
              data.inspectionId,
            ),
          });
        }
        if (showToasts) showSuccess("Inspection completed");
      },
      [queryClient, partnerKey, showToasts],
    ),
  );

  useSocketEvent<InspectionEventPayload>(
    INSPECTION_EVENTS.REPORT_READY,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.inspections.all(partnerKey),
        });
        if (showToasts) showSuccess("Inspection report is ready to view");
        onReportReady?.(data);
      },
      [queryClient, partnerKey, showToasts, onReportReady],
    ),
  );

  // --- Claim Events ---

  useSocketEvent<ClaimEventPayload>(
    CLAIM_EVENTS.SUBMITTED,
    useCallback(
      () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.claims.all(partnerKey),
        });
        if (showToasts) showInfo("A new claim has been submitted");
      },
      [queryClient, partnerKey, showToasts],
    ),
  );

  useSocketEvent<ClaimEventPayload>(
    CLAIM_EVENTS.APPROVED,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.claims.all(partnerKey),
        });
        if (data.claimId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.claims.detail(partnerKey, data.claimId),
          });
        }
        // Also invalidate deposits (deduction applied)
        queryClient.invalidateQueries({
          queryKey: queryKeys.deposits.all(partnerKey),
        });
        if (showToasts) showSuccess("Claim has been approved");
        onClaimResolved?.(data);
      },
      [queryClient, partnerKey, showToasts, onClaimResolved],
    ),
  );

  useSocketEvent<ClaimEventPayload>(
    CLAIM_EVENTS.REJECTED,
    useCallback(
      (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.claims.all(partnerKey),
        });
        if (data.claimId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.claims.detail(partnerKey, data.claimId),
          });
        }
        if (showToasts) showInfo("Claim has been rejected");
        onClaimResolved?.(data);
      },
      [queryClient, partnerKey, showToasts, onClaimResolved],
    ),
  );
}
