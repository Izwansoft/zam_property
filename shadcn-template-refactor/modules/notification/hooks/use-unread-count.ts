// =============================================================================
// useUnreadCount — TanStack Query hook for notification unread count
// =============================================================================
// Short-polls the unread count. Also updated in real-time via WebSocket.
// Backend endpoint: GET /api/v1/notifications/unread-count
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { UnreadCountResponse } from "../types";

/**
 * Fetch the current user's unread notification count.
 * Stale time is low (10s) because WebSocket can update this in real-time.
 *
 * @example
 * ```tsx
 * const { data } = useUnreadCount();
 * // data.unreadCount: number
 * ```
 */
export function useUnreadCount() {
  return useApiQuery<UnreadCountResponse>({
    queryKey: queryKeys.notifications.unreadCount(),
    path: "/notifications/unread-count",
    staleTime: 10 * 1000,
  });
}
