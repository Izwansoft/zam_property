// =============================================================================
// Partner Types — Partner entity, PartnerMembership, PartnerContext
// =============================================================================
// Defines shapes used by PartnerProvider and partner-scoped queries.
// Matches backend Prisma schema. Do NOT invent fields.
// =============================================================================

// ---------------------------------------------------------------------------
// Partner Status (matches backend prisma PartnerStatus enum)
// ---------------------------------------------------------------------------

export enum PartnerStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DEACTIVATED = "DEACTIVATED",
}

// ---------------------------------------------------------------------------
// Partner entity — as returned by GET /api/v1/admin/partners/:id
// ---------------------------------------------------------------------------

export interface Partner {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: PartnerStatus;
  logo: string | null;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Partner Membership — user's relationship to a partner
// ---------------------------------------------------------------------------

export interface PartnerMembership {
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
  role: string;
  primaryVendorId: string | null;
}

// ---------------------------------------------------------------------------
// Partner Context State
// ---------------------------------------------------------------------------

export type PartnerResolutionStatus =
  | "idle"
  | "resolving"
  | "resolved"
  | "error"
  | "not-required";

export interface PartnerContextState {
  /** Current resolved partner ID */
  partnerId: string | null;
  /** Current partner details (if fetched) */
  partner: Partner | null;
  /** Resolution status */
  status: PartnerResolutionStatus;
  /** Error message if resolution failed */
  error: string | null;
  /** Whether partner context is required for current portal */
  isRequired: boolean;
  /** Whether partner context is resolved and ready */
  isReady: boolean;
}

// ---------------------------------------------------------------------------
// Partner Switcher — for users with multiple partner memberships
// ---------------------------------------------------------------------------

export interface PartnerSwitcherState {
  /** Available partners for switching */
  availablePartners: PartnerMembership[];
  /** Whether switching is allowed in this portal */
  canSwitch: boolean;
}

// =============================================================================
// Partner Management Types (Platform Admin — Session 2.6)
// =============================================================================

// ---------------------------------------------------------------------------
// Sort / Filter enums
// ---------------------------------------------------------------------------

export type PartnerSortBy = "createdAt" | "updatedAt" | "name" | "vendorCount";

export type SortOrder = "asc" | "desc";

export type PartnerPlan = "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

// ---------------------------------------------------------------------------
// Partner Detail — extended entity for admin detail view
// ---------------------------------------------------------------------------

export interface PartnerDetail extends Partner {
  /** Plan / tier */
  plan: PartnerPlan;
  /** Number of vendors under this partner */
  vendorCount: number;
  /** Number of total listings */
  listingCount: number;
  /** Number of active / published listings */
  activeListingCount: number;
  /** Enabled verticals (e.g., ["PROPERTY_SALE", "PROPERTY_RENTAL"]) */
  enabledVerticals: string[];
  /** Admin / owner email */
  adminEmail: string;
  /** Admin / owner name */
  adminName: string;
  /** Subscription details */
  subscription?: PartnerSubscription;
  /** Usage stats */
  usage?: PartnerUsage;
  /** Suspension reason (if suspended) */
  suspensionReason?: string;
  /** Deactivation reason (if deactivated) */
  deactivationReason?: string;
  /** Last activity timestamp */
  lastActivityAt?: string;
  /** Logo URLs (light, dark, icon) */
  logos?: BrandingLogos;
  /** Brand colors */
  colors?: BrandingColors;
  /** Company details */
  company?: CompanyDetails;
}

// ---------------------------------------------------------------------------
// Branding — Logos
// ---------------------------------------------------------------------------

export interface BrandingLogos {
  /** Full logo for light mode */
  light?: string;
  /** Full logo for dark mode */
  dark?: string;
  /** Icon/favicon for light mode (sidebar collapsed) */
  iconLight?: string;
  /** Icon/favicon for dark mode (sidebar collapsed) */
  iconDark?: string;
}

// ---------------------------------------------------------------------------
// Branding — Colors
// ---------------------------------------------------------------------------

export interface BrandingColors {
  primary?: string;
  secondary?: string;
}

// ---------------------------------------------------------------------------
// Company Details
// ---------------------------------------------------------------------------

export interface CompanyAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CompanyDetails {
  legalName?: string;
  registrationNumber?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: CompanyAddress;
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export interface PartnerSubscription {
  plan: PartnerPlan;
  status: "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIALING";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------

export interface PartnerUsage {
  vendorsUsed: number;
  vendorsLimit: number;
  listingsUsed: number;
  listingsLimit: number;
  storageUsedMB: number;
  storageLimitMB: number;
}

// ---------------------------------------------------------------------------
// Filter / Query Params
// ---------------------------------------------------------------------------

export interface PartnerFilters {
  page?: number;
  pageSize?: number;
  status?: PartnerStatus | "";
  plan?: PartnerPlan | "";
  search?: string;
  sortBy?: PartnerSortBy;
  sortOrder?: SortOrder;
}

export const DEFAULT_PARTNER_FILTERS: PartnerFilters = {
  page: 1,
  pageSize: 20,
  status: "",
  plan: "",
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

// ---------------------------------------------------------------------------
// Partner Settings DTO — for PATCH /admin/partners/:id/settings
// ---------------------------------------------------------------------------

export interface PartnerSettingsDto {
  name?: string;
  domain?: string | null;
  logo?: string | null;
  enabledVerticals?: string[];
  settings?: Record<string, unknown>;
  /** Logos (light, dark, icon) */
  logos?: BrandingLogos;
  /** Brand colors */
  colors?: BrandingColors;
  /** Company details */
  company?: CompanyDetails;
}
