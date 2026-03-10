// =============================================================================
// Tenancy Mutations — Create, status change, termination request hooks
// =============================================================================
// Wraps useApiMutation for tenancy write operations.
// Uses partner-scoped query key invalidation.
// =============================================================================

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Tenancy, TenancyDetail, TenancyStatus, TenancyType } from "../types";

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface CreateTenancyDto {
  /** Property (listing) ID to book */
  listingId: string;
  /** Property ID from the listing */
  propertyId: string;
  /** Optional unit ID if specific unit */
  unitId?: string;
  /** Vendor/owner ID from the listing */
  ownerId: string;
  /** Tenancy type */
  type?: TenancyType;
  /** Tenancy start date (ISO) */
  startDate: string;
  /** Tenancy end date (ISO) */
  endDate: string;
  /** Monthly rent amount */
  monthlyRent: number;
  /** Currency (default MYR) */
  currency?: string;
  /** Security deposit amount */
  securityDeposit?: number;
  /** Utility deposit amount */
  utilityDeposit?: number;
  /** Notice period in days */
  noticePeriodDays?: number;
  /** Payment intent ID if deposit pre-authorized */
  paymentIntentId?: string;
}

export interface RequestTerminationDto {
  tenancyId: string;
  requestedDate: string;
  reason?: string;
}

export interface UpdateTenancyStatusDto {
  tenancyId: string;
  status: TenancyStatus;
  reason?: string;
}

// ---------------------------------------------------------------------------
// useRequestTermination
// ---------------------------------------------------------------------------

/**
 * Request tenancy termination.
 *
 * @example
 * ```tsx
 * const requestTermination = useRequestTermination();
 * requestTermination.mutate({
 *   tenancyId: "tenancy-001",
 *   requestedDate: "2026-03-01",
 *   reason: "Moving to new city"
 * });
 * ```
 */
export function useRequestTermination() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const queryClient = useQueryClient();

  return useApiMutation<TenancyDetail, RequestTerminationDto>({
    path: (variables) => `/tenancies/${variables.tenancyId}/request-termination`,
    method: "POST",
    invalidateKeys: [queryKeys.tenancies.all(partnerKey)],
    onSuccess: (_, variables) => {
      // Also invalidate the specific tenancy detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenancies.detail(partnerKey, variables.tenancyId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// useUpdateTenancyStatus
// ---------------------------------------------------------------------------

/**
 * Update tenancy status via specific lifecycle endpoints.
 * NOTE: Backend does NOT have a generic PATCH /tenancies/:id/status.
 *       Instead use the specific action endpoints:
 *       - POST /tenancies/:id/confirm-booking
 *       - POST /tenancies/:id/confirm-deposit
 *       - POST /tenancies/:id/submit-contract
 *       - POST /tenancies/:id/activate
 *       - POST /tenancies/:id/request-termination
 *       - POST /tenancies/:id/terminate
 *       - POST /tenancies/:id/extend
 *       - POST /tenancies/:id/cancel
 *
 * This hook maps status values to the correct action endpoint.
 */
export function useUpdateTenancyStatus() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const queryClient = useQueryClient();

  /** Map status to backend action endpoint */
  const statusActionMap: Record<string, string> = {
    BOOKED: "confirm-booking",
    DEPOSIT_PAID: "confirm-deposit",
    CONTRACT_PENDING: "submit-contract",
    ACTIVE: "activate",
    TERMINATION_REQUESTED: "request-termination",
    TERMINATED: "terminate",
    EXTENDED: "extend",
    CANCELLED: "cancel",
  };

  return useApiMutation<TenancyDetail, UpdateTenancyStatusDto>({
    path: (variables) => {
      const action = statusActionMap[variables.status] ?? variables.status.toLowerCase();
      return `/tenancies/${variables.tenancyId}/${action}`;
    },
    method: "POST",
    invalidateKeys: [queryKeys.tenancies.all(partnerKey)],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenancies.detail(partnerKey, variables.tenancyId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// useCreateTenancy
// ---------------------------------------------------------------------------

/**
 * Create a new tenancy booking.
 * Used by the booking wizard when an tenant wants to rent a property.
 *
 * @example
 * ```tsx
 * const createTenancy = useCreateTenancy();
 * createTenancy.mutate({
 *   listingId: "listing-001",
 *   propertyId: "property-001",
 *   ownerId: "owner-001",
 *   startDate: "2026-03-01",
 *   endDate: "2027-03-01",
 *   monthlyRent: 2500,
 * });
 * ```
 */
export function useCreateTenancy() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Tenancy, CreateTenancyDto>({
    path: "/tenancies",
    method: "POST",
    invalidateKeys: [queryKeys.tenancies.all(partnerKey)],
  });
}
