// =============================================================================
// Backend Contracts — Single Source of Truth
// =============================================================================
// All types here mirror the Backend Prisma schema EXACTLY.
// DO NOT invent roles, statuses, or permissions.
// If the backend Prisma schema changes, update THIS file first.
//
// Backend source: backend/prisma/schema.prisma
// Backend API docs: backend/docs/API-REGISTRY.md
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// §1  ROLES (Prisma enum: Role)
// ─────────────────────────────────────────────────────────────────────────────

export type BackendRole =
  | "SUPER_ADMIN"
  | "PARTNER_ADMIN"
  | "VENDOR_ADMIN"
  | "VENDOR_STAFF"
  | "CUSTOMER"
  | "GUEST"
  | "TENANT"
  | "COMPANY_ADMIN"
  | "AGENT";

export const BACKEND_ROLES: BackendRole[] = [
  "SUPER_ADMIN",
  "PARTNER_ADMIN",
  "VENDOR_ADMIN",
  "VENDOR_STAFF",
  "CUSTOMER",
  "GUEST",
  "TENANT",
  "COMPANY_ADMIN",
  "AGENT",
];

export const ROLE_HIERARCHY: Record<BackendRole, number> = {
  SUPER_ADMIN: 100,
  PARTNER_ADMIN: 60,
  VENDOR_ADMIN: 40,
  VENDOR_STAFF: 20,
  CUSTOMER: 10,
  GUEST: 0,
  TENANT: 10,
  COMPANY_ADMIN: 50,
  AGENT: 30,
};

export function hasMinimumRole(userRole: BackendRole, requiredRole: BackendRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ─────────────────────────────────────────────────────────────────────────────
// §2  STATUS ENUMS (match Prisma enums exactly)
// ─────────────────────────────────────────────────────────────────────────────

/** Prisma enum: PartnerStatus (SaaS organization status) */
export type PartnerStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export const PARTNER_STATUSES: PartnerStatus[] = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];

/** Prisma enum: TenantStatus (property tenant/renter status) */
export type TenantStatus = "PENDING" | "SCREENING" | "APPROVED" | "REJECTED" | "ACTIVE" | "NOTICE_GIVEN" | "VACATED";
export const TENANT_STATUSES: TenantStatus[] = ["PENDING", "SCREENING", "APPROVED", "REJECTED", "ACTIVE", "NOTICE_GIVEN", "VACATED"];

/** Prisma enum: UserStatus */
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export const USER_STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];

/** Prisma enum: VendorStatus */
export type VendorStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export const VENDOR_STATUSES: VendorStatus[] = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

/** Prisma enum: VendorType */
export type VendorType = "INDIVIDUAL" | "COMPANY";
export const VENDOR_TYPES: VendorType[] = ["INDIVIDUAL", "COMPANY"];

/** Prisma enum: ListingStatus */
export type ListingStatus = "DRAFT" | "PUBLISHED" | "EXPIRED" | "ARCHIVED";
export const LISTING_STATUSES: ListingStatus[] = ["DRAFT", "PUBLISHED", "EXPIRED", "ARCHIVED"];

/** Prisma enum: InteractionStatus */
export type InteractionStatus = "NEW" | "CONTACTED" | "CONFIRMED" | "CLOSED" | "INVALID";
export const INTERACTION_STATUSES: InteractionStatus[] = ["NEW", "CONTACTED", "CONFIRMED", "CLOSED", "INVALID"];

/** Prisma enum: InteractionType */
export type InteractionType = "LEAD" | "ENQUIRY" | "BOOKING";
export const INTERACTION_TYPES: InteractionType[] = ["LEAD", "ENQUIRY", "BOOKING"];

/** Prisma enum: ReviewStatus */
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
export const REVIEW_STATUSES: ReviewStatus[] = ["PENDING", "APPROVED", "REJECTED", "FLAGGED"];

/** Prisma enum: SubscriptionStatus */
export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED";
export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ["ACTIVE", "PAST_DUE", "PAUSED", "CANCELLED"];

/** Prisma enum: InvoiceStatus */
export type InvoiceStatus = "DRAFT" | "OPEN" | "PAID" | "VOID" | "UNCOLLECTIBLE";
export const INVOICE_STATUSES: InvoiceStatus[] = ["DRAFT", "OPEN", "PAID", "VOID", "UNCOLLECTIBLE"];

/** Prisma enum: PaymentStatus */
export type PaymentStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELED";
export const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "CANCELED"];

/** Prisma enum: PropertyRole — Property-level access control */
export type PropertyRole =
  | "PROPERTY_ADMIN"
  | "PROPERTY_MANAGER"
  | "LEASING_MANAGER"
  | "MAINTENANCE_STAFF"
  | "PROPERTY_STAFF";
export const PROPERTY_ROLES: PropertyRole[] = [
  "PROPERTY_ADMIN",
  "PROPERTY_MANAGER",
  "LEASING_MANAGER",
  "MAINTENANCE_STAFF",
  "PROPERTY_STAFF",
];

/** PropertyRole hierarchy (higher = more access) */
export const PROPERTY_ROLE_HIERARCHY: Record<PropertyRole, number> = {
  PROPERTY_ADMIN: 50,
  PROPERTY_MANAGER: 40,
  LEASING_MANAGER: 30,
  MAINTENANCE_STAFF: 20,
  PROPERTY_STAFF: 10,
};

// ─────────────────────────────────────────────────────────────────────────────
// §3  NOTIFICATION ENUMS (match Prisma enums exactly)
// ─────────────────────────────────────────────────────────────────────────────

/** Prisma enum: NotificationType — 13 values */
export type NotificationType =
  | "LISTING_PUBLISHED"
  | "LISTING_EXPIRED"
  | "INTERACTION_NEW"
  | "INTERACTION_MESSAGE"
  | "REVIEW_SUBMITTED"
  | "REVIEW_APPROVED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_EXPIRING"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "VENDOR_APPROVED"
  | "VENDOR_SUSPENDED"
  | "SYSTEM_ALERT";

export const NOTIFICATION_TYPES: NotificationType[] = [
  "LISTING_PUBLISHED",
  "LISTING_EXPIRED",
  "INTERACTION_NEW",
  "INTERACTION_MESSAGE",
  "REVIEW_SUBMITTED",
  "REVIEW_APPROVED",
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_EXPIRING",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "VENDOR_APPROVED",
  "VENDOR_SUSPENDED",
  "SYSTEM_ALERT",
];

/** Prisma enum: NotificationChannel — 5 values */
export type NotificationChannel = "EMAIL" | "IN_APP" | "SMS" | "PUSH" | "WHATSAPP";
export const NOTIFICATION_CHANNELS: NotificationChannel[] = ["EMAIL", "IN_APP", "SMS", "PUSH", "WHATSAPP"];

/** Prisma enum: NotificationStatus */
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "READ";
export const NOTIFICATION_STATUSES: NotificationStatus[] = ["PENDING", "SENT", "FAILED", "READ"];

// ─────────────────────────────────────────────────────────────────────────────
// §4  MEDIA ENUMS (match Prisma enums exactly)
// ─────────────────────────────────────────────────────────────────────────────

/** Prisma enum: MediaType */
export type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT";
export const MEDIA_TYPES: MediaType[] = ["IMAGE", "VIDEO", "DOCUMENT"];

/** Prisma enum: MediaVisibility */
export type MediaVisibility = "PUBLIC" | "PRIVATE";
export const MEDIA_VISIBILITIES: MediaVisibility[] = ["PUBLIC", "PRIVATE"];

/** Prisma enum: ProcessingStatus */
export type ProcessingStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export const PROCESSING_STATUSES: ProcessingStatus[] = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];

// ─────────────────────────────────────────────────────────────────────────────
// §5  PRICING ENUMS (match Prisma enums exactly)
// ─────────────────────────────────────────────────────────────────────────────

/** Prisma enum: ChargeType — 7 values */
export type ChargeType =
  | "SUBSCRIPTION"
  | "LEAD"
  | "INTERACTION"
  | "COMMISSION"
  | "LISTING"
  | "ADDON"
  | "OVERAGE";

export const CHARGE_TYPES: ChargeType[] = [
  "SUBSCRIPTION",
  "LEAD",
  "INTERACTION",
  "COMMISSION",
  "LISTING",
  "ADDON",
  "OVERAGE",
];

/** Prisma enum: PricingModel — 5 values */
export type PricingModel = "SAAS" | "LEAD_BASED" | "COMMISSION" | "LISTING_BASED" | "HYBRID";
export const PRICING_MODELS: PricingModel[] = ["SAAS", "LEAD_BASED", "COMMISSION", "LISTING_BASED", "HYBRID"];

// ─────────────────────────────────────────────────────────────────────────────
// §6  FEATURE FLAGS & AUDIT ENUMS (match Prisma enums exactly)
// ─────────────────────────────────────────────────────────────────────────────

/** Prisma enum: FeatureFlagType */
export type FeatureFlagType = "BOOLEAN" | "PERCENTAGE";
export const FEATURE_FLAG_TYPES: FeatureFlagType[] = ["BOOLEAN", "PERCENTAGE"];

/** Prisma enum: AuditActorType */
export type AuditActorType = "USER" | "SYSTEM" | "ADMIN" | "ANONYMOUS";
export const AUDIT_ACTOR_TYPES: AuditActorType[] = ["USER", "SYSTEM", "ADMIN", "ANONYMOUS"];

// ─────────────────────────────────────────────────────────────────────────────
// §7  API RESPONSE CONTRACTS (4 backend formats)
// ─────────────────────────────────────────────────────────────────────────────

/** Format A — Standard Paginated (listings, vendors, users, interactions, reviews, subscriptions, plans) */
export interface PaginatedResponseA<T> {
  data: {
    items: T[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
  meta: {
    requestId: string;
  };
}

/** Format B — Meta Pagination (search, notifications, audit) */
export interface PaginatedResponseB<T> {
  data: T[];
  meta: {
    requestId: string;
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number; // Note: "totalItems" not "total"
      totalPages: number;
    };
    facets?: Record<string, unknown>; // Search only
  };
}

/** Format C — Public Search (OpenSearch) */
export interface PublicSearchResponse<T> {
  data: {
    hits: T[]; // Note: "hits" not "items"
    total: number;
    aggregations: Record<string, unknown>;
  };
}

/** Format D — Admin Jobs (Non-standard) */
export interface AdminJobsResponse<T = unknown> {
  jobs: T[]; // Note: NO "data" wrapper
  total: number;
}

/** Single entity response — all GET /:id endpoints */
export interface ApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
  };
}

/** Normalized paginated result — common shape after normalization */
export interface NormalizedPaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §8  ERROR RESPONSE CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      code: string;
      message: string;
      constraints?: Record<string, unknown>;
    }>;
    metadata?: Record<string, unknown>;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §9  PAGINATION PARAMS CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;     // 1-based (backend expects 1-indexed)
  pageSize?: number; // Default: 20, Max: 100
  sort?: string;     // Format: "field:asc" or "field:desc"
}

export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 20,
  maxPageSize: 100,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// §10  AUDIT LOG ENTITY
// ─────────────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  partnerId: string | null;
  actorType: AuditActorType;
  actorId: string | null;
  actorEmail: string | null;
  actionType: string;       // e.g., "listing.published" (max 100 chars)
  targetType: string;       // e.g., "listing" (max 100 chars)
  targetId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null; // IPv4/IPv6 (max 45 chars)
  userAgent: string | null;
  requestId: string | null;
  timestamp: string;        // ISO 8601
}

// ─────────────────────────────────────────────────────────────────────────────
// §11  MEDIA UPLOAD CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

export interface PresignedUrlRequest {
  filename: string;
  mimeType: string;
  size: number;
  ownerType: "listing" | "vendor" | "user";
  ownerId: string;
  visibility?: MediaVisibility;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  storageKey: string;
  expiresAt: string;
  mediaId: string;
}

export interface ConfirmUploadRequest {
  storageKey: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// §12  FILTER SERIALIZATION CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

export interface FilterValue {
  eq?: string | number | boolean;
  ne?: string | number;
  gte?: number;
  lte?: number;
  gt?: number;
  lt?: number;
  in?: (string | number)[];
  contains?: string;
  isNull?: boolean;
}

export interface FilterParams {
  [field: string]: FilterValue | FilterParams;
}

export function serializeFilters(filters: FilterParams): string {
  return encodeURIComponent(JSON.stringify(filters));
}

// ─────────────────────────────────────────────────────────────────────────────
// §13  FRONTEND-SPECIFIC EXTENSIONS (documented)
// ─────────────────────────────────────────────────────────────────────────────
// The following types are FRONTEND-ONLY and do NOT exist in the backend schema.
// They are used for UI state management and are clearly separated from
// backend-aligned types above.
//
// | Frontend Type        | Purpose                              | Backend equivalent       |
// |----------------------|--------------------------------------|--------------------------|
// | MediaStatus          | Upload progress tracking             | ProcessingStatus + Bool  |
// | ChargeEventStatus    | Frontend display abstraction         | processed: Boolean       |
// | UsageWarningLevel    | UI gauge thresholds                  | Computed client-side     |
// | NotificationPriority | UI display weight                    | No backend field         |
// | NotificationCategory | UI grouping for preferences grid     | No backend field         |
// | AuthStatus           | Client auth state machine            | No backend field         |
// | Portal               | Route-derived portal identifier      | No backend field         |
// | ConnectionStatus     | WebSocket connection state           | No backend field         |
// | MetricTrend          | Dashboard metric direction indicator | No backend field         |
// | DateRangePreset      | Analytics date picker preset         | No backend field         |
// | SearchSort           | Search result ordering               | Maps to `sort` param    |
// | PriceType            | Listing price display mode           | String field (no enum)   |
// | VerticalType         | Currently only "REAL_ESTATE"         | String field (no enum)   |
// ─────────────────────────────────────────────────────────────────────────────
