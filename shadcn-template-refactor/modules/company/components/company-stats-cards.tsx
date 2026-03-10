// =============================================================================
// CompanyStatsCards — Company dashboard KPI cards grid
// =============================================================================
// Renders a responsive grid of MetricCards for company dashboard stats:
// Properties, Agents, Active Tenancies, Revenue.
// =============================================================================

"use client";

import { Building2, Users, HomeIcon, BadgeDollarSign } from "lucide-react";
import {
  MetricCard,
  MetricCardSkeleton,
} from "@/modules/analytics/components/metric-card";
import type { CompanyDashboardStats } from "../types/dashboard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompanyStatsCardsProps {
  /** Current period stats */
  stats: CompanyDashboardStats | undefined;
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
    key: "totalProperties" as const,
    label: "Properties",
    icon: Building2,
    description: "Total properties managed by the company",
    format: "number" as const,
  },
  {
    key: "totalAgents" as const,
    label: "Agents",
    icon: Users,
    description: "Total agents registered in the company",
    format: "number" as const,
  },
  {
    key: "activeTenancies" as const,
    label: "Active Tenancies",
    icon: HomeIcon,
    description: "Currently active tenancy agreements",
    format: "number" as const,
  },
  {
    key: "totalRevenue" as const,
    label: "Revenue",
    icon: BadgeDollarSign,
    description: "Total revenue collected (MYR)",
    format: "currency" as const,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompanyStatsCards({
  stats,
  isLoading = false,
  className,
}: CompanyStatsCardsProps) {
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
