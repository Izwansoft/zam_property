// =============================================================================
// Activity Module — Barrel Exports
// =============================================================================

// Types
export type {
  ActivityItem,
  ActivityCategory,
  ActivityFeedParams,
} from "./types";
export {
  toActivityItem,
  filterForVendor,
  getActivityCategory,
} from "./types";

// Hooks
export { useActivityFeed } from "./hooks/use-activity-feed";
export type { UseActivityFeedParams } from "./hooks/use-activity-feed";
export { useRecentActivity } from "./hooks/use-recent-activity";
export type { UseRecentActivityParams } from "./hooks/use-recent-activity";

// Components
export { ActivityItemComponent } from "./components/activity-item";
export type { ActivityItemProps } from "./components/activity-item";
export { ActivityFeed } from "./components/activity-feed";
export type { ActivityFeedProps } from "./components/activity-feed";
export { ActivityFeedWidget } from "./components/activity-feed-widget";
export type { ActivityFeedWidgetProps } from "./components/activity-feed-widget";
