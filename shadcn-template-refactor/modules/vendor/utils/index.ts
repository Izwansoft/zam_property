// =============================================================================
// Vendor Utilities — Formatters, helpers, constants
// =============================================================================

import type { VendorStatus, VendorType } from "../types";

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

export const VENDOR_STATUS_CONFIG: Record<
  VendorStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  SUSPENDED: { label: "Suspended", variant: "outline" },
};

// ---------------------------------------------------------------------------
// Vendor type labels
// ---------------------------------------------------------------------------

export const VENDOR_TYPE_CONFIG: Record<
  VendorType,
  { label: string; description: string }
> = {
  INDIVIDUAL: { label: "Individual", description: "Independent agent or property owner" },
  COMPANY: { label: "Company", description: "Registered company or agency" },
};

/**
 * Get human-readable label for vendor type
 */
export function getVendorTypeLabel(type: VendorType): string {
  return VENDOR_TYPE_CONFIG[type]?.label ?? type;
}

// ---------------------------------------------------------------------------
// Address formatter
// ---------------------------------------------------------------------------

export function formatVendorAddress(address?: {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): string {
  if (!address) return "—";
  const parts = [address.line1, address.line2, address.city, address.state].filter(
    Boolean
  );
  return parts.length > 0 ? parts.join(", ") : "—";
}

/**
 * Format vendor location for card display (city, state only)
 */
export function formatVendorLocation(address?: {
  city?: string;
  state?: string;
}): string {
  if (!address) return "—";
  const parts = [address.city, address.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

// ---------------------------------------------------------------------------
// Rating display
// ---------------------------------------------------------------------------

/**
 * Format rating for display (e.g., "4.5" or "—")
 */
export function formatRating(rating: number): string {
  if (rating <= 0) return "—";
  return rating.toFixed(1);
}

// ---------------------------------------------------------------------------
// Date formatters (re-use from listing utils pattern)
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
// Filter cleaner
// ---------------------------------------------------------------------------

/**
 * Remove empty/default filter values for API call
 */
export function cleanVendorFilters(
  filters: Record<string, unknown>
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === "" || value === undefined || value === null) continue;

    // Backend vendor query DTO only accepts:
    // page, pageSize, status, vendorType, search, verticalType.
    if (key === "type") {
      cleaned.vendorType = value;
      continue;
    }
    if (key === "sortBy" || key === "sortOrder") continue;

    cleaned[key] = value;
  }
  return cleaned;
}
