// =============================================================================
// Subscription Module — Barrel exports
// =============================================================================
// Plans, subscriptions, entitlements, and usage visibility.
// =============================================================================

// Types
export type {
  Plan,
  PlanSummary,
  PlanEntitlements,
  Subscription,
  SubscriptionStatus,
  ResolvedEntitlements,
  UsageMetric,
  UsagePeriod,
  UsageWarningLevel,
  FeatureCategory,
  FeatureRow,
} from "./types";

export {
  getUsageWarningLevel,
  SUBSCRIPTION_STATUS_CONFIG,
  METRIC_KEY_LABELS,
  METRIC_KEY_DESCRIPTIONS,
  PLAN_FEATURE_CATEGORIES,
} from "./types";

// Hooks
export { usePlans, type UsePlansParams } from "./hooks/use-plans";
export { useSubscription } from "./hooks/use-subscription";
export { useUsage, type UseUsageParams } from "./hooks/use-usage";
export { useEntitlements } from "./hooks/use-entitlements";

// Components
export {
  PlanComparisonTable,
  PlanComparisonTableSkeleton,
} from "./components/plan-comparison-table";
export {
  CurrentPlanCard,
  CurrentPlanCardSkeleton,
} from "./components/current-plan-card";
export {
  UsageMeters,
  UsageMetersSkeleton,
} from "./components/usage-meters";
export { UpgradePrompt } from "./components/upgrade-prompt";
export {
  EntitlementsDisplay,
  EntitlementsDisplaySkeleton,
} from "./components/entitlements-display";
