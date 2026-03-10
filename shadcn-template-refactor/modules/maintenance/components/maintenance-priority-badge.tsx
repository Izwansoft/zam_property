// =============================================================================
// MaintenancePriorityBadge — Priority badge for maintenance tickets
// =============================================================================

"use client";

import { ArrowDown, Minus, ArrowUp, AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  MaintenancePriority,
  type MaintenanceStatusVariant,
  MAINTENANCE_PRIORITY_CONFIG,
} from "../types";

// ---------------------------------------------------------------------------
// Icon mapping
// ---------------------------------------------------------------------------

function getPriorityIcon(priority: MaintenancePriority) {
  switch (priority) {
    case MaintenancePriority.LOW:
      return <ArrowDown className="h-3 w-3" />;
    case MaintenancePriority.MEDIUM:
      return <Minus className="h-3 w-3" />;
    case MaintenancePriority.HIGH:
      return <ArrowUp className="h-3 w-3" />;
    case MaintenancePriority.URGENT:
      return <AlertTriangle className="h-3 w-3" />;
    default:
      return null;
  }
}

function getPriorityColor(variant: MaintenanceStatusVariant): string {
  switch (variant) {
    case "destructive":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "warning":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    case "outline":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaintenancePriorityBadgeProps {
  priority: MaintenancePriority;
  /** Size variant */
  size?: "sm" | "md";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MaintenancePriorityBadge({
  priority,
  size = "md",
}: MaintenancePriorityBadgeProps) {
  const config = MAINTENANCE_PRIORITY_CONFIG[priority];

  if (!config) {
    return (
      <Badge variant="outline" className="text-xs">
        {priority}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`${getPriorityColor(config.variant)} gap-1 ${
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs"
      }`}
    >
      {getPriorityIcon(priority)}
      {config.label}
    </Badge>
  );
}
