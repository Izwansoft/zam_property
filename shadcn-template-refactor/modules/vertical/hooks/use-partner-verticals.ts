// =============================================================================
// usePartnerVerticals — TanStack Query hooks for partner vertical management
// =============================================================================
// Enable/disable/configure verticals for a partner.
// Uses /verticals/partner endpoints (partner-scoped via auth header).
// =============================================================================

"use client";

import { useApiQuery, useApiPaginatedQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type {
  PartnerVertical,
  EnableVerticalDto,
  UpdatePartnerVerticalDto,
  PartnerVerticalQueryParams,
} from "../types";

// ---------------------------------------------------------------------------
// Query key extensions (partner-vertical specific)
// ---------------------------------------------------------------------------

const partnerVerticalKeys = {
  all: [...queryKeys.verticals.all, "partner"] as const,
  list: (params?: Record<string, unknown>) =>
    [...partnerVerticalKeys.all, "list", params] as const,
  enabled: () => [...partnerVerticalKeys.all, "enabled"] as const,
  detail: (id: string) =>
    [...partnerVerticalKeys.all, "detail", id] as const,
};

// ---------------------------------------------------------------------------
// List (paginated)
// ---------------------------------------------------------------------------

/**
 * Fetch paginated partner verticals.
 */
export function usePartnerVerticals(params?: PartnerVerticalQueryParams) {
  return useApiPaginatedQuery<PartnerVertical>({
    queryKey: partnerVerticalKeys.list(params as Record<string, unknown>),
    path: "/verticals/partner",
    params: params as Record<string, unknown>,
    format: "A",
  });
}

// ---------------------------------------------------------------------------
// Enabled Only (non-paginated)
// ---------------------------------------------------------------------------

/**
 * Fetch only enabled partner verticals (simple list).
 */
export function useEnabledPartnerVerticals() {
  return useApiQuery<PartnerVertical[]>({
    queryKey: partnerVerticalKeys.enabled(),
    path: "/verticals/partner/enabled",
  });
}

// ---------------------------------------------------------------------------
// Single
// ---------------------------------------------------------------------------

/**
 * Fetch a single partner vertical by ID.
 */
export function usePartnerVertical(id: string) {
  return useApiQuery<PartnerVertical>({
    queryKey: partnerVerticalKeys.detail(id),
    path: `/verticals/partner/${id}`,
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Enable a vertical for the current partner.
 */
export function useEnablePartnerVertical() {
  return useApiMutation<PartnerVertical, EnableVerticalDto>({
    path: "/verticals/partner/enable",
    method: "POST",
    invalidateKeys: [partnerVerticalKeys.all, queryKeys.verticals.all],
  });
}

/**
 * Update a partner vertical configuration.
 */
export function useUpdatePartnerVertical(id: string) {
  return useApiMutation<PartnerVertical, UpdatePartnerVerticalDto>({
    path: `/verticals/partner/${id}`,
    method: "PATCH",
    invalidateKeys: [partnerVerticalKeys.all],
  });
}

/**
 * Disable (remove) a vertical from the current partner.
 */
export function useDisablePartnerVertical() {
  return useApiMutation<void, string>({
    path: (verticalType) => `/verticals/partner/disable/${verticalType}`,
    method: "DELETE",
    invalidateKeys: [partnerVerticalKeys.all, queryKeys.verticals.all],
  });
}

export { partnerVerticalKeys };
