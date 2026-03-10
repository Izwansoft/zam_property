// =============================================================================
// Vendor Types — Domain type definitions
// =============================================================================
// Maps to backend Prisma schema + API response contracts.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (match backend exactly)
// ---------------------------------------------------------------------------

export type VendorStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export type VendorType = "INDIVIDUAL" | "COMPANY";

export type VendorSortBy = "createdAt" | "updatedAt" | "name" | "listingCount";

export type SortOrder = "asc" | "desc";

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

export interface VendorAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// ---------------------------------------------------------------------------
// Vendor — list item (GET /vendors)
// ---------------------------------------------------------------------------

export interface Vendor {
  id: string;
  partnerId: string;
  name: string;
  slug: string;
  type: VendorType;
  verticalType: string | null;
  email: string;
  phone?: string;
  status: VendorStatus;
  description?: string;
  logo?: string | null;
  address?: VendorAddress;
  registrationNumber?: string;
  listingCount: number;
  activeListingCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Vendor Detail — single entity (GET /vendors/:id)
// ---------------------------------------------------------------------------

export interface VendorDetail extends Vendor {
  /** Additional detail fields from backend */
  verificationNotes?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  lastActivityAt?: string;
  totalInteractions?: number;
  totalRevenue?: number;
}

// ---------------------------------------------------------------------------
// Filter / Query Params
// ---------------------------------------------------------------------------

export interface VendorFilters {
  page?: number;
  pageSize?: number;
  status?: VendorStatus | "";
  type?: VendorType | "";
  verticalType?: string;
  search?: string;
  sortBy?: VendorSortBy;
  sortOrder?: SortOrder;
}

// Default filter values
export const DEFAULT_VENDOR_FILTERS: VendorFilters = {
  page: 1,
  pageSize: 20,
  status: "",
  type: "",
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};
