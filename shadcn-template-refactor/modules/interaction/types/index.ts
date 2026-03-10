// =============================================================================
// Interaction Types — Domain type definitions
// =============================================================================
// Maps to backend Prisma schema + API response contracts.
// Types: LEAD, ENQUIRY, BOOKING
// Status: NEW → CONTACTED → CONFIRMED → CLOSED/INVALID
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (match backend exactly)
// ---------------------------------------------------------------------------

export type InteractionType = "LEAD" | "ENQUIRY" | "BOOKING";

export type InteractionStatus =
  | "NEW"
  | "CONTACTED"
  | "CONFIRMED"
  | "CLOSED"
  | "INVALID";

export type InteractionSortBy =
  | "createdAt"
  | "updatedAt"
  | "status";

export type SortOrder = "asc" | "desc";

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

export interface InteractionMessage {
  id: string;
  interactionId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: "CUSTOMER" | "VENDOR" | "PARTNER_ADMIN" | "SYSTEM";
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Interaction — list item (GET /interactions)
// ---------------------------------------------------------------------------

export interface Interaction {
  id: string;
  partnerId: string;
  vendorId: string;
  listingId: string;
  listingTitle: string;
  type: InteractionType;
  status: InteractionStatus;
  /** Customer name (may be masked) */
  customerName: string;
  /** Customer email (may be masked) */
  customerEmail?: string;
  /** Customer phone (may be masked) */
  customerPhone?: string;
  /** Reference ID for tracking */
  referenceId: string;
  /** Latest message preview */
  lastMessage?: string;
  /** Number of messages */
  messageCount: number;
  /** Whether this interaction is billable */
  isBillable?: boolean;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Interaction Detail — single entity (GET /interactions/:id)
// ---------------------------------------------------------------------------

export interface InteractionDetail extends Interaction {
  vendorName: string;
  /** Full message history */
  messages: InteractionMessage[];
  /** Booking-specific details */
  bookingDetails?: {
    startDate?: string;
    endDate?: string;
    quantity?: number;
    notes?: string;
  };
  /** Internal notes (admin only, not visible to vendors) */
  internalNotes?: string[];
  /** Metadata */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Filter / Query Params
// ---------------------------------------------------------------------------

export interface InteractionFilters {
  page?: number;
  pageSize?: number;
  status?: InteractionStatus | "";
  type?: InteractionType | "";
  search?: string;
  sortBy?: InteractionSortBy;
  sortOrder?: SortOrder;
}

// Default filter values
export const DEFAULT_INTERACTION_FILTERS: InteractionFilters = {
  page: 1,
  pageSize: 20,
  status: "",
  type: "",
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface UpdateInteractionStatusDto {
  status: InteractionStatus;
}

export interface SendMessageDto {
  content: string;
}

/** DTO for creating a new interaction (inquiry from customer/public) */
export interface CreateInteractionDto {
  vendorId: string;
  listingId: string;
  interactionType: InteractionType;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  message: string;
  source?: string;
  referrer?: string;
}

// ---------------------------------------------------------------------------
// Valid status transitions (enforce in UI)
// ---------------------------------------------------------------------------

export const VALID_STATUS_TRANSITIONS: Record<InteractionStatus, InteractionStatus[]> = {
  NEW: ["CONTACTED", "INVALID"],
  CONTACTED: ["CONFIRMED", "CLOSED"],
  CONFIRMED: ["CLOSED"],
  CLOSED: [],
  INVALID: [],
};
