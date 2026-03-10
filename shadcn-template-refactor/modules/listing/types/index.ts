// =============================================================================
// Listing Types — Domain type definitions
// =============================================================================
// Maps to backend Prisma schema + API response contracts.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (match backend exactly)
// ---------------------------------------------------------------------------

export type ListingStatus = "DRAFT" | "PUBLISHED" | "EXPIRED" | "ARCHIVED";

export type VerticalType = "REAL_ESTATE"; // extensible as more verticals are added

export type PriceType = "FIXED" | "NEGOTIABLE" | "STARTING_FROM" | "UPON_REQUEST";

export type SortBy = "createdAt" | "updatedAt" | "price" | "title";

export type SortOrder = "asc" | "desc";

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

export interface ListingLocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

// ---------------------------------------------------------------------------
// Media (embedded in listing detail)
// ---------------------------------------------------------------------------

export interface ListingMedia {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  mediaType: "IMAGE" | "VIDEO" | "DOCUMENT";
  cdnUrl: string;
  thumbnailUrl?: string;
  sortOrder: number;
  isPrimary: boolean;
  altText?: string;
}

// ---------------------------------------------------------------------------
// Vendor (embedded in listing detail)
// ---------------------------------------------------------------------------

export interface ListingVendor {
  id: string;
  name: string;
  slug: string;
}

export interface ListingAgent {
  id: string;
  agent: {
    id: string;
    user: { id: string; fullName: string };
    company: { id: string; name: string } | null;
  };
}

// ---------------------------------------------------------------------------
// Listing — list item (GET /listings)
// ---------------------------------------------------------------------------

export interface Listing {
  id: string;
  partnerId: string;
  vendorId: string;
  verticalType: string;
  schemaVersion: string;
  title: string;
  description?: string;
  slug: string;
  price: number;
  currency: string;
  priceType?: PriceType;
  location: ListingLocation;
  attributes: Record<string, unknown>;
  status: ListingStatus;
  publishedAt?: string | null;
  expiresAt?: string | null;
  isFeatured: boolean;
  featuredUntil?: string | null;
  primaryImage?: string | null;
  viewCount: number;
  inquiryCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Listing Detail — single entity (GET /listings/:id)
// ---------------------------------------------------------------------------

export interface ListingDetail extends Listing {
  vendor?: ListingVendor;
  agentListings?: ListingAgent[];
  media?: ListingMedia[];
}

// ---------------------------------------------------------------------------
// Filter / Query Params
// ---------------------------------------------------------------------------

export interface ListingFilters {
  page?: number;
  pageSize?: number;
  status?: ListingStatus | "";
  verticalType?: string;
  search?: string;
  vendorId?: string;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

// Default filter values
export const DEFAULT_LISTING_FILTERS: ListingFilters = {
  page: 1,
  pageSize: 20,
  status: "",
  search: "",
  sortBy: "updatedAt",
  sortOrder: "desc",
};
