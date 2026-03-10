// =============================================================================
// InspectionCard — Card component for inspection list views
// =============================================================================

"use client";

import Link from "next/link";
import { ChevronRight, Clock, Calendar, MapPin } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import type { Inspection } from "../types";
import {
  INSPECTION_TYPE_CONFIG,
  InspectionType,
} from "../types";
import { InspectionStatusBadge } from "./inspection-status-badge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeDate(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${
      Math.floor(diffDays / 7) !== 1 ? "s" : ""
    } ago`;
  return formatDate(dateString);
}

function getTypeColor(type: InspectionType): string {
  switch (type) {
    case InspectionType.MOVE_IN:
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case InspectionType.PERIODIC:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case InspectionType.MOVE_OUT:
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    case InspectionType.EMERGENCY:
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InspectionCardProps {
  inspection: Inspection;
  /** Base path for detail links */
  basePath?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InspectionCard({
  inspection,
  basePath = "/dashboard/tenant/inspections",
}: InspectionCardProps) {
  const typeConfig = INSPECTION_TYPE_CONFIG[inspection.type];
  const TypeIcon = typeConfig?.icon;

  return (
    <Card className="group overflow-hidden transition-colors hover:bg-muted/50">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: Icon + Content */}
          <div className="flex flex-1 items-start gap-3">
            {/* Type Icon */}
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getTypeColor(
                inspection.type
              )}`}
            >
              {TypeIcon && <TypeIcon className="h-4 w-4" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Type + Status */}
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium truncate">
                  {typeConfig?.label ?? inspection.type} Inspection
                </h3>
                <InspectionStatusBadge
                  status={inspection.status}
                  size="sm"
                />
              </div>

              {/* Property info */}
              {inspection.tenancy?.property && (
                <p className="text-sm text-muted-foreground truncate">
                  {inspection.tenancy.property.title}
                </p>
              )}

              {/* Meta: Scheduled date, Created */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {inspection.scheduledDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(inspection.scheduledDate)}
                    {inspection.scheduledTime && (
                      <span className="ml-0.5">{inspection.scheduledTime}</span>
                    )}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeDate(inspection.createdAt)}
                </span>
                {inspection.tenancy?.property?.address && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-50">
                      {inspection.tenancy.property.address}
                    </span>
                  </span>
                )}
              </div>

              {/* Rating if completed */}
              {inspection.overallRating && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Rating:</span>
                  <span className="font-medium text-foreground">
                    {inspection.overallRating}/5
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: View button */}
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 self-center"
            asChild
          >
            <Link href={`${basePath}/${inspection.id}`}>
              View
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function InspectionCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-1 items-start gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

