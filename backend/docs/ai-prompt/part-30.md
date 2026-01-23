# PART 30 — API ENDPOINT SPECIFICATIONS (LOCKED)

This part defines the **authoritative API endpoint specifications** for all core modules.
All implementations must conform exactly to these contracts.

All rules from PART 0–29 apply.

---

## 30.1 API DESIGN PRINCIPLES

Rules:
- RESTful resource-oriented design
- Versioned endpoints (`/api/v1/...`)
- Consistent response shapes
- Pagination for all list endpoints
- Idempotency keys for mutations
- OpenAPI/Swagger generated from code

---

## 30.2 COMMON RESPONSE SHAPES

### Success Response (Single)
```json
{
  "data": { ... },
  "meta": {
    "requestId": "uuid"
  }
}
```

### Success Response (List)
```json
{
  "data": [ ... ],
  "meta": {
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 150,
      "totalPages": 8
    }
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

## 30.3 COMMON QUERY PARAMETERS

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (1-based) |
| `pageSize` | number | Items per page (max 100) |
| `sort` | string | Sort field and direction (e.g., `createdAt:desc`) |
| `q` | string | Search query |
| `fields` | string | Comma-separated fields to include |

---

## 30.4 AUTH ENDPOINTS

### POST /api/v1/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Response (200):**
```json
{
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### POST /api/v1/auth/refresh
Refresh access token.

### POST /api/v1/auth/logout
Invalidate session.

### GET /api/v1/auth/me
Get current user profile with tenant memberships.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "memberships": [
      {
        "tenantId": "uuid",
        "tenantName": "Acme Realty",
        "roles": ["tenant_admin"],
        "vendorId": null
      }
    ]
  }
}
```

---

## 30.5 TENANT ENDPOINTS

### GET /api/v1/platform/tenants
List all tenants (platform admin only).

**Query Parameters:**
- `status`: Filter by status
- `q`: Search by name

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Acme Realty",
      "slug": "acme-realty",
      "status": "ACTIVE",
      "enabledVerticals": ["real_estate"],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

### POST /api/v1/platform/tenants
Create a new tenant.

**Request:**
```json
{
  "name": "Acme Realty",
  "slug": "acme-realty",
  "enabledVerticals": ["real_estate"],
  "adminEmail": "admin@acme.com"
}
```

### GET /api/v1/platform/tenants/:tenantId
Get tenant details.

### PATCH /api/v1/platform/tenants/:tenantId
Update tenant.

### POST /api/v1/platform/tenants/:tenantId/suspend
Suspend tenant.

**Request:**
```json
{
  "reason": "Payment overdue"
}
```

### POST /api/v1/platform/tenants/:tenantId/reactivate
Reactivate tenant.

---

## 30.6 VENDOR ENDPOINTS

### GET /api/v1/vendors
List vendors for current tenant.

**Query Parameters:**
- `status`: Filter by status
- `q`: Search by name

### POST /api/v1/vendors
Create vendor (self-registration or by admin).

**Request:**
```json
{
  "name": "Premium Properties",
  "slug": "premium-properties",
  "email": "contact@premium.com",
  "phone": "+60123456789",
  "description": "Leading property agent...",
  "verificationData": { ... }
}
```

### GET /api/v1/vendors/:vendorId
Get vendor details.

### PATCH /api/v1/vendors/:vendorId
Update vendor profile.

### POST /api/v1/vendors/:vendorId/approve
Approve vendor (tenant admin only).

**Request:**
```json
{
  "note": "Verification documents checked"
}
```

### POST /api/v1/vendors/:vendorId/reject
Reject vendor.

**Request:**
```json
{
  "reason": "Invalid business registration"
}
```

### POST /api/v1/vendors/:vendorId/suspend
Suspend vendor.

---

## 30.7 LISTING ENDPOINTS

### GET /api/v1/listings
List listings with filters.

**Query Parameters:**
- `status`: Filter by status
- `verticalType`: Filter by vertical
- `vendorId`: Filter by vendor
- `q`: Search query
- `attributes[propertyType]`: Vertical-specific filter
- `attributes[bedrooms][min]`: Range filter
- `attributes[bedrooms][max]`: Range filter
- `price[min]`: Price range
- `price[max]`: Price range
- `location[lat]`: Geo search center
- `location[lng]`: Geo search center
- `location[radius]`: Geo search radius (km)

### POST /api/v1/listings
Create a new listing.

**Request:**
```json
{
  "verticalType": "real_estate",
  "title": "Modern 3BR Condo",
  "description": "Beautiful condo...",
  "price": 850000,
  "currency": "MYR",
  "location": {
    "address": "Jalan Ampang",
    "city": "Kuala Lumpur",
    "state": "WP",
    "country": "MY",
    "lat": 3.1569,
    "lng": 101.7123
  },
  "attributes": {
    "propertyType": "condominium",
    "listingType": "sale",
    "bedrooms": 3,
    "bathrooms": 2,
    "builtUpSize": 1450
  }
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "status": "DRAFT",
    "slug": "modern-3br-condo-uuid",
    ...
  }
}
```

### GET /api/v1/listings/:listingId
Get listing details.

### PATCH /api/v1/listings/:listingId
Update listing.

### POST /api/v1/listings/:listingId/publish
Publish listing.

**Response (200):** Updated listing with `status: "PUBLISHED"`

**Error (400):** Validation errors for missing required-for-publish fields
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cannot publish: missing required fields",
    "details": [
      { "field": "attributes.builtUpSize", "message": "Required for publishing" }
    ]
  }
}
```

### POST /api/v1/listings/:listingId/unpublish
Unpublish listing.

### POST /api/v1/listings/:listingId/archive
Archive listing.

### DELETE /api/v1/listings/:listingId
Soft delete listing.

---

## 30.8 MEDIA ENDPOINTS

### POST /api/v1/media/upload-url
Get presigned upload URL.

**Request:**
```json
{
  "filename": "photo.jpg",
  "mimeType": "image/jpeg",
  "size": 1048576,
  "ownerType": "listing",
  "ownerId": "uuid"
}
```

**Response (200):**
```json
{
  "data": {
    "mediaId": "uuid",
    "uploadUrl": "https://s3.../presigned-url",
    "expiresAt": "2025-01-01T01:00:00Z"
  }
}
```

### POST /api/v1/media/:mediaId/confirm
Confirm upload completed.

### GET /api/v1/media
List media for an owner.

**Query Parameters:**
- `ownerType`: listing, vendor, user
- `ownerId`: Owner ID

### DELETE /api/v1/media/:mediaId
Delete media.

### PATCH /api/v1/media/:mediaId/order
Update media sort order.

**Request:**
```json
{
  "sortOrder": 2
}
```

---

## 30.9 INTERACTION ENDPOINTS

### GET /api/v1/interactions
List interactions (leads/enquiries/bookings).

**Query Parameters:**
- `listingId`: Filter by listing
- `status`: Filter by status
- `interactionType`: lead, enquiry, booking
- `dateFrom`: Date range start
- `dateTo`: Date range end

### POST /api/v1/interactions (Public)
Create interaction (lead capture).

**Request:**
```json
{
  "listingId": "uuid",
  "interactionType": "LEAD",
  "contactName": "Jane Doe",
  "contactEmail": "jane@example.com",
  "contactPhone": "+60123456789",
  "message": "I'm interested in this property..."
}
```

### GET /api/v1/interactions/:interactionId
Get interaction details.

### PATCH /api/v1/interactions/:interactionId/status
Update interaction status.

**Request:**
```json
{
  "status": "CONTACTED",
  "note": "Called and scheduled viewing"
}
```

### POST /api/v1/interactions/:interactionId/booking/confirm
Confirm booking (for booking type).

### POST /api/v1/interactions/:interactionId/booking/reject
Reject booking.

---

## 30.10 REVIEW ENDPOINTS

### GET /api/v1/reviews
List reviews.

**Query Parameters:**
- `targetType`: vendor, listing
- `targetId`: Target ID
- `status`: Filter by moderation status
- `rating`: Filter by rating

### POST /api/v1/reviews
Create review.

**Request:**
```json
{
  "targetType": "vendor",
  "targetId": "uuid",
  "rating": 4,
  "title": "Great service",
  "content": "Very professional..."
}
```

### GET /api/v1/reviews/:reviewId
Get review details.

### POST /api/v1/reviews/:reviewId/approve
Approve review (admin).

### POST /api/v1/reviews/:reviewId/reject
Reject review (admin).

**Request:**
```json
{
  "reason": "Contains inappropriate content"
}
```

### POST /api/v1/reviews/:reviewId/respond
Vendor response to review.

**Request:**
```json
{
  "responseText": "Thank you for your feedback..."
}
```

---

## 30.11 SUBSCRIPTION & PLAN ENDPOINTS

### GET /api/v1/plans
List available plans.

### GET /api/v1/plans/:planId
Get plan details with entitlements.

### GET /api/v1/subscription
Get current tenant subscription.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "planId": "uuid",
    "planName": "Professional",
    "status": "ACTIVE",
    "currentPeriodStart": "2025-01-01T00:00:00Z",
    "currentPeriodEnd": "2025-02-01T00:00:00Z",
    "entitlements": {
      "listings.limit": 50,
      "listings.featured.limit": 5,
      "verticals": ["real_estate", "vehicles"]
    }
  }
}
```

### POST /api/v1/subscription/change-plan
Request plan change.

---

## 30.12 ENTITLEMENT & USAGE ENDPOINTS

### GET /api/v1/entitlements
Get resolved entitlements for current tenant.

**Response (200):**
```json
{
  "data": {
    "tenantId": "uuid",
    "entitlements": {
      "listing.create": true,
      "listing.create.limit": 50,
      "listing.create.real_estate": true,
      "listing.create.vehicles": false,
      "listing.featured": true,
      "analytics.advanced": false
    },
    "computedAt": "2025-01-01T00:00:00Z"
  }
}
```

### GET /api/v1/usage
Get usage counters for current tenant.

**Response (200):**
```json
{
  "data": {
    "tenantId": "uuid",
    "period": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-02-01T00:00:00Z"
    },
    "counters": {
      "listing.create": { "used": 35, "limit": 50 },
      "listing.create.real_estate": { "used": 30, "limit": null },
      "interaction.lead": { "used": 150, "limit": 500 },
      "media.upload.bytes": { "used": 524288000, "limit": 1073741824 }
    }
  }
}
```

---

## 30.13 VERTICAL REGISTRY ENDPOINTS

### GET /api/v1/verticals
List available verticals (for tenant).

**Response (200):**
```json
{
  "data": [
    {
      "verticalType": "real_estate",
      "displayName": "Real Estate",
      "description": "Property listings",
      "isEnabled": true,
      "schemaVersions": ["1.0"]
    }
  ]
}
```

### GET /api/v1/verticals/:verticalType/schema
Get attribute schema for a vertical.

**Query Parameters:**
- `version`: Schema version (default: latest)

**Response (200):**
```json
{
  "data": {
    "verticalType": "real_estate",
    "schemaVersion": "1.0",
    "attributes": [ ... ],
    "groups": [ ... ],
    "requiredForDraft": [ ... ],
    "requiredForPublish": [ ... ]
  }
}
```

### GET /api/v1/verticals/:verticalType/search-mapping
Get search mapping for a vertical.

---

## 30.14 SEARCH ENDPOINTS

### GET /api/v1/search/listings
Search listings (public or tenant-scoped).

**Query Parameters:**
- All listing filters (see 30.7)
- `highlight`: boolean - include highlight snippets

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Modern 3BR Condo",
      "highlights": {
        "title": ["Modern <em>3BR</em> Condo"]
      },
      ...
    }
  ],
  "meta": {
    "pagination": { ... },
    "facets": {
      "propertyType": [
        { "value": "condominium", "count": 45 },
        { "value": "apartment", "count": 32 }
      ]
    }
  }
}
```

---

## 30.15 ANALYTICS ENDPOINTS

### GET /api/v1/analytics/dashboard
Get dashboard summary metrics.

**Query Parameters:**
- `period`: day, week, month, year
- `dateFrom`: Start date
- `dateTo`: End date

### GET /api/v1/analytics/listings
Get listing performance metrics.

### GET /api/v1/analytics/interactions
Get interaction metrics.

---

## 30.16 AUDIT LOG ENDPOINTS

### GET /api/v1/audit-logs
List audit logs.

**Query Parameters:**
- `targetType`: Filter by target type
- `targetId`: Filter by target ID
- `action`: Filter by action
- `actorId`: Filter by actor
- `dateFrom`: Date range
- `dateTo`: Date range

---

## 30.17 FEATURE FLAG ENDPOINTS (PLATFORM ADMIN)

### GET /api/v1/platform/feature-flags
List feature flags.

### PATCH /api/v1/platform/feature-flags/:key
Update feature flag.

**Request:**
```json
{
  "enabled": true,
  "percentage": 50,
  "tenantIds": ["uuid1", "uuid2"]
}
```

---

## 30.18 OPS ENDPOINTS (PLATFORM ADMIN)

### POST /api/v1/platform/ops/reindex
Trigger search reindex.

**Request:**
```json
{
  "scope": "tenant",
  "tenantId": "uuid",
  "verticalType": "real_estate"
}
```

### POST /api/v1/platform/ops/refresh-entitlements
Refresh entitlements cache.

**Request:**
```json
{
  "tenantId": "uuid"
}
```

### GET /api/v1/platform/ops/jobs
List background job status.

### POST /api/v1/platform/ops/jobs/:jobId/retry
Retry failed job.

---

## 30.19 NOTIFICATION ENDPOINTS

### GET /api/v1/notifications
List notifications for current user.

**Query Parameters:**
- `unreadOnly`: boolean

### PATCH /api/v1/notifications/:notificationId/read
Mark notification as read.

### POST /api/v1/notifications/mark-all-read
Mark all notifications as read.

---

## 30.20 ERROR CODES

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_CREDENTIALS` | 401 | Login failed |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized for action |
| `ENTITLEMENT_DENIED` | 403 | Plan does not allow action |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

END OF PART 30.
