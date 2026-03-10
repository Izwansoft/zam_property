// =============================================================================
// Interaction Utilities — Formatters, helpers, constants
// =============================================================================

import type { InteractionStatus, InteractionType } from "../types";

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

export const INTERACTION_STATUS_CONFIG: Record<
  InteractionStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    description: string;
  }
> = {
  NEW: {
    label: "New",
    variant: "default",
    description: "Awaiting initial response",
  },
  CONTACTED: {
    label: "Contacted",
    variant: "secondary",
    description: "Initial contact made",
  },
  CONFIRMED: {
    label: "Confirmed",
    variant: "default",
    description: "Agreement or booking confirmed",
  },
  CLOSED: {
    label: "Closed",
    variant: "outline",
    description: "Interaction completed",
  },
  INVALID: {
    label: "Invalid",
    variant: "destructive",
    description: "Marked as spam or irrelevant",
  },
};

// ---------------------------------------------------------------------------
// Type config
// ---------------------------------------------------------------------------

export const INTERACTION_TYPE_CONFIG: Record<
  InteractionType,
  { label: string; description: string }
> = {
  LEAD: { label: "Lead", description: "A potential buyer/tenant inquiry" },
  ENQUIRY: { label: "Enquiry", description: "A general enquiry about a listing" },
  BOOKING: { label: "Booking", description: "A booking request" },
};

/**
 * Get human-readable label for interaction type
 */
export function getInteractionTypeLabel(type: InteractionType): string {
  return INTERACTION_TYPE_CONFIG[type]?.label ?? type;
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
// Transition label helpers
// ---------------------------------------------------------------------------

export const STATUS_TRANSITION_LABELS: Record<
  InteractionStatus,
  { label: string; description: string }
> = {
  NEW: { label: "Mark as New", description: "Reset to new" },
  CONTACTED: {
    label: "Mark as Contacted",
    description: "You have contacted the customer",
  },
  CONFIRMED: {
    label: "Confirm",
    description: "Agreement or booking confirmed",
  },
  CLOSED: { label: "Close", description: "Close this interaction" },
  INVALID: {
    label: "Mark as Invalid",
    description: "Mark as spam or irrelevant",
  },
};

// ---------------------------------------------------------------------------
// Clean filters (remove empty values for query params)
// ---------------------------------------------------------------------------

export function cleanInteractionFilters(
  filters: Record<string, unknown>,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === "" || value === undefined || value === null) continue;
    cleaned[key] = value;
  }

  return cleaned;
}
