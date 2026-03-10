// =============================================================================
// useRecentActivity — Recent activity feed for dashboard widgets
// =============================================================================
// Fetches the latest audit logs and transforms them into ActivityItems.
// Used in dashboard sidebar widgets for a quick overview.
// =============================================================================

"use client";

import { useMemo } from "react";
import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { AuditLogEntry } from "@/modules/audit";
import { toActivityItem, filterForVendor } from "../types";
import type { ActivityItem } from "../types";

export interface UseRecentActivityParams {
  /** Portal identifier (platform, partner, vendor) for cache scoping */
  portal: string;
  /** Number of recent items to fetch */
  limit?: number;
  /** Filter by action type */
  actionType?: string;
  /** Whether to filter out internal-only actions */
  hideInternal?: boolean;
  /** Whether query is enabled */
  enabled?: boolean;
}

/**
 * Fetch recent activity for a dashboard widget.
 * Uses the general audit logs endpoint with a small page size.
 *
 * @example
 * ```tsx
 * const { items, isLoading } = useRecentActivity({
 *   portal: "platform",
 *   limit: 10,
 * });
 * ```
 */
export function useRecentActivity({
  portal,
  limit = 10,
  actionType,
  hideInternal = false,
  enabled = true,
}: UseRecentActivityParams) {
  const params: Record<string, unknown> = {
    page: 1,
    pageSize: limit,
  };
  if (actionType) params.actionType = actionType;

  const query = useApiPaginatedQuery<AuditLogEntry>({
    queryKey: queryKeys.activity.recent(portal, params),
    path: "/audit/logs",
    params,
    format: "B",
    enabled,
    staleTime: 30 * 1000,
  });

  const items = useMemo(() => {
    if (!query.data?.items) return [];
    const activities = query.data.items.map(toActivityItem);
    return hideInternal ? filterForVendor(activities) : activities;
  }, [query.data?.items, hideInternal]);

  return {
    items,
    isLoading: query.isLoading,
    error: query.error,
  };
}
