// =============================================================================
// UsageMeters — Visual usage counters with warning levels
// =============================================================================
// Displays usage progress bars for each metric with color-coded warning states.
// Warning levels: Normal (green), Warning (amber), Critical (orange), Exceeded (red).
// Shows "last updated" timestamp as required by Part-12.
// =============================================================================

"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { UsageMetric, UsageWarningLevel } from "../types";
import {
  getUsageWarningLevel,
  METRIC_KEY_LABELS,
  METRIC_KEY_DESCRIPTIONS,
} from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UsageMetersProps {
  metrics: UsageMetric[];
  isLoading?: boolean;
  lastUpdated?: Date;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Warning level visual config
// ---------------------------------------------------------------------------

const WARNING_LEVEL_CONFIG: Record<
  UsageWarningLevel,
  {
    label: string;
    badgeVariant: "default" | "secondary" | "destructive" | "outline";
    progressClass: string;
    textClass: string;
  }
> = {
  normal: {
    label: "Normal",
    badgeVariant: "secondary",
    progressClass: "[&>div]:bg-green-500",
    textClass: "text-green-700 dark:text-green-400",
  },
  warning: {
    label: "Warning",
    badgeVariant: "outline",
    progressClass: "[&>div]:bg-amber-500",
    textClass: "text-amber-700 dark:text-amber-400",
  },
  critical: {
    label: "Critical",
    badgeVariant: "destructive",
    progressClass: "[&>div]:bg-orange-500",
    textClass: "text-orange-700 dark:text-orange-400",
  },
  exceeded: {
    label: "Exceeded",
    badgeVariant: "destructive",
    progressClass: "[&>div]:bg-red-600",
    textClass: "text-red-700 dark:text-red-400",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMetricLabel(key: string): string {
  return METRIC_KEY_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function getMetricDescription(key: string): string | undefined {
  return METRIC_KEY_DESCRIPTIONS[key];
}

// ---------------------------------------------------------------------------
// Single Meter
// ---------------------------------------------------------------------------

function UsageMeter({ metric }: { metric: UsageMetric }) {
  const level = getUsageWarningLevel(metric.percentage);
  const config = WARNING_LEVEL_CONFIG[level];
  const label = getMetricLabel(metric.metricKey);
  const description = getMetricDescription(metric.metricKey);

  // Clamp progress display to 100% (visual only — actual can exceed)
  const visualPercentage = Math.min(metric.percentage, 100);

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium cursor-help">{label}</span>
              </TooltipTrigger>
              {description && (
                <TooltipContent side="top" className="max-w-xs">
                  {description}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {level !== "normal" && (
            <Badge variant={config.badgeVariant} className="text-[10px] px-1.5 py-0">
              {config.label}
            </Badge>
          )}
        </div>
        <span className={cn("text-sm tabular-nums font-medium", config.textClass)}>
          {metric.currentPeriod.count.toLocaleString()} / {metric.limit.toLocaleString()}
        </span>
      </div>

      {/* Progress bar */}
      <Progress
        value={visualPercentage}
        className={cn("h-2", config.progressClass)}
      />

      {/* Footer row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{Math.round(metric.percentage)}% used</span>
        <span>
          Resets: {formatDate(metric.currentPeriod.periodEnd)}
        </span>
      </div>

      {/* Exceeded message */}
      {level === "exceeded" && (
        <div className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>
            You have exceeded your {label.toLowerCase()} limit. New actions may
            be restricted.
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function UsageMetersSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="mt-1 h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UsageMeters({
  metrics,
  isLoading,
  lastUpdated,
  onRefresh,
  isRefreshing,
  className,
}: UsageMetersProps) {
  // Sort metrics: exceeded first, then by percentage descending
  const sortedMetrics = useMemo(
    () =>
      [...metrics].sort((a, b) => {
        const levelA = getUsageWarningLevel(a.percentage);
        const levelB = getUsageWarningLevel(b.percentage);
        const levelOrder: Record<UsageWarningLevel, number> = {
          exceeded: 0,
          critical: 1,
          warning: 2,
          normal: 3,
        };
        const orderDiff = levelOrder[levelA] - levelOrder[levelB];
        if (orderDiff !== 0) return orderDiff;
        return b.percentage - a.percentage;
      }),
    [metrics]
  );

  // Summary counts
  const warningCount = useMemo(
    () =>
      metrics.filter(
        (m) => getUsageWarningLevel(m.percentage) !== "normal"
      ).length,
    [metrics]
  );

  if (isLoading) {
    return <UsageMetersSkeleton />;
  }

  if (sortedMetrics.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No usage data available. Usage will appear once you start using your
            plan features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Usage
            {warningCount > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {warningCount} {warningCount === 1 ? "alert" : "alerts"}
              </Badge>
            )}
          </CardTitle>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("mr-1 h-3 w-3", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
          )}
        </div>
        <CardDescription className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Current billing period usage
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {sortedMetrics.map((metric) => (
          <UsageMeter key={metric.metricKey} metric={metric} />
        ))}

        {/* Last updated timestamp */}
        {lastUpdated && (
          <div className="flex items-center gap-1 border-t pt-3 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last updated: {formatTimestamp(lastUpdated)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { UsageMetersSkeleton };
