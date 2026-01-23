# PART 15 — API DESIGN, VERSIONING & OPENAPI RULES (LOCKED)

This part defines how APIs are designed, exposed, versioned, and documented.
APIs are contracts. Breaking them casually is forbidden.

All rules from PART 0–14 apply.

---

## 15.1 API DESIGN PHILOSOPHY

APIs must be:
- Explicit
- Predictable
- Versioned
- Self-documented
- Backward-compatible by default

APIs are consumer-facing products.

---

## 15.2 API STYLES (AUTHORITATIVE)

The platform uses:
- **RESTful APIs** for external consumers
- **Internal events** for cross-module communication

GraphQL is explicitly forbidden unless added via spine amendment.

---

## 15.3 BASE API STRUCTURE

Rules:
- All APIs are namespaced
- All APIs are versioned

Example:
/api/v1/tenants
/api/v1/listings
/api/v1/interactions

yaml
Copy code

Rules:
- Version is mandatory
- No unversioned endpoints
- Version bump required for breaking changes

---

## 15.4 RESOURCE-ORIENTED DESIGN

Rules:
- Use nouns, not verbs
- HTTP methods reflect intent
- Idempotency where applicable

Examples:
- POST /listings
- PATCH /listings/{id}
- POST /listings/{id}/publish

No RPC-style endpoints.

---

## 15.5 REQUEST & RESPONSE RULES

Rules:
- Use DTOs for all requests and responses
- No raw entities exposed
- Responses must be explicit and stable
- Empty responses must be intentional

Payload shape must not leak internals.

---

## 15.6 ERROR HANDLING STANDARD

Rules:
- Errors must be structured
- Error codes must be stable
- Validation errors must be field-specific
- No stack traces in responses

Error response example (conceptual):
{
"code": "LISTING_INVALID_STATE",
"message": "Listing cannot be published from draft",
"details": { ... }
}

yaml
Copy code

---

## 15.7 AUTHENTICATION & AUTHORIZATION

Rules:
- Auth handled via middleware/guards
- Auth logic must not live in controllers
- Authorization is declarative
- Tenant context must be resolved early

Public endpoints must be explicitly marked.

---

## 15.8 PAGINATION, FILTERING & SORTING

Rules:
- Pagination is mandatory for list endpoints
- Defaults must be safe
- Maximum limits enforced
- Filters must be explicit

Unbounded queries are forbidden.

---

## 15.9 IDEMPOTENCY & SAFETY

Rules:
- Idempotency keys required for:
  - Listing creation
  - Interaction creation
- Duplicate requests must not create duplicates
- Safe retries must be supported

---

## 15.10 OPENAPI / SWAGGER (MANDATORY)

Rules:
- Swagger is generated from code
- All endpoints must be documented
- All DTOs must include schema metadata
- Auth schemes must be documented
- Error responses must be documented
- Versioning must be visible in Swagger

Undocumented endpoints are forbidden.

---

## 15.11 FRONTEND & MOBILE CONTRACT AWARENESS

Rules:
- APIs must be frontend-agnostic
- Mobile constraints (latency, payload size) must be considered
- Backward compatibility must be preserved
- Breaking changes require new version

Frontend must not rely on undocumented behavior.

---

## 15.12 RATE LIMITING & ABUSE PROTECTION

Rules:
- Rate limiting must exist on public APIs
- Limits must be tenant-aware
- Abuse patterns must be detectable
- Rate limit errors must be explicit

---

## 15.13 DEPRECATION POLICY

Rules:
- Deprecated endpoints must be marked
- Deprecation period must be communicated
- Removal requires major version bump

Silent removals are forbidden.

---

## 15.14 FORBIDDEN PRACTICES

You must not:
- Expose internal IDs unnecessarily
- Return inconsistent payload shapes
- Skip versioning
- Add undocumented endpoints
- Embed business logic in controllers

---

## 15.15 EXECUTION DIRECTIVE

All APIs must:
- Follow these design rules
- Be fully documented
- Preserve backward compatibility
- Treat consumers as first-class users

APIs are promises. Keep them.

---

## 15.16 ERROR CODE CATALOG (AUTHORITATIVE)

All error codes are stable and must not change meaning once published.
Frontend and consumers rely on these codes for programmatic handling.

### 15.16.1 Error Response Structure

```typescript
interface ErrorResponse {
  error: {
    code: string;           // Stable error code (SCREAMING_SNAKE_CASE)
    message: string;        // Human-readable message
    details?: ErrorDetail[];// Field-specific errors
    metadata?: Record<string, unknown>; // Additional context
  };
  meta: {
    requestId: string;      // For support/debugging
    timestamp: string;      // ISO 8601
  };
}

interface ErrorDetail {
  field: string;            // Field path (e.g., "attributes.bedrooms")
  code: string;             // Field-specific error code
  message: string;          // Human-readable field error
  constraints?: Record<string, unknown>; // Validation constraints
}
```

### 15.16.2 General Error Codes

| Code | HTTP | Description | When to Use |
|------|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed | Invalid input data |
| `INVALID_REQUEST` | 400 | Malformed request | Missing body, invalid JSON |
| `INVALID_QUERY_PARAMS` | 400 | Invalid query parameters | Bad filters, pagination |
| `UNAUTHORIZED` | 401 | Not authenticated | Missing/invalid token |
| `INVALID_CREDENTIALS` | 401 | Login failed | Wrong email/password |
| `TOKEN_EXPIRED` | 401 | Token has expired | JWT expired |
| `TOKEN_INVALID` | 401 | Token is invalid | Malformed/tampered JWT |
| `FORBIDDEN` | 403 | Not authorized | Lacks permission |
| `TENANT_ACCESS_DENIED` | 403 | Wrong tenant | Cross-tenant access attempt |
| `NOT_FOUND` | 404 | Resource not found | Entity doesn't exist |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not allowed | Wrong HTTP verb |
| `CONFLICT` | 409 | Resource conflict | Duplicate, concurrent edit |
| `GONE` | 410 | Resource deleted | Soft-deleted entity |
| `PAYLOAD_TOO_LARGE` | 413 | Request too large | File/body size exceeded |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Invalid content type | Wrong Content-Type header |
| `RATE_LIMITED` | 429 | Too many requests | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Server error | Unexpected failure |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable | Maintenance, overload |

### 15.16.3 Authentication & Session Errors

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_EMAIL_NOT_FOUND` | 401 | Email not registered |
| `AUTH_PASSWORD_INCORRECT` | 401 | Password doesn't match |
| `AUTH_ACCOUNT_LOCKED` | 401 | Account locked due to attempts |
| `AUTH_ACCOUNT_DISABLED` | 401 | Account disabled by admin |
| `AUTH_MFA_REQUIRED` | 401 | MFA verification needed |
| `AUTH_MFA_INVALID` | 401 | Invalid MFA code |
| `AUTH_SESSION_EXPIRED` | 401 | Session has expired |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Refresh token invalid/expired |
| `AUTH_EMAIL_NOT_VERIFIED` | 403 | Email not yet verified |

### 15.16.4 Tenant Errors

| Code | HTTP | Description |
|------|------|-------------|
| `TENANT_NOT_FOUND` | 404 | Tenant does not exist |
| `TENANT_SUSPENDED` | 403 | Tenant is suspended |
| `TENANT_INACTIVE` | 403 | Tenant is not active |
| `TENANT_SLUG_TAKEN` | 409 | Tenant slug already exists |
| `TENANT_LIMIT_REACHED` | 403 | Platform tenant limit reached |
| `TENANT_VERTICAL_NOT_ENABLED` | 403 | Vertical not enabled for tenant |

### 15.16.5 Vendor Errors

| Code | HTTP | Description |
|------|------|-------------|
| `VENDOR_NOT_FOUND` | 404 | Vendor does not exist |
| `VENDOR_SUSPENDED` | 403 | Vendor is suspended |
| `VENDOR_PENDING_APPROVAL` | 403 | Vendor not yet approved |
| `VENDOR_REJECTED` | 403 | Vendor was rejected |
| `VENDOR_SLUG_TAKEN` | 409 | Vendor slug already exists |
| `VENDOR_ALREADY_EXISTS` | 409 | User already has a vendor |

### 15.16.6 Listing Errors

| Code | HTTP | Description |
|------|------|-------------|
| `LISTING_NOT_FOUND` | 404 | Listing does not exist |
| `LISTING_ARCHIVED` | 410 | Listing has been archived |
| `LISTING_INVALID_STATE` | 400 | Invalid state transition |
| `LISTING_CANNOT_PUBLISH` | 400 | Missing required fields for publish |
| `LISTING_ALREADY_PUBLISHED` | 409 | Listing already published |
| `LISTING_NOT_PUBLISHED` | 400 | Action requires published listing |
| `LISTING_SLUG_TAKEN` | 409 | Listing slug already exists |
| `LISTING_VERTICAL_MISMATCH` | 400 | Attributes don't match vertical |
| `LISTING_ATTRIBUTE_INVALID` | 400 | Invalid attribute value |
| `LISTING_ATTRIBUTE_REQUIRED` | 400 | Required attribute missing |
| `LISTING_PRICE_INVALID` | 400 | Invalid price value |
| `LISTING_LOCATION_INVALID` | 400 | Invalid location data |

### 15.16.7 Media Errors

| Code | HTTP | Description |
|------|------|-------------|
| `MEDIA_NOT_FOUND` | 404 | Media does not exist |
| `MEDIA_UPLOAD_FAILED` | 400 | Upload failed |
| `MEDIA_TYPE_NOT_ALLOWED` | 400 | File type not permitted |
| `MEDIA_SIZE_EXCEEDED` | 413 | File size too large |
| `MEDIA_QUOTA_EXCEEDED` | 403 | Storage quota exceeded |
| `MEDIA_PROCESSING_FAILED` | 500 | Media processing failed |
| `MEDIA_NOT_READY` | 400 | Media still processing |
| `MEDIA_PRESIGN_FAILED` | 500 | Failed to generate upload URL |

### 15.16.8 Interaction Errors

| Code | HTTP | Description |
|------|------|-------------|
| `INTERACTION_NOT_FOUND` | 404 | Interaction does not exist |
| `INTERACTION_ALREADY_RESPONDED` | 409 | Already responded to interaction |
| `INTERACTION_INVALID_STATE` | 400 | Invalid state transition |
| `INTERACTION_LISTING_UNAVAILABLE` | 400 | Listing not available for interaction |
| `BOOKING_SLOT_UNAVAILABLE` | 409 | Booking slot not available |
| `BOOKING_ALREADY_CONFIRMED` | 409 | Booking already confirmed |
| `BOOKING_ALREADY_CANCELLED` | 409 | Booking already cancelled |

### 15.16.9 Review Errors

| Code | HTTP | Description |
|------|------|-------------|
| `REVIEW_NOT_FOUND` | 404 | Review does not exist |
| `REVIEW_ALREADY_EXISTS` | 409 | Already reviewed this target |
| `REVIEW_CANNOT_REVIEW_SELF` | 400 | Cannot review own entity |
| `REVIEW_TARGET_NOT_FOUND` | 404 | Review target doesn't exist |
| `REVIEW_NOT_ELIGIBLE` | 403 | Not eligible to review |
| `REVIEW_MODERATION_PENDING` | 400 | Review pending moderation |
| `REVIEW_ALREADY_MODERATED` | 409 | Review already moderated |

### 15.16.10 Subscription & Entitlement Errors

| Code | HTTP | Description |
|------|------|-------------|
| `SUBSCRIPTION_NOT_FOUND` | 404 | Subscription does not exist |
| `SUBSCRIPTION_EXPIRED` | 403 | Subscription has expired |
| `SUBSCRIPTION_CANCELLED` | 403 | Subscription was cancelled |
| `PLAN_NOT_FOUND` | 404 | Plan does not exist |
| `PLAN_NOT_AVAILABLE` | 400 | Plan not available for selection |
| `PLAN_DOWNGRADE_NOT_ALLOWED` | 400 | Cannot downgrade to this plan |
| `ENTITLEMENT_DENIED` | 403 | Plan doesn't allow this action |
| `ENTITLEMENT_LIMIT_REACHED` | 403 | Usage limit reached |
| `ENTITLEMENT_FEATURE_DISABLED` | 403 | Feature not enabled in plan |
| `USAGE_QUOTA_EXCEEDED` | 403 | Usage quota exceeded |

### 15.16.11 Billing Errors

| Code | HTTP | Description |
|------|------|-------------|
| `PAYMENT_FAILED` | 402 | Payment processing failed |
| `PAYMENT_METHOD_INVALID` | 400 | Invalid payment method |
| `PAYMENT_METHOD_EXPIRED` | 400 | Payment method expired |
| `PAYMENT_METHOD_DECLINED` | 402 | Payment method declined |
| `INVOICE_NOT_FOUND` | 404 | Invoice does not exist |
| `INVOICE_ALREADY_PAID` | 409 | Invoice already paid |
| `BILLING_INFO_REQUIRED` | 400 | Billing information required |

### 15.16.12 Search Errors

| Code | HTTP | Description |
|------|------|-------------|
| `SEARCH_QUERY_INVALID` | 400 | Invalid search query |
| `SEARCH_FILTER_INVALID` | 400 | Invalid search filter |
| `SEARCH_UNAVAILABLE` | 503 | Search service unavailable |
| `SEARCH_TIMEOUT` | 504 | Search query timed out |
| `GEO_SEARCH_INVALID` | 400 | Invalid geo search parameters |

### 15.16.13 Vertical & Schema Errors

| Code | HTTP | Description |
|------|------|-------------|
| `VERTICAL_NOT_FOUND` | 404 | Vertical type doesn't exist |
| `VERTICAL_NOT_ENABLED` | 403 | Vertical not enabled |
| `VERTICAL_SCHEMA_INVALID` | 400 | Schema validation failed |
| `VERTICAL_ATTRIBUTE_UNKNOWN` | 400 | Unknown attribute for vertical |

### 15.16.14 Rate Limit Errors

| Code | HTTP | Description |
|------|------|-------------|
| `RATE_LIMIT_EXCEEDED` | 429 | General rate limit exceeded |
| `RATE_LIMIT_API` | 429 | API rate limit exceeded |
| `RATE_LIMIT_LOGIN` | 429 | Login attempt limit exceeded |
| `RATE_LIMIT_UPLOAD` | 429 | Upload rate limit exceeded |

**Rate Limit Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067200
Retry-After: 60
```

### 15.16.15 Validation Error Details

Field-level validation errors include specific codes:

| Code | Description | Example |
|------|-------------|---------|
| `REQUIRED` | Field is required | `email` is required |
| `INVALID_FORMAT` | Invalid format | Invalid email format |
| `INVALID_TYPE` | Wrong data type | Expected number |
| `TOO_SHORT` | Below minimum length | Min 3 characters |
| `TOO_LONG` | Exceeds maximum length | Max 255 characters |
| `TOO_SMALL` | Below minimum value | Min value is 0 |
| `TOO_LARGE` | Exceeds maximum value | Max value is 1000000 |
| `INVALID_ENUM` | Not in allowed values | Must be one of: ... |
| `INVALID_PATTERN` | Doesn't match pattern | Invalid phone format |
| `DUPLICATE` | Value already exists | Email already registered |
| `INVALID_REFERENCE` | Referenced entity not found | Category not found |

**Example Validation Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Invalid email format"
      },
      {
        "field": "attributes.bedrooms",
        "code": "TOO_SMALL",
        "message": "Must be at least 1",
        "constraints": { "min": 1 }
      },
      {
        "field": "attributes.propertyType",
        "code": "INVALID_ENUM",
        "message": "Must be one of: apartment, condominium, house, land",
        "constraints": { "allowedValues": ["apartment", "condominium", "house", "land"] }
      }
    ]
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-14T10:30:00Z"
  }
}
```

### 15.16.16 Error Code Implementation

```typescript
// errors/error-codes.enum.ts
export enum ErrorCode {
  // General
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  
  // Domain-specific
  LISTING_NOT_FOUND = 'LISTING_NOT_FOUND',
  LISTING_INVALID_STATE = 'LISTING_INVALID_STATE',
  ENTITLEMENT_DENIED = 'ENTITLEMENT_DENIED',
  // ... all codes
}

// errors/app.exception.ts
export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    statusCode: number = 400,
    public readonly details?: ErrorDetail[],
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ code, message, details, metadata }, statusCode);
  }
}

// Usage
throw new AppException(
  ErrorCode.LISTING_CANNOT_PUBLISH,
  'Cannot publish listing: missing required fields',
  400,
  [
    { field: 'attributes.builtUpSize', code: 'REQUIRED', message: 'Required for publishing' },
  ],
);
```

### 15.16.17 Error Code Versioning

Rules:
- Error codes are immutable once published
- New codes may be added
- Existing code meanings must not change
- Deprecated codes marked in documentation
- Removal requires major version bump

END OF PART 15.