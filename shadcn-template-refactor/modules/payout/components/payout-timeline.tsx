// =============================================================================
// PayoutTimeline — Visual status timeline for payout lifecycle
// =============================================================================
// Shows: Calculated → Approved → Processing → Completed/Failed
// Each step shows date/time when available.
// =============================================================================

"use client";

import { CheckCircle2, Circle, Clock, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PayoutStatus } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimelineStep {
  label: string;
  status: "completed" | "current" | "upcoming" | "failed";
  date?: string | null;
  description?: string;
}

interface PayoutTimelineProps {
  payoutStatus: PayoutStatus;
  createdAt: string;
  approvedAt?: string | null;
  processedAt?: string | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimelineDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimelineSteps(
  status: PayoutStatus,
  createdAt: string,
  approvedAt?: string | null,
  processedAt?: string | null
): TimelineStep[] {
  const isFailed = status === PayoutStatus.FAILED;

  const steps: TimelineStep[] = [
    {
      label: "Calculated",
      status: "completed",
      date: createdAt,
      description: "Payout amounts calculated from billing records",
    },
    {
      label: "Approved",
      status:
        status === PayoutStatus.CALCULATED
          ? "upcoming"
          : approvedAt
            ? "completed"
            : "upcoming",
      date: approvedAt,
      description: "Payout reviewed and approved for processing",
    },
    {
      label: "Processing",
      status:
        status === PayoutStatus.PROCESSING
          ? "current"
          : status === PayoutStatus.COMPLETED || isFailed
            ? "completed"
            : "upcoming",
      date:
        status === PayoutStatus.PROCESSING ||
        status === PayoutStatus.COMPLETED ||
        isFailed
          ? processedAt || approvedAt
          : null,
      description: "Bank transfer initiated",
    },
    {
      label: isFailed ? "Failed" : "Completed",
      status: isFailed
        ? "failed"
        : status === PayoutStatus.COMPLETED
          ? "completed"
          : "upcoming",
      date:
        isFailed || status === PayoutStatus.COMPLETED ? processedAt : null,
      description: isFailed
        ? "Transfer failed — will be retried"
        : "Funds deposited to bank account",
    },
  ];

  return steps;
}

// ---------------------------------------------------------------------------
// Step Icon
// ---------------------------------------------------------------------------

function StepIcon({ step }: { step: TimelineStep }) {
  switch (step.status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "current":
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-red-600" />;
    case "upcoming":
    default:
      return <Circle className="h-5 w-5 text-muted-foreground/40" />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PayoutTimeline({
  payoutStatus,
  createdAt,
  approvedAt,
  processedAt,
  className,
}: PayoutTimelineProps) {
  const steps = getTimelineSteps(
    payoutStatus,
    createdAt,
    approvedAt,
    processedAt
  );

  return (
    <div className={cn("relative", className)}>
      <ol className="space-y-0">
        {steps.map((step, index) => (
          <li key={step.label} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute left-[9px] top-7 h-full w-0.5",
                  step.status === "completed"
                    ? "bg-green-300"
                    : step.status === "failed"
                      ? "bg-red-300"
                      : "bg-muted-foreground/20"
                )}
              />
            )}

            {/* Icon */}
            <div className="relative z-10 mt-0.5 flex-shrink-0">
              <StepIcon step={step} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-medium text-sm",
                    step.status === "completed" && "text-foreground",
                    step.status === "current" && "text-blue-600",
                    step.status === "failed" && "text-red-600",
                    step.status === "upcoming" && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {step.status === "current" && (
                  <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                    In Progress
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.description}
              </p>
              {step.date && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimelineDate(step.date)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
