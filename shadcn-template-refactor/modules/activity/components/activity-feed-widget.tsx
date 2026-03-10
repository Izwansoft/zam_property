// =============================================================================
// ActivityFeedWidget — Compact dashboard sidebar widget
// =============================================================================
// A lightweight activity feed for embedding in dashboard pages.
// Shows the most recent activities with minimal chrome.
// =============================================================================

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecentActivity } from "../hooks/use-recent-activity";
import { ActivityItemComponent } from "./activity-item";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ActivityFeedWidgetProps {
  /** Portal scope (platform, partner, vendor) */
  portal: string;
  /** Title for the widget */
  title?: string;
  /** Description below the title */
  description?: string;
  /** Number of items to show */
  limit?: number;
  /** Filter by specific action type */
  actionType?: string;
  /** Whether to filter internal activities (vendor portal) */
  hideInternal?: boolean;
  /** Whether to show internal badge on items (admin view) */
  showInternalBadge?: boolean;
  /** Max height before scrolling (default: 400px) */
  maxHeight?: number;
  /** Additional className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function WidgetSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <Skeleton className="size-7 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function WidgetEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Activity className="size-8 text-muted-foreground/40 mb-2" />
      <p className="text-xs text-muted-foreground">No recent activity</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityFeedWidget({
  portal,
  title = "Recent Activity",
  description,
  limit = 10,
  actionType,
  hideInternal = false,
  showInternalBadge = false,
  maxHeight = 400,
  className,
}: ActivityFeedWidgetProps) {
  const { items, isLoading } = useRecentActivity({
    portal,
    limit,
    actionType,
    hideInternal,
  });

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <WidgetSkeleton count={Math.min(limit, 5)} />
        ) : items.length === 0 ? (
          <WidgetEmpty />
        ) : (
          <ScrollArea style={{ maxHeight }} className="pr-3">
            <div className="space-y-0">
              {items.map((item, index) => (
                <ActivityItemComponent
                  key={item.id}
                  item={item}
                  compact
                  showConnector={index < items.length - 1}
                  showInternalBadge={showInternalBadge}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
