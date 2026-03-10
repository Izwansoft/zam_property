// =============================================================================
// AgentStatsCards — Agent dashboard KPI cards grid
// =============================================================================
// Renders a responsive grid of MetricCards for agent dashboard stats:
// Listings, Deals, Revenue, Commission.
// =============================================================================

"use client";

import {
  Building2,
  HandshakeIcon,
  BadgeDollarSign,
  WalletIcon,
} from "lucide-react";
import {
  MetricCard,
  MetricCardSkeleton,
} from "@/modules/analytics/components/metric-card";
import type { AgentDashboardStats } from "../types/dashboard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentStatsCardsProps {
  /** Current period stats */
  stats: AgentDashboardStats | undefined;
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
    key: "totalListings" as const,
    label: "My Listings",
    icon: Building2,
    description: "Total listings assigned to you",
    format: "number" as const,
  },
  {
    key: "totalDeals" as const,
    label: "Deals Closed",
    icon: HandshakeIcon,
    description: "Total tenancy deals facilitated",
    format: "number" as const,
  },
  {
    key: "totalRevenue" as const,
    label: "Revenue",
    icon: BadgeDollarSign,
    description: "Total revenue generated (MYR)",
    format: "currency" as const,
  },
  {
    key: "totalCommission" as const,
    label: "Total Commission",
    icon: WalletIcon,
    description: "Total commission earned (MYR)",
    format: "currency" as const,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentStatsCards({
  stats,
  isLoading = false,
  className,
}: AgentStatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div
        className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className ?? ""}`}
      >
        {METRICS.map((metric) => (
          <MetricCardSkeleton key={metric.key} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className ?? ""}`}
    >
      {METRICS.map((metric) => (
        <MetricCard
          key={metric.key}
          label={metric.label}
          value={stats[metric.key]}
          previousValue={stats.previousPeriod?.[metric.key]}
          icon={metric.icon}
          description={metric.description}
          format={metric.format}
        />
      ))}
    </div>
  );
}
