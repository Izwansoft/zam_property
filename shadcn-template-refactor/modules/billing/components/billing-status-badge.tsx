// =============================================================================
// BillingStatusBadge — Status badge for billing records
// =============================================================================

"use client";

import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { BillingStatus, BillingStatusVariant } from "../types";
import { BILLING_STATUS_CONFIG } from "../types";

// ---------------------------------------------------------------------------
// Badge variant mapping
// ---------------------------------------------------------------------------

function getBadgeVariant(
  variant: BillingStatusVariant
): "default" | "secondary" | "destructive" | "outline" {
  switch (variant) {
    case "success":
      return "default";
    case "warning":
      return "secondary";
    case "destructive":
      return "destructive";
    case "outline":
      return "outline";
    default:
      return "secondary";
  }
}

function getStatusBadgeClassName(variant: BillingStatusVariant): string {
  switch (variant) {
    case "success":
      return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    case "warning":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
    case "destructive":
      return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BillingStatusBadgeProps {
  status: BillingStatus;
  /** Show tooltip with status description */
  showTooltip?: boolean;
  /** Show urgency indicator for overdue */
  showUrgency?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BillingStatusBadge({
  status,
  showTooltip = false,
  showUrgency = true,
  className = "",
}: BillingStatusBadgeProps) {
  const config = BILLING_STATUS_CONFIG[status];
  const badgeVariant = getBadgeVariant(config.variant);
  const badgeClassName = getStatusBadgeClassName(config.variant);
  const isOverdue = status === "OVERDUE";

  const badge = (
    <Badge
      variant={badgeVariant}
      className={`text-xs ${badgeClassName} ${isOverdue && showUrgency ? "animate-pulse" : ""} ${className}`}
    >
      {isOverdue && showUrgency && (
        <AlertTriangle className="mr-1 h-3 w-3" />
      )}
      {config.label}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
