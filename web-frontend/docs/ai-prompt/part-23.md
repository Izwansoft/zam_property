# FRONTEND (WEB) — PART 23 — BACKEND ALIGNMENT & CONTRACTS (LOCKED)

This part ensures **frontend aligns exactly with backend contracts**.
All definitions here mirror Backend specifications.

All rules from WEB PART 0–22 apply fully.

---

## 23.1 ROLE ENUMERATION (BACKEND-ALIGNED)

Must match **Backend Part 27** exactly:

```typescript
// types/roles.ts
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',       // System-level, full access
  PLATFORM_ADMIN = 'PLATFORM_ADMIN', // Platform operations
  TENANT_ADMIN = 'TENANT_ADMIN',     // Tenant management
  VENDOR_ADMIN = 'VENDOR_ADMIN',     // Vendor management
  VENDOR_USER = 'VENDOR_USER',       // Vendor staff
  USER = 'USER',                     // Basic authenticated user
}
```

### Role → Portal Mapping

| Role | Primary Portal | Can Access |
|------|---------------|------------|
| `SUPER_ADMIN` | Platform Admin | All portals, all tenants |
| `PLATFORM_ADMIN` | Platform Admin | Platform portal, tenant impersonation |
| `TENANT_ADMIN` | Tenant Admin | Tenant portal for owned tenants |
| `VENDOR_ADMIN` | Vendor Portal | Vendor portal, manage vendor staff |
| `VENDOR_USER` | Vendor Portal | Vendor portal (limited) |
| `USER` | Public/Consumer | Public pages, saved searches |

### Role Hierarchy

```typescript
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.PLATFORM_ADMIN]: 80,
  [UserRole.TENANT_ADMIN]: 60,
  [UserRole.VENDOR_ADMIN]: 40,
  [UserRole.VENDOR_USER]: 20,
  [UserRole.USER]: 10,
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
```

---

## 23.2 STATUS ENUMERATIONS (BACKEND-ALIGNED)

All status values must match **Backend Part 27** exactly.

### TenantStatus

```typescript
export enum TenantStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
}

export const TENANT_STATUS_CONFIG: Record<TenantStatus, StatusConfig> = {
  [TenantStatus.PENDING]: { 
    label: 'Pending', 
    color: 'yellow',
    icon: Clock,
    allowedActions: ['activate', 'reject'],
  },
  [TenantStatus.ACTIVE]: { 
    label: 'Active', 
    color: 'green',
    icon: CheckCircle,
    allowedActions: ['suspend', 'deactivate'],
  },
  [TenantStatus.SUSPENDED]: { 
    label: 'Suspended', 
    color: 'red',
    icon: Ban,
    allowedActions: ['reactivate'],
  },
  [TenantStatus.INACTIVE]: { 
    label: 'Inactive', 
    color: 'gray',
    icon: XCircle,
    allowedActions: ['activate'],
  },
};
```

### VendorStatus

```typescript
export enum VendorStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export const VENDOR_STATUS_CONFIG: Record<VendorStatus, StatusConfig> = {
  [VendorStatus.PENDING]: {
    label: 'Pending Approval',
    color: 'yellow',
    icon: Clock,
    allowedActions: ['approve', 'reject'],
  },
  [VendorStatus.APPROVED]: {
    label: 'Approved',
    color: 'green',
    icon: CheckCircle,
    allowedActions: ['suspend'],
  },
  [VendorStatus.REJECTED]: {
    label: 'Rejected',
    color: 'red',
    icon: XCircle,
    allowedActions: ['approve'], // Can re-approve after fixes
  },
  [VendorStatus.SUSPENDED]: {
    label: 'Suspended',
    color: 'red',
    icon: Ban,
    allowedActions: ['reactivate'],
  },
};
```

### ListingStatus

```typescript
export enum ListingStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export const LISTING_STATUS_CONFIG: Record<ListingStatus, StatusConfig> = {
  [ListingStatus.DRAFT]: {
    label: 'Draft',
    color: 'gray',
    icon: FileEdit,
    allowedActions: ['publish', 'delete'],
  },
  [ListingStatus.PUBLISHED]: {
    label: 'Published',
    color: 'green',
    icon: Globe,
    allowedActions: ['unpublish', 'archive'],
  },
  [ListingStatus.EXPIRED]: {
    label: 'Expired',
    color: 'orange',
    icon: Clock,
    allowedActions: ['renew', 'archive'],
  },
  [ListingStatus.ARCHIVED]: {
    label: 'Archived',
    color: 'gray',
    icon: Archive,
    allowedActions: ['restore', 'delete'],
  },
};
```

### InteractionStatus

```typescript
export enum InteractionStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  CONFIRMED = 'CONFIRMED',
  CLOSED = 'CLOSED',
  INVALID = 'INVALID',
}

export const INTERACTION_STATUS_CONFIG: Record<InteractionStatus, StatusConfig> = {
  [InteractionStatus.NEW]: {
    label: 'New',
    color: 'blue',
    icon: Inbox,
    allowedActions: ['markContacted', 'markInvalid'],
  },
  [InteractionStatus.CONTACTED]: {
    label: 'Contacted',
    color: 'yellow',
    icon: Phone,
    allowedActions: ['markConfirmed', 'markClosed'],
  },
  [InteractionStatus.CONFIRMED]: {
    label: 'Confirmed',
    color: 'green',
    icon: CheckCircle,
    allowedActions: ['markClosed'],
  },
  [InteractionStatus.CLOSED]: {
    label: 'Closed',
    color: 'gray',
    icon: XCircle,
    allowedActions: ['reopen'],
  },
  [InteractionStatus.INVALID]: {
    label: 'Invalid',
    color: 'red',
    icon: AlertTriangle,
    allowedActions: ['reopen'],
  },
};
```

### InteractionType

```typescript
export enum InteractionType {
  LEAD = 'LEAD',
  ENQUIRY = 'ENQUIRY',
  BOOKING = 'BOOKING',
}
```

### ReviewStatus

```typescript
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

export const REVIEW_STATUS_CONFIG: Record<ReviewStatus, StatusConfig> = {
  [ReviewStatus.PENDING]: {
    label: 'Pending Review',
    color: 'yellow',
    icon: Clock,
    allowedActions: ['approve', 'reject', 'flag'],
  },
  [ReviewStatus.APPROVED]: {
    label: 'Approved',
    color: 'green',
    icon: CheckCircle,
    allowedActions: ['flag', 'reject'],
  },
  [ReviewStatus.REJECTED]: {
    label: 'Rejected',
    color: 'red',
    icon: XCircle,
    allowedActions: ['approve'],
  },
  [ReviewStatus.FLAGGED]: {
    label: 'Flagged',
    color: 'orange',
    icon: Flag,
    allowedActions: ['approve', 'reject'],
  },
};
```

### SubscriptionStatus

```typescript
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export const SUBSCRIPTION_STATUS_CONFIG: Record<SubscriptionStatus, StatusConfig> = {
  [SubscriptionStatus.ACTIVE]: {
    label: 'Active',
    color: 'green',
    icon: CheckCircle,
    allowedActions: ['pause', 'cancel', 'changePlan'],
  },
  [SubscriptionStatus.PAST_DUE]: {
    label: 'Past Due',
    color: 'red',
    icon: AlertTriangle,
    allowedActions: ['updatePayment', 'retry'],
    banner: 'Payment failed. Please update your payment method.',
  },
  [SubscriptionStatus.PAUSED]: {
    label: 'Paused',
    color: 'yellow',
    icon: Pause,
    allowedActions: ['resume', 'cancel'],
  },
  [SubscriptionStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'gray',
    icon: XCircle,
    allowedActions: ['resubscribe'],
  },
};
```

### MediaStatus

```typescript
export enum MediaStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}
```

---

## 23.3 ERROR CODE HANDLING (BACKEND-ALIGNED)

Must handle all error codes from **Backend Part 15**.

### Error Code Type

```typescript
// types/error-codes.ts
export type ErrorCode =
  // General
  | 'VALIDATION_ERROR'
  | 'INVALID_REQUEST'
  | 'INVALID_QUERY_PARAMS'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'FORBIDDEN'
  | 'TENANT_ACCESS_DENIED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'GONE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  // Auth
  | 'AUTH_EMAIL_NOT_FOUND'
  | 'AUTH_PASSWORD_INCORRECT'
  | 'AUTH_ACCOUNT_LOCKED'
  | 'AUTH_ACCOUNT_DISABLED'
  | 'AUTH_MFA_REQUIRED'
  | 'AUTH_MFA_INVALID'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_EMAIL_NOT_VERIFIED'
  // Tenant
  | 'TENANT_NOT_FOUND'
  | 'TENANT_SUSPENDED'
  | 'TENANT_INACTIVE'
  | 'TENANT_SLUG_TAKEN'
  | 'TENANT_VERTICAL_NOT_ENABLED'
  // Vendor
  | 'VENDOR_NOT_FOUND'
  | 'VENDOR_SUSPENDED'
  | 'VENDOR_PENDING_APPROVAL'
  | 'VENDOR_REJECTED'
  | 'VENDOR_SLUG_TAKEN'
  | 'VENDOR_ALREADY_EXISTS'
  // Listing
  | 'LISTING_NOT_FOUND'
  | 'LISTING_ARCHIVED'
  | 'LISTING_INVALID_STATE'
  | 'LISTING_CANNOT_PUBLISH'
  | 'LISTING_ALREADY_PUBLISHED'
  | 'LISTING_SLUG_TAKEN'
  | 'LISTING_VERTICAL_MISMATCH'
  | 'LISTING_ATTRIBUTE_INVALID'
  | 'LISTING_ATTRIBUTE_REQUIRED'
  // Media
  | 'MEDIA_NOT_FOUND'
  | 'MEDIA_UPLOAD_FAILED'
  | 'MEDIA_TYPE_NOT_ALLOWED'
  | 'MEDIA_SIZE_EXCEEDED'
  | 'MEDIA_QUOTA_EXCEEDED'
  | 'MEDIA_PROCESSING_FAILED'
  // Interaction
  | 'INTERACTION_NOT_FOUND'
  | 'INTERACTION_ALREADY_RESPONDED'
  | 'INTERACTION_INVALID_STATE'
  | 'BOOKING_SLOT_UNAVAILABLE'
  // Review
  | 'REVIEW_NOT_FOUND'
  | 'REVIEW_ALREADY_EXISTS'
  | 'REVIEW_CANNOT_REVIEW_SELF'
  | 'REVIEW_NOT_ELIGIBLE'
  // Subscription & Entitlement
  | 'SUBSCRIPTION_NOT_FOUND'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'PLAN_NOT_FOUND'
  | 'PLAN_NOT_AVAILABLE'
  | 'ENTITLEMENT_DENIED'
  | 'ENTITLEMENT_LIMIT_REACHED'
  | 'USAGE_QUOTA_EXCEEDED'
  // Billing
  | 'PAYMENT_FAILED'
  | 'PAYMENT_METHOD_INVALID'
  | 'PAYMENT_METHOD_DECLINED'
  | 'INVOICE_NOT_FOUND'
  // Rate Limit
  | 'RATE_LIMIT_EXCEEDED'
  | 'RATE_LIMIT_API'
  | 'RATE_LIMIT_LOGIN';
```

### Error Handler Configuration

```typescript
// lib/error-handler.ts
interface ErrorConfig {
  title: string;
  description?: string;
  action?: 'redirect' | 'toast' | 'modal' | 'inline';
  redirectTo?: string;
  retry?: boolean;
}

export const ERROR_CONFIG: Partial<Record<ErrorCode, ErrorConfig>> = {
  // Auth errors - redirect to login
  UNAUTHORIZED: {
    title: 'Session Expired',
    description: 'Please sign in again',
    action: 'redirect',
    redirectTo: '/login',
  },
  TOKEN_EXPIRED: {
    title: 'Session Expired',
    action: 'redirect',
    redirectTo: '/login',
  },
  AUTH_ACCOUNT_LOCKED: {
    title: 'Account Locked',
    description: 'Too many login attempts. Please try again later.',
    action: 'modal',
  },
  AUTH_MFA_REQUIRED: {
    title: 'Verification Required',
    action: 'redirect',
    redirectTo: '/auth/mfa',
  },
  
  // Tenant errors
  TENANT_SUSPENDED: {
    title: 'Account Suspended',
    description: 'Your organization account has been suspended. Please contact support.',
    action: 'modal',
  },
  TENANT_VERTICAL_NOT_ENABLED: {
    title: 'Feature Not Available',
    description: 'This feature is not enabled for your organization.',
    action: 'toast',
  },
  
  // Vendor errors
  VENDOR_PENDING_APPROVAL: {
    title: 'Pending Approval',
    description: 'Your vendor account is pending approval.',
    action: 'redirect',
    redirectTo: '/vendor/pending',
  },
  VENDOR_SUSPENDED: {
    title: 'Vendor Suspended',
    description: 'Your vendor account has been suspended.',
    action: 'modal',
  },
  
  // Listing errors
  LISTING_CANNOT_PUBLISH: {
    title: 'Cannot Publish',
    description: 'Please complete all required fields before publishing.',
    action: 'inline',
  },
  LISTING_INVALID_STATE: {
    title: 'Invalid Action',
    description: 'This action cannot be performed on the listing in its current state.',
    action: 'toast',
  },
  
  // Entitlement errors
  ENTITLEMENT_DENIED: {
    title: 'Upgrade Required',
    description: 'This feature requires a higher plan.',
    action: 'modal',
  },
  ENTITLEMENT_LIMIT_REACHED: {
    title: 'Limit Reached',
    description: 'You have reached the limit for this feature. Upgrade to continue.',
    action: 'modal',
  },
  USAGE_QUOTA_EXCEEDED: {
    title: 'Quota Exceeded',
    description: 'You have exceeded your usage quota for this billing period.',
    action: 'modal',
  },
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: {
    title: 'Too Many Requests',
    description: 'Please wait a moment before trying again.',
    action: 'toast',
    retry: true,
  },
  
  // Generic
  INTERNAL_ERROR: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again.',
    action: 'toast',
    retry: true,
  },
  SERVICE_UNAVAILABLE: {
    title: 'Service Unavailable',
    description: 'The service is temporarily unavailable. Please try again later.',
    action: 'toast',
    retry: true,
  },
};

export function handleApiError(error: ApiError) {
  const config = ERROR_CONFIG[error.code] || {
    title: 'Error',
    description: error.message,
    action: 'toast',
  };
  
  switch (config.action) {
    case 'redirect':
      router.push(config.redirectTo!);
      break;
    case 'toast':
      toast.error(config.title, { description: config.description });
      break;
    case 'modal':
      showErrorModal(config);
      break;
    case 'inline':
      // Return for form handling
      return config;
  }
}
```

---

## 23.4 API RESPONSE CONTRACTS (BACKEND-ALIGNED)

### Standard Response Shape

```typescript
// types/api.ts

// Single entity response
interface ApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
  };
}

// List response with pagination
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    requestId: string;
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

// Error response
interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: Array<{
      field: string;
      code: string;
      message: string;
      constraints?: Record<string, unknown>;
    }>;
    metadata?: Record<string, unknown>;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}
```

### Pagination Query Params

```typescript
interface PaginationParams {
  page?: number;      // 1-based
  pageSize?: number;  // Default: 20, Max: 100
  sort?: string;      // Format: "field:asc" or "field:desc"
}
```

---

## 23.5 NOTIFICATION TYPES (BACKEND-ALIGNED)

```typescript
export enum NotificationType {
  // Interactions
  LEAD_NEW = 'LEAD_NEW',
  ENQUIRY_NEW = 'ENQUIRY_NEW',
  BOOKING_NEW = 'BOOKING_NEW',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  
  // Listings
  LISTING_APPROVED = 'LISTING_APPROVED',
  LISTING_REJECTED = 'LISTING_REJECTED',
  LISTING_EXPIRING = 'LISTING_EXPIRING',
  LISTING_EXPIRED = 'LISTING_EXPIRED',
  
  // Vendors
  VENDOR_APPROVED = 'VENDOR_APPROVED',
  VENDOR_REJECTED = 'VENDOR_REJECTED',
  VENDOR_SUSPENDED = 'VENDOR_SUSPENDED',
  
  // Reviews
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  REVIEW_REPLY = 'REVIEW_REPLY',
  
  // Subscription
  SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING',
  SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  
  // System
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  MAINTENANCE_SCHEDULED = 'MAINTENANCE_SCHEDULED',
}

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  [NotificationType.LEAD_NEW]: {
    icon: UserPlus,
    color: 'blue',
    actionLabel: 'View Lead',
    actionPath: (data) => `/interactions/${data.interactionId}`,
  },
  [NotificationType.BOOKING_CONFIRMED]: {
    icon: CalendarCheck,
    color: 'green',
    actionLabel: 'View Booking',
    actionPath: (data) => `/interactions/${data.interactionId}`,
  },
  [NotificationType.LISTING_EXPIRING]: {
    icon: Clock,
    color: 'orange',
    actionLabel: 'Renew Listing',
    actionPath: (data) => `/listings/${data.listingId}/renew`,
  },
  [NotificationType.PAYMENT_FAILED]: {
    icon: CreditCard,
    color: 'red',
    actionLabel: 'Update Payment',
    actionPath: () => `/settings/billing`,
  },
  // ... all other types
};
```

---

## 23.6 AUDIT LOG FIELDS (BACKEND-ALIGNED)

For admin views displaying audit logs:

```typescript
interface AuditLog {
  id: string;
  tenantId: string;
  actorId: string;
  actorEmail: string;
  action: string;           // e.g., 'listing.published'
  targetType: string;       // e.g., 'listing'
  targetId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  metadata: {
    ip?: string;
    userAgent?: string;
    correlationId?: string;
    traceId?: string;
  };
  createdAt: string;
}
```

---

## 23.7 MEDIA UPLOAD CONTRACT (BACKEND-ALIGNED)

Two-step presigned URL flow:

```typescript
// Step 1: Request presigned URL
interface PresignedUrlRequest {
  filename: string;
  mimeType: string;
  size: number;
  ownerType: 'listing' | 'vendor' | 'user';
  ownerId: string;
}

interface PresignedUrlResponse {
  mediaId: string;
  uploadUrl: string;
  expiresAt: string;
}

// Step 2: Confirm upload (REQUIRED)
interface ConfirmUploadRequest {
  mediaId: string;
}

// Usage
async function uploadMedia(file: File, ownerId: string, ownerType: string) {
  // 1. Get presigned URL
  const { data } = await api.post<PresignedUrlResponse>('/media/presigned-url', {
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    ownerType,
    ownerId,
  });
  
  // 2. Upload to S3
  await fetch(data.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  
  // 3. Confirm upload (CRITICAL - do not skip!)
  await api.post(`/media/${data.mediaId}/confirm`);
  
  return data.mediaId;
}
```

---

## 23.8 FILTER SERIALIZATION CONTRACT

Filter format for search/list endpoints:

```typescript
interface FilterValue {
  // Exact match
  eq?: string | number | boolean;
  // Not equal
  ne?: string | number;
  // Range
  gte?: number;
  lte?: number;
  gt?: number;
  lt?: number;
  // Array contains
  in?: (string | number)[];
  // Text search
  contains?: string;
  // Null check
  isNull?: boolean;
}

interface Filters {
  [field: string]: FilterValue | Filters; // Nested for attributes
}

// Example
const filters: Filters = {
  status: { eq: 'PUBLISHED' },
  price: { gte: 100000, lte: 500000 },
  'attributes.bedrooms': { gte: 3 },
  'attributes.propertyType': { in: ['condominium', 'apartment'] },
};

// Serialization
function serializeFilters(filters: Filters): string {
  return encodeURIComponent(JSON.stringify(filters));
}

// API call
const response = await api.get('/listings', {
  params: {
    filters: serializeFilters(filters),
    page: 1,
    pageSize: 20,
    sort: 'createdAt:desc',
  },
});
```

---

## 23.9 EXECUTION DIRECTIVE

All frontend code must:
- Use exact enum values from this document
- Handle all error codes appropriately
- Follow API response contracts precisely
- Implement complete media upload flow
- Serialize filters in expected format

Backend alignment is non-negotiable.

END OF WEB PART 23.
