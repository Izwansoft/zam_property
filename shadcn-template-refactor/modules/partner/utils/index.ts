// =============================================================================
// Partner Utilities — Formatters, helpers, constants
// =============================================================================

import { PartnerStatus, type PartnerPlan } from "../types";

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

export const PARTNER_STATUS_CONFIG: Record<
  PartnerStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  [PartnerStatus.ACTIVE]: { label: "Active", variant: "default" },
  [PartnerStatus.SUSPENDED]: { label: "Suspended", variant: "outline" },
  [PartnerStatus.DEACTIVATED]: { label: "Deactivated", variant: "destructive" },
};

// ---------------------------------------------------------------------------
// Plan labels & badge config
// ---------------------------------------------------------------------------

export const PARTNER_PLAN_CONFIG: Record<
  PartnerPlan,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  FREE: { label: "Free", variant: "secondary" },
  STARTER: { label: "Starter", variant: "outline" },
  PROFESSIONAL: { label: "Professional", variant: "default" },
  ENTERPRISE: { label: "Enterprise", variant: "default" },
};

/**
 * Get human-readable label for partner plan
 */
export function getPartnerPlanLabel(plan: PartnerPlan): string {
  return PARTNER_PLAN_CONFIG[plan]?.label ?? plan;
}

// ---------------------------------------------------------------------------
// Date formatters
// ---------------------------------------------------------------------------

const DATE_FORMATTER = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Format ISO date string for display
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return DATE_FORMATTER.format(new Date(dateStr));
  } catch {
    return "—";
  }
}

/**
 * Format ISO date string with time
 */
export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return DATETIME_FORMATTER.format(new Date(dateStr));
  } catch {
    return "—";
  }
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 30) return formatDate(dateStr);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  } catch {
    return "—";
  }
}

// ---------------------------------------------------------------------------
// Usage formatters
// ---------------------------------------------------------------------------

/**
 * Format usage as "used / limit" with percentage
 */
export function formatUsage(used: number, limit: number): string {
  if (limit <= 0) return `${used}`;
  return `${used} / ${limit}`;
}

/**
 * Get usage percentage (0-100)
 */
export function getUsagePercentage(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(Math.round((used / limit) * 100), 100);
}

/**
 * Format storage in human-readable units
 */
export function formatStorage(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

// ---------------------------------------------------------------------------
// Filter cleaner
// ---------------------------------------------------------------------------

/**
 * Remove empty/default filter values for API call
 */
export function cleanPartnerFilters(
  filters: Record<string, unknown>
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === "" || value === undefined || value === null) continue;
    cleaned[key] = value;
  }
  return cleaned;
}
