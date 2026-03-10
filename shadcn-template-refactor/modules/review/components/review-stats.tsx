// =============================================================================
// ReviewStats — Rating distribution and average display (self-contained)
// =============================================================================

"use client";

import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

import type { ReviewStats as ReviewStatsType } from "../types";
import { getRatingColor } from "../utils";
import { useReviewStats } from "../hooks/use-review-stats";

// ---------------------------------------------------------------------------
// Trend Icon
// ---------------------------------------------------------------------------

function TrendIcon({ trend }: { trend?: "up" | "down" | "stable" }) {
  if (trend === "up")
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "down")
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

// ---------------------------------------------------------------------------
// Internal renderer (used by both self-contained and pass-through)
// ---------------------------------------------------------------------------

function ReviewStatsCard({ stats }: { stats: ReviewStatsType }) {
  const maxCount = Math.max(
    ...Object.values(stats.distribution),
    1, // prevent division by zero
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Rating Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average rating */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <span className={`text-4xl font-bold ${getRatingColor(Math.round(stats.averageRating))}`}>
              {stats.averageRating.toFixed(1)}
            </span>
            <div className="flex items-center gap-0.5 mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(stats.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendIcon trend={stats.trend} />
              <span>
                {stats.trend === "up"
                  ? "Trending up"
                  : stats.trend === "down"
                    ? "Trending down"
                    : "Stable"}
              </span>
            </div>
          </div>
        </div>

        {/* Distribution bars */}
        <div className="space-y-2">
          {([5, 4, 3, 2, 1] as const).map((rating) => {
            const count = stats.distribution[rating] ?? 0;
            const percentage = (count / maxCount) * 100;

            return (
              <div key={rating} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-16 text-sm">
                  <span>{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <Progress value={percentage} className="h-2 flex-1" />
                <span className="w-8 text-right text-xs text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Self-contained component (fetches its own data)
// ---------------------------------------------------------------------------

interface ReviewStatsDisplayProps {
  /** Target type to fetch rating for */
  targetType?: "vendor" | "listing";
  /** Target ID to fetch rating for */
  targetId?: string;
}

export function ReviewStatsDisplay({ targetType, targetId }: ReviewStatsDisplayProps = {}) {
  const { data: stats, isLoading } = useReviewStats(
    targetType ?? "vendor",
    targetId
  );

  if (isLoading) {
    return <ReviewStatsSkeleton />;
  }

  if (!stats) {
    return null;
  }

  return <ReviewStatsCard stats={stats} />;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ReviewStatsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <Skeleton className="h-10 w-14" />
            <Skeleton className="h-4 w-20 mt-1" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-2 flex-1" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
