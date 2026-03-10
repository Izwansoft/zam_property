// =============================================================================
// Activity Feed Module — Types
// =============================================================================
// Activity feeds wrap audit log entries into a timeline-friendly format.
// The data source is the audit logs endpoint (GET /audit/target/:type/:id)
// and the general audit logs endpoint (GET /audit/logs).
// =============================================================================

import type { AuditLogEntry, AuditActorType } from "@/modules/audit";

// ---------------------------------------------------------------------------
// Activity Item — UI-friendly wrapper around AuditLogEntry
// ---------------------------------------------------------------------------

export interface ActivityItem {
  id: string;
  /** Human-readable description of what happened */
  description: string;
  /** Who performed the action (name or email, masked if needed) */
  actor: string;
  /** Actor type for icon/avatar selection */
  actorType: AuditActorType;
  /** The raw action type from audit log */
  actionType: string;
  /** Broad category for icon/color selection */
  category: ActivityCategory;
  /** Target entity type */
  targetType: string;
  /** Target entity ID */
  targetId: string | null;
  /** ISO timestamp */
  timestamp: string;
  /** Whether this is an internal-only action (hidden from vendors) */
  isInternal: boolean;
  /** Optional metadata for expandable detail */
  metadata: Record<string, unknown> | null;
  /** Old/new values for change tracking */
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Activity Category — for icon/color grouping
// ---------------------------------------------------------------------------

export type ActivityCategory =
  | "auth"
  | "listing"
  | "vendor"
  | "partner"
  | "interaction"
  | "review"
  | "media"
  | "subscription"
  | "admin"
  | "system";

// ---------------------------------------------------------------------------
// Feed Params
// ---------------------------------------------------------------------------

export interface ActivityFeedParams {
  /** Entity-scoped: target type (listing, vendor, partner, etc.) */
  targetType?: string;
  /** Entity-scoped: target entity ID */
  targetId?: string;
  /** General feed: filter by action type */
  actionType?: string;
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Constants — Action type mappings
// ---------------------------------------------------------------------------

/**
 * Map action type prefix to category.
 */
export function getActivityCategory(actionType: string): ActivityCategory {
  const PREFIX_MAP: [string, ActivityCategory][] = [
    ["AUTH_", "auth"],
    ["USER_", "auth"],
    ["LISTING_", "listing"],
    ["MEDIA_", "media"],
    ["VENDOR_", "vendor"],
    ["PARTNER_", "partner"],
    ["INTERACTION_", "interaction"],
    ["REVIEW_", "review"],
    ["SUBSCRIPTION_", "subscription"],
    ["ADMIN_", "admin"],
    ["FEATURE_FLAG_", "admin"],
  ];

  for (const [prefix, category] of PREFIX_MAP) {
    if (actionType.startsWith(prefix)) return category;
  }
  return "system";
}

/**
 * Internal-only action types that should be hidden from vendors.
 */
const INTERNAL_ACTION_TYPES = new Set([
  "ADMIN_ACTION",
  "FEATURE_FLAG_UPDATED",
  "PARTNER_SETTINGS_UPDATED",
  "USER_ROLE_CHANGE",
  "USER_STATUS_CHANGE",
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_CANCELLED",
]);

/**
 * Human-readable descriptions for action types.
 */
const ACTION_DESCRIPTIONS: Record<string, string> = {
  AUTH_LOGIN: "Signed in",
  AUTH_LOGOUT: "Signed out",
  AUTH_FAILED: "Failed login attempt",
  USER_CREATED: "User account created",
  USER_UPDATED: "User profile updated",
  USER_DELETED: "User account deleted",
  USER_STATUS_CHANGE: "User status changed",
  USER_ROLE_CHANGE: "User role changed",
  PARTNER_CREATED: "Partner created",
  PARTNER_UPDATED: "Partner updated",
  PARTNER_SETTINGS_UPDATED: "Partner settings updated",
  VENDOR_CREATED: "Vendor registered",
  VENDOR_APPROVED: "Vendor approved",
  VENDOR_REJECTED: "Vendor rejected",
  VENDOR_SUSPENDED: "Vendor suspended",
  LISTING_CREATED: "Listing created",
  LISTING_UPDATED: "Listing updated",
  LISTING_PUBLISHED: "Listing published",
  LISTING_UNPUBLISHED: "Listing unpublished",
  LISTING_EXPIRED: "Listing expired",
  LISTING_ARCHIVED: "Listing archived",
  LISTING_FEATURED: "Listing featured",
  MEDIA_UPLOADED: "Media uploaded",
  MEDIA_DELETED: "Media deleted",
  INTERACTION_CREATED: "New inquiry received",
  INTERACTION_STATUS_CHANGE: "Inquiry status changed",
  REVIEW_CREATED: "Review submitted",
  REVIEW_APPROVED: "Review approved",
  REVIEW_REJECTED: "Review rejected",
  SUBSCRIPTION_CREATED: "Subscription created",
  SUBSCRIPTION_CANCELLED: "Subscription cancelled",
  ADMIN_ACTION: "Admin action performed",
  FEATURE_FLAG_UPDATED: "Feature flag updated",
};

/**
 * Transform an AuditLogEntry into a UI-friendly ActivityItem.
 */
export function toActivityItem(entry: AuditLogEntry): ActivityItem {
  const category = getActivityCategory(entry.actionType);
  const isInternal = INTERNAL_ACTION_TYPES.has(entry.actionType);
  const description =
    ACTION_DESCRIPTIONS[entry.actionType] ?? formatActionType(entry.actionType);

  return {
    id: entry.id,
    description,
    actor: entry.actorEmail ?? entry.actorId ?? "System",
    actorType: entry.actorType,
    actionType: entry.actionType,
    category,
    targetType: entry.targetType,
    targetId: entry.targetId,
    timestamp: entry.timestamp,
    isInternal,
    metadata: entry.metadata,
    oldValue: entry.oldValue,
    newValue: entry.newValue,
  };
}

/**
 * Fallback formatter for unknown action types.
 */
function formatActionType(actionType: string): string {
  return actionType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Filter out internal activities for vendor portal.
 */
export function filterForVendor(items: ActivityItem[]): ActivityItem[] {
  return items.filter((item) => !item.isInternal);
}
