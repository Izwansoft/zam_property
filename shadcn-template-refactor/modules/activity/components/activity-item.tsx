// =============================================================================
// ActivityItem — Single activity timeline entry
// =============================================================================
// Displays an activity with type-specific icon, description, actor,
// optional expandable metadata, and relative timestamp.
// =============================================================================

"use client";

import { useState } from "react";
import {
  LogIn,
  LogOut,
  FileText,
  Building2,
  Users,
  MessageSquare,
  Star,
  Image,
  CreditCard,
  Shield,
  Settings,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ActivityItem as ActivityItemType, ActivityCategory } from "../types";

// ---------------------------------------------------------------------------
// Icon & color mapping per category
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<
  ActivityCategory,
  { icon: LucideIcon; color: string; bg: string }
> = {
  auth: {
    icon: LogIn,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  listing: {
    icon: FileText,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  vendor: {
    icon: Building2,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  partner: {
    icon: Users,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  interaction: {
    icon: MessageSquare,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
  },
  review: {
    icon: Star,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  media: {
    icon: Image,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-100 dark:bg-pink-900/30",
  },
  subscription: {
    icon: CreditCard,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  admin: {
    icon: Shield,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  system: {
    icon: Settings,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
};

// Override specific action types → icons
const ACTION_ICON_OVERRIDES: Partial<Record<string, LucideIcon>> = {
  AUTH_LOGOUT: LogOut,
};

// ---------------------------------------------------------------------------
// Relative time formatting
// ---------------------------------------------------------------------------

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-MY", {
    month: "short",
    day: "numeric",
    year: days > 365 ? "numeric" : undefined,
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ActivityItemProps {
  /** The activity item data */
  item: ActivityItemType;
  /** Whether to show the timeline connector line below */
  showConnector?: boolean;
  /** Whether this is a compact widget variant */
  compact?: boolean;
  /** Whether to show the internal badge (admin view) */
  showInternalBadge?: boolean;
  /** Additional className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityItemComponent({
  item,
  showConnector = false,
  compact = false,
  showInternalBadge = false,
  className,
}: ActivityItemProps) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[item.category];
  const Icon = ACTION_ICON_OVERRIDES[item.actionType] ?? config.icon;

  const hasDetails =
    !compact && (item.oldValue || item.newValue || item.metadata);

  return (
    <div className={cn("relative flex gap-3", className)}>
      {/* Timeline connector line */}
      {showConnector && (
        <div
          className="absolute left-4 top-9 -bottom-0 w-px bg-border"
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex shrink-0 items-center justify-center rounded-full",
          config.bg,
          compact ? "size-7" : "size-8"
        )}
      >
        <Icon
          className={cn(config.color, compact ? "size-3.5" : "size-4")}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={cn(
                "font-medium leading-snug",
                compact ? "text-xs" : "text-sm"
              )}
            >
              {item.description}
            </p>
            <p
              className={cn(
                "text-muted-foreground truncate",
                compact ? "text-[11px]" : "text-xs"
              )}
            >
              {item.actor}
              {!compact && item.targetType && (
                <span className="text-muted-foreground/60">
                  {" "}
                  · {item.targetType}
                </span>
              )}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {showInternalBadge && item.isInternal && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Internal
              </Badge>
            )}
            <time
              dateTime={item.timestamp}
              className={cn(
                "text-muted-foreground whitespace-nowrap",
                compact ? "text-[10px]" : "text-xs"
              )}
              title={new Date(item.timestamp).toLocaleString("en-MY")}
            >
              {formatRelativeTime(item.timestamp)}
            </time>
          </div>
        </div>

        {/* Expandable detail (full variant only) */}
        {hasDetails && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
            {expanded ? "Hide details" : "Show details"}
          </button>
        )}

        {expanded && hasDetails && (
          <div className="mt-2 rounded-md border bg-muted/50 p-3 text-xs space-y-2">
            {item.oldValue && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Before:
                </span>
                <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap text-[11px]">
                  {JSON.stringify(item.oldValue, null, 2)}
                </pre>
              </div>
            )}
            {item.newValue && (
              <div>
                <span className="font-medium text-muted-foreground">
                  After:
                </span>
                <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap text-[11px]">
                  {JSON.stringify(item.newValue, null, 2)}
                </pre>
              </div>
            )}
            {item.metadata &&
              Object.keys(item.metadata).length > 0 && (
                <div>
                  <span className="font-medium text-muted-foreground">
                    Metadata:
                  </span>
                  <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap text-[11px]">
                    {JSON.stringify(item.metadata, null, 2)}
                  </pre>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
