// =============================================================================
// MetricCard — Single KPI card with trend indicator
// =============================================================================
// Displays a metric value with optional trend direction and percentage change.
// Used in analytics dashboards for KPI overview grids.
// =============================================================================

"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { computeTrend, computePercentageChange } from "../types";
import type { MetricTrend } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetricCardProps {
  /** Card title / metric label */
  label: string;
  /** Current metric value */
  value: number;
  /** Previous period value for trend computation */
  previousValue?: number;
  /** Format: number (default), currency, percentage */
  format?: "number" | "currency" | "percentage";
  /** Currency code for currency format */
  currency?: string;
  /** Tooltip description */
  description?: string;
  /** Optional icon */
  icon?: React.ComponentType<{ className?: string }>;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Additional className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TREND_CONFIG: Record<
  MetricTrend,
  { icon: typeof TrendingUp; color: string; label: string }
> = {
  up: {
    icon: TrendingUp,
    color: "text-green-600 dark:text-green-400",
    label: "Trending up",
  },
  down: {
    icon: TrendingDown,
    color: "text-red-600 dark:text-red-400",
    label: "Trending down",
  },
  neutral: {
    icon: Minus,
    color: "text-muted-foreground",
    label: "No change",
  },
};

function formatValue(
  value: number,
  format: "number" | "currency" | "percentage" = "number",
  currency = "MYR"
): string {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case "percentage":
      return `${value}%`;
    case "number":
    default:
      return new Intl.NumberFormat("en-MY").format(value);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MetricCard({
  label,
  value,
  previousValue,
  format = "number",
  currency = "MYR",
  description,
  icon: Icon,
  isLoading = false,
  className,
}: MetricCardProps) {
  const trend = computeTrend(value, previousValue);
  const percentChange = computePercentageChange(value, previousValue);
  const trendConfig = TREND_CONFIG[trend];
  const TrendIcon = trendConfig.icon;

  if (isLoading) {
    return <MetricCardSkeleton />;
  }

  const cardContent = (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue(value, format, currency)}
        </div>
        {previousValue !== undefined && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <TrendIcon className={cn("h-3 w-3", trendConfig.color)} />
            <span className={trendConfig.color}>
              {percentChange > 0 ? "+" : ""}
              {percentChange}%
            </span>
            <span className="text-muted-foreground">from previous period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (description) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-50">
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return cardContent;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="mt-2 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

