// =============================================================================
// Global Error Handler — Maps backend error codes to user-friendly messages
// =============================================================================
// Handles status-based routing (401→login, 403→forbidden) and provides
// human-readable messages for all backend error codes.
// =============================================================================

import type { AppError, ErrorCode, ErrorKind } from "@/lib/errors";
import { normalizeError, isAuthError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// User-friendly error messages by backend error code
// ---------------------------------------------------------------------------

const ERROR_CODE_MESSAGES: Partial<Record<ErrorCode, string>> = {
  // General
  VALIDATION_ERROR: "Please check your input and try again.",
  INVALID_REQUEST: "The request was invalid. Please try again.",
  INVALID_QUERY_PARAMS: "Invalid search parameters. Please adjust your filters.",
  UNAUTHORIZED: "Your session has expired. Please log in again.",
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  TOKEN_EXPIRED: "Your session has expired. Please log in again.",
  TOKEN_INVALID: "Your session is invalid. Please log in again.",
  FORBIDDEN: "You don't have permission to perform this action.",
  PARTNER_ACCESS_DENIED: "You don't have access to this organization.",
  NOT_FOUND: "The requested resource was not found.",
  CONFLICT: "A conflict occurred. The resource may have been modified by someone else.",
  GONE: "This resource is no longer available.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again later.",
  SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again shortly.",

  // Auth
  AUTH_EMAIL_NOT_FOUND: "No account found with this email address.",
  AUTH_PASSWORD_INCORRECT: "Incorrect password. Please try again.",
  AUTH_ACCOUNT_LOCKED: "Your account has been locked. Please contact support.",
  AUTH_ACCOUNT_DISABLED: "Your account has been disabled. Please contact support.",
  AUTH_MFA_REQUIRED: "Multi-factor authentication is required.",
  AUTH_MFA_INVALID: "Invalid verification code. Please try again.",
  AUTH_SESSION_EXPIRED: "Your session has expired. Please log in again.",
  AUTH_EMAIL_NOT_VERIFIED: "Please verify your email address before continuing.",

  // Partner
  PARTNER_NOT_FOUND: "Organization not found.",
  PARTNER_SUSPENDED: "This organization has been suspended. Please contact support.",
  PARTNER_DEACTIVATED: "This organization has been deactivated.",
  PARTNER_SLUG_TAKEN: "This organization URL is already taken. Please choose another.",
  PARTNER_VERTICAL_NOT_ENABLED: "This feature is not enabled for your organization.",

  // Vendor
  VENDOR_NOT_FOUND: "Vendor not found.",
  VENDOR_SUSPENDED: "This vendor account has been suspended.",
  VENDOR_PENDING_APPROVAL: "Your vendor account is pending approval.",
  VENDOR_REJECTED: "Your vendor application has been rejected.",
  VENDOR_SLUG_TAKEN: "This vendor URL is already taken. Please choose another.",
  VENDOR_ALREADY_EXISTS: "A vendor with this information already exists.",

  // Listing
  LISTING_NOT_FOUND: "Listing not found.",
  LISTING_ARCHIVED: "This listing has been archived.",
  LISTING_INVALID_STATE: "This listing is in an invalid state for this action.",
  LISTING_CANNOT_PUBLISH: "This listing cannot be published. Please check all required fields.",
  LISTING_ALREADY_PUBLISHED: "This listing is already published.",
  LISTING_SLUG_TAKEN: "This listing URL is already taken.",
  LISTING_VERTICAL_MISMATCH: "The property type doesn't match the listing category.",
  LISTING_ATTRIBUTE_INVALID: "One or more property details are invalid.",
  LISTING_ATTRIBUTE_REQUIRED: "Required property details are missing.",

  // Media
  MEDIA_NOT_FOUND: "Media file not found.",
  MEDIA_UPLOAD_FAILED: "File upload failed. Please try again.",
  MEDIA_TYPE_NOT_ALLOWED: "This file type is not supported.",
  MEDIA_SIZE_EXCEEDED: "The file is too large. Please upload a smaller file.",
  MEDIA_QUOTA_EXCEEDED: "Storage quota exceeded. Please remove some files or upgrade your plan.",
  MEDIA_PROCESSING_FAILED: "Failed to process the uploaded file. Please try a different file.",

  // Interaction
  INTERACTION_NOT_FOUND: "Inquiry not found.",
  INTERACTION_ALREADY_RESPONDED: "This inquiry has already been responded to.",
  INTERACTION_INVALID_STATE: "This inquiry is in an invalid state for this action.",
  BOOKING_SLOT_UNAVAILABLE: "The selected time slot is no longer available.",

  // Review
  REVIEW_NOT_FOUND: "Review not found.",
  REVIEW_ALREADY_EXISTS: "You have already reviewed this item.",
  REVIEW_CANNOT_REVIEW_SELF: "You cannot review your own listing.",
  REVIEW_NOT_ELIGIBLE: "You are not eligible to write a review for this item.",

  // Subscription & Entitlement
  SUBSCRIPTION_NOT_FOUND: "Subscription not found.",
  SUBSCRIPTION_EXPIRED: "Your subscription has expired. Please renew to continue.",
  SUBSCRIPTION_CANCELLED: "Your subscription has been cancelled.",
  PLAN_NOT_FOUND: "The selected plan is not available.",
  PLAN_NOT_AVAILABLE: "This plan is currently unavailable.",
  ENTITLEMENT_DENIED: "Your current plan does not include this feature.",
  ENTITLEMENT_LIMIT_REACHED: "You've reached the limit for this feature. Consider upgrading your plan.",
  USAGE_QUOTA_EXCEEDED: "You've exceeded your usage quota.",

  // Billing
  PAYMENT_FAILED: "Payment failed. Please check your payment details.",
  PAYMENT_METHOD_INVALID: "Invalid payment method. Please update your payment information.",
  PAYMENT_METHOD_DECLINED: "Your payment was declined. Please try a different payment method.",
  INVOICE_NOT_FOUND: "Invoice not found.",

  // Rate Limit
  RATE_LIMIT_EXCEEDED: "Too many requests. Please wait a moment and try again.",
  RATE_LIMIT_API: "API rate limit exceeded. Please try again shortly.",
  RATE_LIMIT_LOGIN: "Too many login attempts. Please wait before trying again.",
};

// ---------------------------------------------------------------------------
// Fallback messages by error kind
// ---------------------------------------------------------------------------

const KIND_FALLBACK_MESSAGES: Record<ErrorKind, string> = {
  auth: "Your session has expired. Please log in again.",
  forbidden: "You don't have permission to perform this action.",
  validation: "Please check your input and try again.",
  not_found: "The requested resource was not found.",
  rate_limit: "Too many requests. Please wait a moment and try again.",
  server: "An unexpected error occurred. Please try again later.",
  network: "Unable to connect. Please check your internet connection.",
  unknown: "An unexpected error occurred. Please try again.",
};

// ---------------------------------------------------------------------------
// getUserMessage — returns a user-friendly message for any AppError
// ---------------------------------------------------------------------------

export function getUserMessage(error: AppError): string {
  // Check specific code first
  const codeMessage = ERROR_CODE_MESSAGES[error.code as ErrorCode];
  if (codeMessage) return codeMessage;

  // Fall back to kind-based message
  return KIND_FALLBACK_MESSAGES[error.kind] ?? KIND_FALLBACK_MESSAGES.unknown;
}

// ---------------------------------------------------------------------------
// handleGlobalError — handles error-status routing and side-effects
// ---------------------------------------------------------------------------

export interface GlobalErrorHandlerOptions {
  /** Called to redirect to login (e.g., router.push) */
  onAuthError?: () => void;
  /** Called to redirect to forbidden page */
  onForbiddenError?: () => void;
  /** Called to show field-level errors in a form */
  onValidationError?: (fieldErrors: AppError["fieldErrors"]) => void;
  /** Called to display an error message (e.g., toast) */
  onDisplayError?: (message: string) => void;
  /** Suppress default toast display */
  silent?: boolean;
}

/**
 * Central error handler for the application.
 * Normalizes the error, routes based on status, and triggers side-effects.
 *
 * @returns The normalized AppError for further handling if needed.
 */
export function handleGlobalError(
  error: unknown,
  options: GlobalErrorHandlerOptions = {}
): AppError {
  const appError = normalizeError(error);
  const message = getUserMessage(appError);

  switch (appError.kind) {
    case "auth":
      // 401 — redirect to login
      if (options.onAuthError) {
        options.onAuthError();
      } else if (typeof window !== "undefined") {
        // Default: redirect to login
        window.location.href = "/login";
      }
      break;

    case "forbidden":
      // 403 — redirect to forbidden page
      if (options.onForbiddenError) {
        options.onForbiddenError();
      } else if (typeof window !== "undefined") {
        window.location.href = "/forbidden";
      }
      break;

    case "validation":
      // 422/400 — show field errors if available
      if (appError.fieldErrors?.length && options.onValidationError) {
        options.onValidationError(appError.fieldErrors);
      }
      // Also show toast unless silent
      if (!options.silent && options.onDisplayError) {
        options.onDisplayError(message);
      }
      break;

    default:
      // All other errors — show toast
      if (!options.silent && options.onDisplayError) {
        options.onDisplayError(message);
      }
      break;
  }

  return appError;
}

// ---------------------------------------------------------------------------
// Convenience — handle mutation error with toast (used in use-api-mutation)
// ---------------------------------------------------------------------------

/**
 * Quick handler for mutation errors. Returns the normalized AppError.
 * Does NOT redirect — callers should use handleGlobalError for full routing.
 */
export function getMutationErrorMessage(error: unknown): string {
  const appError = normalizeError(error);
  return getUserMessage(appError);
}

// ---------------------------------------------------------------------------
// isSessionExpiredError — check if error should trigger session expiry flow
// ---------------------------------------------------------------------------

export function isSessionExpiredError(error: unknown): boolean {
  const appError = normalizeError(error);
  return (
    isAuthError(appError) &&
    (appError.code === "TOKEN_EXPIRED" ||
      appError.code === "AUTH_SESSION_EXPIRED")
  );
}
