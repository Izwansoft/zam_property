// =============================================================================
// ReviewCard — Card component for review list views
// =============================================================================

"use client";

import Link from "next/link";
import { Star, MessageSquare, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { Review } from "../types";
import { REVIEW_STATUS_CONFIG, getRatingColor, formatRelativeDate } from "../utils";

// ---------------------------------------------------------------------------
// Star rating display
// ---------------------------------------------------------------------------

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReviewCardProps {
  review: Review;
  /** Base path for detail link (e.g., "/dashboard/vendor/reviews") */
  basePath: string;
  /** Whether to show vendor info (for partner/platform views) */
  showVendor?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewCard({ review, basePath, showVendor = false }: ReviewCardProps) {
  const statusConfig = REVIEW_STATUS_CONFIG[review.status];

  return (
    <Link href={`${basePath}/${review.id}`} className="block">
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Rating */}
            <div className="flex flex-col items-center gap-1 pt-0.5">
              <span className={`text-2xl font-bold ${getRatingColor(review.rating)}`}>
                {review.rating}
              </span>
              <StarRating rating={review.rating} size="sm" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {review.title && (
                    <h3 className="font-semibold text-sm truncate">
                      {review.title}
                    </h3>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{review.customerName}</span>
                    <span>·</span>
                    <span className="truncate">{review.listingTitle}</span>
                  </div>
                </div>
                <Badge variant={statusConfig.variant} className="shrink-0 text-xs">
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Content preview */}
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {review.content}
              </p>

              {/* Footer */}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                {showVendor && (
                  <>
                    <span className="font-medium text-foreground">
                      {review.vendorName}
                    </span>
                    <span>·</span>
                  </>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeDate(review.createdAt)}</span>
                </div>
                {review.hasVendorReply && (
                  <>
                    <span>·</span>
                    <div className="flex items-center gap-1 text-primary">
                      <MessageSquare className="h-3 w-3" />
                      <span>Replied</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ReviewCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { StarRating };
