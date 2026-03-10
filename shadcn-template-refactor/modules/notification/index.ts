// =============================================================================
// Notification Module — Barrel exports
// =============================================================================

// Types
export type {
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationCategory,
  NotificationData,
  NotificationFilters,
  UnreadCountResponse,
  NotificationPreference,
  NotificationPreferences,
  NotificationTypeConfig,
} from "./types";

export {
  DEFAULT_NOTIFICATION_FILTERS,
  NOTIFICATION_TYPE_CONFIG,
} from "./types";

// Hooks
export { useNotifications } from "./hooks/use-notifications";
export { useUnreadCount } from "./hooks/use-unread-count";
export { useMarkAsRead, useMarkAllAsRead } from "./hooks/use-notification-mutations";
export { useRealtimeNotifications } from "./hooks/use-realtime-notifications";
export {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "./hooks/use-notification-preferences";

// Components
export { NotificationBell } from "./components/notification-bell";
export { NotificationList } from "./components/notification-list";
export { NotificationItem } from "./components/notification-item";
export {
  NotificationPreferencesGrid,
  NotificationPreferencesGridSkeleton,
} from "./components/notification-preferences-grid";

// Utils
export { formatDistanceToNow } from "./utils";
