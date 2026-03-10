// =============================================================================
// ClaimStatusBadge — Status badge for claim items
// =============================================================================

"use client";

import { Badge } from "@/components/ui/badge";
import { ClaimStatus, CLAIM_STATUS_CONFIG } from "../types";

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function ClaimStatusBadge({
  status,
  size = "md",
  showIcon = false,
}: ClaimStatusBadgeProps) {
  const config = CLAIM_STATUS_CONFIG[status];
  if (!config) return null;

  const Icon = config.icon;

  // Map custom variants to badge variants
  const variantMap: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    default: "default",
    secondary: "secondary",
    outline: "outline",
    destructive: "destructive",
    success: "default",
    warning: "secondary",
  };

  const badgeVariant = variantMap[config.variant] || "default";

  // Additional color classes for success/warning
  const extraClasses =
    config.variant === "success"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200"
      : config.variant === "warning"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200"
        : "";

  return (
    <Badge
      variant={badgeVariant}
      className={`${size === "sm" ? "text-[10px] px-1.5 py-0" : ""} ${extraClasses}`}
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
