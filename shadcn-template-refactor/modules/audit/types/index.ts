// =============================================================================
// Audit Module — Types
// =============================================================================
// Type definitions for audit logs, filters, and display helpers.
// Matches backend API contracts from API-REGISTRY.md Audit Module.
// =============================================================================

// ---------------------------------------------------------------------------
// Actor Types (from backend)
// ---------------------------------------------------------------------------

export type AuditActorType = "USER" | "SYSTEM" | "ADMIN" | "ANONYMOUS";

export const ACTOR_TYPE_LABELS: Record<AuditActorType, string> = {
  USER: "User",
  SYSTEM: "System",
  ADMIN: "Admin",
  ANONYMOUS: "Anonymous",
};

// ---------------------------------------------------------------------------
// Audit Log Entry (matches backend response)
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  partnerId: string;
  actorType: AuditActorType;
  actorId: string | null;
  actorEmail: string | null;
  actionType: string;
  targetType: string;
  targetId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Filter Params (matches backend query params)
// ---------------------------------------------------------------------------

export interface AuditLogFilters {
  actorId?: string;
  actorType?: AuditActorType;
  actionType?: string;
  targetType?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}

export const DEFAULT_AUDIT_FILTERS: AuditLogFilters = {
  page: 1,
  pageSize: 20,
};

// ---------------------------------------------------------------------------
// Pagination (from backend meta)
// ---------------------------------------------------------------------------

export interface AuditPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AuditLogsResponse {
  data: AuditLogEntry[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Action/Target Type Options (from backend endpoints)
// ---------------------------------------------------------------------------

export interface ActionTypesResponse {
  actionTypes: string[];
}

export interface TargetTypesResponse {
  targetTypes: string[];
}

// ---------------------------------------------------------------------------
// Display Helpers
// ---------------------------------------------------------------------------

/** Action type category mapping for badge coloring */
export type ActionCategory =
  | "auth"
  | "user"
  | "partner"
  | "vendor"
  | "listing"
  | "media"
  | "interaction"
  | "review"
  | "subscription"
  | "billing"
  | "admin"
  | "api"
  | "feature"
  | "unknown";

const ACTION_PREFIX_MAP: Record<string, ActionCategory> = {
  AUTH_: "auth",
  USER_: "user",
  PARTNER_: "partner",
  VENDOR_: "vendor",
  LISTING_: "listing",
  MEDIA_: "media",
  INTERACTION_: "interaction",
  MESSAGE_: "interaction",
  REVIEW_: "review",
  SUBSCRIPTION_: "subscription",
  PLAN_: "subscription",
  PAYMENT_: "billing",
  INVOICE_: "billing",
  ADMIN_: "admin",
  BULK_: "admin",
  SYSTEM_: "admin",
  API_: "api",
  API_KEY_: "api",
  FEATURE_: "feature",
  EXPERIMENT_: "feature",
};

/**
 * Determine the category of an action type for badge coloring.
 */
export function getActionCategory(actionType: string): ActionCategory {
  for (const [prefix, category] of Object.entries(ACTION_PREFIX_MAP)) {
    if (actionType.startsWith(prefix)) return category;
  }
  return "unknown";
}

/** Map from category to badge color variant */
export const ACTION_CATEGORY_COLORS: Record<ActionCategory, string> = {
  auth: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  user: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  partner: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  vendor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  listing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  media: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  interaction: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  subscription: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  billing: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  admin: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  api: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
  feature: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  unknown: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

/**
 * Human-friendly label for an action type.
 * Converts LISTING_PUBLISHED → Listing Published
 */
export function formatActionType(actionType: string): string {
  return actionType
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Human-friendly label for a target type.
 * Converts "listing" → "Listing"
 */
export function formatTargetType(targetType: string): string {
  return targetType.charAt(0).toUpperCase() + targetType.slice(1);
}

/**
 * Icon/color mapping for actor types.
 */
export const ACTOR_TYPE_CONFIG: Record<
  AuditActorType,
  { color: string; label: string }
> = {
  USER: { color: "text-blue-500", label: "User" },
  SYSTEM: { color: "text-amber-500", label: "System" },
  ADMIN: { color: "text-red-500", label: "Admin" },
  ANONYMOUS: { color: "text-gray-400", label: "Anonymous" },
};
