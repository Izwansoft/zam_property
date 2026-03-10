// =============================================================================
// ActivityFeed — Full timeline view with pagination
// =============================================================================
// Displays a chronological feed of activity items in a vertical timeline.
// Used in entity detail pages or dedicated activity views.
// =============================================================================

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivityFeed } from "../hooks/use-activity-feed";
import { ActivityItemComponent } from "./activity-item";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ActivityFeedProps {
  /** Target entity type (listing, vendor, partner, etc.) */
  targetType: string;
  /** Target entity ID */
  targetId: string;
  /** Title for the feed card */
  title?: string;
  /** Description below the title */
  description?: string;
  /** Items per page */
  pageSize?: number;
  /** Whether to filter internal activities (vendor portal) */
  hideInternal?: boolean;
  /** Whether to show the internal badge on items */
  showInternalBadge?: boolean;
  /** Additional className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ActivityFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function ActivityFeedEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Activity className="size-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">
        No activity yet
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Activity will appear here as actions are performed.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityFeed({
  targetType,
  targetId,
  title = "Activity",
  description,
  pageSize = 20,
  hideInternal = false,
  showInternalBadge = false,
  className,
}: ActivityFeedProps) {
  const [page, setPage] = useState(1);

  const { items, pagination, isLoading, isFetching } = useActivityFeed({
    targetType,
    targetId,
    page,
    pageSize,
    hideInternal,
  });

  const totalPages = pagination?.totalPages ?? 1;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          {isFetching && !isLoading && (
            <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <ActivityFeedSkeleton count={Math.min(pageSize, 5)} />
        ) : items.length === 0 ? (
          <ActivityFeedEmpty />
        ) : (
          <>
            {/* Timeline */}
            <div className="space-y-0">
              {items.map((item, index) => (
                <ActivityItemComponent
                  key={item.id}
                  item={item}
                  showConnector={index < items.length - 1}
                  showInternalBadge={showInternalBadge}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4 mt-2">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                  {pagination?.total != null && (
                    <span> · {pagination.total} items</span>
                  )}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!hasPrev || isFetching}
                  >
                    <ChevronLeft className="size-4" />
                    <span className="sr-only">Previous</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasNext || isFetching}
                  >
                    <ChevronRight className="size-4" />
                    <span className="sr-only">Next</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
