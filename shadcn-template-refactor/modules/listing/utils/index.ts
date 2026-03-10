// =============================================================================
// Listing Utilities — Formatters, helpers, constants
// =============================================================================

import type { ListingStatus } from "../types";

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

export const LISTING_STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PUBLISHED: { label: "Published", variant: "default" },
  EXPIRED: { label: "Expired", variant: "destructive" },
  ARCHIVED: { label: "Archived", variant: "outline" },
};

// ---------------------------------------------------------------------------
// Price formatters
// ---------------------------------------------------------------------------

const MYR_FORMATTER = new Intl.NumberFormat("ms-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format price for display (e.g., RM 500,000)
 */
export function formatPrice(price: number, currency: string = "MYR"): string {
  if (currency === "MYR") {
    return MYR_FORMATTER.format(price);
  }
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format price compactly (e.g., RM 500K, RM 1.2M)
 */
export function formatPriceCompact(price: number): string {
  if (price >= 1_000_000) {
    return `RM ${(price / 1_000_000).toFixed(1)}M`;
  }
  if (price >= 1_000) {
    return `RM ${(price / 1_000).toFixed(0)}K`;
  }
  return `RM ${price}`;
}

// ---------------------------------------------------------------------------
// Location formatter
// ---------------------------------------------------------------------------

export function formatLocation(location?: {
  city?: string;
  state?: string;
}): string {
  if (!location) return "—";
  const parts = [location.city, location.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

// ---------------------------------------------------------------------------
// Date formatters
// ---------------------------------------------------------------------------

const DATE_FORMATTER = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

export function formatDate(dateStr: string): string {
  return DATE_FORMATTER.format(new Date(dateStr));
}

export function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = date - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) < 1) {
      return "just now";
    }
    return RELATIVE_FORMATTER.format(diffHours, "hour");
  }
  if (Math.abs(diffDays) < 30) {
    return RELATIVE_FORMATTER.format(diffDays, "day");
  }
  return formatDate(dateStr);
}

// ---------------------------------------------------------------------------
// Vertical type labels
// ---------------------------------------------------------------------------

export function getVerticalLabel(verticalType: string): string {
  const labels: Record<string, string> = {
    REAL_ESTATE: "Real Estate",
    real_estate: "Real Estate",
  };
  return labels[verticalType] || verticalType;
}

// ---------------------------------------------------------------------------
// Filter cleanup — remove empty/default values before sending to API
// ---------------------------------------------------------------------------

export function cleanFilters(
  filters: Record<string, unknown> | object
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === "" || value === undefined || value === null) continue;
    cleaned[key] = value;
  }
  return cleaned;
}
