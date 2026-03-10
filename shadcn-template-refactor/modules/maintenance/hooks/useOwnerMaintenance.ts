// =============================================================================
// useOwnerMaintenance — Owner-side maintenance hooks
// =============================================================================
// Hooks for property owners to manage maintenance tickets:
// - List all tickets across owned properties
// - Verify, assign, resolve, close tickets
// - Cancel tickets
// API: /api/v1/maintenance (with owner scope)
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Maintenance, MaintenanceFilters } from "../types";

// ---------------------------------------------------------------------------
// Filter helper
// ---------------------------------------------------------------------------

function cleanFilters(
  filters: MaintenanceFilters
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      if (key === "pageSize") {
        cleaned["limit"] = value;
      } else {
        cleaned[key] = value;
      }
    }
  }
  // Owner scope — include all properties
  cleaned["scope"] = "owner";
  return cleaned;
}

// ---------------------------------------------------------------------------
// Query: List owner maintenance tickets
// ---------------------------------------------------------------------------

/**
 * Fetch all maintenance tickets across owner's properties.
 * Uses same endpoint with owner scope param.
 *
 * @example
 * ```tsx
 * const { data } = useOwnerMaintenanceTickets({ status: MaintenanceStatus.OPEN });
 * ```
 */
export function useOwnerMaintenanceTickets(filters: MaintenanceFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanFilters(filters);

  return useApiPaginatedQuery<Maintenance>({
    queryKey: queryKeys.maintenance.list(partnerKey, { ...cleanedParams, scope: "owner" }),
    path: "/maintenance",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}

// ---------------------------------------------------------------------------
// Mutation DTOs
// ---------------------------------------------------------------------------

/** DTO for verifying a maintenance ticket */
export interface VerifyMaintenanceDto {
  verificationNotes?: string;
}

/** DTO for assigning a maintenance ticket */
export interface AssignMaintenanceDto {
  assignedTo?: string;
  contractorName?: string;
  contractorPhone?: string;
  estimatedCost?: number;
}

/** DTO for resolving a maintenance ticket */
export interface ResolveMaintenanceDto {
  resolution: string;
  actualCost?: number;
}

/** DTO for closing a maintenance ticket */
export interface CloseMaintenanceDto {
  closingNotes?: string;
}

/** DTO for cancelling a maintenance ticket */
export interface CancelMaintenanceDto {
  reason?: string;
}

// ---------------------------------------------------------------------------
// Mutations: Owner actions on maintenance tickets
// ---------------------------------------------------------------------------

/**
 * Verify a maintenance ticket (OPEN → VERIFIED).
 * Owner confirms the issue is legitimate.
 */
export function useVerifyMaintenance(ticketId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Maintenance, VerifyMaintenanceDto>({
    path: `/maintenance/${ticketId}/verify`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.maintenance.detail(partnerKey, ticketId),
      queryKeys.maintenance.all(partnerKey),
    ],
  });
}

/**
 * Assign a maintenance ticket (VERIFIED → ASSIGNED).
 * Owner assigns to staff member or external contractor.
 */
export function useAssignMaintenance(ticketId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Maintenance, AssignMaintenanceDto>({
    path: `/maintenance/${ticketId}/assign`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.maintenance.detail(partnerKey, ticketId),
      queryKeys.maintenance.all(partnerKey),
    ],
  });
}

/**
 * Start work on a maintenance ticket (ASSIGNED → IN_PROGRESS).
 */
export function useStartMaintenance(ticketId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Maintenance, Record<string, never>>({
    path: `/maintenance/${ticketId}/start`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.maintenance.detail(partnerKey, ticketId),
      queryKeys.maintenance.all(partnerKey),
    ],
  });
}

/**
 * Resolve a maintenance ticket (IN_PROGRESS → PENDING_APPROVAL).
 * Work is done, awaiting tenant approval.
 */
export function useResolveMaintenance(ticketId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Maintenance, ResolveMaintenanceDto>({
    path: `/maintenance/${ticketId}/resolve`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.maintenance.detail(partnerKey, ticketId),
      queryKeys.maintenance.all(partnerKey),
    ],
  });
}

/**
 * Close a maintenance ticket (PENDING_APPROVAL → CLOSED).
 * Issue is fully resolved and accepted.
 */
export function useCloseMaintenance(ticketId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Maintenance, CloseMaintenanceDto>({
    path: `/maintenance/${ticketId}/close`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.maintenance.detail(partnerKey, ticketId),
      queryKeys.maintenance.all(partnerKey),
    ],
  });
}

/**
 * Cancel a maintenance ticket (OPEN/VERIFIED/ASSIGNED → CANCELLED).
 */
export function useCancelMaintenance(ticketId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Maintenance, CancelMaintenanceDto>({
    path: `/maintenance/${ticketId}/cancel`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.maintenance.detail(partnerKey, ticketId),
      queryKeys.maintenance.all(partnerKey),
    ],
  });
}
