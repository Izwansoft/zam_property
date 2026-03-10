// =============================================================================
// Analytics Module — Public API
// =============================================================================
// Re-exports all types, hooks, and components for the analytics domain.
// =============================================================================

// ---- Types ----
export type {
  AnalyticsDateRange,
  AnalyticsTotals,
  PartnerAnalyticsOverview,
  VendorAnalyticsOverview,
  VendorListingAnalytics,
  ListingAnalyticsItem,
  AdminDashboardStats,
  StatusCountItem,
  MetricCardConfig,
  MetricTrend,
  ChartDataPoint,
  PieChartSlice,
  TopItem,
  DateRangePreset,
} from "./types";
export {
  computeTrend,
  computePercentageChange,
  statusArrayToMap,
  DATE_RANGE_PRESET_LABELS,
  METRIC_LABELS,
  METRIC_DESCRIPTIONS,
} from "./types";

// ---- Hooks ----
export { usePlatformAnalytics } from "./hooks/use-platform-analytics";
export { usePartnerAnalytics } from "./hooks/use-partner-analytics";
export {
  useVendorAnalytics,
  useVendorListingAnalytics,
} from "./hooks/use-vendor-analytics";
export { useAnalyticsDateRange } from "./hooks/use-analytics-date-range";

// ---- Components ----
export { MetricCard, MetricCardSkeleton } from "./components/metric-card";
export { DashboardStats } from "./components/dashboard-stats";
export {
  AnalyticsLineChart,
  AnalyticsBarChart,
  AnalyticsPieChart,
} from "./components/analytics-charts";
export { TopItemsTable } from "./components/top-items-table";
export { ExportButton } from "./components/export-button";
export { AnalyticsDateRangePicker } from "./components/analytics-date-range-picker";

