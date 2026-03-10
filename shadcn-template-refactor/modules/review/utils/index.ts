// =============================================================================
// Review Utilities — Formatters, helpers, constants
// =============================================================================

import type { ReviewStatus } from "../types";

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

export const REVIEW_STATUS_CONFIG: Record<
  ReviewStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    description: string;
  }
> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
    description: "Awaiting moderation",
  },
  APPROVED: {
    label: "Approved",
    variant: "default",
    description: "Visible to public",
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
    description: "Hidden from public view",
  },
  FLAGGED: {
    label: "Flagged",
    variant: "outline",
    description: "Flagged for attention",
  },
};

// ---------------------------------------------------------------------------
// Rating helpers
// ---------------------------------------------------------------------------

/**
 * Get text label for a rating value (1–5)
 */
export function getRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };
  return labels[rating] ?? `${rating} stars`;
}

/**
 * Get CSS color class for a rating value
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4) return "text-yellow-500";
  if (rating >= 3) return "text-amber-500";
  if (rating >= 2) return "text-orange-500";
  return "text-red-500";
}

// ---------------------------------------------------------------------------
// Date formatters
// ---------------------------------------------------------------------------

/**
 * Format ISO date string to locale date (e.g. "16 Feb 2026")
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format ISO date string to locale date + time (e.g. "16 Feb 2026, 3:45 PM")
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format ISO date to relative time (e.g. "2 hours ago", "3 days ago")
 */
export function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateStr);
}

// ---------------------------------------------------------------------------
// Clean filters (remove empty values for query params)
// ---------------------------------------------------------------------------

export function cleanReviewFilters(
  filters: Record<string, unknown>,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === "" || value === undefined || value === null) continue;

    // Backend review query DTO only accepts:
    // targetType, targetId, status, rating, page, pageSize.
    if (key === "vendorId") {
      cleaned.targetType = "vendor";
      cleaned.targetId = value;
      continue;
    }
    if (key === "listingId") {
      cleaned.targetType = "listing";
      cleaned.targetId = value;
      continue;
    }
    if (key === "search" || key === "sortBy" || key === "sortOrder") continue;

    cleaned[key] = value;
  }

  return cleaned;
}
