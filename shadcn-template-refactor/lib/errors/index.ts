// =============================================================================
// Error Normalization — AppError type, error mapping, toast helpers
// =============================================================================
// Normalizes backend error responses into a consistent UI shape.
// All API calls should produce either data OR an AppError.
// =============================================================================

import { AxiosError } from "axios";

// ---------------------------------------------------------------------------
// Error Code Type (matches Backend Part 23 §23.3)
// ---------------------------------------------------------------------------

export type ErrorCode =
  // General
  | "VALIDATION_ERROR"
  | "INVALID_REQUEST"
  | "INVALID_QUERY_PARAMS"
  | "UNAUTHORIZED"
  | "INVALID_CREDENTIALS"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "FORBIDDEN"
  | "PARTNER_ACCESS_DENIED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "GONE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE"
  // Auth
  | "AUTH_EMAIL_NOT_FOUND"
  | "AUTH_PASSWORD_INCORRECT"
  | "AUTH_ACCOUNT_LOCKED"
  | "AUTH_ACCOUNT_DISABLED"
  | "AUTH_MFA_REQUIRED"
  | "AUTH_MFA_INVALID"
  | "AUTH_SESSION_EXPIRED"
  | "AUTH_EMAIL_NOT_VERIFIED"
  // Partner
  | "PARTNER_NOT_FOUND"
  | "PARTNER_SUSPENDED"
  | "PARTNER_DEACTIVATED"
  | "PARTNER_SLUG_TAKEN"
  | "PARTNER_VERTICAL_NOT_ENABLED"
  // Vendor
  | "VENDOR_NOT_FOUND"
  | "VENDOR_SUSPENDED"
  | "VENDOR_PENDING_APPROVAL"
  | "VENDOR_REJECTED"
  | "VENDOR_SLUG_TAKEN"
  | "VENDOR_ALREADY_EXISTS"
  // Listing
  | "LISTING_NOT_FOUND"
  | "LISTING_ARCHIVED"
  | "LISTING_INVALID_STATE"
  | "LISTING_CANNOT_PUBLISH"
  | "LISTING_ALREADY_PUBLISHED"
  | "LISTING_SLUG_TAKEN"
  | "LISTING_VERTICAL_MISMATCH"
  | "LISTING_ATTRIBUTE_INVALID"
  | "LISTING_ATTRIBUTE_REQUIRED"
  // Media
  | "MEDIA_NOT_FOUND"
  | "MEDIA_UPLOAD_FAILED"
  | "MEDIA_TYPE_NOT_ALLOWED"
  | "MEDIA_SIZE_EXCEEDED"
  | "MEDIA_QUOTA_EXCEEDED"
  | "MEDIA_PROCESSING_FAILED"
  // Interaction
  | "INTERACTION_NOT_FOUND"
  | "INTERACTION_ALREADY_RESPONDED"
  | "INTERACTION_INVALID_STATE"
  | "BOOKING_SLOT_UNAVAILABLE"
  // Review
  | "REVIEW_NOT_FOUND"
  | "REVIEW_ALREADY_EXISTS"
  | "REVIEW_CANNOT_REVIEW_SELF"
  | "REVIEW_NOT_ELIGIBLE"
  // Subscription & Entitlement
  | "SUBSCRIPTION_NOT_FOUND"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_CANCELLED"
  | "PLAN_NOT_FOUND"
  | "PLAN_NOT_AVAILABLE"
  | "ENTITLEMENT_DENIED"
  | "ENTITLEMENT_LIMIT_REACHED"
  | "USAGE_QUOTA_EXCEEDED"
  // Billing
  | "PAYMENT_FAILED"
  | "PAYMENT_METHOD_INVALID"
  | "PAYMENT_METHOD_DECLINED"
  | "INVOICE_NOT_FOUND"
  // Rate Limit
  | "RATE_LIMIT_EXCEEDED"
  | "RATE_LIMIT_API"
  | "RATE_LIMIT_LOGIN";

// ---------------------------------------------------------------------------
// Error Kind — categorizes errors for UI handling
// ---------------------------------------------------------------------------

export type ErrorKind =
  | "auth"
  | "forbidden"
  | "validation"
  | "not_found"
  | "rate_limit"
  | "server"
  | "network"
  | "unknown";

// ---------------------------------------------------------------------------
// Field Error — for form field-level validation
// ---------------------------------------------------------------------------

export interface FieldError {
  field: string;
  code: string;
  message: string;
  constraints?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// AppError — normalized error shape for the entire frontend
// ---------------------------------------------------------------------------

export interface AppError {
  kind: ErrorKind;
  code: ErrorCode | string;
  message: string;
  fieldErrors?: FieldError[];
  status?: number;
  requestId?: string;
}

// ---------------------------------------------------------------------------
// Backend Error Response shape (from Part-23 §23.4)
// ---------------------------------------------------------------------------

interface BackendErrorResponse {
  error: {
    code: string;
    message: string;
    details?: FieldError[];
    metadata?: Record<string, unknown>;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

// ---------------------------------------------------------------------------
// Error Kind Mapping
// ---------------------------------------------------------------------------

function statusToKind(status: number): ErrorKind {
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 422 || status === 400) return "validation";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server";
  return "unknown";
}

function codeToKind(code: string): ErrorKind | null {
  if (
    code.startsWith("AUTH_") ||
    code === "UNAUTHORIZED" ||
    code === "TOKEN_EXPIRED" ||
    code === "TOKEN_INVALID" ||
    code === "INVALID_CREDENTIALS"
  ) {
    return "auth";
  }
  if (code === "FORBIDDEN" || code === "PARTNER_ACCESS_DENIED") {
    return "forbidden";
  }
  if (
    code === "VALIDATION_ERROR" ||
    code === "INVALID_REQUEST" ||
    code === "INVALID_QUERY_PARAMS"
  ) {
    return "validation";
  }
  if (code === "NOT_FOUND" || code.endsWith("_NOT_FOUND")) {
    return "not_found";
  }
  if (code.startsWith("RATE_LIMIT")) {
    return "rate_limit";
  }
  if (code === "INTERNAL_ERROR" || code === "SERVICE_UNAVAILABLE") {
    return "server";
  }
  return null;
}

// ---------------------------------------------------------------------------
// normalizeError — converts any thrown value into AppError
// ---------------------------------------------------------------------------

export function normalizeError(error: unknown): AppError {
  // Already an AppError
  if (isAppError(error)) {
    return error;
  }

  // Axios error with a backend response body
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    const body = error.response.data as
      | Partial<BackendErrorResponse>
      | undefined;

    if (body?.error) {
      const code = body.error.code ?? "UNKNOWN";
      const kind = codeToKind(code) ?? statusToKind(status);

      return {
        kind,
        code,
        message: body.error.message || error.message,
        fieldErrors: body.error.details,
        status,
        requestId: body.meta?.requestId,
      };
    }

    // Response present but doesn't follow standard error shape
    return {
      kind: statusToKind(status),
      code: `HTTP_${status}`,
      message: error.message || `Request failed with status ${status}`,
      status,
    };
  }

  // Axios error without response (network error)
  if (error instanceof AxiosError && !error.response) {
    return {
      kind: "network",
      code: "NETWORK_ERROR",
      message: "Unable to connect. Please check your internet connection.",
    };
  }

  // Generic Error
  if (error instanceof Error) {
    return {
      kind: "unknown",
      code: "UNKNOWN",
      message: error.message,
    };
  }

  // Fallback for non-Error values
  return {
    kind: "unknown",
    code: "UNKNOWN",
    message: String(error),
  };
}

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    "code" in value &&
    "message" in value
  );
}

// ---------------------------------------------------------------------------
// Helpers — extract field errors for RHF integration
// ---------------------------------------------------------------------------

/**
 * Convert AppError fieldErrors into a Record<string, string>
 * suitable for React Hook Form's setError.
 */
export function extractFieldErrors(
  error: AppError
): Record<string, string> | null {
  if (!error.fieldErrors?.length) return null;

  const map: Record<string, string> = {};
  for (const fe of error.fieldErrors) {
    if (!map[fe.field]) {
      map[fe.field] = fe.message;
    }
  }
  return map;
}

/**
 * Check if this error should trigger a redirect (auth/session errors)
 */
export function isAuthError(error: AppError): boolean {
  return error.kind === "auth";
}

/**
 * Check if this error is retryable (server/network/rate-limit)
 */
export function isRetryableError(error: AppError): boolean {
  return (
    error.kind === "server" ||
    error.kind === "network" ||
    error.kind === "rate_limit"
  );
}
