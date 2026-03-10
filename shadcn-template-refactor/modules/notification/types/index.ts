// =============================================================================
// Notification Module — Types
// =============================================================================
// Matches backend notification entity structure and API responses.
// Role-scoped: users only see notifications relevant to their role.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Notification type — matches backend Prisma NotificationType enum exactly (13 values) */
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

/** Notification channel — matches backend Prisma NotificationChannel enum exactly (5 values) */
export type NotificationChannel =
  | "EMAIL"
  | "IN_APP"
  | "SMS"
  | "PUSH"
  | "WHATSAPP";

/** Notification priority — frontend-only (no backend enum) */
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

// ---------------------------------------------------------------------------
// Notification Entity
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt: string | null;
  /** Optional payload with entity reference */
  data: NotificationData | null;
  createdAt: string;
  updatedAt: string;
}

/** Notification data payload — contextual entity links */
export interface NotificationData {
  /** Entity type the notification refers to */
  entityType?: string;
  /** Entity ID to link to */
  entityId?: string;
  /** Portal-relative URL to navigate to */
  actionUrl?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// API Params / DTOs
// ---------------------------------------------------------------------------

export interface NotificationFilters {
  page: number;
  pageSize: number;
  isRead?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  sortBy: "createdAt";
  sortOrder: "asc" | "desc";
}

export const DEFAULT_NOTIFICATION_FILTERS: NotificationFilters = {
  page: 1,
  pageSize: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
};

// ---------------------------------------------------------------------------
// Unread Count Response
// ---------------------------------------------------------------------------

export interface UnreadCountResponse {
  unreadCount: number;
}

// ---------------------------------------------------------------------------
// Notification Preferences
// ---------------------------------------------------------------------------

export interface NotificationPreference {
  type: NotificationType;
  channels: Record<NotificationChannel, boolean>;
}

export interface NotificationPreferences {
  preferences: NotificationPreference[];
}

// ---------------------------------------------------------------------------
// Type → UI Mapping (icons, colors, labels)
// ---------------------------------------------------------------------------

export interface NotificationTypeConfig {
  label: string;
  icon: string;
  color: string;
  /** Category for grouping in preferences */
  category: NotificationCategory;
}

export type NotificationCategory =
  | "listings"
  | "interactions"
  | "reviews"
  | "subscriptions"
  | "payments"
  | "vendors"
  | "system";

/** Map notification types to UI config — 13 types matching backend */
export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  NotificationTypeConfig
> = {
  LISTING_PUBLISHED: {
    label: "Listing Published",
    icon: "Globe",
    color: "text-green-600",
    category: "listings",
  },
  LISTING_EXPIRED: {
    label: "Listing Expired",
    icon: "Clock",
    color: "text-red-500",
    category: "listings",
  },
  INTERACTION_NEW: {
    label: "New Interaction",
    icon: "MessageSquare",
    color: "text-blue-600",
    category: "interactions",
  },
  INTERACTION_MESSAGE: {
    label: "New Message",
    icon: "Mail",
    color: "text-blue-500",
    category: "interactions",
  },
  REVIEW_SUBMITTED: {
    label: "Review Submitted",
    icon: "Star",
    color: "text-yellow-500",
    category: "reviews",
  },
  REVIEW_APPROVED: {
    label: "Review Approved",
    icon: "CheckCircle",
    color: "text-green-500",
    category: "reviews",
  },
  SUBSCRIPTION_CREATED: {
    label: "Subscription Created",
    icon: "CreditCard",
    color: "text-purple-600",
    category: "subscriptions",
  },
  SUBSCRIPTION_EXPIRING: {
    label: "Subscription Expiring",
    icon: "AlertTriangle",
    color: "text-orange-600",
    category: "subscriptions",
  },
  PAYMENT_SUCCESS: {
    label: "Payment Successful",
    icon: "CheckCircle",
    color: "text-green-600",
    category: "payments",
  },
  PAYMENT_FAILED: {
    label: "Payment Failed",
    icon: "AlertOctagon",
    color: "text-red-600",
    category: "payments",
  },
  VENDOR_APPROVED: {
    label: "Vendor Approved",
    icon: "CheckCircle",
    color: "text-green-600",
    category: "vendors",
  },
  VENDOR_SUSPENDED: {
    label: "Vendor Suspended",
    icon: "Ban",
    color: "text-red-600",
    category: "vendors",
  },
  SYSTEM_ALERT: {
    label: "System Alert",
    icon: "Bell",
    color: "text-red-500",
    category: "system",
  },
};
