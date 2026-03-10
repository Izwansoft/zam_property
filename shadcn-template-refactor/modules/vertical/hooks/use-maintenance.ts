/**
 * Maintenance Mode Hook & Provider
 *
 * Provides maintenance status checking for verticals.
 * Pages/layouts use this to show a maintenance page when a vertical is down.
 *
 * @see docs/ai-prompt/part-11.md - Vertical Layer
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query";

// =============================================================================
// Types
// =============================================================================

export interface MaintenanceStatus {
  type: string;
  name: string;
  isUnderMaintenance: boolean;
  message: string | null;
  startAt: string | null;
  endAt: string | null;
  estimatedRemainingMs: number | null;
}

// =============================================================================
// Vertical Type Mapping
// =============================================================================

/**
 * Map URL path patterns to vertical types.
 * Used to automatically detect which vertical the current page belongs to.
 */
export const PATH_TO_VERTICAL: Record<string, string> = {
  "/property": "real_estate",
  "/listing": "real_estate", // Listing details - needs vertical detection
  "/vehicles": "automotive",
  "/automotive": "automotive",
  "/jobs": "jobs",
  "/services": "services",
  "/electronics": "electronics",
  "/fashion": "fashion",
};

/**
 * Map vertical types to their base paths.
 */
export const VERTICAL_TO_PATH: Record<string, string> = {
  real_estate: "/property",
  automotive: "/vehicles",
  jobs: "/jobs",
  services: "/services",
  electronics: "/electronics",
  fashion: "/fashion",
};

/**
 * Get vertical type from a URL path.
 */
export function getVerticalFromPath(pathname: string): string | null {
  for (const [pathPrefix, verticalType] of Object.entries(PATH_TO_VERTICAL)) {
    if (pathname.startsWith(pathPrefix)) {
      return verticalType;
    }
  }
  // Also check search params for vertical
  return null;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch maintenance status for a specific vertical.
 *
 * @param verticalType - The vertical type (e.g., 'real_estate')
 * @param options - Query options
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMaintenanceStatus('real_estate');
 * if (data?.isUnderMaintenance) {
 *   return <MaintenancePage status={data} />;
 * }
 * ```
 */
export function useMaintenanceStatus(
  verticalType: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery<MaintenanceStatus>({
    queryKey: [...queryKeys.verticals.all, "maintenance", verticalType],
    queryFn: async () => {
      const response = await api.get(
        `/public/maintenance/${verticalType}`
      );
      // Handle ApiResponse wrapper
      return response.data?.data ?? response.data;
    },
    enabled: !!verticalType && (options?.enabled ?? true),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: false, // Don't retry on error
  });
}

/**
 * Hook to fetch maintenance status for all verticals.
 * Useful for showing maintenance badges in navigation.
 *
 * @example
 * ```tsx
 * const { data: statuses } = useAllMaintenanceStatuses();
 * const realEstateDown = statuses?.find(s => s.type === 'real_estate')?.isUnderMaintenance;
 * ```
 */
export function useAllMaintenanceStatuses(options?: { enabled?: boolean }) {
  return useQuery<MaintenanceStatus[]>({
    queryKey: [...queryKeys.verticals.all, "maintenance", "all"],
    queryFn: async () => {
      const response = await api.get("/public/maintenance");
      return response.data?.data ?? response.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
