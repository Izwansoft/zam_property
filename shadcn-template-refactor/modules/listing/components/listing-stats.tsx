// =============================================================================
// ListingStats — View/inquiry count stats for listing detail
// =============================================================================

"use client";

import { Eye, MessageSquare, TrendingUp, Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { ListingDetail } from "../types";
import { formatRelativeDate } from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListingStatsProps {
  listing: ListingDetail;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingStats({ listing }: ListingStatsProps) {
  const stats = [
    {
      label: "Total Views",
      value: listing.viewCount.toLocaleString(),
      icon: Eye,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Inquiries",
      value: (listing.inquiryCount ?? 0).toLocaleString(),
      icon: MessageSquare,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Conversion",
      value:
        listing.viewCount > 0
          ? `${(((listing.inquiryCount ?? 0) / listing.viewCount) * 100).toFixed(1)}%`
          : "—",
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      label: "Last Updated",
      value: formatRelativeDate(listing.updatedAt),
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bgColor}`}
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="truncate text-lg font-bold">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ListingStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
