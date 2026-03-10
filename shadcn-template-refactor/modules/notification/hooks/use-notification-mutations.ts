// =============================================================================
// Notification Mutations — Mark as read, mark all as read (with optimistic updates)
// =============================================================================
// Backend endpoints:
//   PATCH /api/v1/notifications/:id/read
//   POST  /api/v1/notifications/mark-all-read
// =============================================================================

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { NormalizedPaginatedResult } from "@/lib/api/client";
import type { Notification } from "../types";

// ---------------------------------------------------------------------------
// useMarkAsRead — with optimistic update
// ---------------------------------------------------------------------------

/**
 * Mark a single notification as read.
 * Optimistically marks it read in the cache for instant UI feedback.
 *
 * @example
 * ```tsx
 * const markAsRead = useMarkAsRead();
 * markAsRead.mutate({ id: "notif-001" });
 * ```
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useApiMutation<Notification, { id: string }>({
    path: (variables) => `/notifications/${variables.id}/read`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.notifications.all,
      queryKeys.notifications.unreadCount(),
    ],
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });

      // Snapshot current values
      const previousUnread = queryClient.getQueryData<{ unreadCount: number }>(
        queryKeys.notifications.unreadCount(),
      );

      // Optimistically update unread count
      if (previousUnread) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(), {
          unreadCount: Math.max(0, previousUnread.unreadCount - 1),
        });
      }

      // Optimistically mark the notification as read in list caches
      queryClient.setQueriesData<NormalizedPaginatedResult<Notification>>(
        { queryKey: queryKeys.notifications.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((n) =>
              n.id === variables.id ? { ...n, readAt: new Date().toISOString() } : n,
            ),
          };
        },
      );

      return { previousUnread };
    },
  });
}

// ---------------------------------------------------------------------------
// useMarkAllAsRead
// ---------------------------------------------------------------------------

/**
 * Mark all notifications as read for the current user.
 * Invalidates both the notifications list and unread count.
 *
 * @example
 * ```tsx
 * const markAllAsRead = useMarkAllAsRead();
 * markAllAsRead.mutate({});
 * ```
 */
export function useMarkAllAsRead() {
  return useApiMutation<{ count: number }, Record<string, never>>({
    path: () => "/notifications/mark-all-read",
    method: "POST",
    invalidateKeys: [
      queryKeys.notifications.all,
      queryKeys.notifications.unreadCount(),
    ],
  });
}
