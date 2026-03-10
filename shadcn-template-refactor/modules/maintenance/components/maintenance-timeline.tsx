// =============================================================================
// MaintenanceTimeline — Visual timeline of maintenance ticket status changes
// =============================================================================
// Shows the progression of a maintenance ticket through its lifecycle.
// Each status transition is represented as a timeline node.
// =============================================================================

"use client";

import {
  Circle,
  CheckCircle2,
  Clock,
  UserCheck,
  Wrench,
  ClipboardCheck,
  FileCheck,
  XCircle,
  AlertCircle,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { MaintenanceStatus, MAINTENANCE_STATUS_CONFIG } from "../types";
import type { Maintenance } from "../types";

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

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Ordered status flow for the primary path */
const STATUS_FLOW: MaintenanceStatus[] = [
  MaintenanceStatus.OPEN,
  MaintenanceStatus.VERIFIED,
  MaintenanceStatus.ASSIGNED,
  MaintenanceStatus.IN_PROGRESS,
  MaintenanceStatus.PENDING_APPROVAL,
  MaintenanceStatus.CLOSED,
];

/** Map status to its icon */
function getStatusIcon(status: MaintenanceStatus, isActive: boolean) {
  const cls = cn("h-4 w-4", isActive ? "text-white" : "text-muted-foreground");

  switch (status) {
    case MaintenanceStatus.OPEN:
      return <Circle className={cls} />;
    case MaintenanceStatus.VERIFIED:
      return <UserCheck className={cls} />;
    case MaintenanceStatus.ASSIGNED:
      return <ClipboardCheck className={cls} />;
    case MaintenanceStatus.IN_PROGRESS:
      return <Wrench className={cls} />;
    case MaintenanceStatus.PENDING_APPROVAL:
      return <Clock className={cls} />;
    case MaintenanceStatus.CLAIM_SUBMITTED:
      return <FileCheck className={cls} />;
    case MaintenanceStatus.CLAIM_APPROVED:
      return <Shield className={cls} />;
    case MaintenanceStatus.CLAIM_REJECTED:
      return <AlertCircle className={cls} />;
    case MaintenanceStatus.CLOSED:
      return <CheckCircle2 className={cls} />;
    case MaintenanceStatus.CANCELLED:
      return <XCircle className={cls} />;
    default:
      return <Circle className={cls} />;
  }
}

/** Get background color for timeline node */
function getNodeBg(status: MaintenanceStatus, state: "done" | "current" | "pending") {
  if (state === "pending") return "bg-muted";
  if (state === "current") {
    const config = MAINTENANCE_STATUS_CONFIG[status];
    switch (config.variant) {
      case "success":
        return "bg-emerald-500";
      case "warning":
        return "bg-amber-500";
      case "destructive":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  }
  // done
  return "bg-emerald-500";
}

// ---------------------------------------------------------------------------
// Timeline Item
// ---------------------------------------------------------------------------

interface TimelineItemProps {
  status: MaintenanceStatus;
  state: "done" | "current" | "pending";
  date?: string;
  detail?: string;
  isLast: boolean;
}

function TimelineItem({ status, state, date, detail, isLast }: TimelineItemProps) {
  const config = MAINTENANCE_STATUS_CONFIG[status];

  return (
    <div className="flex gap-3">
      {/* Line + Node */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            state === "done" && "border-emerald-500",
            state === "current" && "border-blue-500",
            state === "pending" && "border-muted-foreground/30",
            getNodeBg(status, state)
          )}
        >
          {state === "done" ? (
            <CheckCircle2 className="h-4 w-4 text-white" />
          ) : (
            getStatusIcon(status, state === "current")
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 min-h-[2rem]",
              state === "done" ? "bg-emerald-500" : "bg-muted-foreground/20"
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="pb-6">
        <p
          className={cn(
            "text-sm font-medium leading-8",
            state === "pending" && "text-muted-foreground"
          )}
        >
          {config.label}
        </p>
        {date && (
          <p className="text-xs text-muted-foreground">
            {formatDateTime(date)}
          </p>
        )}
        {detail && (
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaintenanceTimelineProps {
  ticket: Maintenance;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Render a visual timeline of maintenance ticket status progression.
 *
 * The timeline shows all statuses in the primary flow, marking completed,
 * current, and pending steps. Terminal statuses (CANCELLED) are displayed
 * separately if applicable.
 */
export function MaintenanceTimeline({ ticket }: MaintenanceTimelineProps) {
  const isCancelled = ticket.status === MaintenanceStatus.CANCELLED;
  const isClosed = ticket.status === MaintenanceStatus.CLOSED;

  // Build timeline entries from the ticket data
  const timelineEntries = buildTimelineEntries(ticket);

  return (
    <div className="space-y-0">
      {timelineEntries.map((entry, index) => (
        <TimelineItem
          key={entry.status}
          status={entry.status}
          state={entry.state}
          date={entry.date}
          detail={entry.detail}
          isLast={index === timelineEntries.length - 1}
        />
      ))}

      {/* Show cancelled status separately */}
      {isCancelled && (
        <TimelineItem
          status={MaintenanceStatus.CANCELLED}
          state="current"
          date={ticket.updatedAt}
          isLast
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Build Timeline Entries
// ---------------------------------------------------------------------------

interface TimelineEntry {
  status: MaintenanceStatus;
  state: "done" | "current" | "pending";
  date?: string;
  detail?: string;
}

function buildTimelineEntries(ticket: Maintenance): TimelineEntry[] {
  const currentStatusIndex = STATUS_FLOW.indexOf(ticket.status);
  const isCancelled = ticket.status === MaintenanceStatus.CANCELLED;

  // For cancelled, show up to the last reached status
  const lastReachedIndex = isCancelled
    ? getLastReachedIndex(ticket)
    : currentStatusIndex;

  return STATUS_FLOW.map((status, index) => {
    let state: "done" | "current" | "pending";
    if (isCancelled) {
      state = index <= lastReachedIndex ? "done" : "pending";
    } else if (index < currentStatusIndex) {
      state = "done";
    } else if (index === currentStatusIndex) {
      state = "current";
    } else {
      state = "pending";
    }

    return {
      status,
      state,
      date: getDateForStatus(ticket, status),
      detail: getDetailForStatus(ticket, status),
    };
  });
}

/** Determine the last status the ticket reached before cancellation */
function getLastReachedIndex(ticket: Maintenance): number {
  // Check dates to determine the furthest progress
  if (ticket.startedAt) return STATUS_FLOW.indexOf(MaintenanceStatus.IN_PROGRESS);
  if (ticket.assignedAt) return STATUS_FLOW.indexOf(MaintenanceStatus.ASSIGNED);
  if (ticket.verifiedAt) return STATUS_FLOW.indexOf(MaintenanceStatus.VERIFIED);
  return STATUS_FLOW.indexOf(MaintenanceStatus.OPEN);
}

/** Get the date string associated with a particular status */
function getDateForStatus(ticket: Maintenance, status: MaintenanceStatus): string | undefined {
  switch (status) {
    case MaintenanceStatus.OPEN:
      return ticket.reportedAt || ticket.createdAt;
    case MaintenanceStatus.VERIFIED:
      return ticket.verifiedAt;
    case MaintenanceStatus.ASSIGNED:
      return ticket.assignedAt;
    case MaintenanceStatus.IN_PROGRESS:
      return ticket.startedAt;
    case MaintenanceStatus.PENDING_APPROVAL:
      return ticket.resolvedAt;
    case MaintenanceStatus.CLOSED:
      return ticket.closedAt;
    default:
      return undefined;
  }
}

/** Get optional detail text for a status */
function getDetailForStatus(ticket: Maintenance, status: MaintenanceStatus): string | undefined {
  switch (status) {
    case MaintenanceStatus.VERIFIED:
      return ticket.verificationNotes || undefined;
    case MaintenanceStatus.ASSIGNED:
      return ticket.contractorName
        ? `Assigned to ${ticket.contractorName}`
        : ticket.assignedTo
        ? `Assigned to staff`
        : undefined;
    case MaintenanceStatus.CLOSED:
      return ticket.resolution || undefined;
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function MaintenanceTimelineSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            {i < 4 && <div className="w-0.5 min-h-[2rem] bg-muted" />}
          </div>
          <div className="pb-6 space-y-1">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-3 w-32 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
