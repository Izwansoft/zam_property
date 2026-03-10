// =============================================================================
// useNotifications — TanStack Query hook for notification list
// =============================================================================
// Paginated notifications for the current user (role/partner scoped).
// Backend endpoint: GET /api/v1/notifications
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { Notification, NotificationFilters } from "../types";

/**
 * Fetch paginated notifications for the current user.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useNotifications({ page: 1, pageSize: 20 });
 * // data.items: Notification[], data.pagination
 * ```
 */
export function useNotifications(
  filters: Partial<NotificationFilters> = {},
) {
  const cleanedParams: Record<string, unknown> = {};

  if (filters.page) cleanedParams.page = filters.page;
  if (filters.pageSize) cleanedParams.pageSize = filters.pageSize;
  if (filters.isRead === false) cleanedParams.unreadOnly = true;
  if (filters.type) cleanedParams.type = filters.type;

  return useApiPaginatedQuery<Notification>({
    queryKey: queryKeys.notifications.list(cleanedParams),
    path: "/notifications",
    params: cleanedParams,
    format: "B",
  });
}
