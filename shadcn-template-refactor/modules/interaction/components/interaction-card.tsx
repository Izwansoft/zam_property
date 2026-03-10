// =============================================================================
// InteractionCard — Card component for inbox list views
// =============================================================================

"use client";

import Link from "next/link";
import {
  Inbox,
  MessageSquare,
  CalendarCheck,
  Clock,
  Mail,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { Interaction, InteractionType } from "../types";
import {
  INTERACTION_STATUS_CONFIG,
  getInteractionTypeLabel,
  formatRelativeDate,
} from "../utils";

// ---------------------------------------------------------------------------
// Type icon mapping
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<InteractionType, React.ComponentType<{ className?: string }>> = {
  LEAD: Inbox,
  ENQUIRY: MessageSquare,
  BOOKING: CalendarCheck,
};

const TYPE_COLORS: Record<InteractionType, string> = {
  LEAD: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950",
  ENQUIRY: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950",
  BOOKING: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InteractionCardProps {
  interaction: Interaction;
  /** Base path for detail link (e.g., "/dashboard/vendor/inbox") */
  basePath: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InteractionCard({ interaction, basePath }: InteractionCardProps) {
  const statusConfig = INTERACTION_STATUS_CONFIG[interaction.status];
  const TypeIcon = TYPE_ICONS[interaction.type];
  const typeColor = TYPE_COLORS[interaction.type];

  return (
    <Link href={`${basePath}/${interaction.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          {/* Row 1: Type icon, listing title, status badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Type icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeColor}`}
              >
                <TypeIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-sm group-hover:text-primary transition-colors">
                  {interaction.listingTitle}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getInteractionTypeLabel(interaction.type)} &middot;{" "}
                  {interaction.referenceId}
                </p>
              </div>
            </div>
            <Badge variant={statusConfig.variant} className="shrink-0 text-xs">
              {statusConfig.label}
            </Badge>
          </div>

          {/* Row 2: Customer name + last message */}
          <div className="mt-3 space-y-1">
            <p className="text-sm font-medium text-foreground/90">
              {interaction.customerName}
            </p>
            {interaction.lastMessage && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {interaction.lastMessage}
              </p>
            )}
          </div>

          {/* Row 3: Meta info */}
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {/* Message count */}
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {interaction.messageCount}{" "}
                {interaction.messageCount === 1 ? "message" : "messages"}
              </span>
            </div>

            {/* Time */}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeDate(interaction.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function InteractionCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
