// =============================================================================
// InspectionStatusBadge — Status badge for inspection items
// =============================================================================

"use client";

import { Badge } from "@/components/ui/badge";
import {
  InspectionStatus,
  INSPECTION_STATUS_CONFIG,
  type InspectionStatusVariant,
} from "../types";

interface InspectionStatusBadgeProps {
  status: InspectionStatus;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function InspectionStatusBadge({
  status,
  size = "md",
  showIcon = false,
}: InspectionStatusBadgeProps) {
  const config = INSPECTION_STATUS_CONFIG[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={size === "sm" ? "text-[10px] px-1.5 py-0" : ""}
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
