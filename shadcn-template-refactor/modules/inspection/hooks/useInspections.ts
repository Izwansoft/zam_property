// =============================================================================
// useInspections — TanStack Query hooks for Inspection module
// =============================================================================
// Provides list, detail, schedule, complete, and checklist hooks.
// API: /api/v1/inspections
// =============================================================================

"use client";

import { useApiPaginatedQuery, useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  Inspection,
  InspectionFilters,
  ScheduleInspectionDto,
  CompleteInspectionDto,
  UpdateChecklistDto,
} from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanFilters(
  filters: InspectionFilters
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      if (key === "pageSize") {
        cleaned["limit"] = value;
      } else if (key === "status" && Array.isArray(value)) {
        // Backend expects comma-separated statuses
        cleaned[key] = value.join(",");
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// List inspections
// ---------------------------------------------------------------------------

/**
 * Fetch paginated inspection list with filters.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useInspections({ type: InspectionType.MOVE_IN, page: 1 });
 * // data.items: Inspection[], data.pagination: { page, pageSize, total, totalPages }
 * ```
 */
export function useInspections(filters: InspectionFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanFilters(filters);

  return useApiPaginatedQuery<Inspection>({
    queryKey: queryKeys.inspections.list(partnerKey, cleanedParams),
    path: "/inspections",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}

// ---------------------------------------------------------------------------
// Single inspection detail
// ---------------------------------------------------------------------------

/**
 * Fetch a single inspection by ID.
 */
export function useInspection(inspectionId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<Inspection>({
    queryKey: queryKeys.inspections.detail(partnerKey, inspectionId ?? ""),
    path: `/inspections/${inspectionId}`,
    enabled: !!partnerId && !!inspectionId,
  });
}

// ---------------------------------------------------------------------------
// Inspections by tenancy
// ---------------------------------------------------------------------------

/**
 * Fetch inspections scoped to a specific tenancy.
 */
export function useInspectionsByTenancy(tenancyId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const params = tenancyId ? { tenancyId } : {};

  return useApiPaginatedQuery<Inspection>({
    queryKey: queryKeys.inspections.byTenancy(partnerKey, tenancyId ?? ""),
    path: "/inspections",
    params,
    format: "A",
    enabled: !!partnerId && !!tenancyId,
  });
}

// ---------------------------------------------------------------------------
// Schedule inspection
// ---------------------------------------------------------------------------

/**
 * Schedule a new inspection.
 */
export function useScheduleInspection() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Inspection, ScheduleInspectionDto>({
    path: "/inspections",
    method: "POST",
    invalidateKeys: [queryKeys.inspections.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// Complete inspection
// ---------------------------------------------------------------------------

/**
 * Complete an inspection with rating and notes.
 */
export function useCompleteInspection(inspectionId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Inspection, CompleteInspectionDto>({
    path: `/inspections/${inspectionId}/complete`,
    method: "POST",
    invalidateKeys: [
      queryKeys.inspections.all(partnerKey),
      queryKeys.inspections.detail(partnerKey, inspectionId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Update checklist
// ---------------------------------------------------------------------------

/**
 * Update inspection checklist items.
 */
export function useUpdateChecklist(inspectionId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Inspection, UpdateChecklistDto>({
    path: `/inspections/${inspectionId}/checklist`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.inspections.detail(partnerKey, inspectionId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Cancel inspection
// ---------------------------------------------------------------------------

/**
 * Cancel an inspection.
 */
export function useCancelInspection() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Inspection, { inspectionId: string }>({
    path: (variables) => `/inspections/${variables.inspectionId}/cancel`,
    method: "PATCH",
    invalidateKeys: [queryKeys.inspections.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// Reschedule inspection
// ---------------------------------------------------------------------------

/**
 * Reschedule an existing inspection.
 */
export function useRescheduleInspection(inspectionId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<
    Inspection,
    { scheduledDate: string; scheduledTime?: string }
  >({
    path: `/inspections/${inspectionId}/reschedule`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.inspections.all(partnerKey),
      queryKeys.inspections.detail(partnerKey, inspectionId),
    ],
  });
}
