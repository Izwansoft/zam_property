/**
 * Stable error codes per part-15.md.
 * Error codes are immutable once published.
 */

// ---------------------------------------------------------------------------
// General Errors
// ---------------------------------------------------------------------------
export const VALIDATION_ERROR = 'VALIDATION_ERROR';
export const INVALID_REQUEST = 'INVALID_REQUEST';
export const INVALID_QUERY_PARAMS = 'INVALID_QUERY_PARAMS';
export const UNAUTHORIZED = 'UNAUTHORIZED';
export const INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
export const TOKEN_EXPIRED = 'TOKEN_EXPIRED';
export const TOKEN_INVALID = 'TOKEN_INVALID';
export const FORBIDDEN = 'FORBIDDEN';
export const TENANT_ACCESS_DENIED = 'TENANT_ACCESS_DENIED';
export const NOT_FOUND = 'NOT_FOUND';
export const METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED';
export const CONFLICT = 'CONFLICT';
export const GONE = 'GONE';
export const PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE';
export const UNSUPPORTED_MEDIA_TYPE = 'UNSUPPORTED_MEDIA_TYPE';
export const RATE_LIMITED = 'RATE_LIMITED';
export const INTERNAL_ERROR = 'INTERNAL_ERROR';
export const SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE';

// ---------------------------------------------------------------------------
// Authentication & Session Errors (AUTH_*)
// ---------------------------------------------------------------------------
export const AUTH_EMAIL_NOT_FOUND = 'AUTH_EMAIL_NOT_FOUND';
export const AUTH_PASSWORD_INCORRECT = 'AUTH_PASSWORD_INCORRECT';
export const AUTH_ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED';
export const AUTH_ACCOUNT_DISABLED = 'AUTH_ACCOUNT_DISABLED';
export const AUTH_MFA_REQUIRED = 'AUTH_MFA_REQUIRED';
export const AUTH_MFA_INVALID = 'AUTH_MFA_INVALID';
export const AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED';
export const AUTH_REFRESH_TOKEN_INVALID = 'AUTH_REFRESH_TOKEN_INVALID';
export const AUTH_EMAIL_NOT_VERIFIED = 'AUTH_EMAIL_NOT_VERIFIED';

// ---------------------------------------------------------------------------
// Tenant Errors
// ---------------------------------------------------------------------------
export const TENANT_NOT_FOUND = 'TENANT_NOT_FOUND';
export const TENANT_SUSPENDED = 'TENANT_SUSPENDED';
export const TENANT_INACTIVE = 'TENANT_INACTIVE';
export const TENANT_SLUG_TAKEN = 'TENANT_SLUG_TAKEN';
export const TENANT_LIMIT_REACHED = 'TENANT_LIMIT_REACHED';
export const TENANT_VERTICAL_NOT_ENABLED = 'TENANT_VERTICAL_NOT_ENABLED';

// ---------------------------------------------------------------------------
// User Errors
// ---------------------------------------------------------------------------
export const USER_NOT_FOUND = 'USER_NOT_FOUND';
export const USER_EMAIL_TAKEN = 'USER_EMAIL_TAKEN';
export const USER_SUSPENDED = 'USER_SUSPENDED';
export const USER_DEACTIVATED = 'USER_DEACTIVATED';

// ---------------------------------------------------------------------------
// Vendor Errors
// ---------------------------------------------------------------------------
export const VENDOR_NOT_FOUND = 'VENDOR_NOT_FOUND';
export const VENDOR_SUSPENDED = 'VENDOR_SUSPENDED';
export const VENDOR_PENDING_APPROVAL = 'VENDOR_PENDING_APPROVAL';
export const VENDOR_REJECTED = 'VENDOR_REJECTED';
export const VENDOR_SLUG_TAKEN = 'VENDOR_SLUG_TAKEN';
export const VENDOR_ALREADY_EXISTS = 'VENDOR_ALREADY_EXISTS';

// ---------------------------------------------------------------------------
// Listing Errors
// ---------------------------------------------------------------------------
export const LISTING_NOT_FOUND = 'LISTING_NOT_FOUND';
export const LISTING_ARCHIVED = 'LISTING_ARCHIVED';
export const LISTING_INVALID_STATE = 'LISTING_INVALID_STATE';
export const LISTING_CANNOT_PUBLISH = 'LISTING_CANNOT_PUBLISH';
export const LISTING_ALREADY_PUBLISHED = 'LISTING_ALREADY_PUBLISHED';
export const LISTING_NOT_PUBLISHED = 'LISTING_NOT_PUBLISHED';
export const LISTING_SLUG_TAKEN = 'LISTING_SLUG_TAKEN';
export const LISTING_VERTICAL_MISMATCH = 'LISTING_VERTICAL_MISMATCH';
export const LISTING_ATTRIBUTE_INVALID = 'LISTING_ATTRIBUTE_INVALID';
export const LISTING_ATTRIBUTE_REQUIRED = 'LISTING_ATTRIBUTE_REQUIRED';
export const LISTING_PRICE_INVALID = 'LISTING_PRICE_INVALID';
export const LISTING_LOCATION_INVALID = 'LISTING_LOCATION_INVALID';

// ---------------------------------------------------------------------------
// Media Errors
// ---------------------------------------------------------------------------
export const MEDIA_NOT_FOUND = 'MEDIA_NOT_FOUND';
export const MEDIA_UPLOAD_FAILED = 'MEDIA_UPLOAD_FAILED';
export const MEDIA_TYPE_NOT_ALLOWED = 'MEDIA_TYPE_NOT_ALLOWED';
export const MEDIA_SIZE_EXCEEDED = 'MEDIA_SIZE_EXCEEDED';
export const MEDIA_QUOTA_EXCEEDED = 'MEDIA_QUOTA_EXCEEDED';
export const MEDIA_PROCESSING_FAILED = 'MEDIA_PROCESSING_FAILED';
export const MEDIA_NOT_READY = 'MEDIA_NOT_READY';
export const MEDIA_PRESIGN_FAILED = 'MEDIA_PRESIGN_FAILED';

// ---------------------------------------------------------------------------
// Interaction Errors
// ---------------------------------------------------------------------------
export const INTERACTION_NOT_FOUND = 'INTERACTION_NOT_FOUND';
export const INTERACTION_ALREADY_RESPONDED = 'INTERACTION_ALREADY_RESPONDED';
export const INTERACTION_INVALID_STATE = 'INTERACTION_INVALID_STATE';
export const INTERACTION_LISTING_UNAVAILABLE = 'INTERACTION_LISTING_UNAVAILABLE';
export const BOOKING_SLOT_UNAVAILABLE = 'BOOKING_SLOT_UNAVAILABLE';
export const BOOKING_ALREADY_CONFIRMED = 'BOOKING_ALREADY_CONFIRMED';
export const BOOKING_ALREADY_CANCELLED = 'BOOKING_ALREADY_CANCELLED';

// ---------------------------------------------------------------------------
// Review Errors
// ---------------------------------------------------------------------------
export const REVIEW_NOT_FOUND = 'REVIEW_NOT_FOUND';
export const REVIEW_ALREADY_EXISTS = 'REVIEW_ALREADY_EXISTS';
export const REVIEW_CANNOT_REVIEW_SELF = 'REVIEW_CANNOT_REVIEW_SELF';
export const REVIEW_TARGET_NOT_FOUND = 'REVIEW_TARGET_NOT_FOUND';
export const REVIEW_NOT_ELIGIBLE = 'REVIEW_NOT_ELIGIBLE';
export const REVIEW_MODERATION_PENDING = 'REVIEW_MODERATION_PENDING';
export const REVIEW_ALREADY_MODERATED = 'REVIEW_ALREADY_MODERATED';

// ---------------------------------------------------------------------------
// Subscription & Entitlement Errors
// ---------------------------------------------------------------------------
export const SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND';
export const SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED';
export const SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED';
export const PLAN_NOT_FOUND = 'PLAN_NOT_FOUND';
export const PLAN_NOT_AVAILABLE = 'PLAN_NOT_AVAILABLE';
export const PLAN_DOWNGRADE_NOT_ALLOWED = 'PLAN_DOWNGRADE_NOT_ALLOWED';
export const ENTITLEMENT_DENIED = 'ENTITLEMENT_DENIED';
export const ENTITLEMENT_LIMIT_REACHED = 'ENTITLEMENT_LIMIT_REACHED';
export const ENTITLEMENT_FEATURE_DISABLED = 'ENTITLEMENT_FEATURE_DISABLED';
export const USAGE_QUOTA_EXCEEDED = 'USAGE_QUOTA_EXCEEDED';

// ---------------------------------------------------------------------------
// Billing Errors
// ---------------------------------------------------------------------------
export const PAYMENT_FAILED = 'PAYMENT_FAILED';
export const PAYMENT_METHOD_INVALID = 'PAYMENT_METHOD_INVALID';
export const PAYMENT_METHOD_EXPIRED = 'PAYMENT_METHOD_EXPIRED';
export const PAYMENT_METHOD_DECLINED = 'PAYMENT_METHOD_DECLINED';
export const INVOICE_NOT_FOUND = 'INVOICE_NOT_FOUND';
export const INVOICE_ALREADY_PAID = 'INVOICE_ALREADY_PAID';
export const BILLING_INFO_REQUIRED = 'BILLING_INFO_REQUIRED';

// ---------------------------------------------------------------------------
// Search Errors
// ---------------------------------------------------------------------------
export const SEARCH_QUERY_INVALID = 'SEARCH_QUERY_INVALID';
export const SEARCH_FILTER_INVALID = 'SEARCH_FILTER_INVALID';
export const SEARCH_UNAVAILABLE = 'SEARCH_UNAVAILABLE';
export const SEARCH_TIMEOUT = 'SEARCH_TIMEOUT';
export const GEO_SEARCH_INVALID = 'GEO_SEARCH_INVALID';

// ---------------------------------------------------------------------------
// Vertical & Schema Errors
// ---------------------------------------------------------------------------
export const VERTICAL_NOT_FOUND = 'VERTICAL_NOT_FOUND';
export const VERTICAL_NOT_ENABLED = 'VERTICAL_NOT_ENABLED';
export const VERTICAL_SCHEMA_INVALID = 'VERTICAL_SCHEMA_INVALID';
export const VERTICAL_ATTRIBUTE_UNKNOWN = 'VERTICAL_ATTRIBUTE_UNKNOWN';

// ---------------------------------------------------------------------------
// Rate Limit Errors
// ---------------------------------------------------------------------------
export const RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED';
export const RATE_LIMIT_API = 'RATE_LIMIT_API';
export const RATE_LIMIT_LOGIN = 'RATE_LIMIT_LOGIN';
export const RATE_LIMIT_UPLOAD = 'RATE_LIMIT_UPLOAD';

// ---------------------------------------------------------------------------
// Validation Detail Codes (field-level)
// ---------------------------------------------------------------------------
export const VAL_REQUIRED = 'REQUIRED';
export const VAL_INVALID_FORMAT = 'INVALID_FORMAT';
export const VAL_INVALID_TYPE = 'INVALID_TYPE';
export const VAL_TOO_SHORT = 'TOO_SHORT';
export const VAL_TOO_LONG = 'TOO_LONG';
export const VAL_TOO_SMALL = 'TOO_SMALL';
export const VAL_TOO_LARGE = 'TOO_LARGE';
export const VAL_INVALID_ENUM = 'INVALID_ENUM';
export const VAL_INVALID_PATTERN = 'INVALID_PATTERN';
export const VAL_DUPLICATE = 'DUPLICATE';
export const VAL_INVALID_REFERENCE = 'INVALID_REFERENCE';
