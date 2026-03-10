// =============================================================================
// InspectionSummaryCard — Compact card for tenancy detail view
// =============================================================================
// Shows upcoming/recent inspections for a specific tenancy.
// Placed in the left column of TenancyDetailView.
// =============================================================================

"use client";

import Link from "next/link";
import {
  ClipboardCheck,
  Calendar,
  ChevronRight,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { Inspection } from "../types";
import { INSPECTION_TYPE_CONFIG, INSPECTION_STATUS_CONFIG } from "../types";
import { InspectionStatusBadge } from "./inspection-status-badge";
import { useInspectionsByTenancy } from "../hooks";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InspectionSummaryCardProps {
  tenancyId: string;
  /** Max items to display */
  maxItems?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InspectionSummaryCard({
  tenancyId,
  maxItems = 3,
}: InspectionSummaryCardProps) {
  const { data, isLoading } = useInspectionsByTenancy(tenancyId);
  const inspections = data?.items?.slice(0, maxItems) ?? [];
  const total = data?.pagination?.total ?? 0;

  if (isLoading) {
    return <InspectionSummaryCardSkeleton />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          Inspections
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/tenant/inspections?tenancyId=${tenancyId}`}>
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {inspections.length === 0 ? (
          <div className="flex flex-col items-center py-4 text-center">
            <ClipboardCheck className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              No inspections scheduled
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              asChild
            >
              <Link href={`/dashboard/tenant/inspections?action=new&tenancyId=${tenancyId}`}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Schedule Inspection
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {inspections.map((inspection) => (
              <InspectionSummaryItem
                key={inspection.id}
                inspection={inspection}
              />
            ))}

            {total > maxItems && (
              <p className="text-center text-xs text-muted-foreground">
                +{total - maxItems} more inspection{total - maxItems > 1 ? "s" : ""}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Summary Item
// ---------------------------------------------------------------------------

function InspectionSummaryItem({ inspection }: { inspection: Inspection }) {
  const typeConfig = INSPECTION_TYPE_CONFIG[inspection.type];
  const TypeIcon = typeConfig?.icon;

  return (
    <Link
      href={`/dashboard/tenant/inspections/${inspection.id}`}
      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      {TypeIcon && (
        <TypeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {typeConfig?.label ?? inspection.type}
          </span>
          <InspectionStatusBadge status={inspection.status} size="sm" />
        </div>
        {inspection.scheduledDate && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3" />
            {formatDate(inspection.scheduledDate)}
            {inspection.scheduledTime && ` · ${inspection.scheduledTime}`}
          </p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function InspectionSummaryCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-16" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
            <Skeleton className="h-4 w-4 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
