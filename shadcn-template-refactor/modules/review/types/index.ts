// =============================================================================
// Review Types — Domain type definitions
// =============================================================================
// Maps to backend Prisma schema + API response contracts.
// Status: PENDING → APPROVED / REJECTED / FLAGGED
// Rating: 1–5 (integer, backend-calculated aggregates)
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (match backend exactly)
// ---------------------------------------------------------------------------

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";

export type ReviewSortBy = "createdAt" | "updatedAt" | "rating";

export type SortOrder = "asc" | "desc";

// ---------------------------------------------------------------------------
// Review — list item (GET /reviews)
// ---------------------------------------------------------------------------

export interface Review {
  id: string;
  partnerId: string;
  vendorId: string;
  vendorName: string;
  listingId: string;
  listingTitle: string;
  /** Reviewer name */
  customerName: string;
  customerId: string;
  /** 1–5 integer rating */
  rating: number;
  /** Review title/headline */
  title?: string;
  /** Review body text */
  content: string;
  /** Current moderation status */
  status: ReviewStatus;
  /** Vendor reply (if any) */
  vendorReply?: string;
  /** When vendor replied */
  vendorReplyDate?: string;
  /** Whether vendor has replied */
  hasVendorReply: boolean;
  /** Moderation reason (reject/flag) — visible only to admins */
  moderationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Review Detail — single entity (GET /reviews/:id)
// ---------------------------------------------------------------------------

export interface ReviewDetail extends Review {
  /** Customer email (admin view only) */
  customerEmail?: string;
  /** Customer phone (admin view only) */
  customerPhone?: string;
  /** Interaction reference (masked as needed) */
  interactionId?: string;
  /** Internal moderation notes (admin only, not visible to vendors) */
  internalNotes?: string[];
  /** Review edit history */
  editHistory?: ReviewEditEntry[];
  /** Report reasons from users */
  reportReasons?: string[];
  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface ReviewEditEntry {
  editedAt: string;
  previousContent: string;
  previousRating: number;
}

// ---------------------------------------------------------------------------
// Rating Stats — aggregated rating data (GET /reviews/stats)
// ---------------------------------------------------------------------------

export interface ReviewStats {
  /** Average rating (1.0–5.0, backend-calculated) */
  averageRating: number;
  /** Total number of reviews */
  totalReviews: number;
  /** Distribution by rating value */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  /** Recent trend indicator */
  trend?: "up" | "down" | "stable";
}

// ---------------------------------------------------------------------------
// Filter / Query Params
// ---------------------------------------------------------------------------

export interface ReviewFilters {
  page?: number;
  pageSize?: number;
  status?: ReviewStatus | "";
  /** Min rating (1–5) */
  rating?: number | "";
  search?: string;
  vendorId?: string;
  listingId?: string;
  sortBy?: ReviewSortBy;
  sortOrder?: SortOrder;
}

// Default filter values
export const DEFAULT_REVIEW_FILTERS: ReviewFilters = {
  page: 1,
  pageSize: 20,
  status: "",
  rating: "",
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface ApproveReviewDto {
  /** Optional note for audit trail */
  note?: string;
}

export interface RejectReviewDto {
  /** Required reason for rejection */
  reason: string;
}

export interface FlagReviewDto {
  /** Required reason for flagging */
  reason: string;
}

export interface ReplyToReviewDto {
  /** Vendor reply content */
  content: string;
}
