// =============================================================================
// useVerticalDefinitions — TanStack Query hooks for vertical definitions
// =============================================================================
// CRUD hooks for platform admin vertical definition management.
// Uses /verticals/definitions endpoints.
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation, useApiDelete } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type {
  VerticalDefinition,
  CreateVerticalDefinitionDto,
  UpdateVerticalDefinitionDto,
  VerticalQueryParams,
  VerticalHealthResponse,
  SetMaintenanceDto,
  MaintenanceStatusResponse,
} from "../types";

// ---------------------------------------------------------------------------
// Health (Runtime Detection)
// ---------------------------------------------------------------------------

/**
 * Fetch vertical health status — which verticals are actually implemented.
 * This queries the backend to check which vertical modules are loaded.
 */
export function useVerticalHealth() {
  return useApiQuery<VerticalHealthResponse>({
    queryKey: [...queryKeys.verticals.all, "health"],
    path: "/verticals/definitions/health",
    // Long stale time — implementation status rarely changes
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ---------------------------------------------------------------------------
// List (non-paginated - vertical definitions are typically few)
// ---------------------------------------------------------------------------

/**
 * Fetch all vertical definitions (platform admin).
 * Returns simple array since vertical count is small.
 */
export function useVerticalDefinitions(params?: VerticalQueryParams) {
  return useApiQuery<VerticalDefinition[]>({
    queryKey: queryKeys.verticals.list(),
    path: "/verticals/definitions",
    axiosConfig: params ? { params } : undefined,
  });
}

// ---------------------------------------------------------------------------
// Active Only (non-paginated)
// ---------------------------------------------------------------------------

/**
 * Fetch all active vertical definitions (simple list, no pagination).
 */
export function useActiveVerticalDefinitions() {
  return useApiQuery<VerticalDefinition[]>({
    queryKey: [...queryKeys.verticals.all, "active"],
    path: "/verticals/definitions/active",
  });
}

// ---------------------------------------------------------------------------
// Single Detail
// ---------------------------------------------------------------------------

/**
 * Fetch a single vertical definition by ID.
 */
export function useVerticalDefinition(id: string) {
  return useApiQuery<VerticalDefinition>({
    queryKey: [...queryKeys.verticals.all, "detail", id],
    path: `/verticals/definitions/${id}`,
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new vertical definition.
 */
export function useCreateVerticalDefinition() {
  return useApiMutation<VerticalDefinition, CreateVerticalDefinitionDto>({
    path: "/verticals/definitions",
    method: "POST",
    invalidateKeys: [queryKeys.verticals.all],
  });
}

/**
 * Update a vertical definition.
 */
export function useUpdateVerticalDefinition(id: string) {
  return useApiMutation<VerticalDefinition, UpdateVerticalDefinitionDto>({
    path: `/verticals/definitions/${id}`,
    method: "PATCH",
    invalidateKeys: [queryKeys.verticals.all],
  });
}

/**
 * Activate a vertical definition.
 */
export function useActivateVerticalDefinition() {
  return useApiMutation<VerticalDefinition, string>({
    path: (id) => `/verticals/definitions/${id}/activate`,
    method: "POST",
    invalidateKeys: [queryKeys.verticals.all],
  });
}

/**
 * Deactivate a vertical definition.
 */
export function useDeactivateVerticalDefinition() {
  return useApiMutation<VerticalDefinition, string>({
    path: (id) => `/verticals/definitions/${id}/deactivate`,
    method: "POST",
    invalidateKeys: [queryKeys.verticals.all],
  });
}

/**
 * Delete a vertical definition.
 */
export function useDeleteVerticalDefinition() {
  return useApiDelete<void>({
    basePath: "/verticals/definitions",
    invalidateKeys: [queryKeys.verticals.all],
  });
}

// ---------------------------------------------------------------------------
// Maintenance Mode
// ---------------------------------------------------------------------------

/**
 * Set maintenance mode on a vertical definition.
 * Note: The `id` in the payload is used for the path and excluded from the body.
 */
export function useSetVerticalMaintenance() {
  return useApiMutation<VerticalDefinition, SetMaintenanceDto & { id: string }>({
    path: (data) => `/verticals/definitions/${data.id}/maintenance`,
    method: "PATCH",
    invalidateKeys: [queryKeys.verticals.all],
    excludeFromBody: ["id"],
  });
}

/**
 * Get maintenance status for a specific vertical type.
 */
export function useVerticalMaintenanceStatus(type: string) {
  return useApiQuery<MaintenanceStatusResponse>({
    queryKey: [...queryKeys.verticals.all, "maintenance", type],
    path: `/verticals/definitions/maintenance/${type}`,
    enabled: !!type,
  });
}

/**
 * Get maintenance status for all verticals.
 */
export function useAllVerticalMaintenanceStatuses() {
  return useApiQuery<MaintenanceStatusResponse[]>({
    queryKey: [...queryKeys.verticals.all, "maintenance"],
    path: "/verticals/definitions/maintenance",
  });
}
