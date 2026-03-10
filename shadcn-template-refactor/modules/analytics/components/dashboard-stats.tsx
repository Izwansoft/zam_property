// =============================================================================
// DashboardStats — KPI cards grid for analytics dashboards
// =============================================================================
// Renders a responsive grid of MetricCards from AnalyticsTotals data.
// Used by partner & vendor dashboard pages.
// =============================================================================

"use client";

import { Eye, UserPlus, MessageSquare, CalendarCheck } from "lucide-react";
import { MetricCard, MetricCardSkeleton } from "./metric-card";
import type { AnalyticsTotals } from "../types";
import { METRIC_DESCRIPTIONS } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardStatsProps {
  /** Current period totals */
  totals: AnalyticsTotals | undefined;
  /** Previous period totals for trend comparison */
  previousTotals?: AnalyticsTotals;
  /** Loading state */
  isLoading?: boolean;
  /** Additional className for the grid container */
  className?: string;
}

// ---------------------------------------------------------------------------
// Metric Definitions
// ---------------------------------------------------------------------------

const METRICS = [
  {
    key: "viewsCount" as const,
    label: "Total Views",
    icon: Eye,
    description: METRIC_DESCRIPTIONS.viewsCount,
  },
  {
    key: "leadsCount" as const,
    label: "Leads",
    icon: UserPlus,
    description: METRIC_DESCRIPTIONS.leadsCount,
  },
  {
    key: "enquiriesCount" as const,
    label: "Enquiries",
    icon: MessageSquare,
    description: METRIC_DESCRIPTIONS.enquiriesCount,
  },
  {
    key: "bookingsCount" as const,
    label: "Bookings",
    icon: CalendarCheck,
    description: METRIC_DESCRIPTIONS.bookingsCount,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardStats({
  totals,
  previousTotals,
  isLoading = false,
  className,
}: DashboardStatsProps) {
  if (isLoading || !totals) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className ?? ""}`}>
        {METRICS.map((metric) => (
          <MetricCardSkeleton key={metric.key} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className ?? ""}`}>
      {METRICS.map((metric) => (
        <MetricCard
          key={metric.key}
          label={metric.label}
          value={totals[metric.key]}
          previousValue={previousTotals?.[metric.key]}
          icon={metric.icon}
          description={metric.description}
        />
      ))}
    </div>
  );
}
