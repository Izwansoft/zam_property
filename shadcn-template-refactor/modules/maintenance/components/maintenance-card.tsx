// =============================================================================
// MaintenanceCard — Card component for maintenance list views
// =============================================================================

"use client";

import Link from "next/link";
import {
  Wrench,
  Droplets,
  Zap,
  Building2,
  HelpCircle,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import type { Maintenance } from "../types";
import { MaintenanceCategory } from "../types";
import { MaintenanceStatusBadge } from "./maintenance-status-badge";
import { MaintenancePriorityBadge } from "./maintenance-priority-badge";

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
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? "s" : ""} ago`;
  return formatDate(dateString);
}

function getCategoryIcon(category: MaintenanceCategory) {
  switch (category) {
    case MaintenanceCategory.PLUMBING:
      return <Droplets className="h-4 w-4" />;
    case MaintenanceCategory.ELECTRICAL:
      return <Zap className="h-4 w-4" />;
    case MaintenanceCategory.STRUCTURAL:
      return <Building2 className="h-4 w-4" />;
    case MaintenanceCategory.APPLIANCE:
      return <Wrench className="h-4 w-4" />;
    case MaintenanceCategory.OTHER:
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
}

function getCategoryColor(category: MaintenanceCategory): string {
  switch (category) {
    case MaintenanceCategory.PLUMBING:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case MaintenanceCategory.ELECTRICAL:
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case MaintenanceCategory.STRUCTURAL:
      return "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-400";
    case MaintenanceCategory.APPLIANCE:
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case MaintenanceCategory.OTHER:
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaintenanceCardProps {
  ticket: Maintenance;
  /** Base path for detail links */
  basePath?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MaintenanceCard({
  ticket,
  basePath = "/dashboard/tenant/maintenance",
}: MaintenanceCardProps) {
  return (
    <Card className="group overflow-hidden transition-colors hover:bg-muted/50">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: Icon + Content */}
          <div className="flex flex-1 items-start gap-3">
            {/* Category Icon */}
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getCategoryColor(
                ticket.category
              )}`}
            >
              {getCategoryIcon(ticket.category)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Title + Status */}
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium truncate">{ticket.title}</h3>
                <MaintenanceStatusBadge status={ticket.status} size="sm" />
                <MaintenancePriorityBadge
                  priority={ticket.priority}
                  size="sm"
                />
              </div>

              {/* Ticket Number + Category */}
              <p className="text-sm text-muted-foreground">
                {ticket.ticketNumber} &middot;{" "}
                {ticket.category.charAt(0) +
                  ticket.category.slice(1).toLowerCase()}
              </p>

              {/* Meta: Date, Location */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeDate(ticket.createdAt)}
                </span>
                {ticket.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {ticket.location}
                  </span>
                )}
                {ticket.tenancy?.property && (
                  <span className="truncate">
                    {ticket.tenancy.property.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: View button */}
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 self-center"
            asChild
          >
            <Link href={`${basePath}/${ticket.id}`}>
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

export function MaintenanceCardSkeleton() {
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
                <Skeleton className="h-5 w-14" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
