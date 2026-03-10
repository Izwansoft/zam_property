// =============================================================================
// Analytics Module — Type Definitions
// =============================================================================
// Types for analytics dashboards, metrics, and charts.
// Matches backend API contracts from API-REGISTRY.md.
// =============================================================================

// ---------------------------------------------------------------------------
// Common Analytics Types
// ---------------------------------------------------------------------------

/** Date range for analytics queries */
export interface AnalyticsDateRange {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

/** Trend direction for metric cards */
export type MetricTrend = "up" | "down" | "neutral";

/** Metric totals shared across partner and vendor analytics */
export interface AnalyticsTotals {
  viewsCount: number;
  leadsCount: number;
  enquiriesCount: number;
  bookingsCount: number;
}

// ---------------------------------------------------------------------------
// Partner Analytics (GET /analytics/partner/overview)
// ---------------------------------------------------------------------------

/** Response from GET /api/v1/analytics/partner/overview */
export interface PartnerAnalyticsOverview {
  startDate: string;
  endDate: string;
  totals: AnalyticsTotals;
}

// ---------------------------------------------------------------------------
// Vendor Analytics (GET /analytics/vendor/overview)
// ---------------------------------------------------------------------------

/** Response from GET /api/v1/analytics/vendor/overview */
export interface VendorAnalyticsOverview {
  vendorId: string;
  startDate: string;
  endDate: string;
  totals: AnalyticsTotals;
}

// ---------------------------------------------------------------------------
// Vendor Listing Analytics (GET /analytics/vendor/listings)
// ---------------------------------------------------------------------------

/** Individual listing analytics item */
export interface ListingAnalyticsItem {
  listingId: string;
  verticalType: string;
  viewsCount: number;
  leadsCount: number;
  enquiriesCount: number;
  bookingsCount: number;
}

/** Response from GET /api/v1/analytics/vendor/listings */
export interface VendorListingAnalytics {
  vendorId: string;
  startDate: string;
  endDate: string;
  items: ListingAnalyticsItem[];
}

// ---------------------------------------------------------------------------
// Admin Dashboard Stats (GET /admin/dashboard/stats)
// ---------------------------------------------------------------------------

/** Status count item from backend */
export interface StatusCountItem {
  status: string;
  count: number;
}

/** Response from GET /api/v1/admin/dashboard/stats */
export interface AdminDashboardStats {
  vendorsByStatus: StatusCountItem[];
  listingsByStatus: StatusCountItem[];
  interactionsLast7DaysByType: StatusCountItem[];
  pendingVendors: number;
  pendingReviews: number;
  generatedAt: string;
}

/** Helper to convert StatusCountItem[] to Record<string, number> */
export function statusArrayToMap(items: StatusCountItem[]): Record<string, number> {
  return items.reduce((acc, item) => {
    acc[item.status] = item.count;
    return acc;
  }, {} as Record<string, number>);
}

// ---------------------------------------------------------------------------
// Metric Card Config
// ---------------------------------------------------------------------------

/** Configuration for a single metric card */
export interface MetricCardConfig {
  label: string;
  value: number;
  previousValue?: number;
  format?: "number" | "currency" | "percentage";
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// ---------------------------------------------------------------------------
// Chart Data Types
// ---------------------------------------------------------------------------

/** Generic chart data point */
export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

/** Pie chart slice data */
export interface PieChartSlice {
  name: string;
  value: number;
  fill?: string;
}

// ---------------------------------------------------------------------------
// Top Items Table
// ---------------------------------------------------------------------------

/** A top-performing item row */
export interface TopItem {
  id: string;
  label: string;
  subLabel?: string;
  metrics: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Date Range Presets
// ---------------------------------------------------------------------------

export type DateRangePreset = "7d" | "30d" | "90d" | "1y" | "custom";

export const DATE_RANGE_PRESET_LABELS: Record<DateRangePreset, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "1y": "Last Year",
  custom: "Custom Range",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute trend direction based on current vs previous value.
 * Returns "neutral" when no comparison is available.
 */
export function computeTrend(
  current: number,
  previous?: number
): MetricTrend {
  if (previous === undefined || previous === current) return "neutral";
  return current > previous ? "up" : "down";
}

/**
 * Compute percentage change between current and previous values.
 * Returns 0 when no comparison is available or previous is 0.
 */
export function computePercentageChange(
  current: number,
  previous?: number
): number {
  if (previous === undefined || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Human-friendly metric key labels.
 */
export const METRIC_LABELS: Record<string, string> = {
  viewsCount: "Views",
  leadsCount: "Leads",
  enquiriesCount: "Enquiries",
  bookingsCount: "Bookings",
};

/**
 * Human-friendly metric descriptions for tooltips.
 */
export const METRIC_DESCRIPTIONS: Record<string, string> = {
  viewsCount: "Total number of listing page views",
  leadsCount: "Number of lead submissions received",
  enquiriesCount: "Number of enquiry messages received",
  bookingsCount: "Number of booking requests made",
};
