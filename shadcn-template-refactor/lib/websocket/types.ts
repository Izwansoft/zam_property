// =============================================================================
// WebSocket Types — Socket.IO client types, events, namespaces
// =============================================================================
// Matches backend Socket.IO namespace structure (Part-22).
// Portal-based namespaces + shared /notifications namespace.
// =============================================================================

import type { Socket } from "socket.io-client";

// ---------------------------------------------------------------------------
// Namespace Constants
// ---------------------------------------------------------------------------

/** Socket.IO namespaces matching backend gateway structure */
export const SOCKET_NAMESPACES = {
  DEFAULT: "/",
  PLATFORM: "/platform",
  PARTNER: "/partner",
  VENDOR: "/vendor",
  NOTIFICATIONS: "/notifications",
} as const;

export type SocketNamespace =
  (typeof SOCKET_NAMESPACES)[keyof typeof SOCKET_NAMESPACES];

// ---------------------------------------------------------------------------
// Portal → Namespace Mapping
// ---------------------------------------------------------------------------

/**
 * Returns the Socket.IO namespace for a given portal.
 * Platform admins → /platform, partner admins → /partner, vendors → /vendor.
 * Customers and unknown portals connect to the default namespace.
 */
export function getNamespaceForPortal(portal: string): SocketNamespace {
  switch (portal) {
    case "platform":
      return SOCKET_NAMESPACES.PLATFORM;
    case "partner":
      return SOCKET_NAMESPACES.PARTNER;
    case "vendor":
      return SOCKET_NAMESPACES.VENDOR;
    default:
      return SOCKET_NAMESPACES.DEFAULT;
  }
}

// ---------------------------------------------------------------------------
// Connection State
// ---------------------------------------------------------------------------

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

export interface SocketState {
  /** Main portal namespace socket */
  socket: Socket | null;
  /** Dedicated notification namespace socket */
  notificationSocket: Socket | null;
  /** Whether main socket is connected */
  isConnected: boolean;
  /** Whether notification socket is connected */
  isNotificationConnected: boolean;
  /** Overall connection status */
  connectionStatus: ConnectionStatus;
  /** Error message if connection failed */
  connectionError: string | null;
  /** Number of reconnection attempts so far */
  reconnectAttempts: number;
}

// ---------------------------------------------------------------------------
// Socket Context Value (exposed via useSocket hook)
// ---------------------------------------------------------------------------

export interface SocketContextValue extends SocketState {
  /** Emit an event on the main portal socket */
  emit: (event: string, data?: unknown) => void;
  /** Join a room on the main portal socket */
  joinRoom: (room: string) => void;
  /** Leave a room on the main portal socket */
  leaveRoom: (room: string) => void;
  /** Disconnect and cleanup all sockets */
  disconnect: () => void;
}

// ---------------------------------------------------------------------------
// Socket.IO Connection Options
// ---------------------------------------------------------------------------

export interface SocketConnectionOptions {
  /** Backend URL (defaults to NEXT_PUBLIC_API_URL or localhost:3000) */
  url?: string;
  /** JWT access token for auth handshake */
  token: string;
  /** Portal type → determines namespace */
  portal: string;
  /** Partner ID for multi-partner scoping */
  partnerId?: string;
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

// ---------------------------------------------------------------------------
// Reconnection Config
// ---------------------------------------------------------------------------

export const RECONNECT_CONFIG = {
  /** Maximum number of reconnection attempts */
  MAX_ATTEMPTS: 5,
  /** Initial delay in ms */
  INITIAL_DELAY: 1000,
  /** Maximum delay in ms */
  MAX_DELAY: 5000,
  /** Delay multiplier for exponential backoff */
  MULTIPLIER: 1.5,
} as const;

// ---------------------------------------------------------------------------
// WebSocket Events (backend event names)
// ---------------------------------------------------------------------------

/** Listing-related events */
export const LISTING_EVENTS = {
  CREATED: "listing:created",
  UPDATED: "listing:updated",
  PUBLISHED: "listing:published",
  UNPUBLISHED: "listing:unpublished",
  DELETED: "listing:deleted",
  VIEWERS: "listing:viewers",
} as const;

/** Interaction-related events */
export const INTERACTION_EVENTS = {
  NEW: "interaction:new",
  UPDATED: "interaction:updated",
  MESSAGE: "interaction:message",
  TYPING: "interaction:typing",
} as const;

/** Vendor-related events */
export const VENDOR_EVENTS = {
  APPROVED: "vendor:approved",
  SUSPENDED: "vendor:suspended",
} as const;

/** Review-related events */
export const REVIEW_EVENTS = {
  CREATED: "review:created",
} as const;

/** Subscription-related events */
export const SUBSCRIPTION_EVENTS = {
  CHANGED: "subscription:changed",
} as const;

/** Contract-related events */
export const CONTRACT_EVENTS = {
  CREATED: "contract:created",
  SIGNED: "contract:signed",
  EXECUTED: "contract:executed",
  VOIDED: "contract:voided",
  EXPIRED: "contract:expired",
} as const;

/** Maintenance-related events */
export const MAINTENANCE_EVENTS = {
  CREATED: "maintenance:created",
  UPDATED: "maintenance:updated",
  STATUS_CHANGED: "maintenance:status_changed",
  COMMENT_ADDED: "maintenance:comment_added",
  ASSIGNED: "maintenance:assigned",
} as const;

/** Tenancy-related events */
export const TENANCY_EVENTS = {
  CREATED: "tenancy:created",
  UPDATED: "tenancy:updated",
  ACTIVATED: "tenancy:activated",
  TERMINATED: "tenancy:terminated",
} as const;

/** Notification events */
export const NOTIFICATION_EVENTS = {
  NEW: "notification:new",
  COUNT: "notification:count",
} as const;

/** Billing events */
export const BILLING_EVENTS = {
  GENERATED: "billing:generated",
  PAID: "billing:paid",
  OVERDUE: "billing:overdue",
} as const;

/** Payment events */
export const PAYMENT_EVENTS = {
  RECEIVED: "payment:received",
  CONFIRMED: "payment:confirmed",
  FAILED: "payment:failed",
} as const;

/** Payout events */
export const PAYOUT_EVENTS = {
  CALCULATED: "payout:calculated",
  APPROVED: "payout:approved",
  PROCESSED: "payout:processed",
} as const;

/** Deposit events */
export const DEPOSIT_EVENTS = {
  COLLECTED: "deposit:collected",
  REFUND_INITIATED: "deposit:refund_initiated",
  REFUNDED: "deposit:refunded",
} as const;

/** Inspection events */
export const INSPECTION_EVENTS = {
  SCHEDULED: "inspection:scheduled",
  COMPLETED: "inspection:completed",
  REPORT_READY: "inspection:report_ready",
} as const;

/** Claim events */
export const CLAIM_EVENTS = {
  SUBMITTED: "claim:submitted",
  APPROVED: "claim:approved",
  REJECTED: "claim:rejected",
} as const;

/** Presence events */
export const PRESENCE_EVENTS = {
  ONLINE: "presence:online",
  OFFLINE: "presence:offline",
} as const;

/** All event constants grouped */
export const SOCKET_EVENTS = {
  LISTING: LISTING_EVENTS,
  INTERACTION: INTERACTION_EVENTS,
  VENDOR: VENDOR_EVENTS,
  REVIEW: REVIEW_EVENTS,
  SUBSCRIPTION: SUBSCRIPTION_EVENTS,
  CONTRACT: CONTRACT_EVENTS,
  MAINTENANCE: MAINTENANCE_EVENTS,
  TENANCY: TENANCY_EVENTS,
  NOTIFICATION: NOTIFICATION_EVENTS,
  BILLING: BILLING_EVENTS,
  PAYMENT: PAYMENT_EVENTS,
  PAYOUT: PAYOUT_EVENTS,
  DEPOSIT: DEPOSIT_EVENTS,
  INSPECTION: INSPECTION_EVENTS,
  CLAIM: CLAIM_EVENTS,
  PRESENCE: PRESENCE_EVENTS,
} as const;

// ---------------------------------------------------------------------------
// Event Payload Types
// ---------------------------------------------------------------------------

export interface ListingEventPayload {
  listingId: string;
}

export interface ListingViewersPayload {
  listingId: string;
  count: number;
}

export interface InteractionEventPayload {
  interactionId: string;
}

export interface InteractionMessagePayload {
  interactionId: string;
  message: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  };
}

export interface InteractionTypingPayload {
  interactionId: string;
  userId: string;
}

export interface VendorEventPayload {
  vendorId: string;
}

export interface ReviewEventPayload {
  reviewId: string;
  vendorId: string;
}

export interface ContractEventPayload {
  contractId: string;
  tenancyId: string;
  status: string;
  signerId?: string;
  signerName?: string;
  allSigned?: boolean;
}

export interface MaintenanceEventPayload {
  maintenanceId: string;
  ticketNumber?: string;
  status?: string;
  previousStatus?: string;
  updatedBy?: string;
  updatedByName?: string;
  commentId?: string;
}

export interface TenancyEventPayload {
  tenancyId: string;
  status: string;
  tenantId?: string;
  ownerId?: string;
}

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationCountPayload {
  unreadCount: number;
}

export interface PresencePayload {
  userId: string;
}

export interface BillingEventPayload {
  billingId: string;
  tenancyId: string;
  amount?: number;
  dueDate?: string;
}

export interface PaymentEventPayload {
  paymentId: string;
  billingId: string;
  amount: number;
  method?: string;
}

export interface PayoutEventPayload {
  payoutId: string;
  ownerId?: string;
  amount?: number;
}

export interface DepositEventPayload {
  depositId: string;
  tenancyId: string;
  amount?: number;
  type?: string;
}

export interface InspectionEventPayload {
  inspectionId: string;
  tenancyId: string;
  type?: string;
  scheduledDate?: string;
}

export interface ClaimEventPayload {
  claimId: string;
  depositId: string;
  amount?: number;
  status?: string;
}
