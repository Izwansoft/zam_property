// =============================================================================
// useActivityFeed — Entity-scoped activity feed with pagination
// =============================================================================
// Wraps the audit-by-target endpoint and transforms entries into
// ActivityItems for timeline display.
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { AuditLogEntry } from "@/modules/audit";
import { toActivityItem, filterForVendor } from "../types";
import type { ActivityItem } from "../types";
import { useMemo } from "react";

export interface UseActivityFeedParams {
  /** Target entity type (listing, vendor, partner, etc.) */
  targetType: string;
  /** Target entity ID */
  targetId: string;
  /** Current page (1-indexed) */
  page?: number;
  /** Items per page */
  pageSize?: number;
  /** Whether to filter out internal-only actions (for vendor portal) */
  hideInternal?: boolean;
  /** Whether query is enabled */
  enabled?: boolean;
}

/**
 * Fetch activity feed for a specific entity.
 * Transforms audit log entries into timeline-friendly ActivityItems.
 *
 * @example
 * ```tsx
 * const { items, pagination, isLoading } = useActivityFeed({
 *   targetType: "listing",
 *   targetId: listingId,
 *   hideInternal: true, // for vendor portal
 * });
 * ```
 */
export function useActivityFeed({
  targetType,
  targetId,
  page = 1,
  pageSize = 20,
  hideInternal = false,
  enabled = true,
}: UseActivityFeedParams) {
  const query = useApiPaginatedQuery<AuditLogEntry>({
    queryKey: queryKeys.activity.byTarget(targetType, targetId, {
      page,
      pageSize,
    }),
    path: `/audit/target/${targetType}/${targetId}`,
    params: { page, pageSize },
    format: "B",
    enabled: enabled && !!targetType && !!targetId,
    staleTime: 30 * 1000,
  });

  // Transform audit entries into activity items
  const items = useMemo(() => {
    if (!query.data?.items) return [];
    const activities = query.data.items.map(toActivityItem);
    return hideInternal ? filterForVendor(activities) : activities;
  }, [query.data?.items, hideInternal]);

  return {
    items,
    pagination: query.data?.pagination ?? null,
    isLoading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
  };
}
