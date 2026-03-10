// =============================================================================
// useRealtimeNotifications — WebSocket event handler for notifications
// =============================================================================
// Listens on the /notifications namespace for:
//   notification:new  → show toast + prepend to cache + increment count
//   notification:count → sync unread count from server
//
// Must be mounted inside SocketProvider.
// =============================================================================

"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "@/lib/websocket";
import { NOTIFICATION_EVENTS } from "@/lib/websocket/types";
import { queryKeys } from "@/lib/query";
import { showSuccess, showInfo } from "@/lib/errors/toast-helpers";
import type {
  NotificationPayload,
  NotificationCountPayload,
} from "@/lib/websocket/types";
import type { Notification } from "../types";
import { NOTIFICATION_TYPE_CONFIG } from "../types";

// ---------------------------------------------------------------------------
// Notification → Toast mapping
// ---------------------------------------------------------------------------

/** Categories that show a success toast */
const SUCCESS_TYPES = new Set([
  "LISTING_PUBLISHED",
  "VENDOR_APPROVED",
  "REVIEW_APPROVED",
  "PAYMENT_SUCCESS",
  "SUBSCRIPTION_CREATED",
]);

/** Categories that show an info toast */
const INFO_TYPES = new Set([
  "INTERACTION_NEW",
  "INTERACTION_MESSAGE",
  "REVIEW_SUBMITTED",
]);

/** Categories that show a warning toast */
const WARNING_TYPES = new Set([
  "LISTING_EXPIRED",
  "VENDOR_SUSPENDED",
  "SUBSCRIPTION_EXPIRING",
  "PAYMENT_FAILED",
  "SYSTEM_ALERT",
]);

function showNotificationToast(payload: NotificationPayload) {
  const config = NOTIFICATION_TYPE_CONFIG[payload.type as keyof typeof NOTIFICATION_TYPE_CONFIG];
  const label = config?.label ?? "Notification";

  if (SUCCESS_TYPES.has(payload.type)) {
    showSuccess(payload.title, {
      description: payload.message,
      duration: 4000,
    });
  } else if (WARNING_TYPES.has(payload.type)) {
    // Use info for warnings too (sonner handles styling)
    showInfo(`${label}: ${payload.title}`, {
      description: payload.message,
      duration: 6000,
    });
  } else if (INFO_TYPES.has(payload.type)) {
    showInfo(payload.title, {
      description: payload.message,
      duration: 4000,
    });
  } else {
    showInfo(payload.title, {
      description: payload.message,
      duration: 4000,
    });
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribe to real-time notification events via WebSocket.
 * Automatically invalidates notification queries and shows toasts.
 *
 * Mount this hook once in each portal layout (inside SocketProvider).
 *
 * @example
 * ```tsx
 * function RealtimeSyncProvider({ children }) {
 *   useRealtimeNotifications();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient();

  // ---- notification:new ----
  const handleNewNotification = useCallback(
    (payload: NotificationPayload) => {
      // 1. Show toast
      showNotificationToast(payload);

      // 2. Prepend to notifications list cache (optimistic)
      queryClient.setQueriesData<{
        items: Notification[];
        pagination: { page: number; pageSize: number; total: number; totalPages: number };
      }>(
        { queryKey: queryKeys.notifications.all },
        (old) => {
          if (!old?.items) return old;
          const newNotification: Notification = {
            id: payload.id,
            type: payload.type as Notification["type"],
            title: payload.title,
            message: payload.message,
            priority: "NORMAL",
            isRead: false,
            readAt: null,
            data: payload.data ?? null,
            createdAt: payload.createdAt,
            updatedAt: payload.createdAt,
          };
          return {
            ...old,
            items: [newNotification, ...old.items].slice(0, old.pagination.pageSize),
            pagination: {
              ...old.pagination,
              total: old.pagination.total + 1,
            },
          };
        },
      );

      // 3. Increment unread count cache
      queryClient.setQueryData<{ unreadCount: number }>(
        queryKeys.notifications.unreadCount(),
        (old) => ({
          unreadCount: (old?.unreadCount ?? 0) + 1,
        }),
      );

      // 4. Invalidate to refetch eventually
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
        refetchType: "none", // Don't refetch immediately, we just updated cache
      });
    },
    [queryClient],
  );

  // ---- notification:count ----
  const handleCountUpdate = useCallback(
    (payload: NotificationCountPayload) => {
      queryClient.setQueryData<{ unreadCount: number }>(
        queryKeys.notifications.unreadCount(),
        { unreadCount: payload.unreadCount },
      );
    },
    [queryClient],
  );

  // Subscribe on the notification socket
  useSocketEvent<NotificationPayload>(
    NOTIFICATION_EVENTS.NEW,
    handleNewNotification,
    [],
    { target: "notification" },
  );

  useSocketEvent<NotificationCountPayload>(
    NOTIFICATION_EVENTS.COUNT,
    handleCountUpdate,
    [],
    { target: "notification" },
  );
}
