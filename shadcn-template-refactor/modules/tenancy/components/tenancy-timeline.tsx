// =============================================================================
// TenancyTimeline — Timeline component showing tenancy status history
// =============================================================================

"use client";

import { 
  Clock, 
  CheckCircle, 
  FileText, 
  PenTool, 
  Home, 
  AlertTriangle, 
  LogOut, 
  XCircle,
  ArrowRight
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { TenancyStatusChange, TenancyStatus } from "../types";
import { TENANCY_STATUS_CONFIG } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} min ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function getStatusIcon(status: TenancyStatus): React.ReactNode {
  switch (status) {
    case "PENDING_BOOKING":
      return <Clock className="h-4 w-4" />;
    case "PENDING_CONTRACT":
      return <FileText className="h-4 w-4" />;
    case "PENDING_SIGNATURES":
      return <PenTool className="h-4 w-4" />;
    case "APPROVED":
      return <CheckCircle className="h-4 w-4" />;
    case "ACTIVE":
      return <Home className="h-4 w-4" />;
    case "OVERDUE":
      return <AlertTriangle className="h-4 w-4" />;
    case "TERMINATION_REQUESTED":
      return <LogOut className="h-4 w-4" />;
    case "TERMINATING":
      return <LogOut className="h-4 w-4" />;
    case "TERMINATED":
      return <XCircle className="h-4 w-4" />;
    case "CANCELLED":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

function getStatusColor(status: TenancyStatus): string {
  const config = TENANCY_STATUS_CONFIG[status];
  switch (config?.variant) {
    case "success":
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
    case "warning":
      return "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30";
    case "destructive":
      return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
    default:
      return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800";
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TenancyTimelineProps {
  history: TenancyStatusChange[];
  /** Show compact version without card wrapper */
  compact?: boolean;
}

interface TimelineItemProps {
  change: TenancyStatusChange;
  isLast: boolean;
}

// ---------------------------------------------------------------------------
// TimelineItem
// ---------------------------------------------------------------------------

function TimelineItem({ change, isLast }: TimelineItemProps) {
  const toConfig = TENANCY_STATUS_CONFIG[change.toStatus as TenancyStatus];
  
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[17px] top-10 h-[calc(100%-24px)] w-0.5 bg-border" />
      )}
      
      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          getStatusColor(change.toStatus as TenancyStatus)
        )}
      >
        {getStatusIcon(change.toStatus as TenancyStatus)}
      </div>
      
      {/* Content */}
      <div className="flex-1 space-y-1 pt-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{toConfig?.label || change.toStatus}</span>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(change.changedAt)}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {formatDateTime(change.changedAt)}
        </p>
        
        {change.reason && (
          <p className="text-sm text-muted-foreground italic">
            &ldquo;{change.reason}&rdquo;
          </p>
        )}
        
        {/* Show transition for context */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <span>
            {TENANCY_STATUS_CONFIG[change.fromStatus as TenancyStatus]?.label || change.fromStatus}
          </span>
          <ArrowRight className="h-3 w-3" />
          <span>
            {toConfig?.label || change.toStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TenancyTimeline
// ---------------------------------------------------------------------------

export function TenancyTimeline({ history, compact }: TenancyTimelineProps) {
  // Sort by date descending (most recent first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  if (sortedHistory.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No status history available
      </div>
    );
  }

  const content = (
    <div className="space-y-0">
      {sortedHistory.map((change, index) => (
        <TimelineItem
          key={change.id}
          change={change}
          isLast={index === sortedHistory.length - 1}
        />
      ))}
    </div>
  );

  if (compact) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Status History
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function TenancyTimelineSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
