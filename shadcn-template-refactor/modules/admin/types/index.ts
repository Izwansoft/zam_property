// =============================================================================
// Admin Module Types — Type definitions for admin operations
// =============================================================================
// Covers admin listing moderation types used by Platform & Partner admins.
// =============================================================================

import type { Listing, ListingStatus } from "@/modules/listing";

// ---------------------------------------------------------------------------
// Admin Listing (extends base Listing with admin-specific fields)
// ---------------------------------------------------------------------------

/** Partner info embedded in admin listing response */
export interface AdminListingPartner {
  id: string;
  name: string;
  slug?: string;
}

/** Vendor info embedded in admin listing response */
export interface AdminListingVendor {
  id: string;
  name: string;
  slug?: string;
}

/** Admin-enriched listing with partner & vendor info */
export interface AdminListing extends Listing {
  partner?: AdminListingPartner;
  vendor?: AdminListingVendor;
  /** Management type: SELF_MANAGED | AGENT_MANAGED | COMPANY_MANAGED */
  managementType?: string;
  /** Flattened agent name from agentListings[0] */
  agentName?: string | null;
  /** Flattened agent company name from agentListings[0] */
  agentCompanyName?: string | null;
}

// ---------------------------------------------------------------------------
// Admin Listing Filters
// ---------------------------------------------------------------------------

export interface AdminListingFilters {
  page?: number;
  pageSize?: number;
  status?: ListingStatus | "";
  search?: string;
  partnerId?: string;
  vendorId?: string;
  isFeatured?: boolean | "";
  verticalType?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const DEFAULT_ADMIN_LISTING_FILTERS: AdminListingFilters = {
  page: 1,
  pageSize: 20,
  status: "",
  search: "",
  isFeatured: "",
  sortBy: "updatedAt",
  sortOrder: "desc",
};

// ---------------------------------------------------------------------------
// Action DTOs
// ---------------------------------------------------------------------------

/** Variable for admin action mutations — just the listing ID */
export type AdminListingActionVariable = string;

/** Optional reason for unpublish / expire / archive */
export interface AdminListingActionWithReason {
  id: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Admin Action Types
// ---------------------------------------------------------------------------

export type AdminListingAction =
  | "publish"
  | "unpublish"
  | "expire"
  | "archive"
  | "feature"
  | "unfeature";

export const ADMIN_LISTING_ACTIONS: {
  action: AdminListingAction;
  label: string;
  description: string;
  variant: "default" | "destructive" | "outline";
  requiresReason: boolean;
}[] = [
  {
    action: "publish",
    label: "Publish",
    description: "Publish this listing (bypass vendor approval)",
    variant: "default",
    requiresReason: false,
  },
  {
    action: "unpublish",
    label: "Unpublish",
    description: "Unpublish this listing and remove from search",
    variant: "destructive",
    requiresReason: true,
  },
  {
    action: "expire",
    label: "Force Expire",
    description: "Mark this listing as expired immediately",
    variant: "destructive",
    requiresReason: true,
  },
  {
    action: "archive",
    label: "Archive",
    description: "Archive this listing permanently",
    variant: "outline",
    requiresReason: true,
  },
  {
    action: "feature",
    label: "Feature",
    description: "Promote this listing as featured",
    variant: "default",
    requiresReason: false,
  },
  {
    action: "unfeature",
    label: "Unfeature",
    description: "Remove featured status from this listing",
    variant: "outline",
    requiresReason: false,
  },
];

// ---------------------------------------------------------------------------
// Bulk Action Types
// ---------------------------------------------------------------------------

export type BulkAction = "publish" | "unpublish" | "feature" | "unfeature";

export const BULK_ACTIONS: {
  action: BulkAction;
  label: string;
  variant: "default" | "destructive" | "outline";
}[] = [
  { action: "publish", label: "Publish Selected", variant: "default" },
  { action: "unpublish", label: "Unpublish Selected", variant: "destructive" },
  { action: "feature", label: "Feature Selected", variant: "default" },
  { action: "unfeature", label: "Unfeature Selected", variant: "outline" },
];

// ---------------------------------------------------------------------------
// Helper: clean admin filters for API params
// ---------------------------------------------------------------------------

export function cleanAdminFilters(
  filters: AdminListingFilters
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "" && value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}
