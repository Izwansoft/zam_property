// =============================================================================
// useOwnerTenancies — TanStack Query hook for owner's tenancy list
// =============================================================================
// Fetches all tenancies across all properties owned by the vendor.
// Supports filtering, pagination, and grouping by property.
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Tenancy, TenancyFilters, TenancyStatus } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OwnerTenancyFilters extends TenancyFilters {
  propertyId?: string;
  tenantId?: string;
}

export interface OwnerTenancySummary {
  totalTenancies: number;
  activeTenancies: number;
  pendingTenancies: number;
  terminatedTenancies: number;
  totalMonthlyRevenue: number;
  currency: string;
}

export interface GroupedTenancies {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  thumbnailUrl?: string;
  tenancies: Tenancy[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanFilters(filters: OwnerTenancyFilters): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Group tenancies by property for display.
 */
export function groupTenanciesByProperty(tenancies: Tenancy[]): GroupedTenancies[] {
  const grouped = new Map<string, GroupedTenancies>();

  for (const tenancy of tenancies) {
    const key = tenancy.propertyId;
    const property = tenancy.property;
    const propertyTitle = property?.title || `Property ${tenancy.propertyId}`;
    const propertyAddress =
      [property?.address, property?.city, property?.state]
        .filter(Boolean)
        .join(", ") || "Address unavailable";

    if (!grouped.has(key)) {
      grouped.set(key, {
        propertyId: tenancy.propertyId,
        propertyTitle,
        propertyAddress,
        thumbnailUrl: property?.thumbnailUrl,
        tenancies: [],
      });
    }
    grouped.get(key)!.tenancies.push(tenancy);
  }

  return Array.from(grouped.values());
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch paginated tenancies for owner (vendor).
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useOwnerTenancies({ status: "ACTIVE" });
 * // data.items: Tenancy[], data.pagination: { page, pageSize, total, totalPages }
 * ```
 */
export function useOwnerTenancies(filters: OwnerTenancyFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanFilters(filters);

  return useApiPaginatedQuery<Tenancy>({
    queryKey: queryKeys.tenancies.owner(partnerKey, cleanedParams),
    path: "/tenancies",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}

/**
 * Fetch summary stats for owner's tenancies.
 * TODO: Backend does not have a dedicated summary endpoint.
 *       Consider computing from the tenancy list or adding backend endpoint.
 *
 * @example
 * ```tsx
 * const { data } = useOwnerTenancySummary();
 * // data: { totalTenancies, activeTenancies, pendingTenancies, ... }
 * ```
 */
export function useOwnerTenancySummary() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiPaginatedQuery<OwnerTenancySummary>({
    queryKey: queryKeys.tenancies.ownerSummary(partnerKey),
    path: "/tenancies",
    params: { limit: 1 }, // Minimal data, we just need stats from response metadata
    format: "A",
    enabled: !!partnerId,
  });
}

// ---------------------------------------------------------------------------
// Mutation Variables Types
// ---------------------------------------------------------------------------

interface ApproveTenancyDto {
  tenancyId: string;
}

interface RejectTenancyDto {
  tenancyId: string;
  reason: string;
}

interface ConfirmDepositDto {
  tenancyId: string;
  depositType: "SECURITY" | "UTILITY" | "KEY";
  amount: number;
  receivedAt?: string;
}

interface ProcessTerminationDto {
  tenancyId: string;
  moveOutDate: string;
  deductions?: { type: string; amount: number; reason: string }[];
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Approve a pending tenancy booking.
 * Backend: POST /tenancies/:id/confirm-booking (DRAFT→BOOKED)
 */
export function useApproveTenancy() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Tenancy, ApproveTenancyDto>({
    path: (variables) => `/tenancies/${variables.tenancyId}/confirm-booking`,
    method: "POST",
    invalidateKeys: [queryKeys.tenancies.owner(partnerKey)],
  });
}

/**
 * Reject/cancel a pending tenancy booking.
 * Backend: POST /tenancies/:id/cancel
 */
export function useRejectTenancy() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Tenancy, RejectTenancyDto>({
    path: (variables) => `/tenancies/${variables.tenancyId}/cancel`,
    method: "POST",
    invalidateKeys: [queryKeys.tenancies.owner(partnerKey)],
  });
}

/**
 * Confirm deposit received for a tenancy.
 */
export function useConfirmDeposit() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Tenancy, ConfirmDepositDto>({
    path: (variables) => `/tenancies/${variables.tenancyId}/confirm-deposit`,
    method: "POST",
    invalidateKeys: [queryKeys.tenancies.owner(partnerKey)],
  });
}

/**
 * Process termination for a tenancy.
 * Backend: POST /tenancies/:id/terminate
 */
export function useProcessTermination() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Tenancy, ProcessTerminationDto>({
    path: (variables) => `/tenancies/${variables.tenancyId}/terminate`,
    method: "POST",
    invalidateKeys: [queryKeys.tenancies.owner(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// Additional Owner Action DTOs
// ---------------------------------------------------------------------------

interface SignContractDto {
  tenancyId: string;
}

interface CompleteHandoverDto {
  tenancyId: string;
  handoverDate: string;
  notes?: string;
  checklistItems?: Array<{ id: string; completed: boolean }>;
}

interface RequestInspectionDto {
  tenancyId: string;
  inspectionType: "ROUTINE" | "MOVE_OUT" | "MAINTENANCE";
  preferredDate?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Additional Owner Action Mutations
// ---------------------------------------------------------------------------

/**
 * Submit contract for a tenancy.
 * Backend: POST /tenancies/:id/submit-contract (DEPOSIT_PAID→CONTRACT_PENDING)
 */
export function useSignContract() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Tenancy, SignContractDto>({
    path: (variables) => `/tenancies/${variables.tenancyId}/submit-contract`,
    method: "POST",
    invalidateKeys: [queryKeys.tenancies.owner(partnerKey)],
  });
}

/**
 * Activate tenancy after handover.
 * Backend: POST /tenancies/:id/activate (CONTRACT_PENDING→ACTIVE)
 */
export function useCompleteHandover() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Tenancy, CompleteHandoverDto>({
    path: (variables) => `/tenancies/${variables.tenancyId}/activate`,
    method: "POST",
    invalidateKeys: [queryKeys.tenancies.owner(partnerKey)],
  });
}

/**
 * Request property inspection.
 * Backend: POST /inspections (separate module, creates inspection linked to tenancy)
 */
export function useRequestInspection() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<{ tenancy: Tenancy; inspection: unknown }, RequestInspectionDto>({
    path: "/inspections",
    method: "POST",
    invalidateKeys: [queryKeys.tenancies.owner(partnerKey)],
  });
}
