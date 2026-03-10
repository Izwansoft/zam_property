// =============================================================================
// MaintenanceStatusBadge — Status badge for maintenance tickets
// =============================================================================

"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { MaintenanceStatus, MaintenanceStatusVariant } from "../types";
import { MAINTENANCE_STATUS_CONFIG } from "../types";

// ---------------------------------------------------------------------------
// Badge variant mapping
// ---------------------------------------------------------------------------

function getBadgeVariant(
  variant: MaintenanceStatusVariant
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

function getStatusColor(variant: MaintenanceStatusVariant): string {
  switch (variant) {
    case "success":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "warning":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "destructive":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "outline":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus;
  /** Show tooltip with description (default: true) */
  showTooltip?: boolean;
  /** Size variant */
  size?: "sm" | "md";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MaintenanceStatusBadge({
  status,
  showTooltip = true,
  size = "md",
}: MaintenanceStatusBadgeProps) {
  const config = MAINTENANCE_STATUS_CONFIG[status];

  if (!config) {
    return (
      <Badge variant="outline" className="text-xs">
        {status}
      </Badge>
    );
  }

  const badge = (
    <Badge
      variant={getBadgeVariant(config.variant)}
      className={`${getStatusColor(config.variant)} ${
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs"
      }`}
    >
      {config.label}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {config.description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
