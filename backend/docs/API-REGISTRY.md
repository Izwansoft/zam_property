# Zam-Property Backend API Registry

> **This document tracks ALL implemented API endpoints.**  
> Update this file after implementing any endpoint.

---

## 📋 Summary

| Module | Endpoints | Status |
|--------|-----------|--------|
| Health | 5 | ✅ Implemented |
| Auth | 3 | ✅ Implemented |
| Users | 6 | ✅ Implemented |
| Tenants | 0 | ⏳ Pending |
| Vendors | 12 | ✅ Implemented |
| Listings | 13 | ✅ Implemented |
| Search | 2 | ✅ Implemented |
| Media | 6 | ✅ Implemented |
| Interactions | 6 | ✅ Implemented |
| Reviews | 7 | ✅ Implemented |
| Plans | 7 | ✅ Implemented |
| Subscriptions | 7 | ✅ Implemented |
| Webhooks | 1 | ✅ Implemented |
| Pricing | 11 | ✅ Implemented |
| Notifications | 3 | ✅ Implemented |
| Verticals | 14 | ✅ Implemented |
| Real Estate | 4 | ✅ Implemented |
| WebSocket | 3 namespaces | ✅ Implemented |
| Analytics | 3 | ✅ Implemented |
| Admin | 38 | ✅ Implemented |
| Public | 3 | ✅ Implemented |
| Audit | 6 | ✅ Implemented |
| Occupants | 13 | ✅ Implemented |
| Tenancies | 13 | ✅ Implemented |
| Contracts | 20 | ✅ Implemented |
| Deposits | 13 | ✅ Implemented |
| Rent Billing | 15 | ✅ Implemented |
| Rent Payment | 6 | ✅ Implemented |
| Reconciliation | 7 | ✅ Implemented |
| Tenancy Statement | 1 | ✅ Implemented |
| Owner Payouts | 7 | ✅ Implemented |
| Financial Reports | 3 | ✅ Implemented |
| Company | 9 | ✅ Implemented |
| Agent | 10 | ✅ Implemented |
| Commission | 8 | ✅ Implemented |
| Affiliate | 13 | ✅ Implemented |
| Legal | 14 | ✅ Implemented |
| **Total** | **310** | |

---

## 📐 Conventions

### URL Structure
```
/api/v1/{resource}                         # Collection
/api/v1/{resource}/{id}                    # Single resource
/api/v1/{resource}/{id}/{sub-resource}     # Nested resource
/api/v1/{resource}/{id}/actions/{action}   # Custom action
```

### Naming Rules
| Type | Convention | Example |
|------|------------|---------|
| URL paths | `kebab-case` | `/vendor-profiles`, `/listing-media` |
| Query params | `camelCase` | `?pageSize=20&sortBy=createdAt` |
| Request body | `camelCase` | `{ "vendorId": "uuid" }` |
| Response body | `camelCase` | `{ "createdAt": "2025-01-01T00:00:00Z" }` |
| Enum values | `SCREAMING_SNAKE` | `"status": "PUBLISHED"` |
| Dates | ISO 8601 | `"2025-01-01T00:00:00Z"` |

### HTTP Methods
| Method | Purpose | Success Code |
|--------|---------|--------------|
| GET | Read resource(s) | 200 |
| POST | Create resource | 201 |
| PUT | Full update | 200 |
| PATCH | Partial update | 200 |
| DELETE | Remove resource | 204 |

### Query Parameters (Pagination)
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `pageSize` | number | 20 | Items per page (max: 100) |
| `sortBy` | string | `createdAt` | Sort field |
| `sortOrder` | string | `desc` | `asc` or `desc` |

### Standard Response Format

#### Success (Single Resource)
```json
{
  "data": {
    "id": "uuid",
    "...": "..."
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

#### Success (Collection)
```json
{
  "data": [
    { "id": "uuid", "...": "..." }
  ],
  "meta": {
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 100,
      "totalPages": 5
    }
  }
}
```

#### Error Response
```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": []
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

---

## 🔍 Search Module

### GET /api/v1/search/listings
Search listings with full-text search, filters, facets, and geo-distance queries.

**Permission:** Public (tenant-scoped, returns only PUBLISHED listings unless vendor-owned)
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution |
| `X-Request-ID` | ❌ | `uuid` | Optional request ID for tracing |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Full-text search query (searches title, description, location.address) |
| `verticalType` | string | Filter by vertical type (e.g., real_estate, automotive, jobs) |
| `status` | string | Filter by status (DRAFT, PUBLISHED, EXPIRED, ARCHIVED) - defaults to PUBLISHED for public |
| `priceMin` | number | Minimum price (inclusive) |
| `priceMax` | number | Maximum price (inclusive) |
| `city` | string | Filter by city name |
| `state` | string | Filter by state name |
| `country` | string | Filter by country name |
| `lat` | number | Latitude for geo-distance search (requires lng and radius) |
| `lng` | number | Longitude for geo-distance search (requires lat and radius) |
| `radius` | number | Search radius in kilometers (requires lat and lng) |
| `vendorId` | uuid | Filter by vendor ID |
| `featuredOnly` | boolean | Filter only featured listings (default: false) |
| `sort` | string | Sort field: relevance, price:asc, price:desc, newest, oldest, title:asc, title:desc (default: relevance if q provided, else newest) |
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 20, max: 100) |
| `highlight` | boolean | Enable search term highlighting (default: true) |
| `attr.*` | various | Dynamic attribute filters (e.g., attr.bedrooms=3, attr.propertyType=condo,apartment) |

**Dynamic Attribute Filter Examples:**
- `attr.bedrooms=3` - Single value filter (term query)
- `attr.propertyType=condo,apartment` - Multiple values (terms query with comma-separated values)
- `attr.pricePerSqft[gte]=500` - Range filter (greater than or equal)
- `attr.pricePerSqft[lte]=1000` - Range filter (less than or equal)

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "vendorId": "uuid",
      "verticalType": "real_estate",
      "status": "PUBLISHED",
      "title": "Beautiful Condo in KL",
      "description": "Spacious 3-bedroom condo...",
      "slug": "beautiful-condo-in-kl",
      "price": 500000,
      "currency": "MYR",
      "location": {
        "address": "123 Jalan Ampang",
        "city": "Kuala Lumpur",
        "state": "Selangor",
        "country": "Malaysia",
        "postalCode": "50450",
        "coordinates": {
          "lat": 3.1569,
          "lon": 101.7123
        }
      },
      "attributes": {
        "bedrooms": 3,
        "bathrooms": 2,
        "propertyType": "condo",
        "furnishing": "fully_furnished"
      },
      "isFeatured": true,
      "featuredUntil": "2025-02-01T00:00:00Z",
      "primaryImageUrl": "https://cdn.example.com/listings/uuid/image.jpg",
      "mediaCount": 10,
      "vendor": {
        "id": "uuid",
        "name": "Premium Properties",
        "slug": "premium-properties"
      },
      "publishedAt": "2025-01-15T00:00:00Z",
      "expiresAt": "2025-02-15T00:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-15T00:00:00Z",
      "_highlight": {
        "title": "<mark>Beautiful</mark> Condo in KL",
        "description": "Spacious 3-bedroom <mark>condo</mark>..."
      }
    }
  ],
  "meta": {
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 156,
      "totalPages": 8
    },
    "facets": {
      "verticalTypes": {
        "buckets": [
          { "key": "real_estate", "doc_count": 120 },
          { "key": "automotive", "doc_count": 36 }
        ]
      },
      "cities": {
        "buckets": [
          { "key": "Kuala Lumpur", "doc_count": 85 },
          { "key": "Penang", "doc_count": 42 }
        ]
      },
      "states": {
        "buckets": [
          { "key": "Selangor", "doc_count": 90 },
          { "key": "Penang", "doc_count": 42 }
        ]
      },
      "priceRanges": {
        "buckets": [
          { "key": "0-100000", "from": 0, "to": 100000, "doc_count": 25 },
          { "key": "100000-300000", "from": 100000, "to": 300000, "doc_count": 45 },
          { "key": "300000-500000", "from": 300000, "to": 500000, "doc_count": 38 },
          { "key": "500000-1000000", "from": 500000, "to": 1000000, "doc_count": 32 },
          { "key": "1000000+", "from": 1000000, "doc_count": 16 }
        ]
      },
      "propertyTypes": {
        "buckets": [
          { "key": "condo", "doc_count": 55 },
          { "key": "apartment", "doc_count": 40 },
          { "key": "landed", "doc_count": 25 }
        ]
      },
      "bedrooms": {
        "buckets": [
          { "key": "3", "doc_count": 60 },
          { "key": "2", "doc_count": 40 },
          { "key": "4", "doc_count": 20 }
        ]
      },
      "bathrooms": {
        "buckets": [
          { "key": "2", "doc_count": 75 },
          { "key": "3", "doc_count": 30 },
          { "key": "1", "doc_count": 15 }
        ]
      },
      "furnishing": {
        "buckets": [
          { "key": "fully_furnished", "doc_count": 70 },
          { "key": "partially_furnished", "doc_count": 35 },
          { "key": "unfurnished", "doc_count": 15 }
        ]
      },
      "listingType": {
        "buckets": [
          { "key": "sale", "doc_count": 80 },
          { "key": "rent", "doc_count": 40 }
        ]
      }
    }
  }
}
```

**Notes:**
- Full-text search uses multi-match query across title^3, title.raw^2, description, location.address with AUTO fuzziness
- Autocomplete analyzer uses edge_ngram (2-20 characters) for prefix matching
- Geo-distance queries require all three parameters: lat, lng, radius
- Facets returned depend on verticalType (real_estate facets shown above)
- Highlighting uses `<mark>` tags for matched terms
- All queries are tenant-scoped (index per tenant strategy: listings-{tenantId})
- Only PUBLISHED or EXPIRED listings are indexed (DRAFT/ARCHIVED excluded)
- Vendor data is denormalized in search documents for performance

**Error Codes:**
- `VAL_INVALID_QUERY` - Invalid query parameters
- `SEARCH_GEO_INCOMPLETE` - Geo-distance requires lat, lng, and radius
- `SEARCH_INDEX_ERROR` - OpenSearch index error

---

### GET /api/v1/search/suggestions
Get autocomplete suggestions for search queries.

**Permission:** Public (tenant-scoped)
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution |
| `X-Request-ID` | ❌ | `uuid` | Optional request ID for tracing |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | **Required.** Search prefix (minimum 2 characters) |
| `limit` | number | Maximum suggestions to return (default: 10, max: 50) |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Beautiful Condo in KL",
      "slug": "beautiful-condo-in-kl",
      "verticalType": "real_estate",
      "price": 500000,
      "currency": "MYR"
    },
    {
      "id": "uuid",
      "title": "Beautiful Apartment in Penang",
      "slug": "beautiful-apartment-in-penang",
      "verticalType": "real_estate",
      "price": 350000,
      "currency": "MYR"
    }
  ],
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Uses prefix query on title.keyword field for fast autocomplete
- Results sorted by relevance (_score)
- Returns only PUBLISHED or EXPIRED listings
- Tenant-scoped (searches within tenant's index only)

**Error Codes:**
- `VAL_INVALID_QUERY` - Missing or invalid query parameters
- `VAL_QUERY_TOO_SHORT` - Query must be at least 2 characters

---

## 📁 Media Module

### POST /api/v1/media/request-upload
Request presigned URL for file upload.

**Permission:** Authenticated (tenant-scoped)
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution |
| `Authorization` | ✅ | `Bearer {token}` | JWT token |

**Request Body:**
```json
{
  "filename": "house-photo.jpg",
  "mimeType": "image/jpeg",
  "size": 2048576,
  "ownerType": "listing",
  "ownerId": "uuid",
  "visibility": "PUBLIC"
}
```

**Success Response (200):**
```json
{
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/bucket/media/tenant-id/listing/uuid/file.jpg?X-Amz-...",
    "storageKey": "media/tenant-id/listing/uuid/abc123.jpg",
    "expiresAt": "2026-01-20T10:00:00Z",
    "mediaId": "uuid"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Upload flow: Request presigned URL → Upload to S3 → Confirm upload
- Presigned URLs expire after 1 hour (3600 seconds)
- Media record created in PENDING status
- File size limits: 10MB (images), 100MB (videos), 20MB (documents)
- Allowed MIME types:
  - Images: image/jpeg, image/png, image/webp, image/gif
  - Videos: video/mp4, video/quicktime, video/x-msvideo
  - Documents: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
- Storage key format: media/{tenantId}/{ownerType}/{ownerId}/{uuid}{ext}
- Owner types: listing, vendor, user
- Visibility: PUBLIC (served via CDN), PRIVATE (presigned download URLs)

**Error Codes:**
- `VAL_INVALID_FILE_TYPE` - Unsupported MIME type
- `VAL_FILE_TOO_LARGE` - File size exceeds limit for media type

---

### POST /api/v1/media/:id/confirm-upload
Confirm upload completion after S3 upload.

**Permission:** Authenticated (tenant-scoped)
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution |
| `Authorization` | ✅ | `Bearer {token}` | JWT token |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Media ID from request-upload response |

**Request Body:**
```json
{
  "storageKey": "media/tenant-id/listing/uuid/abc123.jpg"
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "ownerType": "listing",
    "ownerId": "uuid",
    "filename": "house-photo.jpg",
    "mimeType": "image/jpeg",
    "size": 2048576,
    "mediaType": "IMAGE",
    "storageKey": "media/tenant-id/listing/uuid/abc123.jpg",
    "cdnUrl": "https://cdn.example.com/media/tenant-id/listing/uuid/abc123.jpg",
    "thumbnailKey": null,
    "thumbnailUrl": null,
    "processingStatus": "COMPLETED",
    "metadata": {
      "size": 2048576,
      "contentType": "image/jpeg"
    },
    "visibility": "PUBLIC",
    "sortOrder": 0,
    "isPrimary": false,
    "createdAt": "2026-01-20T09:00:00Z",
    "updatedAt": "2026-01-20T09:01:00Z",
    "deletedAt": null
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Verifies storage key matches media record
- Verifies object exists in S3
- Updates media status from PENDING to COMPLETED
- Sets cdnUrl for PUBLIC media
- Retrieves file metadata from S3 (size, content-type)

**Error Codes:**
- `MEDIA_NOT_FOUND` - Media record not found
- `VAL_STORAGE_KEY_MISMATCH` - Storage key doesn't match media record
- `MEDIA_NOT_FOUND_IN_STORAGE` - File not found in S3

---

### GET /api/v1/media
List media (paginated, filtered).

**Permission:** Authenticated (tenant-scoped)
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution |
| `Authorization` | ✅ | `Bearer {token}` | JWT token |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `ownerType` | string | Filter by owner type (listing, vendor, user) |
| `ownerId` | uuid | Filter by owner ID |
| `mediaType` | enum | Filter by media type (IMAGE, VIDEO, DOCUMENT) |
| `visibility` | enum | Filter by visibility (PUBLIC, PRIVATE) |
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 20, max: 100) |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "ownerType": "listing",
      "ownerId": "uuid",
      "filename": "house-photo.jpg",
      "mimeType": "image/jpeg",
      "size": 2048576,
      "mediaType": "IMAGE",
      "storageKey": "media/tenant-id/listing/uuid/abc123.jpg",
      "cdnUrl": "https://cdn.example.com/media/tenant-id/listing/uuid/abc123.jpg",
      "thumbnailKey": null,
      "thumbnailUrl": null,
      "processingStatus": "COMPLETED",
      "metadata": {
        "width": 1920,
        "height": 1080
      },
      "visibility": "PUBLIC",
      "sortOrder": 0,
      "isPrimary": true,
      "createdAt": "2026-01-20T09:00:00Z",
      "updatedAt": "2026-01-20T09:01:00Z",
      "deletedAt": null
    }
  ],
  "meta": {
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 45,
      "totalPages": 3
    }
  }
}
```

**Notes:**
- Returns media ordered by sortOrder (ascending), then createdAt (descending)
- Excludes soft-deleted media
- Tenant-scoped (only returns media for current tenant)
- Supports filtering by multiple criteria

---

### GET /api/v1/media/:id
Get media by ID.

**Permission:** Authenticated (tenant-scoped)
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution |
| `Authorization` | ✅ | `Bearer {token}` | JWT token |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Media ID |

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "ownerType": "listing",
    "ownerId": "uuid",
    "filename": "house-photo.jpg",
    "mimeType": "image/jpeg",
    "size": 2048576,
    "mediaType": "IMAGE",
    "storageKey": "media/tenant-id/listing/uuid/abc123.jpg",
    "cdnUrl": "https://cdn.example.com/media/tenant-id/listing/uuid/abc123.jpg",
    "thumbnailKey": "media/tenant-id/listing/uuid/abc123-thumb.jpg",
    "thumbnailUrl": "https://cdn.example.com/media/tenant-id/listing/uuid/abc123-thumb.jpg",
    "processingStatus": "COMPLETED",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "JPEG"
    },
    "visibility": "PUBLIC",
    "sortOrder": 0,
    "isPrimary": true,
    "createdAt": "2026-01-20T09:00:00Z",
    "updatedAt": "2026-01-20T09:01:00Z",
    "deletedAt": null
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Error Codes:**
- `MEDIA_NOT_FOUND` - Media not found or doesn't belong to tenant

---

### PATCH /api/v1/media/:id
Update media metadata.

**Permission:** Authenticated (tenant-scoped, ownership verified)
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution |
| `Authorization` | ✅ | `Bearer {token}` | JWT token |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Media ID |

**Request Body:**
```json
{
  "sortOrder": 1,
  "isPrimary": true,
  "visibility": "PRIVATE",
  "metadata": {
    "altText": "Beautiful 3-bedroom condo exterior view",
    "caption": "Main entrance"
  }
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "ownerType": "listing",
    "ownerId": "uuid",
    "filename": "house-photo.jpg",
    "mimeType": "image/jpeg",
    "size": 2048576,
    "mediaType": "IMAGE",
    "storageKey": "media/tenant-id/listing/uuid/abc123.jpg",
    "cdnUrl": null,
    "thumbnailKey": null,
    "thumbnailUrl": null,
    "processingStatus": "COMPLETED",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "altText": "Beautiful 3-bedroom condo exterior view",
      "caption": "Main entrance"
    },
    "visibility": "PRIVATE",
    "sortOrder": 1,
    "isPrimary": true,
    "createdAt": "2026-01-20T09:00:00Z",
    "updatedAt": "2026-01-20T09:05:00Z",
    "deletedAt": null
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Only updates provided fields
- Cannot change ownerType, ownerId, or storageKey
- Changing visibility from PUBLIC to PRIVATE removes cdnUrl
- Metadata field is merged with existing metadata

**Error Codes:**
- `MEDIA_NOT_FOUND` - Media not found or doesn't belong to tenant

---

### DELETE /api/v1/media/:id
Delete media (soft delete).

**Permission:** Authenticated (tenant-scoped, ownership verified)
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution |
| `Authorization` | ✅ | `Bearer {token}` | JWT token |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Media ID |

**Success Response (204):** No content

**Notes:**
- Soft delete: Sets deletedAt timestamp, doesn't remove from database
- Optionally deletes from S3 storage (default: true)
- Physical cleanup can be async via scheduled job
- Deleted media excluded from all queries

**Error Codes:**
- `MEDIA_NOT_FOUND` - Media not found or doesn't belong to tenant

---

## 💬 Interactions Module

The Interactions module manages leads, enquiries, and bookings between customers and vendors. It provides a generic interaction layer that works across all verticals.

### POST /api/v1/interactions
Create a new interaction (lead/enquiry/booking).

**Permission:** `Authenticated` (Customer, Vendor, or System)  
**Status:** ✅ Implemented

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

**Request Body:**
```json
{
  "vendorId": "uuid",
  "listingId": "uuid",
  "verticalType": "real_estate",
  "interactionType": "LEAD" | "ENQUIRY" | "BOOKING",
  "contactName": "John Doe",
  "contactEmail": "john@example.com",
  "contactPhone": "+60123456789",
  "message": "I'm interested in this property",
  "bookingData": {
    "startDate": "2024-01-20",
    "endDate": "2024-01-22",
    "preferredTime": "10:00 AM",
    "quantity": 1
  },
  "source": "web",
  "referrer": "https://google.com"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "vendorId": "uuid",
    "listingId": "uuid",
    "verticalType": "real_estate",
    "interactionType": "LEAD",
    "contactName": "John Doe",
    "contactEmail": "john@example.com",
    "contactPhone": "+60123456789",
    "message": "I'm interested in this property",
    "bookingData": { "startDate": "2024-01-20" },
    "status": "NEW",
    "source": "web",
    "referrer": "https://google.com",
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T10:00:00Z",
    "contactedAt": null,
    "closedAt": null
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Interactions are automatically created with status `NEW`
- Contact information is minimal (PII-safe)
- Booking data is optional and vertical-specific
- Emits `interaction.created` event for notifications/analytics

---

### GET /api/v1/interactions
List interactions with filtering and pagination.

**Permission:** `Authenticated` (Vendors see own interactions, Tenant Admins see all)  
**Status:** ✅ Implemented

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

**Query Parameters:**
```
vendorId: uuid (optional) - Filter by vendor
listingId: uuid (optional) - Filter by listing
interactionType: LEAD|ENQUIRY|BOOKING (optional)
status: NEW|CONTACTED|CONFIRMED|CLOSED|INVALID (optional)
page: number (default: 1)
pageSize: number (default: 20, max: 100)
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "vendorId": "uuid",
      "listingId": "uuid",
      "interactionType": "LEAD",
      "contactName": "John Doe",
      "contactEmail": "john@example.com",
      "status": "NEW",
      "createdAt": "2024-01-20T10:00:00Z",
      "vendor": {
        "id": "uuid",
        "name": "ABC Realty",
        "slug": "abc-realty"
      },
      "listing": {
        "id": "uuid",
        "title": "Modern 3BR Condo",
        "slug": "modern-3br-condo"
      }
    }
  ],
  "meta": {
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

**Notes:**
- Results ordered by createdAt descending (newest first)
- Includes vendor and listing relationships
- Tenant-scoped automatically

---

### GET /api/v1/interactions/:id
Get a single interaction by ID.

**Permission:** `Authenticated` (Vendor or Tenant Admin)  
**Status:** ✅ Implemented

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "vendorId": "uuid",
    "listingId": "uuid",
    "verticalType": "real_estate",
    "interactionType": "LEAD",
    "contactName": "John Doe",
    "contactEmail": "john@example.com",
    "contactPhone": "+60123456789",
    "message": "I'm interested in this property",
    "bookingData": null,
    "status": "CONTACTED",
    "source": "web",
    "referrer": null,
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T11:00:00Z",
    "contactedAt": "2024-01-20T11:00:00Z",
    "closedAt": null,
    "vendor": {
      "id": "uuid",
      "name": "ABC Realty",
      "slug": "abc-realty"
    },
    "listing": {
      "id": "uuid",
      "title": "Modern 3BR Condo",
      "slug": "modern-3br-condo"
    }
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Error Codes:**
- `INTERACTION_NOT_FOUND` - Interaction not found or doesn't belong to tenant

---

### PATCH /api/v1/interactions/:id/status
Update interaction status.

**Permission:** `Vendor Admin/Staff` or `Tenant Admin`  
**Status:** ✅ Implemented

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

**Request Body:**
```json
{
  "status": "CONTACTED" | "CONFIRMED" | "CLOSED" | "INVALID"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "status": "CONTACTED",
    "contactedAt": "2024-01-20T11:00:00Z",
    "updatedAt": "2024-01-20T11:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Valid State Transitions:**
- `NEW` → `CONTACTED` (vendor responds)
- `NEW` → `INVALID` (spam/invalid)
- `CONTACTED` → `CONFIRMED` (booking confirmed)
- `CONTACTED` → `CLOSED` (resolved)
- `CONFIRMED` → `CLOSED` (booking complete)

**Notes:**
- Invalid transitions return `400 Bad Request`
- Status timestamps automatically set (contactedAt, closedAt)
- Emits `interaction.status.updated` event

**Error Codes:**
- `INTERACTION_NOT_FOUND` - Interaction not found
- `INVALID_STATUS_TRANSITION` - Cannot transition from current status to requested status

---

### POST /api/v1/interactions/:id/messages
Add a message to an interaction.

**Permission:** `Authenticated` (Vendor, Customer, or System)  
**Status:** ✅ Implemented

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

**Request Body:**
```json
{
  "senderType": "vendor" | "customer" | "system",
  "senderId": "uuid",
  "senderName": "John Vendor",
  "message": "Thank you for your interest. I'll call you shortly.",
  "isInternal": false
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "interactionId": "uuid",
    "senderType": "vendor",
    "senderId": "uuid",
    "senderName": "John Vendor",
    "message": "Thank you for your interest. I'll call you shortly.",
    "isInternal": false,
    "createdAt": "2024-01-20T11:30:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Internal messages (isInternal: true) not visible to customers
- Messages ordered chronologically
- Emits `interaction.message.added` event

**Error Codes:**
- `INTERACTION_NOT_FOUND` - Interaction not found

---

### GET /api/v1/interactions/:id/messages
Get all messages for an interaction.

**Permission:** `Authenticated` (Vendor or Tenant Admin)  
**Status:** ✅ Implemented

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "interactionId": "uuid",
      "senderType": "customer",
      "senderId": null,
      "senderName": "John Doe",
      "message": "I'm interested in this property",
      "isInternal": false,
      "createdAt": "2024-01-20T10:00:00Z"
    },
    {
      "id": "uuid",
      "interactionId": "uuid",
      "senderType": "vendor",
      "senderId": "uuid",
      "senderName": "Jane Vendor",
      "message": "Thank you for your interest",
      "isInternal": false,
      "createdAt": "2024-01-20T11:00:00Z"
    }
  ],
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Messages ordered by createdAt ascending (chronological)
- Internal messages filtered based on user role
- Customers don't see internal notes

**Error Codes:**
- `INTERACTION_NOT_FOUND` - Interaction not found

---

## ⭐ Reviews Module

The Reviews module manages the platform's trust system through user reviews and ratings. It supports moderation workflows, vendor responses, and rating aggregations.

### POST /api/v1/reviews
Create a new review for a vendor or listing.

**Permission:** `Authenticated` (Customer or System)  
**Status:** ✅ Implemented

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

**Request Body:**
```json
{
  "targetType": "vendor" | "listing",
  "targetId": "uuid",
  "verticalType": "real_estate",
  "reviewerRef": "hash_abc123",
  "rating": 5,
  "title": "Excellent service!",
  "content": "Very professional and helpful. Highly recommended."
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "targetType": "vendor",
    "targetId": "uuid",
    "verticalType": "real_estate",
    "reviewerRef": "hash_abc123",
    "rating": 5,
    "title": "Excellent service!",
    "content": "Very professional and helpful. Highly recommended.",
    "status": "PENDING",
    "moderatedAt": null,
    "moderatedBy": null,
    "moderationNote": null,
    "responseText": null,
    "respondedAt": null,
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Reviews default to `PENDING` status requiring moderation
- `reviewerRef` should be anonymized/hashed for privacy
- Rating must be between 1-5
- Emits `review.created` event

**Error Codes:**
- `VAL_INVALID_RATING` - Rating must be 1-5

---

### GET /api/v1/reviews
Get all reviews with filters and pagination.

**Permission:** `Authenticated`  
**Status:** ✅ Implemented

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

**Query Parameters:**
```
targetType?: vendor | listing
targetId?: uuid
status?: PENDING | APPROVED | REJECTED | FLAGGED
rating?: 1 | 2 | 3 | 4 | 5
page?: number (default: 1)
pageSize?: number (default: 20, max: 100)
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "targetType": "vendor",
      "targetId": "uuid",
      "rating": 5,
      "title": "Great service",
      "content": "Highly recommended",
      "status": "APPROVED",
      "createdAt": "2024-01-20T10:00:00.000Z",
      "vendor": {
        "id": "uuid",
        "name": "Property Solutions",
        "slug": "property-solutions"
      }
    }
  ],
  "meta": {
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**Notes:**
- Results ordered by createdAt desc
- Includes vendor/listing relations
- Supports multiple filters

---

### GET /api/v1/reviews/:id
Get a specific review by ID.

**Permission:** `Authenticated`  
**Status:** ✅ Implemented

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "targetType": "vendor",
    "targetId": "uuid",
    "verticalType": "real_estate",
    "reviewerRef": "hash_abc123",
    "rating": 5,
    "title": "Excellent service!",
    "content": "Very professional and helpful.",
    "status": "APPROVED",
    "moderatedAt": "2024-01-20T11:00:00.000Z",
    "moderatedBy": "admin_uuid",
    "moderationNote": "Verified review",
    "responseText": "Thank you for your feedback!",
    "respondedAt": "2024-01-20T12:00:00.000Z",
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T11:00:00.000Z",
    "vendor": {
      "id": "uuid",
      "name": "Property Solutions",
      "slug": "property-solutions"
    }
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Error Codes:**
- `REVIEW_NOT_FOUND` - Review not found

---

### PATCH /api/v1/reviews/:id/moderate
Moderate a review (approve/reject/flag).

**Permission:** `TENANT_ADMIN` or `SUPER_ADMIN`  
**Status:** ✅ Implemented

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

**Request Body:**
```json
{
  "status": "APPROVED" | "REJECTED" | "FLAGGED",
  "moderationNote": "Verified review"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "moderatedAt": "2024-01-20T11:00:00.000Z",
    "moderatedBy": "admin_uuid",
    "moderationNote": "Verified review"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Valid transitions:
  - `PENDING` → `APPROVED`, `REJECTED`, `FLAGGED`
  - `FLAGGED` → `APPROVED`, `REJECTED`
  - `APPROVED` and `REJECTED` are terminal (cannot change)
- Emits `review.moderated` event
- Moderator ID extracted from JWT

**Error Codes:**
- `REVIEW_NOT_FOUND` - Review not found
- `BIZ_INVALID_TRANSITION` - Invalid status transition

---

### POST /api/v1/reviews/:id/response
Add vendor response to a review.

**Permission:** `VENDOR_ADMIN` or `VENDOR_STAFF` (same vendor)  
**Status:** ✅ Implemented

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

**Request Body:**
```json
{
  "responseText": "Thank you for your feedback! We're glad we could help."
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "responseText": "Thank you for your feedback! We're glad we could help.",
    "respondedAt": "2024-01-20T12:00:00.000Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Only approved reviews can receive responses
- Only the target vendor can respond to their own reviews
- Vendor ID extracted from JWT
- Emits `review.vendor_responded` event

**Error Codes:**
- `REVIEW_NOT_FOUND` - Review not found
- `BIZ_REVIEW_NOT_APPROVED` - Can only respond to approved reviews
- `BIZ_NOT_REVIEW_OWNER` - Vendor can only respond to their own reviews

---

### GET /api/v1/reviews/target/:targetType/:targetId/rating
Get rating aggregation for a target (vendor or listing).

**Permission:** `Public` (No Auth)  
**Status:** ✅ Implemented

**Path Parameters:**
```
targetType: vendor | listing
targetId: uuid
```

**Response:**
```json
{
  "data": {
    "averageRating": 4.5,
    "totalReviews": 120,
    "ratingDistribution": {
      "1": 5,
      "2": 10,
      "3": 15,
      "4": 30,
      "5": 60
    }
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Only counts `APPROVED` reviews
- Average rating rounded to 1 decimal place
- Distribution shows count per rating level (1-5)
- Returns zeros if no approved reviews exist

---

### GET /api/v1/reviews/target/:targetType/:targetId
Get all reviews for a specific target.

**Permission:** `Public` (No Auth)  
**Status:** ✅ Implemented

**Path Parameters:**
```
targetType: vendor | listing
targetId: uuid
```

**Query Parameters:**
```
status?: PENDING | APPROVED | REJECTED | FLAGGED
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "targetType": "vendor",
      "targetId": "uuid",
      "rating": 5,
      "title": "Great service",
      "content": "Highly recommended",
      "status": "APPROVED",
      "responseText": "Thank you!",
      "respondedAt": "2024-01-20T12:00:00.000Z",
      "createdAt": "2024-01-20T10:00:00.000Z"
    }
  ],
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Results ordered by createdAt desc
- Public endpoint typically filters to `APPROVED` only
- Admin/vendor may see all statuses

---

## 💳 Subscriptions & Plans Module

The Subscriptions module manages platform monetization through subscription plans, entitlements, and usage tracking. It provides tenant-level subscription management with declarative entitlements and observational usage metrics.

### POST /api/v1/plans
Create a new subscription plan.

**Permission:** `SUPER_ADMIN` or `TENANT_ADMIN`  
**Status:** ✅ Implemented

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

**Request Body:**
```json
{
  "name": "Professional Plan",
  "slug": "professional",
  "description": "Perfect for growing businesses",
  "priceMonthly": 299.00,
  "priceYearly": 2990.00,
  "currency": "MYR",
  "entitlements": {
    "listings": {
      "limit": 50,
      "verticals": {
        "real_estate": 30,
        "automotive": 20
      }
    },
    "interactions": {
      "limit": 500
    },
    "media": {
      "uploadSizeLimit": 50,
      "storageSizeLimit": 10
    },
    "features": ["analytics", "priority_support"],
    "verticals": ["real_estate", "automotive"],
    "api": {
      "requestsPerMinute": 120
    }
  },
  "isActive": true,
  "isPublic": true
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Professional Plan",
    "slug": "professional",
    "description": "Perfect for growing businesses",
    "priceMonthly": "299.00",
    "priceYearly": "2990.00",
    "currency": "MYR",
    "entitlements": { ... },
    "isActive": true,
    "isPublic": true,
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Slug must be unique
- Prices stored as Decimal(10,2)
- Entitlements stored as JSON for flexibility
- Emits `plan.created` event

**Error Codes:**
- `VAL_INVALID_SLUG` - Slug already exists
- `VAL_INVALID_ENTITLEMENTS` - Invalid entitlements structure

---

### GET /api/v1/plans
List all subscription plans.

**Permission:** `Public` (No Auth)  
**Status:** ✅ Implemented

**Query Parameters:**
```
isActive?: boolean
isPublic?: boolean
page?: number (default: 1)
pageSize?: number (default: 20)
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Starter Plan",
      "slug": "starter",
      "priceMonthly": "99.00",
      "priceYearly": "990.00",
      "currency": "MYR",
      "entitlements": { ... },
      "isActive": true,
      "isPublic": true
    }
  ],
  "meta": {
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

**Notes:**
- Public endpoint shows only active+public plans by default
- Admin can filter by any status

---

### GET /api/v1/plans/:id
Get a specific plan by ID.

**Permission:** `Public` (No Auth)  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Professional Plan",
    "slug": "professional",
    "description": "Perfect for growing businesses",
    "priceMonthly": "299.00",
    "priceYearly": "2990.00",
    "currency": "MYR",
    "entitlements": {
      "listings": { "limit": 50 },
      "interactions": { "limit": 500 },
      "media": {
        "uploadSizeLimit": 50,
        "storageSizeLimit": 10
      }
    },
    "isActive": true,
    "isPublic": true,
    "createdAt": "2024-01-20T10:00:00.000Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Error Codes:**
- `PLAN_NOT_FOUND` - Plan not found

---

### PATCH /api/v1/plans/:id
Update a subscription plan.

**Permission:** `SUPER_ADMIN` or `TENANT_ADMIN`  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "name": "Professional Plan (Updated)",
  "description": "New description",
  "priceMonthly": 349.00,
  "entitlements": { ... }
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Professional Plan (Updated)",
    "updatedAt": "2024-01-20T11:00:00.000Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- All fields optional
- Validates entitlements if provided
- Emits `plan.updated` event

**Error Codes:**
- `PLAN_NOT_FOUND` - Plan not found
- `VAL_INVALID_ENTITLEMENTS` - Invalid entitlements structure

---

### PATCH /api/v1/plans/:id/activate
Activate a subscription plan.

**Permission:** `SUPER_ADMIN` or `TENANT_ADMIN`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "isActive": true,
    "updatedAt": "2024-01-20T11:00:00.000Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Sets `isActive` to true
- Emits `plan.activated` event

**Error Codes:**
- `PLAN_NOT_FOUND` - Plan not found

---

### PATCH /api/v1/plans/:id/deactivate
Deactivate a subscription plan.

**Permission:** `SUPER_ADMIN` or `TENANT_ADMIN`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "isActive": false,
    "updatedAt": "2024-01-20T11:00:00.000Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Sets `isActive` to false
- Prevents deactivation if plan has active subscriptions
- Emits `plan.deactivated` event

**Error Codes:**
- `PLAN_NOT_FOUND` - Plan not found
- `BIZ_PLAN_HAS_ACTIVE_SUBSCRIPTIONS` - Cannot deactivate plan with active subscriptions

---

### DELETE /api/v1/plans/:id
Soft delete a subscription plan (delegates to deactivate).

**Permission:** `SUPER_ADMIN` or `TENANT_ADMIN`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "isActive": false
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Soft delete (sets isActive=false)
- Delegates to deactivate operation

---

### GET /api/v1/subscriptions/current
Get current tenant's subscription.

**Permission:** `Authenticated` (Tenant-scoped)  
**Status:** ✅ Implemented

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "planId": "uuid",
    "status": "ACTIVE",
    "currentPeriodStart": "2024-01-01T00:00:00.000Z",
    "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
    "externalId": "sub_abc123",
    "externalProvider": "stripe",
    "overrides": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "plan": {
      "id": "uuid",
      "name": "Professional Plan",
      "slug": "professional",
      "priceMonthly": "299.00"
    }
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Tenant-scoped via TenantContextService
- Includes plan relation
- Returns 404 if no subscription exists

**Error Codes:**
- `SUBSCRIPTION_NOT_FOUND` - No subscription for tenant

---

### POST /api/v1/subscriptions/assign
Assign a subscription to the current tenant.

**Permission:** `SUPER_ADMIN` or `TENANT_ADMIN`  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "planId": "uuid",
  "currentPeriodStart": "2024-01-01T00:00:00.000Z",
  "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
  "externalId": "sub_abc123",
  "externalProvider": "stripe",
  "overrides": {
    "listings": {
      "limit": 100
    }
  }
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "planId": "uuid",
    "status": "ACTIVE",
    "currentPeriodStart": "2024-01-01T00:00:00.000Z",
    "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
    "externalId": "sub_abc123",
    "externalProvider": "stripe",
    "overrides": { "listings": { "limit": 100 } },
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- One subscription per tenant (unique tenantId)
- Validates plan exists and is active
- Overrides allow enterprise customization
- Emits `subscription.created` event

**Error Codes:**
- `PLAN_NOT_FOUND` - Plan not found
- `BIZ_PLAN_NOT_ACTIVE` - Cannot assign inactive plan
- `BIZ_SUBSCRIPTION_EXISTS` - Tenant already has subscription

---

### PATCH /api/v1/subscriptions/status
Update subscription status.

**Permission:** `SUPER_ADMIN` or `TENANT_ADMIN`  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "status": "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "PAST_DUE",
    "updatedAt": "2024-01-20T11:00:00.000Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Valid transitions (state machine):
  - ACTIVE → PAST_DUE, PAUSED, CANCELLED
  - PAST_DUE → ACTIVE, CANCELLED
  - PAUSED → ACTIVE, CANCELLED
  - CANCELLED → [terminal, no transitions]
- Invalid transitions rejected
- Emits `subscription.status_changed` event

**Error Codes:**
- `SUBSCRIPTION_NOT_FOUND` - No subscription for tenant
- `BIZ_INVALID_TRANSITION` - Invalid status transition

---

### POST /api/v1/subscriptions/change-plan
Change subscription plan (upgrade/downgrade).

**Permission:** `SUPER_ADMIN` or `TENANT_ADMIN`  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "newPlanId": "uuid",
  "effectiveDate": "2024-02-01T00:00:00.000Z"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "planId": "uuid",
    "updatedAt": "2024-01-20T11:00:00.000Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Validates new plan exists and is active
- Prevents changing to same plan
- Emits `subscription.plan_changed` event

**Error Codes:**
- `SUBSCRIPTION_NOT_FOUND` - No subscription for tenant
- `PLAN_NOT_FOUND` - New plan not found
- `BIZ_PLAN_NOT_ACTIVE` - Cannot change to inactive plan
- `BIZ_SAME_PLAN` - Already on this plan

---

### POST /api/v1/subscriptions/cancel
Cancel current subscription.

**Permission:** `SUPER_ADMIN` or `TENANT_ADMIN`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "CANCELLED",
    "cancelledAt": "2024-01-20T11:00:00.000Z",
    "updatedAt": "2024-01-20T11:00:00.000Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Sets status to CANCELLED
- Sets cancelledAt timestamp
- Emits `subscription.cancelled` event
- CANCELLED is terminal state

**Error Codes:**
- `SUBSCRIPTION_NOT_FOUND` - No subscription for tenant

---

### GET /api/v1/subscriptions/entitlements
Get resolved entitlements for current tenant.

**Permission:** `Authenticated` (Tenant-scoped)  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "listings": {
      "limit": 50,
      "verticals": {
        "real_estate": 30,
        "automotive": 20
      }
    },
    "interactions": {
      "limit": 500
    },
    "media": {
      "uploadSizeLimit": 50,
      "storageSizeLimit": 10
    },
    "features": ["analytics", "priority_support"],
    "verticals": ["real_estate", "automotive"],
    "api": {
      "requestsPerMinute": 120
    }
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Checks cache first (1-hour TTL)
- Computes from plan + overrides if cache expired
- Falls back to free tier if no subscription
- Free tier limits:
  - 3 listings max
  - 10 interactions
  - 10MB upload, 1GB storage
  - 30 API requests/min

---

### GET /api/v1/subscriptions/usage
Get usage summary for current tenant.

**Permission:** `Authenticated` (Tenant-scoped)  
**Status:** ✅ Implemented

**Query Parameters:**
```
metricKey?: string (optional, e.g., "listings_created")
```

**Response (200) - All metrics:**
```json
{
  "data": [
    {
      "metricKey": "listings_created",
      "currentPeriod": {
        "count": 35,
        "periodStart": "2024-01-01T00:00:00.000Z",
        "periodEnd": "2024-02-01T00:00:00.000Z"
      },
      "limit": 50,
      "percentage": 70.0
    },
    {
      "metricKey": "interactions_received",
      "currentPeriod": {
        "count": 420,
        "periodStart": "2024-01-01T00:00:00.000Z",
        "periodEnd": "2024-02-01T00:00:00.000Z"
      },
      "limit": 500,
      "percentage": 84.0
    }
  ],
  "meta": {
    "requestId": "uuid"
  }
}
```

**Response (200) - Single metric:**
```json
{
  "data": {
    "metricKey": "listings_created",
    "currentPeriod": {
      "count": 35,
      "periodStart": "2024-01-01T00:00:00.000Z",
      "periodEnd": "2024-02-01T00:00:00.000Z"
    },
    "limit": 50,
    "percentage": 70.0
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Notes:**
- Usage periods are monthly (1st to end of month)
- Percentage = (count / limit) * 100
- Threshold events emitted:
  - `usage.threshold.warning` at 80%
  - `usage.threshold.reached` at 100%

---

## 🏥 Health Module

### GET /api/v1/health
Basic health check endpoint.

**Permission:** Public (No Auth, No Tenant)
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### GET /api/v1/health/redis
Check Redis connection status.

**Permission:** Public (No Auth, No Tenant)
**Status:** ✅ Implemented

**Response (200) - Healthy:**
```json
{
  "status": "ok",
  "redis": {
    "connected": true
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Response (503) - Unhealthy:**
```json
{
  "status": "error",
  "redis": {
    "connected": false
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### GET /api/v1/health/queues
Get queue statistics for all registered queues.

**Permission:** Public (No Auth, No Tenant)
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "status": "ok",
  "queues": {
    "media.process": {
      "waiting": 5,
      "active": 2,
      "completed": 150,
      "failed": 3,
      "delayed": 1,
      "paused": 0
    },
    "search.index": {
      "waiting": 0,
      "active": 0,
      "completed": 500,
      "failed": 0,
      "delayed": 0,
      "paused": 0
    },
    "notification.send": {
      "waiting": 10,
      "active": 5,
      "completed": 1000,
      "failed": 2,
      "delayed": 0,
      "paused": 0
    }
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### GET /api/v1/health/cache
Get cache health and statistics.

**Permission:** Public (No Auth, No Tenant)
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "status": "ok",
  "memory": {
    "hits": 150,
    "misses": 30,
    "keys": 45,
    "hitRate": 83.33
  },
  "redis": {
    "connected": true
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Response (503) - Unhealthy:**
```json
{
  "status": "error",
  "memory": {
    "hits": 0,
    "misses": 0,
    "keys": 0,
    "hitRate": 0
  },
  "redis": {
    "connected": false
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### GET /api/v1/health/config
Get configuration status with secrets masked.

**Permission:** Public (No Auth, No Tenant)
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "status": "ok",
  "config": {
    "app": {
      "name": "zam-property-api",
      "environment": "development",
      "port": 3000,
      "apiPrefix": "api/v1",
      "swaggerEnabled": true,
      "logLevel": "info"
    },
    "database": {
      "host": "localhost",
      "port": 5433,
      "database": "zam_property",
      "ssl": false
    },
    "redis": {
      "host": "localhost",
      "port": 6380,
      "db": 0,
      "tls": false
    },
    "jwt": {
      "accessTokenTtl": "15m",
      "refreshTokenTtl": "30d"
    },
    "openSearch": {
      "node": "http://localhost:9200",
      "hasAuth": false
    },
    "s3": {
      "region": "ap-southeast-1",
      "bucket": "zam-property",
      "hasEndpoint": true,
      "forcePathStyle": true
    },
    "cors": {
      "origin": "*",
      "credentials": true
    }
  },
  "validation": {
    "valid": true,
    "warnings": []
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Response (200) - With Warnings:**
```json
{
  "status": "warning",
  "config": { ... },
  "validation": {
    "valid": true,
    "warnings": ["JWT secrets are using default values. Change them in production!"]
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## 🔐 Auth Module

### POST /api/v1/auth/login
Login with email and password.

**Permission:** Public
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution (or use tenant host/subdomain). |
| `X-Request-ID` | ❌ | `6b4a7f2a-7fd5-4b3a-8b90-7c7b2a7f99a1` | If provided, echoed back as `meta.requestId`; otherwise generated server-side. |

**Success Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "VENDOR_ADMIN"
    }
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Error Codes:**
- `AUTH_INVALID_CREDENTIALS` - Invalid email or password
- `AUTH_ACCOUNT_NOT_ACTIVE` - Account is not active (SUSPENDED/DEACTIVATED)

---

### POST /api/v1/auth/refresh
Refresh access token using refresh token.

**Permission:** Public (with valid refresh token)
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Token must match resolved tenant context. |
| `X-Request-ID` | ❌ | `6b4a7f2a-7fd5-4b3a-8b90-7c7b2a7f99a1` | If provided, echoed back as `meta.requestId`; otherwise generated server-side. |

**Success Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbG...",
    "expiresIn": 900
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Error Codes:**
- `AUTH_INVALID_REFRESH_TOKEN` - Invalid or expired refresh token
- `AUTH_CROSS_TENANT_TOKEN` - Refresh token does not match resolved tenant context

---

### POST /api/v1/auth/logout
Logout and revoke refresh token.

**Permission:** Authenticated
**Status:** ⏳ Pending

**Request Body:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Success Response (204):** No content

---

### POST /api/v1/auth/register
Register a new customer account.

**Permission:** Public
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution (or use tenant host/subdomain). |
| `X-Request-ID` | ❌ | `6b4a7f2a-7fd5-4b3a-8b90-7c7b2a7f99a1` | If provided, echoed back as `meta.requestId`; otherwise generated server-side. |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "fullName": "John Doe",
  "phone": "+60123456789"
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "CUSTOMER",
    "status": "ACTIVE"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Error Codes:**
- `AUTH_EMAIL_EXISTS` - Email already registered
- `VAL_INVALID_EMAIL` - Invalid email format
- `VAL_WEAK_PASSWORD` - Password doesn't meet requirements

---

### GET /api/v1/auth/me
Get current authenticated user profile.

**Permission:** Authenticated
**Status:** ⏳ Pending

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+60123456789",
    "role": "VENDOR_ADMIN",
    "status": "ACTIVE",
    "tenantId": "uuid",
    "vendorId": "uuid"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

## 👤 Users Module

### GET /api/v1/users
List users (paginated).

**Permission:** TENANT_ADMIN, SUPER_ADMIN
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution (or use tenant host/subdomain). |
| `X-Request-ID` | ❌ | `6b4a7f2a-7fd5-4b3a-8b90-7c7b2a7f99a1` | If provided, echoed back as `meta.requestId`; otherwise generated server-side. |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (1-indexed) |
| `pageSize` | number | Items per page (max: 100) |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "phone": "+60123456789",
      "role": "VENDOR_STAFF",
      "status": "ACTIVE",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 50,
      "totalPages": 3
    }
  }
}
```

---

### GET /api/v1/users/me
Get current authenticated user profile.

**Permission:** Authenticated
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution (or use tenant host/subdomain). |
| `X-Request-ID` | ❌ | `6b4a7f2a-7fd5-4b3a-8b90-7c7b2a7f99a1` | If provided, echoed back as `meta.requestId`; otherwise generated server-side. |

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+60123456789",
    "role": "TENANT_ADMIN",
    "status": "ACTIVE",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

### GET /api/v1/users/{id}
Get user by ID.

**Permission:** TENANT_ADMIN, SUPER_ADMIN
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution (or use tenant host/subdomain). |
| `X-Request-ID` | ❌ | `6b4a7f2a-7fd5-4b3a-8b90-7c7b2a7f99a1` | If provided, echoed back as `meta.requestId`; otherwise generated server-side. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | User ID |

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+60123456789",
    "role": "VENDOR_STAFF",
    "status": "ACTIVE",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Error Codes:**
- `USER_NOT_FOUND` - User not found

---

### POST /api/v1/users
Create a new user.

**Permission:** TENANT_ADMIN, SUPER_ADMIN
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution (or use tenant host/subdomain). |
| `X-Request-ID` | ❌ | `6b4a7f2a-7fd5-4b3a-8b90-7c7b2a7f99a1` | If provided, echoed back as `meta.requestId`; otherwise generated server-side. |

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "fullName": "Jane Doe",
  "phone": "+60123456789",
  "role": "VENDOR_STAFF",
  "status": "ACTIVE",
  "password": "TempPassword123!"
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "email": "newuser@example.com",
    "fullName": "Jane Doe",
    "phone": "+60123456789",
    "role": "VENDOR_STAFF",
    "status": "ACTIVE",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

### PATCH /api/v1/users/{id}
Update user.

**Permission:** TENANT_ADMIN, SUPER_ADMIN
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution (or use tenant host/subdomain). |
| `X-Request-ID` | ❌ | `6b4a7f2a-7fd5-4b3a-8b90-7c7b2a7f99a1` | If provided, echoed back as `meta.requestId`; otherwise generated server-side. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | User ID |

**Request Body:**
```json
{
  "fullName": "Jane Smith",
  "phone": "+60198765432",
  "role": "VENDOR_STAFF",
  "status": "ACTIVE"
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "email": "newuser@example.com",
    "fullName": "Jane Smith",
    "phone": "+60198765432",
    "role": "VENDOR_STAFF",
    "status": "ACTIVE",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

### POST /api/v1/users/{id}/actions/deactivate
Deactivate a user.

**Permission:** TENANT_ADMIN, SUPER_ADMIN
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution (or use tenant host/subdomain). |
| `X-Request-ID` | ❌ | `6b4a7f2a-7fd5-4b3a-8b90-7c7b2a7f99a1` | If provided, echoed back as `meta.requestId`; otherwise generated server-side. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | User ID |

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+60123456789",
    "role": "VENDOR_STAFF",
    "status": "DEACTIVATED",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

## 🏪 Vendors Module

### GET /api/v1/vendors
List vendors (paginated) with filtering options.

**Permission:** TENANT_ADMIN, VENDOR_ADMIN, SUPER_ADMIN
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |
| `X-Request-ID` | ❌ | `uuid` | Optional request tracking ID. |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (1-indexed) |
| `pageSize` | number | Items per page (max: 100) |
| `status` | string | Filter by status (PENDING, APPROVED, REJECTED, SUSPENDED) |
| `vendorType` | string | Filter by type (INDIVIDUAL, COMPANY) |
| `search` | string | Search by name |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "ABC Properties",
      "slug": "abc-properties",
      "description": "Leading property agency",
      "vendorType": "COMPANY",
      "email": "info@abc.com",
      "phone": "+60123456789",
      "website": "https://abc.com",
      "status": "APPROVED",
      "verifiedAt": "2025-01-01T00:00:00Z",
      "approvedAt": "2025-01-01T00:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 50,
      "totalPages": 3
    }
  }
}
```

---

### GET /api/v1/vendors/{id}
Get vendor by ID with profile and settings.

**Permission:** TENANT_ADMIN, VENDOR_ADMIN, SUPER_ADMIN, or own vendor
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Vendor ID |

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "ABC Properties",
    "slug": "abc-properties",
    "description": "Leading property agency",
    "vendorType": "COMPANY",
    "email": "info@abc.com",
    "phone": "+60123456789",
    "website": "https://abc.com",
    "status": "APPROVED",
    "verifiedAt": "2025-01-01T00:00:00Z",
    "approvedAt": "2025-01-01T00:00:00Z",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "profile": {
      "businessRegNo": "ABC123456",
      "taxId": "TAX123",
      "addressLine1": "123 Main St",
      "city": "Kuala Lumpur",
      "state": "Selangor",
      "postalCode": "50000",
      "country": "MY",
      "logoUrl": "https://...",
      "bannerUrl": "https://...",
      "socialLinks": { "facebook": "...", "twitter": "..." },
      "operatingHours": { "mon": "9:00-18:00" }
    },
    "settings": {
      "emailNotifications": true,
      "smsNotifications": true,
      "leadNotifications": true,
      "autoResponseEnabled": false,
      "showPhone": true,
      "showEmail": true
    }
  },
  "meta": { "requestId": "uuid" }
}
```

**Error Codes:**
- `VENDOR_NOT_FOUND` - Vendor not found

---

### GET /api/v1/vendors/by-slug/{slug}
Get vendor by URL slug.

**Permission:** TENANT_ADMIN, VENDOR_ADMIN, SUPER_ADMIN
**Status:** ✅ Implemented

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `slug` | string | Vendor slug (URL-friendly) |

---

### POST /api/v1/vendors
Create/register a new vendor. Vendor starts in PENDING status.

**Permission:** TENANT_ADMIN, SUPER_ADMIN
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Request Body:**
```json
{
  "name": "ABC Properties",
  "description": "Leading property agency",
  "vendorType": "COMPANY",
  "email": "info@abc.com",
  "phone": "+60123456789",
  "website": "https://abc.com"
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "ABC Properties",
    "slug": "abc-properties",
    "description": "Leading property agency",
    "vendorType": "COMPANY",
    "email": "info@abc.com",
    "phone": "+60123456789",
    "website": "https://abc.com",
    "status": "PENDING",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "meta": { "requestId": "uuid" }
}
```

**Events Emitted:**
- `vendor.created`

---

### PATCH /api/v1/vendors/{id}
Update vendor details.

**Permission:** TENANT_ADMIN, VENDOR_ADMIN (own vendor), SUPER_ADMIN
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "name": "ABC Properties Updated",
  "description": "Updated description",
  "email": "newemail@abc.com",
  "phone": "+60198765432",
  "website": "https://newsite.com"
}
```

---

### DELETE /api/v1/vendors/{id}
Soft delete a vendor.

**Permission:** TENANT_ADMIN, SUPER_ADMIN
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "data": { "...vendor with deletedAt set..." },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/vendors/{id}/actions/approve
Approve a pending vendor. Transitions: PENDING → APPROVED.

**Permission:** TENANT_ADMIN, SUPER_ADMIN
**Status:** ✅ Implemented

**Request Body (optional):**
```json
{
  "notes": "Verified business registration"
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "approvedAt": "2025-01-01T00:00:00Z",
    "approvedBy": "admin-user-id",
    "...": "..."
  },
  "meta": { "requestId": "uuid" }
}
```

**Events Emitted:**
- `vendor.approved`

**Error Codes:**
- `VENDOR_NOT_FOUND` - Vendor not found
- `VENDOR_INVALID_TRANSITION` - Can only approve PENDING vendors

---

### POST /api/v1/vendors/{id}/actions/reject
Reject a pending vendor. Transitions: PENDING → REJECTED.

**Permission:** TENANT_ADMIN, SUPER_ADMIN
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "reason": "Incomplete documentation"
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "REJECTED",
    "rejectedAt": "2025-01-01T00:00:00Z",
    "rejectedBy": "admin-user-id",
    "rejectionReason": "Incomplete documentation",
    "...": "..."
  },
  "meta": { "requestId": "uuid" }
}
```

**Events Emitted:**
- `vendor.rejected`

**Error Codes:**
- `VENDOR_INVALID_TRANSITION` - Can only reject PENDING vendors

---

### POST /api/v1/vendors/{id}/actions/suspend
Suspend an approved vendor. Transitions: APPROVED → SUSPENDED.

**Permission:** TENANT_ADMIN, SUPER_ADMIN
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "reason": "Policy violation"
}
```

**Events Emitted:**
- `vendor.suspended`

**Error Codes:**
- `VENDOR_INVALID_TRANSITION` - Can only suspend APPROVED vendors

---

### POST /api/v1/vendors/{id}/actions/reactivate
Reactivate a suspended or rejected vendor. Transitions: SUSPENDED/REJECTED → APPROVED.

**Permission:** TENANT_ADMIN, SUPER_ADMIN
**Status:** ✅ Implemented

**Request Body (optional):**
```json
{
  "notes": "Issue resolved"
}
```

**Events Emitted:**
- `vendor.reactivated`

**Error Codes:**
- `VENDOR_INVALID_TRANSITION` - Can only reactivate SUSPENDED or REJECTED vendors

---

### PATCH /api/v1/vendors/{id}/profile
Update vendor profile (business details, address, branding).

**Permission:** TENANT_ADMIN, VENDOR_ADMIN (own vendor), SUPER_ADMIN
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "businessRegNo": "ABC123456",
  "taxId": "TAX123",
  "addressLine1": "123 Main St",
  "addressLine2": "Suite 100",
  "city": "Kuala Lumpur",
  "state": "Selangor",
  "postalCode": "50000",
  "country": "MY",
  "logoUrl": "https://cdn.example.com/logo.png",
  "bannerUrl": "https://cdn.example.com/banner.png",
  "socialLinks": {
    "facebook": "https://facebook.com/abc",
    "twitter": "https://twitter.com/abc"
  },
  "operatingHours": {
    "mon": "9:00-18:00",
    "tue": "9:00-18:00"
  }
}
```

---

### PATCH /api/v1/vendors/{id}/settings
Update vendor settings (notifications, auto-response, privacy).

**Permission:** TENANT_ADMIN, VENDOR_ADMIN (own vendor), SUPER_ADMIN
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "emailNotifications": true,
  "smsNotifications": false,
  "leadNotifications": true,
  "autoResponseEnabled": true,
  "autoResponseMessage": "Thank you for contacting us!",
  "showPhone": true,
  "showEmail": false
}
```

---

## 📦 Listings Module

### GET /api/v1/listings
List listings (paginated).

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`, `VENDOR_ADMIN`, `VENDOR_STAFF`, `CUSTOMER`
**Status:** ✅ Implemented

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 20, max: 100) |
| `status` | string | Filter by status (DRAFT, PUBLISHED, EXPIRED, ARCHIVED) |
| `vendorId` | uuid | Filter by vendor |
| `verticalType` | string | Filter by vertical type |
| `search` | string | Search by title (partial match) |
| `isFeatured` | boolean | Filter by featured status |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `city` | string | Filter by city |
| `state` | string | Filter by state |
| `sortBy` | string | Sort field (createdAt, updatedAt, price, title) |
| `sortOrder` | string | Sort direction (asc, desc) |

**Success Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "tenantId": "uuid",
        "vendorId": "uuid",
        "verticalType": "real_estate",
        "schemaVersion": "1.0",
        "title": "Beautiful Condo in KL",
        "description": "Spacious 3-bedroom condo...",
        "slug": "beautiful-condo-in-kl",
        "price": 500000,
        "currency": "MYR",
        "priceType": "FIXED",
        "location": { "city": "Kuala Lumpur", "state": "Selangor" },
        "attributes": { "bedrooms": 3, "bathrooms": 2 },
        "status": "PUBLISHED",
        "publishedAt": "2025-01-15T00:00:00Z",
        "expiresAt": "2025-02-15T00:00:00Z",
        "isFeatured": false,
        "featuredUntil": null,
        "viewCount": 125,
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-15T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 100,
      "totalPages": 5
    }
  }
}
```

---

### GET /api/v1/listings/{id}
Get listing by ID with vendor and media details.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`, `VENDOR_ADMIN`, `VENDOR_STAFF`, `CUSTOMER`
**Status:** ✅ Implemented

**Note:** Increments view count on each request.

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "vendorId": "uuid",
    "verticalType": "real_estate",
    "schemaVersion": "1.0",
    "title": "Beautiful Condo in KL",
    "description": "Spacious 3-bedroom condo...",
    "slug": "beautiful-condo-in-kl",
    "price": 500000,
    "currency": "MYR",
    "priceType": "FIXED",
    "location": { "city": "Kuala Lumpur", "state": "Selangor" },
    "attributes": { "bedrooms": 3, "bathrooms": 2 },
    "status": "PUBLISHED",
    "publishedAt": "2025-01-15T00:00:00Z",
    "expiresAt": "2025-02-15T00:00:00Z",
    "isFeatured": true,
    "featuredUntil": "2025-02-01T00:00:00Z",
    "viewCount": 126,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T00:00:00Z",
    "vendor": {
      "id": "uuid",
      "name": "ABC Properties",
      "slug": "abc-properties"
    },
    "media": [
      {
        "id": "uuid",
        "filename": "living-room.jpg",
        "mimeType": "image/jpeg",
        "size": 245000,
        "mediaType": "IMAGE",
        "cdnUrl": "https://cdn.example.com/...",
        "thumbnailUrl": "https://cdn.example.com/.../thumb",
        "sortOrder": 0,
        "isPrimary": true,
        "altText": "Living room view"
      }
    ]
  }
}
```

---

### GET /api/v1/listings/by-slug/{slug}
Get listing by URL-friendly slug.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`, `VENDOR_ADMIN`, `VENDOR_STAFF`, `CUSTOMER`
**Status:** ✅ Implemented

---

### GET /api/v1/listings/vendor/{vendorId}
Get all listings for a specific vendor.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`, `VENDOR_ADMIN`, `VENDOR_STAFF`
**Status:** ✅ Implemented

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `pageSize` | number | Items per page |

---

### POST /api/v1/listings
Create a new listing. New listings start in DRAFT status.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`, `VENDOR_ADMIN`
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "vendorId": "uuid",
  "verticalType": "real_estate",
  "title": "Beautiful Condo in KL",
  "description": "Spacious 3-bedroom condo...",
  "price": 500000,
  "currency": "MYR",
  "priceType": "sale",
  "location": {
    "address": "123 Jalan Sultan",
    "city": "Kuala Lumpur",
    "state": "Selangor",
    "postalCode": "50000",
    "country": "MY",
    "lat": 3.1390,
    "lng": 101.6869
  },
  "attributes": {
    "propertyType": "condominium",
    "bedrooms": 3,
    "bathrooms": 2,
    "builtUpSize": 1200,
    "furnishing": "fully_furnished"
  }
}
```

**Success Response (201):** Returns created listing

---

### PATCH /api/v1/listings/{id}
Update listing details.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`, `VENDOR_ADMIN`
**Status:** ✅ Implemented

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Condo Title",
  "description": "Updated description...",
  "price": 550000,
  "currency": "MYR",
  "priceType": "sale",
  "location": { "city": "Petaling Jaya" },
  "attributes": { "bedrooms": 4 },
  "isFeatured": true,
  "featuredUntil": "2025-03-01T00:00:00Z",
  "expiresAt": "2025-04-01T00:00:00Z"
}
```

---

### DELETE /api/v1/listings/{id}
Soft delete listing.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`, `VENDOR_ADMIN`
**Status:** ✅ Implemented

**Success Response:** 204 No Content

---

### POST /api/v1/listings/{id}/publish
Publish a DRAFT listing. Transitions status from DRAFT to PUBLISHED.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`, `VENDOR_ADMIN`
**Status:** ✅ Implemented

**Request Body:** (optional)
```json
{
  "expiresAt": "2025-06-01T00:00:00Z"
}
```

**Default Behavior:** If expiresAt not provided, defaults to 30 days from publish date.

**Events Emitted:** `listing.published`

---

### POST /api/v1/listings/{id}/unpublish
Unpublish a PUBLISHED listing. Transitions status back to DRAFT.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`, `VENDOR_ADMIN`
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "reason": "Need to update information"
}
```

**Events Emitted:** `listing.unpublished`

---

### POST /api/v1/listings/{id}/expire
Expire a PUBLISHED listing. Transitions status from PUBLISHED to EXPIRED.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`
**Status:** ✅ Implemented

**Request Body:** (optional)
```json
{
  "reason": "Listing period ended"
}
```

**Events Emitted:** `listing.expired`

---

### POST /api/v1/listings/{id}/archive
Archive a listing. Can transition from DRAFT, PUBLISHED, or EXPIRED to ARCHIVED.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`, `VENDOR_ADMIN`
**Status:** ✅ Implemented

**Request Body:** (optional)
```json
{
  "reason": "Property sold"
}
```

**Events Emitted:** `listing.archived`

---

### POST /api/v1/listings/{id}/feature
Mark a listing as featured until a specified date.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "featuredUntil": "2025-03-01T00:00:00Z"
}
```

**Events Emitted:** `listing.featured`

---

### POST /api/v1/listings/{id}/unfeature
Remove featured status from a listing.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`
**Status:** ✅ Implemented

**Events Emitted:** `listing.unfeatured`

---

## 🔍 Search Module

### GET /api/v1/search/listings
Search listings with filters and facets.

**Permission:** Public
**Status:** ⏳ Pending

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Full-text search query |
| `verticalType` | string | Filter by vertical |
| `priceMin` | number | Minimum price |
| `priceMax` | number | Maximum price |
| `city` | string | Filter by city |
| `state` | string | Filter by state |
| `lat` | number | Geo search latitude |
| `lng` | number | Geo search longitude |
| `radius` | number | Geo search radius (km) |
| `attributes[key]` | varies | Vertical-specific filters |
| `sort` | string | Sort field:direction |
| `page` | number | Page number |
| `pageSize` | number | Items per page |
| `highlight` | boolean | Include highlights |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Beautiful Condo",
      "slug": "beautiful-condo",
      "price": 500000,
      "currency": "MYR",
      "location": {
        "city": "Kuala Lumpur",
        "state": "Selangor"
      },
      "primaryImageUrl": "https://...",
      "verticalType": "real_estate",
      "attributes": {},
      "vendor": {
        "id": "uuid",
        "name": "ABC Properties",
        "slug": "abc-properties"
      },
      "highlights": {
        "title": ["Beautiful <mark>Condo</mark>"]
      }
    }
  ],
  "meta": {
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 150,
      "totalPages": 8
    },
    "facets": {
      "verticalTypes": [
        { "value": "real_estate", "count": 100 }
      ],
      "cities": [
        { "value": "Kuala Lumpur", "count": 50 }
      ],
      "priceRanges": [
        { "from": 0, "to": 300000, "count": 30 }
      ]
    }
  }
}
```

---

### GET /api/v1/search/suggestions
Get autocomplete suggestions.

**Permission:** Public
**Status:** ⏳ Pending

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search prefix |
| `limit` | number | Max suggestions (default: 10) |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Beautiful Condo in KL",
      "slug": "beautiful-condo-in-kl",
      "price": 500000,
      "city": "Kuala Lumpur"
    }
  ]
}
```

---

## 🖼️ Media Module

### POST /api/v1/media/presigned-url
Request a presigned URL for upload.

**Permission:** Authenticated
**Status:** ⏳ Pending

**Request Body:**
```json
{
  "filename": "photo.jpg",
  "contentType": "image/jpeg",
  "size": 1048576,
  "purpose": "listing"
}
```

**Success Response (200):**
```json
{
  "data": {
    "uploadId": "uuid",
    "presignedUrl": "https://s3.amazonaws.com/...",
    "expiresAt": "2025-01-01T01:00:00Z",
    "fields": {}
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

### POST /api/v1/media/confirm
Confirm upload completion.

**Permission:** Authenticated
**Status:** ⏳ Pending

**Request Body:**
```json
{
  "uploadId": "uuid"
}
```

---

### DELETE /api/v1/media/{id}
Delete media.

**Permission:** Owner or Admin
**Status:** ⏳ Pending

---

## 💬 Interactions Module

### GET /api/v1/interactions
List interactions (vendor inbox).

**Permission:** `interaction:list` (VENDOR_ADMIN, VENDOR_STAFF)
**Status:** ⏳ Pending

---

### GET /api/v1/interactions/{id}
Get interaction by ID.

**Permission:** `interaction:read` (participant)
**Status:** ⏳ Pending

---

### POST /api/v1/interactions
Create a new interaction (inquiry).

**Permission:** Authenticated (CUSTOMER)
**Status:** ⏳ Pending

**Request Body:**
```json
{
  "listingId": "uuid",
  "type": "ENQUIRY",
  "message": "I'm interested in this property..."
}
```

---

### POST /api/v1/interactions/{id}/messages
Send a message in an interaction.

**Permission:** Participant
**Status:** ⏳ Pending

**Request Body:**
```json
{
  "content": "Thank you for your interest..."
}
```

---

### PATCH /api/v1/interactions/{id}/status
Update interaction status.

**Permission:** `interaction:update` (VENDOR)
**Status:** ⏳ Pending

**Request Body:**
```json
{
  "status": "CONTACTED"
}
```

---

## ⭐ Reviews Module

### GET /api/v1/reviews
List reviews.

**Permission:** Public (approved) or `review:list` (all)
**Status:** ⏳ Pending

---

### POST /api/v1/reviews
Create a review.

**Permission:** Authenticated (CUSTOMER)
**Status:** ⏳ Pending

**Request Body:**
```json
{
  "vendorId": "uuid",
  "listingId": "uuid",
  "rating": 5,
  "title": "Great service!",
  "content": "Very professional and helpful..."
}
```

---

### POST /api/v1/reviews/{id}/actions/approve
Approve a review.

**Permission:** `review:moderate` (TENANT_ADMIN)
**Status:** ⏳ Pending

---

### POST /api/v1/reviews/{id}/actions/reject
Reject a review.

**Permission:** `review:moderate` (TENANT_ADMIN)
**Status:** ⏳ Pending

---

## 💳 Subscriptions Module

### GET /api/v1/subscription-plans
List available subscription plans.

**Permission:** Public
**Status:** ⏳ Pending

---

### GET /api/v1/vendors/{vendorId}/subscription
Get vendor's current subscription.

**Permission:** `subscription:read` (owner or admin)
**Status:** ⏳ Pending

---

### POST /api/v1/vendors/{vendorId}/subscription
Subscribe vendor to a plan.

**Permission:** `subscription:create` (TENANT_ADMIN)
**Status:** ⏳ Pending

---

## 🪝 Webhooks Module

The Webhooks module processes external payment provider events (Stripe, PayPal, etc.) for billing integration. All webhook endpoints use signature verification and idempotent processing to ensure security and reliability.

---

### POST /api/v1/webhooks/stripe
Process Stripe webhook events.

**Permission:** Public (signature verified)  
**Status:** ✅ Implemented  
**Idempotency:** Guaranteed via PaymentEvent.externalId unique constraint

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `stripe-signature` | string | Yes | Stripe webhook signature for verification |

**Request Body:**
- Raw Stripe webhook event payload (JSON)
- Must contain valid signature
- See [Stripe Webhook Event Types](https://stripe.com/docs/api/events/types)

**Supported Event Types:**
| Event Type | Action |
|------------|--------|
| `payment_intent.succeeded` | Emits `billing.payment.succeeded` |
| `payment_intent.payment_failed` | Emits `billing.payment.failed` |
| `invoice.paid` | Updates Invoice status to PAID, emits `billing.invoice.paid` + `billing.subscription.payment_succeeded` |
| `invoice.payment_failed` | Emits `billing.invoice.payment_failed` + `billing.subscription.payment_failed` |
| `customer.subscription.created` | Emits `billing.subscription.updated` |
| `customer.subscription.updated` | Emits `billing.subscription.updated` |
| `customer.subscription.deleted` | Emits `billing.subscription.deleted` |

**Success Response (200):**
```json
{
  "received": true
}
```

**Error Responses:**

**400 Bad Request** (Invalid signature):
```json
{
  "statusCode": 400,
  "message": "Invalid webhook signature",
  "error": "Bad Request"
}
```

**400 Bad Request** (Missing tenantId):
```json
{
  "statusCode": 400,
  "message": "Webhook event has no tenant ID",
  "error": "Bad Request"
}
```

**500 Internal Server Error** (Processing failed):
```json
{
  "statusCode": 500,
  "message": "Failed to process webhook event",
  "error": "Internal Server Error"
}
```

**Webhook Security:**
- Signature verification using `STRIPE_WEBHOOK_SECRET` from environment
- Raw body required (NestJS RawBodyRequest)
- Rejects unsigned or tampered requests
- Idempotent processing prevents duplicate execution

**Webhook Processing Flow:**
1. Verify signature with Stripe secret
2. Check if event already processed (PaymentEvent.externalId)
3. Extract tenantId from event metadata
4. Store event in PaymentEvent table (processed=false)
5. Route event to specific handler based on event.type
6. Update related entities (Invoice status, etc.)
7. Emit domain events for subscription service to react
8. Mark event as processed (processed=true, processedAt timestamp)
9. Return {received: true}

**Retry Logic:**
- Failed webhooks stored with error message
- retryCount incremented on each failure
- Max 5 retry attempts before permanent failure
- Unprocessed events can be reprocessed via background job

**Tenant Routing:**
- TenantId stored in Stripe customer/subscription metadata
- Webhook extracts tenantId from metadata for routing
- Events without tenantId are rejected

---

## � Pricing Module

The Pricing module implements flexible, configuration-driven pricing models for tenant monetization. Tenants can configure their pricing strategy (SaaS, lead-based, commission, or hybrid) without code changes.

**Architecture:**
- Strategy Pattern: Each pricing model is a separate strategy
- Configuration-Driven: Pricing rules stored as JSON in database
- Event-Driven: Charges triggered by domain events
- Tenant-Customizable: Each tenant configures own pricing
- Vertical-Aware: Different prices per vertical (real_estate vs automotive)

**Pricing Models:**
- **SaaS (Flat-Fee Subscription):** Monthly/yearly pricing
- **Lead-Based (Pay-Per-Lead):** Charge per interaction with free quota
- **Commission:** Percentage-based with min/max caps
- **Hybrid:** Combine multiple models

---

### POST /api/v1/pricing/configs
Create pricing configuration.

**Permission:** `pricing:create` (TENANT_ADMIN)
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "model": "LEAD_BASED",
  "name": "Real Estate Lead Pricing",
  "description": "Pay-per-lead for property enquiries",
  "config": {
    "pricePerLead": 5.00,
    "freeQuota": 10,
    "verticalPricing": {
      "real_estate": 5.00,
      "automotive": 3.00
    }
  },
  "verticalId": "uuid-optional",
  "isActive": true
}
```

**Success Response (201):**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "model": "LEAD_BASED",
  "name": "Real Estate Lead Pricing",
  "description": "Pay-per-lead for property enquiries",
  "config": {
    "pricePerLead": 5.00,
    "freeQuota": 10,
    "verticalPricing": {
      "real_estate": 5.00,
      "automotive": 3.00
    }
  },
  "verticalId": "uuid-optional",
  "isActive": true,
  "createdAt": "2026-01-20T00:00:00Z",
  "updatedAt": "2026-01-20T00:00:00Z"
}
```

**Validation:**
- model: PricingModel enum (SAAS, LEAD_BASED, COMMISSION, LISTING_BASED, HYBRID)
- config: Validated by strategy (validateConfig())

**Models & Config Schemas:**

*SaaS Model (config):*
```json
{
  "monthlyFee": 99.00,
  "yearlyFee": 999.00,
  "features": ["unlimited_listings", "analytics"]
}
```

*Lead-Based Model (config):*
```json
{
  "pricePerLead": 5.00,
  "freeQuota": 10,
  "verticalPricing": {
    "real_estate": 5.00,
    "automotive": 3.00
  }
}
```

*Commission Model (config):*
```json
{
  "commissionPercentage": 5.0,
  "minimumCommission": 10.00,
  "maximumCommission": 500.00,
  "flatFee": 5.00
}
```

---

### GET /api/v1/pricing/configs
List pricing configurations.

**Permission:** `pricing:list` (TENANT_ADMIN)
**Status:** ✅ Implemented

**Query Params:**
- model?: PricingModel enum filter
- isActive?: boolean filter
- verticalId?: string filter
- page?: number (default: 1)
- pageSize?: number (default: 20)

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "model": "LEAD_BASED",
      "name": "Real Estate Lead Pricing",
      "config": {...},
      "isActive": true,
      "rules": [...],
      "createdAt": "2026-01-20T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### GET /api/v1/pricing/configs/:id
Get pricing configuration by ID.

**Permission:** `pricing:read` (TENANT_ADMIN)
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "model": "LEAD_BASED",
  "name": "Real Estate Lead Pricing",
  "config": {...},
  "rules": [
    {
      "id": "uuid",
      "name": "Property Enquiry Rule",
      "eventType": "interaction.created",
      "chargeType": "LEAD",
      "amount": 5.00,
      "currency": "MYR",
      "conditions": {
        "verticalId": "uuid",
        "interactionType": "ENQUIRY"
      },
      "isActive": true
    }
  ],
  "isActive": true,
  "createdAt": "2026-01-20T00:00:00Z",
  "updatedAt": "2026-01-20T00:00:00Z"
}
```

---

### PATCH /api/v1/pricing/configs/:id
Update pricing configuration.

**Permission:** `pricing:update` (TENANT_ADMIN)
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "name": "Updated Lead Pricing",
  "description": "New description",
  "config": {
    "pricePerLead": 6.00,
    "freeQuota": 20
  },
  "isActive": false
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "name": "Updated Lead Pricing",
  "config": {...},
  "isActive": false,
  "updatedAt": "2026-01-20T00:00:00Z"
}
```

**Validation:**
- If config is updated, validates via strategy.validateConfig()

---

### DELETE /api/v1/pricing/configs/:id
Delete pricing configuration.

**Permission:** `pricing:delete` (TENANT_ADMIN)
**Status:** ✅ Implemented

**Success Response (204):** No content

---

### POST /api/v1/pricing/rules
Create pricing rule.

**Permission:** `pricing:create` (TENANT_ADMIN)
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "pricingConfigId": "uuid",
  "name": "Property Enquiry Rule",
  "description": "Charge for property enquiries",
  "eventType": "interaction.created",
  "chargeType": "LEAD",
  "amount": 5.00,
  "currency": "MYR",
  "conditions": {
    "verticalId": "uuid",
    "listingType": "SALE",
    "interactionType": "ENQUIRY",
    "minAmount": 100.00,
    "maxAmount": 1000.00
  },
  "isActive": true
}
```

**Success Response (201):**
```json
{
  "id": "uuid",
  "pricingConfigId": "uuid",
  "name": "Property Enquiry Rule",
  "eventType": "interaction.created",
  "chargeType": "LEAD",
  "amount": 5.00,
  "conditions": {...},
  "isActive": true,
  "createdAt": "2026-01-20T00:00:00Z"
}
```

**Rule Conditions:**
- verticalId?: Filter by vertical
- listingType?: Filter by property type
- interactionType?: Filter by interaction type
- minAmount?: Minimum transaction amount
- maxAmount?: Maximum transaction amount
- customFilters?: Extensible JSON object

**Validation:**
- pricingConfigId must belong to tenant
- eventType: string (e.g., "interaction.created", "subscription.created")
- chargeType: ChargeType enum (SUBSCRIPTION, LEAD, INTERACTION, COMMISSION, LISTING, ADDON, OVERAGE)

---

### PATCH /api/v1/pricing/rules/:id
Update pricing rule.

**Permission:** `pricing:update` (TENANT_ADMIN)
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "name": "Updated Rule Name",
  "amount": 6.00,
  "conditions": {
    "verticalId": "uuid",
    "interactionType": "BOOKING"
  },
  "isActive": false
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "name": "Updated Rule Name",
  "amount": 6.00,
  "conditions": {...},
  "isActive": false,
  "updatedAt": "2026-01-20T00:00:00Z"
}
```

---

### DELETE /api/v1/pricing/rules/:id
Delete pricing rule.

**Permission:** `pricing:delete` (TENANT_ADMIN)
**Status:** ✅ Implemented

**Success Response (204):** No content

---

### POST /api/v1/pricing/calculate
Calculate charge for event (dry-run, no save).

**Permission:** `pricing:calculate` (TENANT_ADMIN, VENDOR_ADMIN)
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "eventType": "interaction.created",
  "resourceType": "Interaction",
  "resourceId": "uuid",
  "amount": 250000.00,
  "metadata": {
    "verticalId": "uuid",
    "listingType": "SALE",
    "interactionType": "ENQUIRY",
    "currentUsage": 5
  }
}
```

**Success Response (200):**
```json
{
  "shouldCharge": true,
  "chargeType": "LEAD",
  "amount": 5.00,
  "currency": "MYR",
  "pricingConfigId": "uuid",
  "pricingRuleId": "uuid",
  "reason": "Lead charge applied (within free quota: false)",
  "metadata": {
    "overageCharge": true,
    "usedQuota": 10,
    "currentUsage": 5
  }
}
```

**Calculation Logic:**
1. Get active pricing configs for tenant
2. Find rules matching eventType
3. Check rule conditions (verticalId, listingType, interactionType, amount range)
4. Execute pricing strategy (SaaS/LeadBased/Commission)
5. Return ChargeCalculationResult (no database save)

**Strategies:**
- **SaaS:** Returns monthly/yearly fee if eventType = "subscription.*"
- **LeadBased:** Checks currentUsage vs freeQuota, applies vertical-specific pricing
- **Commission:** Calculates percentage of amount, applies min/max caps, adds flatFee

---

### GET /api/v1/pricing/charges
List charge events.

**Permission:** `pricing:list` (TENANT_ADMIN)
**Status:** ✅ Implemented

**Query Params:**
- chargeType?: ChargeType enum filter
- eventType?: string filter
- processed?: boolean filter
- startDate?: ISO 8601 date
- endDate?: ISO 8601 date
- page?: number (default: 1)
- pageSize?: number (default: 20)

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "chargeType": "LEAD",
      "amount": 5.00,
      "currency": "MYR",
      "eventType": "interaction.created",
      "resourceType": "Interaction",
      "resourceId": "uuid",
      "pricingConfigId": "uuid",
      "pricingRuleId": "uuid",
      "processed": false,
      "processedAt": null,
      "invoiceId": null,
      "metadata": {...},
      "createdAt": "2026-01-20T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

**Charge Event Fields:**
- processed: false (pending), true (invoiced)
- processedAt: timestamp when charge was added to invoice
- invoiceId: reference to Invoice after processing
- metadata: strategy-specific calculation details

---

### GET /api/v1/pricing/charges/summary
Get charge summary (aggregated totals).

**Permission:** `pricing:list` (TENANT_ADMIN)
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "pending": {
    "total": 150.00,
    "currency": "MYR",
    "count": 10,
    "breakdown": {
      "LEAD": 50.00,
      "SUBSCRIPTION": 100.00
    }
  },
  "processed": {
    "total": 500.00,
    "currency": "MYR",
    "count": 25,
    "breakdown": {
      "LEAD": 200.00,
      "SUBSCRIPTION": 300.00
    }
  }
}
```

**Aggregation:**
- pending: Sum of charges where processed=false
- processed: Sum of charges where processed=true
- breakdown: Sum grouped by chargeType

---

## �🔔 Notifications Module

### GET /api/v1/notifications
List user notifications.

**Permission:** Authenticated
**Status:** ⏳ Pending

---

### PATCH /api/v1/notifications/{id}/read
Mark notification as read.

**Permission:** Owner
**Status:** ⏳ Pending

---

### POST /api/v1/notifications/read-all
Mark all notifications as read.

**Permission:** Authenticated
**Status:** ⏳ Pending

---

## ⚡ Real-time (WebSocket)

### Socket.IO Namespace: /
Main namespace for real-time events.

**Authentication:** JWT access token in handshake auth
**Status:** ⏳ Pending

#### Server → Client Events

##### `listing:updated`
Emitted when a listing is updated.

**Payload:**
```json
{
  "listingId": "uuid",
  "changes": ["status", "price"]
}
```

##### `interaction:new`
Emitted when a new interaction is created.

**Payload:**
```json
{
  "interactionId": "uuid",
  "listingId": "uuid",
  "type": "ENQUIRY"
}
```

##### `interaction:message`
Emitted when a new message is sent.

**Payload:**
```json
{
  "interactionId": "uuid",
  "messageId": "uuid"
}
```

##### `notification:new`
Emitted for new notifications.

**Payload:**
```json
{
  "notificationId": "uuid",
  "type": "INTERACTION_NEW",
  "title": "New inquiry received"
}
```

---

## 🏭 Verticals Module

The Verticals module implements the Vertical Registry defined in Part 8 (Vertical Module Contract). It manages vertical definitions (platform-level) and tenant-vertical enablement. Verticals define attribute schemas, validation rules, and search mappings for specific business domains (real_estate, automotive, jobs, services, etc.).

### Vertical Definition Endpoints (Platform-level, SUPER_ADMIN)

#### POST /api/v1/verticals/definitions
Create a new vertical definition.

**Permission:** `SUPER_ADMIN`  
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer <token>` | JWT access token |

**Request Body:**
```json
{
  "type": "real_estate",
  "name": "Real Estate",
  "description": "Property listings including residential, commercial, and land",
  "icon": "home",
  "color": "#3B82F6",
  "attributeSchema": {
    "version": "1.0",
    "fields": [
      {
        "name": "propertyType",
        "type": "enum",
        "label": "Property Type",
        "required": true,
        "options": [
          { "value": "house", "label": "House" },
          { "value": "condo", "label": "Condominium" }
        ]
      }
    ]
  },
  "validationRules": {
    "version": "1.0",
    "rules": [
      {
        "id": "bedrooms-required-on-publish",
        "type": "requiredOnPublish",
        "field": "bedrooms",
        "message": "Bedrooms is required before publishing"
      }
    ]
  },
  "searchMapping": {
    "version": "1.0",
    "properties": {
      "propertyType": { "name": "propertyType", "type": "keyword" },
      "bedrooms": { "name": "bedrooms", "type": "integer" }
    }
  },
  "supportedStatuses": ["DRAFT", "PUBLISHED", "EXPIRED", "ARCHIVED"],
  "displayMetadata": {
    "version": "1.0",
    "cardView": {
      "titleField": "title",
      "priceField": "price",
      "locationField": "location.city"
    }
  },
  "schemaVersion": "1.0",
  "isActive": true,
  "isCore": false
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "type": "real_estate",
    "name": "Real Estate",
    "description": "Property listings including residential, commercial, and land",
    "icon": "home",
    "color": "#3B82F6",
    "attributeSchema": { "version": "1.0", "fields": [...] },
    "validationRules": { "version": "1.0", "rules": [...] },
    "searchMapping": { "version": "1.0", "properties": {...} },
    "supportedStatuses": ["DRAFT", "PUBLISHED", "EXPIRED", "ARCHIVED"],
    "displayMetadata": { "version": "1.0", ... },
    "schemaVersion": "1.0",
    "isActive": true,
    "isCore": false,
    "createdAt": "2026-01-21T00:00:00Z",
    "updatedAt": "2026-01-21T00:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Invalid attribute schema, validation rules, or search mapping
- `409`: Vertical type already exists

---

#### GET /api/v1/verticals/definitions
List all vertical definitions with optional filters.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`  
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer <token>` | JWT access token |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `isActive` | boolean | Filter by active status |
| `isCore` | boolean | Filter by core vertical flag |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "real_estate",
      "name": "Real Estate",
      ...
    }
  ]
}
```

---

#### GET /api/v1/verticals/definitions/active
Get all active vertical definitions.

**Permission:** Authenticated  
**Status:** ✅ Implemented

---

#### GET /api/v1/verticals/definitions/{id}
Get vertical definition by ID.

**Permission:** Authenticated  
**Status:** ✅ Implemented

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Vertical definition ID |

---

#### GET /api/v1/verticals/definitions/type/{type}
Get vertical definition by type.

**Permission:** Authenticated  
**Status:** ✅ Implemented

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `type` | string | Vertical type (e.g., `real_estate`) |

---

#### PATCH /api/v1/verticals/definitions/{id}
Update a vertical definition.

**Permission:** `SUPER_ADMIN`  
**Status:** ✅ Implemented

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Vertical definition ID |

**Request Body:** (partial update)
```json
{
  "name": "Updated Name",
  "attributeSchema": { ... }
}
```

---

#### PATCH /api/v1/verticals/definitions/{id}/activate
Activate a vertical definition.

**Permission:** `SUPER_ADMIN`  
**Status:** ✅ Implemented

---

#### PATCH /api/v1/verticals/definitions/{id}/deactivate
Deactivate a vertical definition. Cannot deactivate core verticals.

**Permission:** `SUPER_ADMIN`  
**Status:** ✅ Implemented

**Error Responses:**
- `400`: Cannot deactivate core vertical

---

#### DELETE /api/v1/verticals/definitions/{id}
Delete a vertical definition. Cannot delete core verticals or verticals in use.

**Permission:** `SUPER_ADMIN`  
**Status:** ✅ Implemented

**Error Responses:**
- `400`: Cannot delete core vertical or vertical in use by tenants
- `404`: Vertical not found

---

### Tenant Vertical Endpoints (Tenant-level)

#### POST /api/v1/verticals/tenant/enable
Enable a vertical for the current tenant.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`  
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer <token>` | JWT access token |
| `X-Tenant-ID` | ✅ | `demo` | Tenant identifier |

**Request Body:**
```json
{
  "verticalType": "real_estate",
  "configOverrides": { "allowCustomFields": true },
  "customFields": [
    { "name": "customField1", "type": "string", "label": "Custom Field" }
  ],
  "listingLimit": 100
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "verticalId": "uuid",
    "configOverrides": { "allowCustomFields": true },
    "customFields": [...],
    "listingLimit": 100,
    "isEnabled": true,
    "enabledAt": "2026-01-21T00:00:00Z",
    "disabledAt": null,
    "createdAt": "2026-01-21T00:00:00Z",
    "updatedAt": "2026-01-21T00:00:00Z",
    "vertical": {
      "id": "uuid",
      "type": "real_estate",
      "name": "Real Estate",
      ...
    }
  }
}
```

**Error Responses:**
- `400`: Vertical is not active
- `404`: Vertical type not found
- `409`: Vertical already enabled for tenant

---

#### GET /api/v1/verticals/tenant
List tenant verticals with optional filters.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`, `VENDOR_ADMIN`  
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer <token>` | JWT access token |
| `X-Tenant-ID` | ✅ | `demo` | Tenant identifier |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `isEnabled` | boolean | Filter by enabled status |
| `verticalType` | string | Filter by vertical type |

---

#### GET /api/v1/verticals/tenant/enabled
Get all enabled and active verticals for the current tenant.

**Permission:** Authenticated  
**Status:** ✅ Implemented

---

#### GET /api/v1/verticals/tenant/{id}
Get tenant vertical by ID.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`, `VENDOR_ADMIN`  
**Status:** ✅ Implemented

---

#### PATCH /api/v1/verticals/tenant/{id}
Update tenant vertical configuration.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "configOverrides": { ... },
  "customFields": [...],
  "listingLimit": 200,
  "isEnabled": true
}
```

---

#### DELETE /api/v1/verticals/tenant/{verticalType}
Disable a vertical for the current tenant.

**Permission:** `SUPER_ADMIN`, `TENANT_ADMIN`  
**Status:** ✅ Implemented

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `verticalType` | string | Vertical type (e.g., `real_estate`) |

**Error Responses:**
- `400`: Vertical already disabled
- `404`: Vertical not found for tenant

---

### Guards & Decorators

The module exports guards and decorators for protecting routes based on vertical enablement:

```typescript
// Require a specific vertical to be enabled for the tenant
@RequireVertical('real_estate')
@UseGuards(VerticalGuard)

// Require any one of the specified verticals
@RequireAnyVertical('real_estate', 'automotive')
@UseGuards(AnyVerticalGuard)
```

---

### Real Estate Vertical Implementation

The Real Estate vertical (`real_estate`) is the reference implementation demonstrating the vertical pattern. It auto-registers with the Vertical Registry on application startup via `OnModuleInit`.

**Module:** `src/verticals/real-estate/real-estate-vertical.module.ts`  
**Status:** ✅ Implemented (Session 3.3)

**No new HTTP endpoints** - the vertical registers its configuration with the existing Vertical Registry endpoints and provides internal services.

#### Components

| File | Purpose |
|------|---------|
| `registry/attribute.schema.ts` | 16-field attribute schema with groups, types, UI hints |
| `registry/validation.rules.ts` | Draft/publish validation rules (required, range, enum, conditional, cross-field) |
| `registry/search.mapping.ts` | OpenSearch index mapping, 10 facets, filter/aggregation builders |
| `services/real-estate-listing.service.ts` | CRUD operations with validation and search helpers |

#### Attribute Schema (16 fields)

| Group | Fields |
|-------|--------|
| Basic Info | `propertyType`, `listingType` |
| Tenure & Legal | `tenure` |
| Size & Capacity | `builtUpSize`, `landSize`, `bedrooms`, `bathrooms`, `carParks` |
| Condition | `furnishing`, `floorLevel`, `condition`, `yearBuilt`, `facing` |
| Features | `facilities`, `nearbyAmenities` |
| Rental Terms | `rentalDeposit`, `minimumRentalPeriod` |
| Additional | `additionalFeatures` |

#### Facets (10 configured)

| Facet | Type | Description |
|-------|------|-------------|
| `propertyType` | terms | Property categories (house, condo, apartment, etc.) |
| `listingType` | terms | Sale, rent, or new project |
| `tenure` | terms | Freehold, leasehold |
| `bedrooms` | terms | Number of bedrooms |
| `bathrooms` | terms | Number of bathrooms |
| `carParks` | terms | Number of car parks |
| `furnishing` | terms | Unfurnished, partially, fully furnished |
| `condition` | terms | New, good, requires renovation |
| `facing` | terms | Property orientation |
| `floorLevel` | terms | Floor level category |

#### Validation Rules

**Draft Save (minimal):**
- `propertyType` (required)
- `listingType` (required)

**Publish (full):**
- All draft requirements plus:
- `tenure`, `builtUpSize`, `bedrooms`, `bathrooms` (required)
- `landSize` (required for landed properties only)
- Size ranges: `builtUpSize` 1-100,000 sqft, `landSize` 1-1,000,000 sqft
- Integer ranges: `bedrooms` 0-50, `bathrooms` 0-30, `carParks` 0-20

#### Search Helpers

```typescript
// Build OpenSearch filters from query params
buildRealEstateFilters(params: RealEstateFilterParams): QueryDslQueryContainer[]

// Build aggregations for faceted search
buildRealEstateAggregations(): Record<string, AggregationsAggregationContainer>
```

#### Auto-Registration

On application startup, `RealEstateVerticalModule.onModuleInit()`:
1. Checks if `real_estate` vertical definition exists
2. If exists: Updates schema/validation/search mapping to latest version
3. If not: Creates new vertical definition with full configuration

---

### Real Estate Search Endpoints (Session 3.4)

Dedicated search endpoints for real estate vertical with full filter and facet support.

**Controller:** `src/verticals/real-estate/controllers/real-estate-search.controller.ts`  
**Status:** ✅ Implemented

---

#### GET /api/v1/real-estate/search
Search real estate listings with comprehensive filters and facets.

**Permission:** Public (no auth required)  
**Status:** ✅ Implemented

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Full-text search query |
| `propertyType` | string | Property type(s), comma-separated (apartment, condominium, terrace, etc.) |
| `listingType` | enum | `sale` or `rent` |
| `tenure` | string | Tenure type(s), comma-separated (freehold, leasehold, etc.) |
| `bedroomsMin` | number | Minimum bedrooms |
| `bedroomsMax` | number | Maximum bedrooms |
| `bathroomsMin` | number | Minimum bathrooms |
| `bathroomsMax` | number | Maximum bathrooms |
| `builtUpSizeMin` | number | Minimum built-up size (sq ft) |
| `builtUpSizeMax` | number | Maximum built-up size (sq ft) |
| `landSizeMin` | number | Minimum land size (sq ft) |
| `landSizeMax` | number | Maximum land size (sq ft) |
| `priceMin` | number | Minimum price |
| `priceMax` | number | Maximum price |
| `furnishing` | string | Furnishing level(s), comma-separated |
| `condition` | string | Property condition(s), comma-separated |
| `yearBuiltMin` | number | Minimum year built |
| `yearBuiltMax` | number | Maximum year built |
| `facilities` | string | Required facilities, comma-separated |
| `nearbyAmenities` | string | Required nearby amenities, comma-separated |
| `city` | string | City name filter |
| `state` | string | State name filter |
| `country` | string | Country filter |
| `lat` | number | Latitude for geo-search |
| `lng` | number | Longitude for geo-search |
| `radius` | number | Radius in km for geo-search (1-100) |
| `vendorId` | string | Filter by vendor ID |
| `featuredOnly` | boolean | Show only featured listings |
| `sort` | string | Sort order: `price:asc`, `price:desc`, `newest`, `oldest`, `size:asc`, `size:desc`, `bedrooms:asc`, `bedrooms:desc`, `relevance`, `distance` |
| `page` | number | Page number (1-indexed) |
| `pageSize` | number | Items per page (default: 20, max: 100) |
| `highlight` | boolean | Enable search highlighting |
| `includeDistance` | boolean | Include distance in results (requires lat/lng) |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Modern 3BR Condo in KLCC",
      "slug": "modern-3br-condo-klcc",
      "price": 850000,
      "currency": "MYR",
      "primaryImageUrl": "https://cdn.example.com/...",
      "location": {
        "city": "Kuala Lumpur",
        "state": "Kuala Lumpur"
      },
      "attributes": {
        "propertyType": "condominium",
        "listingType": "sale",
        "bedrooms": 3,
        "bathrooms": 2,
        "builtUpSize": 1200,
        "furnishing": "fully_furnished"
      },
      "isFeatured": true,
      "distance": 2.5,
      "publishedAt": "2026-01-20T00:00:00Z"
    }
  ],
  "meta": {
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 150,
      "totalPages": 8
    },
    "facets": {
      "propertyType": [
        { "key": "condominium", "count": 45, "label": "Condominium" },
        { "key": "apartment", "count": 32, "label": "Apartment / Flat" }
      ],
      "listingType": [
        { "key": "sale", "count": 100, "label": "For Sale" },
        { "key": "rent", "count": 50, "label": "For Rent" }
      ],
      "bedrooms": [
        { "key": "1", "count": 20, "label": "1 Bedroom" },
        { "key": "2", "count": 45, "label": "2 Bedrooms" },
        { "key": "3", "count": 60, "label": "3 Bedrooms" }
      ],
      "priceRange": [
        { "key": "below_100k", "count": 10, "label": "Below RM 100K" },
        { "key": "100k_to_300k", "count": 35, "label": "RM 100K - 300K" }
      ],
      "city": [
        { "key": "Kuala Lumpur", "count": 80, "label": "Kuala Lumpur" }
      ]
    }
  }
}
```

---

#### GET /api/v1/real-estate/suggestions
Get search suggestions/autocomplete.

**Permission:** Public  
**Status:** ✅ Implemented

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search prefix (required) |
| `limit` | number | Max results (default: 10) |

**Success Response (200):**
```json
{
  "data": [
    { "id": "uuid", "title": "Modern Condo KLCC", "slug": "modern-condo-klcc", "price": 850000, "city": "Kuala Lumpur" },
    { "id": "uuid", "title": "Cozy Studio Bangsar", "slug": "cozy-studio-bangsar", "price": 350000, "city": "Kuala Lumpur" }
  ],
  "meta": { "requestId": "uuid" }
}
```

---

#### GET /api/v1/real-estate/facets
Get facet counts for filter sidebar.

**Permission:** Public  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "data": {
    "propertyType": [...],
    "listingType": [...],
    "bedrooms": [...],
    "furnishing": [...],
    "tenure": [...],
    "priceRange": [...],
    "city": [...],
    "state": [...]
  },
  "meta": { "requestId": "uuid" }
}
```

---

#### GET /api/v1/real-estate/nearby
Search properties near a location.

**Permission:** Public  
**Status:** ✅ Implemented

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `lat` | number | Latitude (required) |
| `lng` | number | Longitude (required) |
| `radius` | number | Radius in km (default: 5) |
| `propertyType` | string | Property type filter |
| `listingType` | enum | `sale` or `rent` |
| `priceMax` | number | Maximum price filter |
| `page` | number | Page number |
| `pageSize` | number | Items per page |

**Success Response (200):** Same as search endpoint, with results sorted by distance.

---

## 📊 Analytics Module

### GET /api/v1/analytics/tenant/overview
Get tenant-wide analytics overview.

**Permission:** Roles: SUPER_ADMIN, TENANT_ADMIN
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution |
| `Authorization` | ✅ | `Bearer <accessToken>` | JWT access token |
| `X-Request-ID` | ❌ | `uuid` | Optional request ID for tracing |

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `startDate` | string | last 30 days | Start date (YYYY-MM-DD, inclusive) |
| `endDate` | string | today | End date (YYYY-MM-DD, inclusive) |

**Success Response (200):**
```json
{
  "data": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "totals": {
      "viewsCount": 123,
      "leadsCount": 10,
      "enquiriesCount": 5,
      "bookingsCount": 2
    }
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

### GET /api/v1/analytics/vendor/overview
Get vendor analytics overview.

**Permission:** Roles: SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution |
| `Authorization` | ✅ | `Bearer <accessToken>` | JWT access token |
| `X-Request-ID` | ❌ | `uuid` | Optional request ID for tracing |

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `vendorId` | uuid | (role-based) | Required for TENANT_ADMIN; vendor roles can only access their own vendor |
| `startDate` | string | last 30 days | Start date (YYYY-MM-DD, inclusive) |
| `endDate` | string | today | End date (YYYY-MM-DD, inclusive) |

**Success Response (200):**
```json
{
  "data": {
    "vendorId": "uuid",
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "totals": {
      "viewsCount": 45,
      "leadsCount": 3,
      "enquiriesCount": 2,
      "bookingsCount": 1
    }
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

### GET /api/v1/analytics/vendor/listings
Get vendor listing performance analytics.

**Permission:** Roles: SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF
**Status:** ✅ Implemented

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution |
| `Authorization` | ✅ | `Bearer <accessToken>` | JWT access token |
| `X-Request-ID` | ❌ | `uuid` | Optional request ID for tracing |

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `vendorId` | uuid | (role-based) | Required for TENANT_ADMIN; vendor roles can only access their own vendor |
| `startDate` | string | last 30 days | Start date (YYYY-MM-DD, inclusive) |
| `endDate` | string | today | End date (YYYY-MM-DD, inclusive) |

**Success Response (200):**
```json
{
  "data": {
    "vendorId": "uuid",
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "items": [
      {
        "listingId": "uuid",
        "verticalType": "REAL_ESTATE",
        "viewsCount": 12,
        "leadsCount": 1,
        "enquiriesCount": 0,
        "bookingsCount": 0
      }
    ]
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

## 🛡️ Admin Module

### GET /api/v1/admin/dashboard/stats
Tenant-scoped admin dashboard stats.

**Permission:** `admin:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |
| `X-Request-ID` | ❌ | `uuid` | Optional request tracking ID. |

**Success Response (200):**
```json
{
  "data": {
    "vendorsByStatus": [{ "status": "APPROVED", "count": 12 }],
    "listingsByStatus": [{ "status": "PUBLISHED", "count": 42 }],
    "interactionsLast7DaysByType": [{ "status": "LEAD", "count": 5 }],
    "pendingVendors": 2,
    "pendingReviews": 1,
    "generatedAt": "2026-01-21T00:00:00.000Z"
  },
  "meta": { "requestId": "uuid" }
}
```

---

### GET /api/v1/admin/dashboard/pm-stats
Property Management dashboard stats — aggregated metrics across all PM modules.

**Permission:** `admin:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2 — PM Extension)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |
| `X-Request-ID` | ❌ | `uuid` | Optional request tracking ID. |

**Success Response (200):**
```json
{
  "data": {
    "tenancy": {
      "byStatus": [{ "status": "ACTIVE", "count": 85 }],
      "activeCount": 85,
      "expiringSoonCount": 5,
      "totalCount": 120
    },
    "billing": {
      "byStatus": [{ "status": "OVERDUE", "count": 12 }],
      "overdueCount": 12,
      "overdueAmount": "15600.00",
      "collectedThisMonth": "97800.00",
      "billedThisMonth": "125000.00"
    },
    "maintenance": {
      "byStatus": [{ "status": "OPEN", "count": 10 }],
      "byPriority": [{ "status": "HIGH", "count": 5 }],
      "openCount": 23,
      "unassignedCount": 8
    },
    "payout": {
      "byStatus": [{ "status": "CALCULATED", "count": 15 }],
      "pendingApprovalAmount": "45200.00",
      "processedThisMonth": "128500.00"
    },
    "deposit": {
      "byStatus": [{ "status": "COLLECTED", "count": 50 }],
      "totalHeldAmount": "256000.00",
      "pendingRefundCount": 4
    },
    "inspection": {
      "byStatus": [{ "status": "SCHEDULED", "count": 7 }],
      "upcomingCount": 7,
      "completedThisMonth": 15
    },
    "claim": {
      "byStatus": [{ "status": "SUBMITTED", "count": 6 }],
      "pendingReviewCount": 6,
      "disputedCount": 2
    },
    "legal": {
      "byStatus": [{ "status": "NOTICE_SENT", "count": 2 }],
      "openCount": 3
    },
    "occupant": {
      "totalCount": 95,
      "activeCount": 82
    },
    "companyAgent": {
      "totalCompanies": 12,
      "activeCompanies": 9,
      "totalAgents": 45,
      "activeAgents": 38
    },
    "generatedAt": "2026-02-23T00:00:00.000Z"
  }
}
```

---

### GET /api/v1/admin/vendors
Vendor management dashboard (paginated vendor listing + counts).

**Permission:** `vendor:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |
| `X-Request-ID` | ❌ | `uuid` | Optional request tracking ID. |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (1-indexed) |
| `pageSize` | number | Items per page (max: 100) |
| `status` | string | Filter by status (PENDING, APPROVED, REJECTED, SUSPENDED) |
| `vendorType` | string | Filter by type (INDIVIDUAL, COMPANY) |
| `search` | string | Search by name/slug/email |

**Success Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "tenantId": "uuid",
        "name": "ABC Properties",
        "slug": "abc-properties",
        "vendorType": "COMPANY",
        "status": "APPROVED",
        "listingsCount": 5,
        "interactionsCount": 12,
        "reviewsCount": 3,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "pageSize": 20, "totalItems": 50, "totalPages": 3 }
  },
  "meta": { "requestId": "uuid" }
}
```

---

### GET /api/v1/admin/vendors/{id}
Get vendor details (admin).

**Permission:** `vendor:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Vendor ID |

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "ABC Properties",
    "slug": "abc-properties",
    "vendorType": "COMPANY",
    "email": "info@abc.com",
    "phone": "+60123456789",
    "status": "APPROVED",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
    "profile": { "addressLine1": "123 Main St", "city": "Kuala Lumpur" },
    "settings": { "emailNotifications": true }
  },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/vendors/{id}/actions/approve
Approve a vendor.

**Permission:** `vendor:update` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Vendor ID |

**Request Body (optional):**
```json
{
  "notes": "Documents verified"
}
```

**Success Response (200):**
```json
{
  "data": { "id": "uuid", "status": "APPROVED", "approvedAt": "2026-01-01T00:00:00.000Z" },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/vendors/{id}/actions/reject
Reject a vendor.

**Permission:** `vendor:update` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Vendor ID |

**Request Body:**
```json
{
  "reason": "Incomplete documentation"
}
```

**Success Response (200):**
```json
{
  "data": { "id": "uuid", "status": "REJECTED" },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/vendors/{id}/actions/suspend
Suspend a vendor.

**Permission:** `vendor:update` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Vendor ID |

**Request Body:**
```json
{
  "reason": "Terms of service violation"
}
```

**Success Response (200):**
```json
{
  "data": { "id": "uuid", "status": "SUSPENDED" },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/vendors/{id}/actions/reactivate
Reactivate a vendor.

**Permission:** `vendor:update` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Vendor ID |

**Request Body (optional):**
```json
{
  "notes": "Issue resolved after review"
}
```

**Success Response (200):**
```json
{
  "data": { "id": "uuid", "status": "APPROVED" },
  "meta": { "requestId": "uuid" }
}
```

---

### GET /api/v1/admin/listings
Listing moderation dashboard (paginated listing listing + vendor + counts).

**Permission:** `listing:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (1-indexed) |
| `pageSize` | number | Items per page (max: 100) |
| `status` | string | Filter by status (DRAFT, PUBLISHED, EXPIRED, ARCHIVED) |
| `verticalType` | string | Filter by vertical type (e.g., `real_estate`) |
| `vendorId` | uuid | Filter by vendor ID |
| `search` | string | Search by title/slug |
| `isFeatured` | boolean | Filter by featured status |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `city` | string | Filter by city |
| `state` | string | Filter by state |
| `sortBy` | string | Sort field (`createdAt`, `updatedAt`, `price`, `title`, `publishedAt`, `viewCount`) |
| `sortOrder` | string | `asc` or `desc` |

**Success Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "tenantId": "uuid",
        "vendorId": "uuid",
        "vendor": { "id": "uuid", "name": "ABC Properties", "slug": "abc-properties" },
        "verticalType": "real_estate",
        "status": "PUBLISHED",
        "title": "Admin Dashboard Listing",
        "slug": "admin-dashboard-listing",
        "price": 100000,
        "currency": "MYR",
        "isFeatured": false,
        "publishedAt": "2026-01-01T00:00:00.000Z",
        "expiresAt": null,
        "interactionsCount": 0,
        "reviewsCount": 0,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "pageSize": 20, "totalItems": 1, "totalPages": 1 }
  },
  "meta": { "requestId": "uuid" }
}
```

---

### GET /api/v1/admin/listings/{id}
Get listing details (admin).

**Permission:** `listing:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Listing ID |

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "vendorId": "uuid",
    "verticalType": "real_estate",
    "title": "Sample Listing",
    "status": "PUBLISHED",
    "isFeatured": false,
    "publishedAt": "2026-01-01T00:00:00.000Z",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/listings/{id}/publish
Publish a listing.

**Permission:** `listing:update` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Listing ID |

**Request Body (optional):**
```json
{
  "expiresAt": "2026-06-01T00:00:00.000Z"
}
```

**Success Response (200):**
```json
{
  "data": { "id": "uuid", "status": "PUBLISHED" },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/listings/{id}/unpublish
Unpublish a listing.

**Permission:** `listing:update` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Listing ID |

**Request Body:**
```json
{
  "reason": "Need to update information"
}
```

**Success Response (200):**
```json
{
  "data": { "id": "uuid", "status": "DRAFT" },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/listings/{id}/expire
Expire a listing.

**Permission:** `listing:update` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Listing ID |

**Request Body (optional):**
```json
{
  "reason": "Policy violation"
}
```

**Success Response (200):**
```json
{
  "data": { "id": "uuid", "status": "EXPIRED" },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/listings/{id}/archive
Archive a listing.

**Permission:** `listing:update` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Listing ID |

**Request Body (optional):**
```json
{
  "reason": "Duplicate listing"
}
```

**Success Response (200):**
```json
{
  "data": { "id": "uuid", "status": "ARCHIVED" },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/listings/{id}/feature
Feature a listing until a specified date.

**Permission:** `listing:update` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Listing ID |

**Request Body:**
```json
{
  "featuredUntil": "2026-03-01T00:00:00.000Z"
}
```

**Success Response (200):**
```json
{
  "data": { "id": "uuid", "isFeatured": true },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/listings/{id}/unfeature
Remove featured status from a listing.

**Permission:** `listing:update` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Listing ID |

**Success Response (200):**
```json
{
  "data": { "id": "uuid", "isFeatured": false },
  "meta": { "requestId": "uuid" }
}
```

---

### GET /api/v1/admin/system/health
Admin-only system health summary (DB, Redis, queues).

**Permission:** `jobs:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Success Response (200):**
```json
{
  "data": {
    "status": "healthy",
    "databaseConnected": true,
    "redisConnected": true,
    "queues": [{ "name": "search.index", "waiting": 0, "active": 0, "completed": 10, "failed": 0, "delayed": 0 }],
    "timestamp": "2026-01-21T00:00:00.000Z"
  },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/bulk/search/reindex
Trigger an async bulk reindex job.

**Permission:** `jobs:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Request Body:**
```json
{
  "entityType": "listing",
  "verticalType": "real_estate",
  "batchSize": 100
}
```

**Success Response (202):**
```json
{
  "data": { "jobId": "123" },
  "meta": { "requestId": "uuid" }
}
```

**Notes:**
- Poll job progress via `GET /api/v1/admin/jobs/{queueName}/{jobId}` (queue: `search.index`).

---

### POST /api/v1/admin/bulk/listings/expire
Trigger an async bulk listing expiration job.

**Permission:** `jobs:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Request Body:**
```json
{
  "listingIds": ["550e8400-e29b-41d4-a716-446655440000"],
  "reason": "Policy violation"
}
```

**Success Response (202):**
```json
{
  "data": { "jobId": "456" },
  "meta": { "requestId": "uuid" }
}
```

**Notes:**
- Poll job progress via `GET /api/v1/admin/jobs/{queueName}/{jobId}` (queue: `listing.expire`).

---

### GET /api/v1/admin/jobs/health
Get health status of all background job queues.

**Permission:** `jobs:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 3.6)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Success Response (200):**
```json
{
  "queues": [
    {
      "name": "media.process",
      "waiting": 5,
      "active": 2,
      "completed": 1000,
      "failed": 3,
      "delayed": 10,
      "isPaused": false
    }
  ],
  "timestamp": "2026-01-21T12:00:00.000Z",
  "status": "healthy"
}
```

---

### GET /api/v1/admin/jobs/queues/{queueName}
Get detailed statistics for a specific queue.

**Permission:** `jobs:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 3.6)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `queueName` | string | Queue name (e.g., `media.process`) |

**Valid Queue Names:**
- `media.process`
- `search.index`
- `notification.send`
- `listing.expire`
- `tenancy.expiry`
- `analytics.process`
- `cleanup.process`
- `billing.process`
- `data.transfer`

**Success Response (200):**
```json
{
  "name": "media.process",
  "waiting": 5,
  "active": 2,
  "completed": 1000,
  "failed": 3,
  "delayed": 10,
  "isPaused": false
}
```

---

### GET /api/v1/admin/jobs/list
List jobs with filtering options.

**Permission:** `jobs:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 3.6)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Query Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `queue` | enum | Filter by queue name |
| `state` | enum | Filter by job state |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |

**Job States:** `waiting`, `active`, `completed`, `failed`, `delayed`, `paused`

**Success Response (200):**
```json
{
  "jobs": [
    {
      "id": "8",
      "name": "listing.expire_batch",
      "queue": "listing.expire",
      "state": "completed",
      "progress": 100,
      "attemptsMade": 1,
      "data": { "tenantId": "uuid", "type": "listing.expire_batch", "listingIds": ["uuid"], "reason": "Admin bulk expire" },
      "result": { "success": true, "message": "Expired 1/1 listings" },
      "createdAt": "2026-01-21T10:02:07.816Z",
      "processedAt": "2026-01-21T10:02:07.819Z",
      "finishedAt": "2026-01-21T10:02:07.833Z"
    }
  ],
  "total": 8
}
```

---

### GET /api/v1/admin/jobs/{queueName}/{jobId}
Get details of a specific job.

**Permission:** `jobs:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 3.6)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `queueName` | string | Queue name |
| `jobId` | string | Job ID |

**Success Response (200):**
```json
{
  "id": "123",
  "name": "image.resize",
  "queue": "media.process",
  "state": "completed",
  "progress": 50,
  "attemptsMade": 1,
  "data": { "mediaId": "abc123", "tenantId": "tenant-1" },
  "result": { "success": true },
  "failedReason": "Error message",
  "createdAt": "2026-01-21T12:00:00.000Z",
  "processedAt": "2026-01-21T12:00:05.000Z",
  "finishedAt": "2026-01-21T12:00:10.000Z"
}
```

---

### POST /api/v1/admin/jobs/retry
Retry a specific failed job.

**Permission:** `jobs:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 3.6)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Request Body:**
```json
{
  "queue": "media.process",
  "jobId": "123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "newJobId": "456",
  "message": "Job requeued successfully"
}
```

---

### POST /api/v1/admin/jobs/retry-all/{queueName}
Retry all failed jobs in a queue.

**Permission:** `jobs:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 3.6)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `queueName` | string | Queue name |

---

### POST /api/v1/admin/jobs/add
Manually add a job to a queue.

**Permission:** `jobs:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 3.6)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Request Body:**
```json
{
  "queue": "search.index",
  "jobType": "bulk.reindex",
  "data": {
    "tenantId": "tenant-1",
    "entityType": "listing",
    "batchSize": 100
  },
  "delay": 5000
}
```

**Success Response (201):**
```json
{
  "success": true,
  "jobId": "789",
  "queue": "media.process",
  "jobType": "bulk.reindex"
}
```

---

### POST /api/v1/admin/jobs/queues/{queueName}/pause
Pause a queue (stop processing new jobs).

**Permission:** `jobs:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 3.6)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `queueName` | string | Queue name |

**Success Response (201):**
Empty response body.

---

### POST /api/v1/admin/jobs/queues/{queueName}/resume
Resume a paused queue.

**Permission:** `jobs:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 3.6)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `queueName` | string | Queue name |

**Success Response (201):**
Empty response body.

---

### POST /api/v1/admin/jobs/queues/{queueName}/clean
Clean completed or failed jobs from a queue.

**Permission:** `jobs:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 3.6)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `queueName` | string | Queue name |

**Query Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `grace` | number | Keep jobs newer than (ms) (default: 3600000) |
| `limit` | number | Max jobs to clean (default: 1000) |

**Success Response (201):**
Empty response body.

---

### GET /api/v1/admin/feature-flags
List all feature flags (admin).

**Permission:** `feature-flag:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2b)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "key": "new-search-ranking",
      "type": "BOOLEAN",
      "description": "Enable the new search ranking algorithm",
      "owner": "platform-team",
      "defaultValue": false,
      "rolloutPercentage": null,
      "allowedVerticals": [],
      "allowedRoles": [],
      "reviewAt": null,
      "expiresAt": null,
      "isArchived": false,
      "createdAt": "2026-01-21T00:00:00.000Z",
      "updatedAt": "2026-01-21T00:00:00.000Z"
    }
  ],
  "meta": { "requestId": "uuid" }
}
```

---

### GET /api/v1/admin/feature-flags/{key}
Get a feature flag by key (admin).

**Permission:** `feature-flag:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2b)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `key` | string | Feature flag key |

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "key": "new-search-ranking",
    "type": "BOOLEAN",
    "description": "Enable the new search ranking algorithm",
    "owner": "platform-team",
    "defaultValue": false,
    "rolloutPercentage": null,
    "allowedVerticals": [],
    "allowedRoles": [],
    "reviewAt": null,
    "expiresAt": null,
    "isArchived": false,
    "createdAt": "2026-01-21T00:00:00.000Z",
    "updatedAt": "2026-01-21T00:00:00.000Z"
  },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/feature-flags
Create a feature flag (admin).

**Permission:** `feature-flag:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2b)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Request Body:**
```json
{
  "key": "new-search-ranking",
  "type": "BOOLEAN",
  "description": "Enable the new search ranking algorithm",
  "owner": "platform-team",
  "defaultValue": false,
  "rolloutPercentage": 25,
  "allowedVerticals": ["real_estate"],
  "allowedRoles": ["TENANT_ADMIN"],
  "reviewAt": "2026-02-01T00:00:00Z",
  "expiresAt": "2026-03-01T00:00:00Z"
}
```

**Success Response (201):**
```json
{
  "data": { "id": "uuid", "key": "new-search-ranking" },
  "meta": { "requestId": "uuid" }
}
```

---

### PATCH /api/v1/admin/feature-flags/{key}
Update a feature flag (admin).

**Permission:** `feature-flag:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2b)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `key` | string | Feature flag key |

**Request Body (partial):**
```json
{
  "rolloutPercentage": 50,
  "isArchived": false
}
```

**Success Response (200):**
```json
{
  "data": { "id": "uuid", "key": "new-search-ranking" },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/feature-flags/{key}/overrides
Create or update an override for a feature flag (admin).

**Permission:** `feature-flag:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2b)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `key` | string | Feature flag key |

**Request Body:**
```json
{
  "tenantId": "uuid",
  "verticalType": "real_estate",
  "role": "TENANT_ADMIN",
  "isEmergency": false,
  "value": true,
  "rolloutPercentage": 10
}
```

**Notes:**
- Resolution order: emergency override → tenant override → vertical override → percentage rollout → default.
- `tenantId`, `verticalType`, and `role` are optional; omit them to target broader scopes.

**Success Response (200):**
```json
{
  "data": { "id": "uuid" },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/feature-flags/{key}/user-targets
Set per-user feature flag target (admin).

**Permission:** `feature-flag:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2b)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `key` | string | Feature flag key |

**Request Body:**
```json
{
  "tenantId": "uuid",
  "userId": "uuid",
  "value": true
}
```

**Success Response (200):**
```json
{
  "data": { "ok": true },
  "meta": { "requestId": "uuid" }
}
```

---

### GET /api/v1/admin/experiments
List experiments (admin).

**Permission:** `feature-flag:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2b)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "key": "search-ranking-v2",
      "description": "A/B test for search ranking v2",
      "owner": "growth-team",
      "successMetrics": "CTR, conversion rate",
      "variants": [{ "key": "control", "weight": 50 }, { "key": "variant", "weight": 50 }],
      "startsAt": "2026-01-21T00:00:00.000Z",
      "endsAt": "2026-02-21T00:00:00.000Z",
      "isActive": true
    }
  ],
  "meta": { "requestId": "uuid" }
}
```

---

### GET /api/v1/admin/experiments/{key}
Get an experiment by key (admin).

**Permission:** `feature-flag:read` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2b)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `key` | string | Experiment key |

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "key": "search-ranking-v2",
    "description": "A/B test for search ranking v2",
    "owner": "growth-team",
    "successMetrics": "CTR, conversion rate",
    "variants": [{ "key": "control", "weight": 50 }, { "key": "variant", "weight": 50 }],
    "startsAt": "2026-01-21T00:00:00.000Z",
    "endsAt": "2026-02-21T00:00:00.000Z",
    "isActive": true
  },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/experiments
Create an experiment (admin).

**Permission:** `feature-flag:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2b)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Request Body:**
```json
{
  "key": "search-ranking-v2",
  "description": "A/B test for search ranking v2",
  "owner": "growth-team",
  "successMetrics": "CTR, conversion rate",
  "variants": [{ "key": "control", "weight": 50 }, { "key": "variant", "weight": 50 }],
  "startsAt": "2026-01-21T00:00:00Z",
  "endsAt": "2026-02-21T00:00:00Z",
  "isActive": true,
  "featureFlagKey": "new-search-ranking"
}
```

**Success Response (201):**
```json
{
  "data": { "id": "uuid", "key": "search-ranking-v2" },
  "meta": { "requestId": "uuid" }
}
```

---

### POST /api/v1/admin/experiments/{key}/tenant-opt-in
Opt a tenant in/out of an experiment (admin).

**Permission:** `feature-flag:write` (SUPER_ADMIN, TENANT_ADMIN)
**Status:** ✅ Implemented (Session 4.2b)

**Headers:**
| Header | Required | Example | Notes |
|--------|----------|---------|-------|
| `Authorization` | ✅ | `Bearer eyJhbG...` | Access token. |
| `X-Tenant-ID` | ✅ | `demo` | Required for tenant resolution. |

**Path Parameters:**
| Param | Type | Description |
|------|------|-------------|
| `key` | string | Experiment key |

**Request Body:**
```json
{
  "tenantId": "uuid",
  "optIn": true
}
```

**Notes:**
- If `tenantId` is omitted, the current `X-Tenant-ID` tenant is used.

**Success Response (200):**
```json
{
  "data": { "ok": true },
  "meta": { "requestId": "uuid" }
}
```

---

## 🏥 Health Module

### GET /api/v1/health
Basic health check.

**Permission:** Public
**Status:** ⏳ Pending

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

---

## 🌐 Public API Module

The Public API module provides unauthenticated endpoints for public access with rate limiting.

**Architecture:**
- No authentication required (X-Tenant-ID header for tenant resolution)
- Rate limiting via Redis sliding window algorithm
- Response caching with L1 (memory) and L2 (Redis)
- Only PUBLISHED listings and APPROVED vendors returned

**Rate Limit Presets:**
| Preset | Limit | Window | Use Case |
|--------|-------|--------|----------|
| PUBLIC_SEARCH | 60 requests | 60 seconds | Search endpoints |
| PUBLIC_READ | 120 requests | 60 seconds | Detail endpoints |
| PUBLIC_WRITE | 10 requests | 60 seconds | Form submissions |

**Response Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Unix timestamp when window resets

---

### GET /api/v1/public/search/listings
Search public listings.

**Permission:** Public (Rate Limited: 60/min)

**Request Headers:**
```
X-Tenant-ID: uuid (required)
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | No | Search query |
| `verticalType` | string | No | Filter by vertical type |
| `priceMin` | number | No | Minimum price |
| `priceMax` | number | No | Maximum price |
| `city` | string | No | Filter by city |
| `state` | string | No | Filter by state |
| `country` | string | No | Filter by country |
| `lat` | number | No | Latitude for geo search |
| `lng` | number | No | Longitude for geo search |
| `radius` | number | No | Radius in km (default: 10) |
| `featuredOnly` | boolean | No | Only featured listings |
| `sort` | enum | No | RELEVANCE, PRICE_ASC, PRICE_DESC, NEWEST, OLDEST |
| `page` | number | No | Page number (default: 1) |
| `pageSize` | number | No | Items per page (default: 20, max: 50) |
| `highlight` | boolean | No | Include search highlights |

**Success Response (200):**
```json
{
  "data": {
    "hits": [
      {
        "id": "uuid",
        "title": "string",
        "slug": "string",
        "price": 500000,
        "currency": "MYR",
        "primaryImageUrl": "string",
        "location": {
          "city": "string",
          "state": "string",
          "country": "string"
        },
        "verticalType": "real-estate",
        "vendorName": "string",
        "vendorSlug": "string",
        "isFeatured": true,
        "publishedAt": "2025-01-01T00:00:00Z",
        "highlights": { "title": ["<em>keyword</em>"] }
      }
    ],
    "total": 100,
    "aggregations": {}
  }
}
```

---

### GET /api/v1/public/listings/:idOrSlug
Get public listing detail.

**Permission:** Public (Rate Limited: 120/min)

**Request Headers:**
```
X-Tenant-ID: uuid (required)
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `idOrSlug` | string | Listing UUID or slug |

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "title": "string",
    "slug": "string",
    "description": "string",
    "verticalType": "real-estate",
    "price": 500000,
    "currency": "MYR",
    "isFeatured": true,
    "publishedAt": "2025-01-01T00:00:00Z",
    "location": {
      "address": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postalCode": "string",
      "coordinates": { "lat": 3.123, "lng": 101.456 }
    },
    "attributes": {},
    "media": [
      {
        "id": "uuid",
        "url": "string",
        "thumbnailUrl": "string",
        "mediaType": "IMAGE",
        "altText": "string",
        "sortOrder": 0
      }
    ],
    "vendor": {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "logoUrl": "string",
      "phone": "string",
      "email": "string"
    }
  }
}
```

**Error Responses:**
- 404: Listing not found

---

### GET /api/v1/public/vendors/:idOrSlug
Get public vendor profile.

**Permission:** Public (Rate Limited: 120/min)

**Request Headers:**
```
X-Tenant-ID: uuid (required)
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `idOrSlug` | string | Vendor UUID or slug |

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "slug": "string",
    "description": "string",
    "logoUrl": "string",
    "coverImageUrl": "string",
    "phone": "string",
    "email": "string",
    "website": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "totalListings": 25,
    "ratings": {
      "averageRating": 4.5,
      "totalReviews": 100,
      "ratingBreakdown": { "1": 2, "2": 3, "3": 10, "4": 35, "5": 50 }
    },
    "featuredListings": [
      {
        "id": "uuid",
        "title": "string",
        "slug": "string",
        "price": 500000,
        "currency": "MYR",
        "primaryImageUrl": "string",
        "verticalType": "real-estate",
        "isFeatured": true
      }
    ],
    "memberSince": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- 404: Vendor not found

---

### Implementation Details

**Files Created:**
1. `src/modules/public/public.module.ts` - Module configuration
2. `src/modules/public/public.controller.ts` - Controller with 3 endpoints
3. `src/modules/public/public.service.ts` - Service with caching
4. `src/modules/public/dto/public-search.dto.ts` - Search DTOs
5. `src/modules/public/dto/public-listing.dto.ts` - Listing DTOs
6. `src/modules/public/dto/public-vendor.dto.ts` - Vendor DTOs
7. `src/modules/public/decorators/rate-limit.decorator.ts` - @RateLimit decorator
8. `src/modules/public/guards/rate-limit.guard.ts` - Rate limit guard

**Dependencies:**
- `@infrastructure/cache` - L1/L2 caching
- `@infrastructure/search` - OpenSearch integration
- `@infrastructure/database` - Prisma ORM
- `@core/rate-limit` - Redis sliding window rate limiter

---

### GET /api/v1/health/ready
Readiness check (includes dependencies).

**Permission:** Public
**Status:** ⏳ Pending

**Success Response (200):**
```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "opensearch": "ok"
  }
}
```

---

## 📝 Changelog

| Date | Session | Changes |
|------|---------|---------|
| - | - | Initial template created |
| 2026-01-14 | 1.1 | Project skeleton only (no HTTP endpoints implemented) |
| 2026-01-14 | 1.2 | Prisma & database setup (no HTTP endpoints implemented) |
| 2026-01-14 | 1.3 | Tenant entities added to schema (no HTTP endpoints implemented) |
| 2026-01-14 | 1.4 | TenantContext middleware + tenant enforcement scaffolding (no HTTP endpoints implemented) |
| 2026-01-14 | 1.5 | Auth login/refresh endpoints implemented (tenant-scoped via X-Tenant-ID) |
| 2026-01-14 | 1.6 | RBAC scaffolding added (@Roles, @RequirePermission, guards + role-permission mapping) (no HTTP endpoints implemented) |
| 2026-01-14 | 1.7 | Auth register endpoint implemented + Users CRUD endpoints implemented (list, me, get by id, create, update, deactivate) |
| 2026-01-14 | 1.8 | Swagger/OpenAPI enabled at /api/docs; controllers + DTOs annotated (no new HTTP endpoints implemented) |
| 2026-01-16 | 2.1 | Vendors module + 12 vendor endpoints implemented (CRUD, settings, logo, onboarding, transfer, approval/suspension) |
| 2026-01-18 | 2.2 | Listings module + 13 listing endpoints implemented (CRUD, publish, unpublish, archive, feature, import, visibility rules) |
| 2026-01-18 | 2.2b | State machines for Listings (transitions: publish, unpublish, expire, archive, restore, feature/unfeature) |
| 2026-01-20 | 2.3 | Search module + 2 search endpoints implemented (search listings with facets, autocomplete suggestions) |
| 2026-01-20 | 2.4 | Media module + 6 media endpoints implemented (presigned upload flow, S3 integration, CRUD operations) |
| 2026-01-20 | 2.5 | Interactions module + 6 interaction endpoints implemented (leads, enquiries, bookings with status workflow, messaging) |
| 2026-01-20 | 2.6 | Reviews module + 7 review endpoints implemented (moderation workflow, vendor responses, rating aggregations) |
| 2026-01-20 | 2.7 | Subscriptions & Plans module + 14 endpoints implemented (7 plan management + 7 subscription lifecycle with entitlements/usage) |
| 2026-01-20 | 2.7b | Billing Provider Integration + 1 webhook endpoint implemented (Stripe webhook processing with idempotency) |
| 2026-01-20 | 2.7c | Pricing Models Configuration + 11 pricing endpoints implemented (pricing configs/rules CRUD, charge calculation, charge events) |
| 2026-01-20 | 2.8 | Notification System + 6 notification endpoints implemented (in-app notifications, preferences, event-driven multi-channel delivery with SMTP) |
| 2026-01-21 | 3.1 | WebSocket Infrastructure + 3 namespaces implemented (/tenant, /vendor, /notifications with Redis adapter, JWT auth, room-based messaging) |
| 2026-01-21 | 3.2 | Vertical Registry + 14 vertical endpoints implemented (definitions CRUD, tenant enablement, VerticalGuard) |
| 2026-01-21 | 3.3 | Real Estate Vertical Schema (no new endpoints - schema, validation, search mapping registered via OnModuleInit) |
| 2026-01-21 | 3.4 | Real Estate Search + 4 endpoints implemented (search with 30+ filters/facets, suggestions, facets, nearby geo-search) |
| 2026-01-21 | 3.5 | Validation Engine (no new endpoints - AttributeSchemaRegistry, ValidationService, phase-based validation, cross-field rules, vertical validators) |
| 2026-01-21 | 4.2 | Admin Dashboard + 28 admin endpoints implemented (dashboard stats, system health, listings/vendors dashboards, bulk actions, job monitoring) |
| 2026-01-21 | 4.2b | Feature Flags & Experiments + 10 admin endpoints implemented (feature flags CRUD, overrides, user targets, experiments CRUD, tenant opt-in) |
| 2026-01-21 | 4.3 | Public API + 3 public endpoints implemented (search listings, listing detail, vendor profile with rate limiting via Redis sliding window) |
| 2026-01-21 | 4.4 | Audit Logging + 6 audit endpoints implemented (query logs, get by ID/target/actor, action types, target types) |
| 2026-01-21 | 4.5 | Testing & E2E (no new endpoints - 96 tests: 21 unit + 75 E2E covering auth, listing, vendor, tenant isolation) |
| 2026-02-21 | 6.1 | Rent Billing Engine + 9 endpoints implemented (generate bill, list/get/download PDF, add line items, apply late fee, mark sent/overdue, write-off) + 28 unit tests |
| 2026-02-21 | 6.2 | Billing Automation + 3 endpoints (automation status, billing config GET/PATCH) + BillingProcessor (batch/single/overdue/late-fee jobs) + 3 cron schedules + billing notifications + 29 unit tests |
| 2026-02-21 | 6.5 | Payment Reminder System + 3 endpoints (manual remind, reminder history, legal escalation) + ReminderService (4-tier schedule, batch processing, event-driven) + cron at 7 AM + 29 unit tests |

---

## 🔔 Notifications Module

The Notification module implements event-driven, multi-channel notifications with tenant-customizable templates and user preference management.

**Architecture:**
- Event-driven delivery: Domain events → Notification handlers → Async channel delivery
- Template-driven messaging: Handlebars templates with tenant customization per locale
- Multi-channel support: EMAIL, IN_APP, SMS (placeholder), PUSH (placeholder), WhatsApp (placeholder)
- User preferences: Opt-out model (enabled by default, users can disable per type + channel)
- Provider abstraction: Swappable email providers (SMTP functional, SendGrid placeholder)

**Notification Types:**
- LISTING_PUBLISHED, LISTING_EXPIRED, LISTING_FEATURED
- INTERACTION_NEW, INTERACTION_MESSAGE, INTERACTION_CLOSED
- REVIEW_SUBMITTED, REVIEW_APPROVED, REVIEW_REJECTED, REVIEW_RESPONDED
- SUBSCRIPTION_CREATED, SUBSCRIPTION_RENEWED, SUBSCRIPTION_CANCELED, SUBSCRIPTION_EXPIRING
- PAYMENT_SUCCESS, PAYMENT_FAILED, PAYMENT_REFUNDED
- VENDOR_APPROVED, VENDOR_SUSPENDED
- SYSTEM_ALERT

**Channels:**
- EMAIL: SMTP (nodemailer) or SendGrid
- IN_APP: Database storage only (no external delivery)
- SMS: Placeholder (not implemented)
- PUSH: Placeholder (not implemented)
- WHATSAPP: Placeholder (not implemented)

---

### 1. List User Notifications
Get paginated in-app notifications for authenticated user.

**Endpoint:** `GET /api/v1/notifications`

**Auth:** JWT required

**Query Parameters:**
```typescript
{
  type?: NotificationType;        // Filter by notification type
  channel?: NotificationChannel;  // Filter by channel (defaults to IN_APP)
  status?: NotificationStatus;    // Filter by status (PENDING, SENT, FAILED, READ)
  unreadOnly?: boolean;           // Show only unread notifications
  page?: number;                  // Page number (default: 1)
  pageSize?: number;              // Items per page (default: 20)
}
```

**Response:** `200 OK`
```typescript
{
  data: NotificationResponseDto[];  // Array of notifications
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// NotificationResponseDto
{
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  status: NotificationStatus;
  readAt?: Date;
  sentAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  eventId?: string;
  resourceType?: string;
  resourceId?: string;
  createdAt: Date;
}
```

**Example:**
```bash
GET /api/v1/notifications?unreadOnly=true&page=1&pageSize=10
Authorization: Bearer <jwt_token>
```

---

### 2. Get Unread Count
Get count of unread in-app notifications.

**Endpoint:** `GET /api/v1/notifications/unread-count`

**Auth:** JWT required

**Response:** `200 OK`
```typescript
{
  count: number;
}
```

**Example:**
```bash
GET /api/v1/notifications/unread-count
Authorization: Bearer <jwt_token>

# Response
{
  "count": 5
}
```

---

### 3. Mark Notification as Read
Mark a single notification as read.

**Endpoint:** `PATCH /api/v1/notifications/:id/read`

**Auth:** JWT required

**Path Parameters:**
- `id`: Notification ID

**Request Body:**
```typescript
{
  // Empty body (required by DTO validation)
}
```

**Response:** `200 OK`
```typescript
NotificationResponseDto  // Updated notification with status=READ, readAt set
```

**Errors:**
- `404 Not Found`: Notification not found or access denied

**Example:**
```bash
PATCH /api/v1/notifications/abc123/read
Authorization: Bearer <jwt_token>
Content-Type: application/json

{}
```

---

### 4. Mark All Notifications as Read
Mark all user notifications as read.

**Endpoint:** `POST /api/v1/notifications/mark-all-read`

**Auth:** JWT required

**Request Body:**
```typescript
{
  // Empty body (required by DTO validation)
}
```

**Response:** `200 OK`
```typescript
{
  count: number;  // Number of notifications marked as read
}
```

**Example:**
```bash
POST /api/v1/notifications/mark-all-read
Authorization: Bearer <jwt_token>
Content-Type: application/json

{}

# Response
{
  "count": 12
}
```

---

### 5. Get User Notification Preferences
Get all notification preferences for authenticated user.

**Endpoint:** `GET /api/v1/notifications/preferences`

**Auth:** JWT required

**Response:** `200 OK`
```typescript
PreferenceResponseDto[]

// PreferenceResponseDto
{
  id: string;
  userId: string;
  notificationType: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Note:** If no preference exists for a type + channel combination, it defaults to **enabled** (opt-out model).

**Example:**
```bash
GET /api/v1/notifications/preferences
Authorization: Bearer <jwt_token>

# Response
[
  {
    "id": "pref1",
    "userId": "user123",
    "notificationType": "LISTING_PUBLISHED",
    "channel": "EMAIL",
    "enabled": false,  // User opted out
    "createdAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-20T10:00:00Z"
  }
]
```

---

### 6. Update Notification Preference
Update (or create) a notification preference.

**Endpoint:** `PATCH /api/v1/notifications/preferences`

**Auth:** JWT required

**Request Body:**
```typescript
{
  notificationType: NotificationType;  // Required
  channel: NotificationChannel;        // Required
  enabled: boolean;                    // Required (true = opt-in, false = opt-out)
}
```

**Response:** `200 OK`
```typescript
PreferenceResponseDto  // Updated/created preference
```

**Example:**
```bash
PATCH /api/v1/notifications/preferences
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "notificationType": "LISTING_PUBLISHED",
  "channel": "EMAIL",
  "enabled": false
}

# Response
{
  "id": "pref1",
  "userId": "user123",
  "notificationType": "LISTING_PUBLISHED",
  "channel": "EMAIL",
  "enabled": false,
  "createdAt": "2026-01-20T10:00:00Z",
  "updatedAt": "2026-01-20T10:30:00Z"
}
```

---

## Event-Driven Notification Delivery

Notifications are **never sent synchronously** during business operations. Instead:

1. **Domain Event Emitted**: Business logic emits event (e.g., `listing.published`)
2. **Handler Triggered**: Notification handler listens to event
3. **Notification Created**: Handler calls `NotificationService.sendNotification()`
4. **Service Checks Preferences**: Verifies user hasn't opted out
5. **Template Rendered**: Fetches template, renders with Handlebars
6. **Record Created**: Notification saved with status=PENDING
7. **Delivery Event Emitted**: Service emits `notification.deliver` event
8. **Background Delivery**: Delivery handler processes async (via channel provider)
9. **Status Updated**: Notification marked as SENT/FAILED

**Flow:**
```
Business Logic → Domain Event → Handler → NotificationService
  → Check Preferences → Render Template → Create Notification
  → Emit Delivery Event → Background Job → Channel Provider
  → Update Status (SENT/FAILED)
```

**Event Handlers Implemented:**
- `ListingNotificationHandler`: listing.published, listing.expired
- `InteractionNotificationHandler`: interaction.created, interaction.message
- `ReviewNotificationHandler`: review.submitted, review.approved
- `SubscriptionNotificationHandler`: subscription.created, subscription.expiring
- `BillingNotificationHandler`: billing.generated, billing.overdue, billing.payment.succeeded, billing.payment.failed
- `NotificationDeliveryHandler`: notification.deliver (executes actual channel delivery)

---

## Template System

Notification templates use **Handlebars** for variable substitution.

**Template Variables by Type:**
- **Listing**: listingId, listingTitle, listingType, propertyType, price, location, vendorName, tenantName
- **Interaction**: interactionId, interactionType, listingTitle, buyerName, vendorName, message, status
- **Review**: reviewId, reviewerName, listingTitle, rating, comment, vendorName, moderatorName, reason
- **Subscription**: subscriptionId, planName, price, interval, status, startDate, endDate, tenantName
- **Payment**: paymentId, amount, currency, status, invoiceId, subscriptionPlanName, tenantName
- **Vendor**: vendorId, vendorName, companyName, email, phone, approverName, reason, tenantName

**Example Template:**
```handlebars
<p>Hello {{vendorName}},</p>
<p>Your listing <strong>{{listingTitle}}</strong> has been published successfully!</p>
<p>Property Type: {{propertyType}}</p>
<p>Price: {{currency}} {{price}}</p>
<p>Location: {{location}}</p>
<p>Thank you for using {{tenantName}}!</p>
```

**Template Model in Prisma:**
```prisma
model NotificationTemplate {
  id            String              @id @default(dbgenerated("gen_random_uuid()"))
  tenantId      String
  type          NotificationType    // Which notification type this template is for
  channel       NotificationChannel // Which channel (EMAIL, IN_APP, SMS, etc.)
  name          String              // Template name (e.g., "Listing Published Email")
  description   String?
  subject       String?             // Email subject (supports variables)
  bodyTemplate  String              // Handlebars template
  locale        String @default("en") // i18n support
  isActive      Boolean @default(true)
  variables     Json?               // Expected variables (JSON schema)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([tenantId, type, channel, locale]) // One template per type+channel+locale per tenant
}
```

---

## Implementation Details

**Files Created:**
1. `prisma/schema.prisma`: Notification, NotificationTemplate, NotificationPreference models + enums
2. `src/modules/notification/types/notification.types.ts`: Type definitions (212 lines)
3. `src/modules/notification/dto/notification.dto.ts`: DTOs with validation (443 lines)
4. `src/modules/notification/repositories/notification.repository.ts`: Data access layer (369 lines)
5. `src/modules/notification/providers/smtp-email.provider.ts`: SMTP provider (59 lines)
6. `src/modules/notification/providers/sendgrid-email.provider.ts`: SendGrid placeholder (67 lines)
7. `src/modules/notification/services/notification.service.ts`: Core service (373 lines)
8. `src/modules/notification/listeners/notification.handlers.ts`: Event handlers (157 lines)
9. `src/modules/notification/controllers/notification.controller.ts`: REST API (186 lines)
10. `src/modules/notification/notification.module.ts`: Module configuration (63 lines)
11. `src/database/database.module.ts`: Database module (placeholder)
12. `src/database/prisma.service.ts`: Prisma service (placeholder)
13. `src/modules/auth/guards/jwt-auth.guard.ts`: JWT guard (placeholder)

**Database Migration:**
- Migration: `20260120152530_add_notification_system`
- Tables: notifications, notification_templates, notification_preferences
- Enums: NotificationType (13 values), NotificationChannel (5 values), NotificationStatus (4 values)

**Dependencies Added:**
- `nodemailer` - SMTP email delivery
- `@types/nodemailer` - TypeScript types
- `handlebars` - Template rendering
- `@nestjs/event-emitter` - Event-driven architecture (already installed)

**Environment Variables Required:**
```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Zam Property <noreply@zamproperty.com>"

# SendGrid (optional)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM="Zam Property <noreply@zamproperty.com>"
```

---

## 🔌 WebSocket Module

WebSocket provides real-time bidirectional communication using Socket.IO with Redis adapter for horizontal scaling.

### Connection

**URL:** `ws://localhost:3000/{namespace}`

**Namespaces:**
| Namespace | Purpose | Access |
|-----------|---------|--------|
| `/tenant` | Tenant-scoped updates (listings, interactions) | Authenticated users |
| `/vendor` | Vendor-specific updates (leads, stats) | Vendors only |
| `/notifications` | User notification delivery | Authenticated users |

**Authentication:**
WebSocket connections require JWT authentication. Token can be provided via:
1. `auth.token` in handshake options (recommended)
2. `token` query parameter
3. `Authorization` header

**Connection Example:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/tenant', {
  auth: {
    token: 'your-jwt-access-token'
  }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.log('Connection error:', error.message);
});
```

---

### /tenant Namespace

Real-time updates for tenant-scoped data (listings, interactions).

**Auto-Joined Rooms on Connect:**
- `tenant:{tenantId}` - All tenant updates
- `user:{userId}` - User-specific updates
- `vendor:{vendorId}` - If user is a vendor
- `tenant:{tenantId}:listings` - If user is admin (listing updates)

#### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join:listing` | `{ listingId: string }` | Join listing room for updates |
| `leave:listing` | `{ listingId: string }` | Leave listing room |
| `listing:view` | `{ listingId: string }` | Track listing view |
| `join:interaction` | `{ interactionId: string }` | Join interaction room |
| `leave:interaction` | `{ interactionId: string }` | Leave interaction room |
| `ping` | - | Connection health check |

#### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `listing:created` | `ListingEventPayload` | New listing created |
| `listing:updated` | `ListingEventPayload` | Listing details updated |
| `listing:published` | `ListingEventPayload` | Listing published |
| `listing:unpublished` | `ListingEventPayload` | Listing unpublished |
| `listing:expired` | `ListingEventPayload` | Listing expired |
| `listing:deleted` | `{ listingId: string }` | Listing deleted |
| `interaction:created` | `InteractionEventPayload` | New interaction/lead |
| `interaction:updated` | `InteractionEventPayload` | Interaction status changed |
| `interaction:message` | `MessageEventPayload` | New message in interaction |
| `pong` | `{ timestamp: number }` | Ping response |

**ListingEventPayload:**
```typescript
{
  listingId: string;
  tenantId: string;
  vendorId: string;
  title: string;
  status: string;
  updatedAt: string;
}
```

---

### /vendor Namespace

Real-time updates for vendor dashboard (leads, messages, stats).

**Access:** Vendors only. Non-vendor connections are rejected.

**Auto-Joined Rooms on Connect:**
- `vendor:{vendorId}` - Vendor-specific updates
- `tenant:{tenantId}` - Tenant updates

**Initial Data on Connect:**
```typescript
{
  event: 'vendor:stats',
  data: {
    activeListings: number;
    newLeads: number;
    totalMessages: number;
  }
}
```

#### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join:vendor` | `{ vendorId: string }` | Join vendor room |
| `leave:vendor` | `{ vendorId: string }` | Leave vendor room |
| `interaction:message` | `SendMessageDto` | Send message in interaction |
| `interaction:typing` | `TypingDto` | Typing indicator |
| `interaction:read` | `MarkReadDto` | Mark messages as read |
| `vendor:get-stats` | - | Request current stats |
| `ping` | - | Connection health check |

**SendMessageDto:**
```typescript
{
  interactionId: string;
  message: string;
  isInternal?: boolean;
}
```

**TypingDto:**
```typescript
{
  interactionId: string;
  isTyping: boolean;
}
```

**MarkReadDto:**
```typescript
{
  interactionId: string;
  messageIds?: string[];
}
```

#### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `interaction:created` | `InteractionEventPayload` | New lead received |
| `interaction:message` | `MessageEventPayload` | New message received |
| `interaction:typing` | `TypingEventPayload` | Someone is typing |
| `interaction:read` | `ReadEventPayload` | Messages marked as read |
| `vendor:stats` | `VendorStatsPayload` | Updated vendor stats |
| `vendor:approved` | `VendorEventPayload` | Vendor approved |
| `vendor:rejected` | `VendorEventPayload` | Vendor rejected |
| `vendor:suspended` | `VendorEventPayload` | Vendor suspended |
| `message:sent` | `MessageEventPayload` | Confirm message sent |
| `pong` | `{ timestamp: number }` | Ping response |

---

### /notifications Namespace

User notification delivery in real-time.

**Auto-Joined Rooms on Connect:**
- `notifications:{userId}` - User's notification room

**Initial Data on Connect:**
```typescript
{
  event: 'notification:count',
  data: {
    unread: number;
  }
}
```

#### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `notification:read` | `{ notificationId: string }` | Mark notification as read |
| `notification:read-all` | - | Mark all notifications as read |
| `notification:get-count` | - | Get unread count |
| `ping` | - | Connection health check |

#### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `notification:new` | `NotificationPayload` | New notification |
| `notification:count` | `{ unread: number }` | Unread count update |
| `notification:read` | `{ notificationId: string, success: boolean }` | Read confirmation |
| `notification:read-all` | `{ success: boolean, count: number }` | Read all confirmation |
| `pong` | `{ timestamp: number }` | Ping response |

**NotificationPayload:**
```typescript
{
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: string;
}
```

---

### Server-Emitted Events (via Event Bridge)

The WebSocketEventBridge listens to domain events and broadcasts them to relevant rooms.

| Domain Event | WebSocket Event | Target Room |
|--------------|-----------------|-------------|
| `listing.created` | `listing:created` | `tenant:{tenantId}:listings` |
| `listing.updated` | `listing:updated` | `listing:{listingId}` |
| `listing.published` | `listing:published` | `listing:{listingId}`, `vendor:{vendorId}` |
| `listing.unpublished` | `listing:unpublished` | `listing:{listingId}` |
| `listing.expired` | `listing:expired` | `listing:{listingId}`, `vendor:{vendorId}` |
| `listing.deleted` | `listing:deleted` | `listing:{listingId}` |
| `interaction.created` | `interaction:created` | `vendor:{vendorId}` |
| `interaction.updated` | `interaction:updated` | `interaction:{interactionId}` |
| `interaction.message.created` | `interaction:message` | `interaction:{interactionId}` |
| `notification.created` | `notification:new` | `notifications:{userId}` |
| `vendor.approved` | `vendor:approved` | `vendor:{vendorId}` |
| `vendor.rejected` | `vendor:rejected` | `vendor:{vendorId}` |
| `vendor.suspended` | `vendor:suspended` | `vendor:{vendorId}` |
| `review.created` | `review:new` | `vendor:{vendorId}` |
| `review.approved` | `review:approved` | `vendor:{vendorId}`, `listing:{listingId}` |
| `subscription.created` | `subscription:created` | `tenant:{tenantId}` |
| `subscription.cancelled` | `subscription:cancelled` | `tenant:{tenantId}` |
| `subscription.limit_warning` | `subscription:limit-warning` | `tenant:{tenantId}` |
| `system.maintenance` | `system:maintenance` | All connected clients |

---

### Room Naming Convention

| Room Type | Format | Example |
|-----------|--------|---------|
| Tenant | `tenant:{tenantId}` | `tenant:abc123` |
| Vendor | `vendor:{vendorId}` | `vendor:xyz789` |
| Listing | `listing:{listingId}` | `listing:lst001` |
| Interaction | `interaction:{interactionId}` | `interaction:int001` |
| User | `user:{userId}` | `user:usr001` |
| Notifications | `notifications:{userId}` | `notifications:usr001` |
| Tenant Listings | `tenant:{tenantId}:listings` | `tenant:abc123:listings` |

---

### Room Limits

| Room Type | Max Connections |
|-----------|-----------------|
| Listing | 1,000 |
| Interaction | 10 |
| Tenant | 10,000 |

---

### Error Handling

WebSocket errors are returned in a consistent format:

```typescript
{
  event: 'error',
  data: {
    code: string;      // e.g., 'WS_AUTH_FAILED', 'WS_ROOM_FULL'
    message: string;
    details?: any;
  }
}
```

**Error Codes:**
| Code | Description |
|------|-------------|
| `WS_AUTH_FAILED` | JWT authentication failed |
| `WS_UNAUTHORIZED` | User not authorized for action |
| `WS_INVALID_PAYLOAD` | Invalid event payload |
| `WS_ROOM_FULL` | Room connection limit reached |
| `WS_NOT_FOUND` | Resource not found |
| `WS_INTERNAL_ERROR` | Server error |

---

### Implementation Details

**Files Created:**
1. `src/infrastructure/websocket/types/websocket.types.ts` - Type definitions
2. `src/infrastructure/websocket/dto/websocket.dto.ts` - DTOs with validation
3. `src/infrastructure/websocket/services/ws-auth.service.ts` - JWT authentication
4. `src/infrastructure/websocket/services/broadcast.service.ts` - Room broadcasting
5. `src/infrastructure/websocket/services/websocket-event-bridge.service.ts` - Event bridge
6. `src/infrastructure/websocket/gateways/tenant.gateway.ts` - /tenant namespace
7. `src/infrastructure/websocket/gateways/vendor.gateway.ts` - /vendor namespace
8. `src/infrastructure/websocket/gateways/notifications.gateway.ts` - /notifications namespace
9. `src/infrastructure/websocket/adapters/redis-io.adapter.ts` - Redis adapter
10. `src/infrastructure/websocket/filters/ws-exception.filter.ts` - Error filter
11. `src/infrastructure/websocket/websocket.module.ts` - Module configuration

**Dependencies:**
- `socket.io` v4.8.1 - WebSocket library
- `@socket.io/redis-adapter` v8.2.1 - Redis adapter for scaling
- `redis` v5.10.0 - Redis client
- `@nestjs/websockets` - NestJS WebSocket integration
- `@nestjs/platform-socket.io` - Socket.IO platform adapter

**Environment Variables:**
```env
# Redis for WebSocket adapter (optional, falls back to REDIS_URL)
SOCKET_IO_REDIS_URL=redis://localhost:6380
```

---

## 📝 Audit Module

The Audit module provides append-only, immutable audit logging for compliance and security tracking. All sensitive actions are logged with actor context, change details, and request metadata.

**Architecture:**
- Append-only records (no updates or deletes)
- Event-driven logging (domain events → audit handlers)
- Async fire-and-forget (non-blocking via setImmediate)
- Tenant isolation enforced
- Sensitive data masking (PII protection)
- Request correlation (requestId tracking)

**Actor Types:**
- `USER` - Authenticated user action
- `SYSTEM` - Automated system action
- `ADMIN` - Administrative action
- `ANONYMOUS` - Unauthenticated action

**Action Type Categories:**
- Auth: AUTH_LOGIN, AUTH_LOGOUT, AUTH_REFRESH, AUTH_PASSWORD_CHANGE, AUTH_PASSWORD_RESET, AUTH_FAILED
- User: USER_CREATED, USER_UPDATED, USER_DELETED, USER_STATUS_CHANGE, USER_ROLE_CHANGE
- Tenant: TENANT_CREATED, TENANT_UPDATED, TENANT_SETTINGS_UPDATED, TENANT_SUSPENDED, TENANT_REACTIVATED
- Vendor: VENDOR_CREATED, VENDOR_APPROVED, VENDOR_REJECTED, VENDOR_SUSPENDED, VENDOR_REACTIVATED
- Listing: LISTING_CREATED, LISTING_UPDATED, LISTING_PUBLISHED, LISTING_UNPUBLISHED, LISTING_EXPIRED, LISTING_ARCHIVED, LISTING_FEATURED
- Media: MEDIA_UPLOADED, MEDIA_DELETED
- Interaction: INTERACTION_CREATED, INTERACTION_UPDATED, INTERACTION_STATUS_CHANGE, MESSAGE_SENT
- Review: REVIEW_CREATED, REVIEW_APPROVED, REVIEW_REJECTED, REVIEW_FLAGGED, REVIEW_RESPONDED
- Subscription: SUBSCRIPTION_CREATED, SUBSCRIPTION_UPDATED, SUBSCRIPTION_CANCELLED, SUBSCRIPTION_RENEWED, PLAN_CHANGED
- Billing: PAYMENT_SUCCEEDED, PAYMENT_FAILED, INVOICE_CREATED
- Admin: ADMIN_ACTION, BULK_ACTION, SYSTEM_CONFIG_CHANGE
- API: API_KEY_CREATED, API_KEY_REVOKED
- Feature Flags: FEATURE_FLAG_UPDATED, EXPERIMENT_CREATED

**Sensitive Fields Masked:**
password, token, secret, apiKey, api_key, accessToken, access_token, refreshToken, refresh_token, creditCard, credit_card, cardNumber, card_number, cvv, cvc, ssn, socialSecurityNumber, bankAccount, bank_account, routingNumber, routing_number

---

### 1. Query Audit Logs
Get paginated audit logs with filters.

**Endpoint:** `GET /api/v1/audit/logs`

**Auth:** JWT required (TENANT_ADMIN, SUPER_ADMIN)

**Query Parameters:**
```typescript
{
  actorId?: string;              // Filter by actor ID (UUID)
  actorType?: AuditActorType;    // Filter by actor type (USER, SYSTEM, ADMIN, ANONYMOUS)
  actionType?: string;           // Filter by action type (e.g., USER_CREATED)
  targetType?: string;           // Filter by target type (e.g., user, listing)
  targetId?: string;             // Filter by target ID (UUID)
  startDate?: string;            // Filter from date (ISO 8601)
  endDate?: string;              // Filter to date (ISO 8601)
  page?: number;                 // Page number (default: 1)
  pageSize?: number;             // Items per page (default: 20, max: 100)
}
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "actorType": "USER",
      "actorId": "uuid",
      "actorEmail": "ab***@domain.com",
      "actionType": "USER_CREATED",
      "targetType": "user",
      "targetId": "uuid",
      "oldValue": null,
      "newValue": {
        "email": "ne***@example.com",
        "role": "CUSTOMER"
      },
      "metadata": {
        "source": "api"
      },
      "ipAddress": "192.168.1.xxx",
      "userAgent": "Mozilla/5.0...",
      "requestId": "uuid",
      "timestamp": "2026-01-21T12:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

---

### 2. Get Audit Log by ID
Get a single audit log entry by ID.

**Endpoint:** `GET /api/v1/audit/logs/:id`

**Auth:** JWT required (TENANT_ADMIN, SUPER_ADMIN)

**Path Parameters:**
- `id` (string, UUID) - Audit log ID

**Success Response (200):**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "actorType": "USER",
  "actorId": "uuid",
  "actorEmail": "ab***@domain.com",
  "actionType": "LISTING_PUBLISHED",
  "targetType": "listing",
  "targetId": "uuid",
  "oldValue": {
    "status": "DRAFT"
  },
  "newValue": {
    "status": "PUBLISHED"
  },
  "metadata": {
    "reason": "Manual publish"
  },
  "ipAddress": "192.168.1.xxx",
  "userAgent": "Mozilla/5.0...",
  "requestId": "uuid",
  "timestamp": "2026-01-21T12:00:00Z"
}
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "code": "NOT_FOUND",
  "message": "Audit log not found"
}
```

---

### 3. Get Audit Logs by Target
Get all audit logs for a specific target entity.

**Endpoint:** `GET /api/v1/audit/target/:targetType/:targetId`

**Auth:** JWT required (TENANT_ADMIN, SUPER_ADMIN)

**Path Parameters:**
- `targetType` (string) - Target type (e.g., user, listing, vendor)
- `targetId` (string, UUID) - Target entity ID

**Query Parameters:**
```typescript
{
  page?: number;      // Page number (default: 1)
  pageSize?: number;  // Items per page (default: 20, max: 100)
}
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "actorType": "USER",
      "actorId": "uuid",
      "actionType": "LISTING_CREATED",
      "targetType": "listing",
      "targetId": "uuid",
      "oldValue": null,
      "newValue": { "title": "Beautiful Apartment" },
      "timestamp": "2026-01-21T10:00:00Z"
    },
    {
      "id": "uuid",
      "tenantId": "uuid",
      "actorType": "USER",
      "actorId": "uuid",
      "actionType": "LISTING_UPDATED",
      "targetType": "listing",
      "targetId": "uuid",
      "oldValue": { "price": 500000 },
      "newValue": { "price": 480000 },
      "timestamp": "2026-01-21T11:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 2,
    "totalPages": 1
  }
}
```

---

### 4. Get Audit Logs by Actor
Get all audit logs for a specific actor (user).

**Endpoint:** `GET /api/v1/audit/actor/:actorId`

**Auth:** JWT required (TENANT_ADMIN, SUPER_ADMIN)

**Path Parameters:**
- `actorId` (string, UUID) - Actor (user) ID

**Query Parameters:**
```typescript
{
  page?: number;      // Page number (default: 1)
  pageSize?: number;  // Items per page (default: 20, max: 100)
}
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "actorType": "USER",
      "actorId": "uuid",
      "actorEmail": "us***@example.com",
      "actionType": "AUTH_LOGIN",
      "targetType": "session",
      "targetId": null,
      "timestamp": "2026-01-21T09:00:00Z"
    },
    {
      "id": "uuid",
      "actorType": "USER",
      "actorId": "uuid",
      "actionType": "LISTING_CREATED",
      "targetType": "listing",
      "targetId": "uuid",
      "timestamp": "2026-01-21T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 15,
    "totalPages": 1
  }
}
```

---

### 5. Get Distinct Action Types
Get all distinct action types recorded in audit logs (for filtering UI).

**Endpoint:** `GET /api/v1/audit/action-types`

**Auth:** JWT required (TENANT_ADMIN, SUPER_ADMIN)

**Success Response (200):**
```json
{
  "actionTypes": [
    "AUTH_LOGIN",
    "AUTH_LOGOUT",
    "USER_CREATED",
    "USER_UPDATED",
    "LISTING_CREATED",
    "LISTING_PUBLISHED",
    "VENDOR_APPROVED"
  ]
}
```

---

### 6. Get Distinct Target Types
Get all distinct target types recorded in audit logs (for filtering UI).

**Endpoint:** `GET /api/v1/audit/target-types`

**Auth:** JWT required (TENANT_ADMIN, SUPER_ADMIN)

**Success Response (200):**
```json
{
  "targetTypes": [
    "user",
    "listing",
    "vendor",
    "review",
    "interaction",
    "subscription",
    "tenant"
  ]
}
```

---

### AuditService Methods

**Logging Methods:**
```typescript
// Async fire-and-forget logging (non-blocking)
log(options: CreateAuditLogOptions): void

// Synchronous logging with confirmation
logSync(options: CreateAuditLogOptions): Promise<AuditLog>

// Convenience methods
logCreate(targetType, targetId, newValue, context): void
logUpdate(targetType, targetId, oldValue, newValue, context): void
logDelete(targetType, targetId, oldValue, context): void
logStatusChange(targetType, targetId, oldStatus, newStatus, context): void
logAuth(actionType, actorId, actorEmail, success, context): void
logAdminAction(action, metadata, context): void
```

**Query Methods:**
```typescript
findAll(filters, tenantId): Promise<{ data, meta }>
findByTarget(targetType, targetId, tenantId, page, pageSize): Promise<{ data, meta }>
findByActor(actorId, tenantId, page, pageSize): Promise<{ data, meta }>
findById(id, tenantId): Promise<AuditLog | null>
getActionTypes(tenantId): Promise<string[]>
getTargetTypes(tenantId): Promise<string[]>
```

---

### @Audit() Decorator

Declarative audit logging for controllers:

```typescript
@Audit({
  actionType: AuditActionType.LISTING_CREATED,
  targetType: AuditTargetType.LISTING,
  targetIdPath: 'params.id',      // Extract target ID from request
  includeRequestBody: true,       // Log request body as newValue
  includeResponseBody: false,     // Don't log response
  maskFields: ['password'],       // Additional fields to mask
})
@Post()
createListing(@Body() dto: CreateListingDto) { ... }
```

---

### Event-Driven Audit Logging

Domain events automatically create audit logs:

```typescript
// AuditService listens to domain events
@OnEvent('user.created')
handleUserCreated(event) { ... }

@OnEvent('vendor.approved')
handleVendorApproved(event) { ... }

@OnEvent('listing.published')
handleListingPublished(event) { ... }
```

---

### Data Masking Examples

**Email Masking:**
- Input: `john.doe@example.com`
- Output: `jo***@example.com`

**Phone Masking:**
- Input: `+1234567890`
- Output: `+*******890`

**Credit Card Masking:**
- Input: `4111111111111111`
- Output: `***REDACTED***`

**Sensitive Field Masking:**
- Any field in SENSITIVE_FIELDS constant is replaced with `***REDACTED***`

---

### Implementation Details

**Files Created:**
1. `src/core/audit/types/audit.types.ts` - Type definitions (AuditActionType enum with 50+ actions)
2. `src/core/audit/utils/mask-sensitive-data.util.ts` - Masking utilities
3. `src/core/audit/dto/audit.dto.ts` - Request/Response DTOs with validation
4. `src/core/audit/interceptors/audit.interceptor.ts` - @Audit decorator + interceptor
5. `src/core/audit/audit.service.ts` - Core audit service with logging and query methods
6. `src/core/audit/audit.controller.ts` - REST API controller with 6 endpoints
7. `src/core/audit/audit.module.ts` - Global module configuration

**Prisma Schema:**
```prisma
enum AuditActorType {
  USER
  SYSTEM
  ADMIN
  ANONYMOUS
}

model AuditLog {
  id          String         @id @default(uuid())
  tenantId    String?
  actorType   AuditActorType
  actorId     String?
  actorEmail  String?
  actionType  String
  targetType  String
  targetId    String?
  oldValue    Json?
  newValue    Json?
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  requestId   String?
  timestamp   DateTime       @default(now())
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  
  tenant      Tenant?        @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId])
  @@index([actorId])
  @@index([actionType])
  @@index([targetType, targetId])
  @@index([timestamp])
  @@map("audit_logs")
}
```

---

##  Occupants Module (Session 5.2)

### Overview
Occupant profile management for the Property Management extension. Handles occupant lifecycle, document uploads, verification, and screening workflows.

**Base URL:** `/api/v1/occupants`

**Controller:** `OccupantController`

**Guard:** `OccupantGuard` with access levels:
- `SELF_ONLY` - Occupant can only access own data
- `VENDOR_PROPERTIES` - Vendor can access occupants in their properties
- `FULL` - Platform/Tenant admins have full access

---

### Endpoint Summary

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/` | List occupants |  | TENANT_ADMIN, PLATFORM_ADMIN |
| GET | `/me` | Get own profile |  | OCCUPANT |
| GET | `/:id` | Get occupant by ID |  | OCCUPANT (self), VENDOR_ADMIN, TENANT_ADMIN |
| POST | `/` | Create occupant profile |  | Authenticated |
| PATCH | `/:id` | Update occupant profile |  | OCCUPANT (self), VENDOR_ADMIN, TENANT_ADMIN |
| PATCH | `/:id/status` | Update verification status |  | VENDOR_ADMIN, TENANT_ADMIN, PLATFORM_ADMIN |
| POST | `/:id/documents` | Request document upload URL |  | OCCUPANT (self), VENDOR_ADMIN |
| POST | `/:id/documents/:documentId/confirm` | Confirm document upload |  | OCCUPANT (self), VENDOR_ADMIN |
| GET | `/:id/documents` | Get occupant documents |  | OCCUPANT (self), VENDOR_ADMIN, TENANT_ADMIN |
| DELETE | `/:id/documents/:documentId` | Delete document |  | OCCUPANT (self), VENDOR_ADMIN |
| POST | `/:id/documents/:documentId/verify` | Verify document |  | VENDOR_ADMIN, TENANT_ADMIN, PLATFORM_ADMIN |
| POST | `/:id/screen` | Run screening check |  | OCCUPANT (self), VENDOR_ADMIN |
| PATCH | `/:id/screening` | Update screening result |  | VENDOR_ADMIN, TENANT_ADMIN, PLATFORM_ADMIN |

---

### Events Emitted

| Event | When | Payload |
|-------|------|---------|
| `occupant.created` | Occupant profile created | `{ occupantId, userId, tenantId }` |
| `occupant.updated` | Profile updated | `{ occupantId, changes }` |
| `occupant.status.changed` | Status changed | `{ occupantId, oldStatus, newStatus }` |
| `occupant.document.uploaded` | Document uploaded | `{ occupantId, documentId, documentType }` |
| `occupant.document.verified` | Document verified | `{ occupantId, documentId, verified }` |
| `occupant.screening.completed` | Screening finished | `{ occupantId, passed, results }` |

---

## 🏠 Tenancies Module (Session 5.3)

### Overview
Tenancy lifecycle management for the Property Management extension. Handles tenancy creation, status transitions, and termination workflows. Only allowed for `TENANT_MANAGED` listings.

**Base URL:** `/api/v1/tenancies`

**Controller:** `TenancyController`

**Guard:** `TenancyGuard` with access levels:
- `SELF_ONLY` - Occupant can access own tenancies
- `OWNER_PROPERTIES` - Vendor can access tenancies for their properties
- `FULL` - Platform/Tenant admins have full access

**State Machine:** `TenancyStateMachine` with status transitions:
```
DRAFT → BOOKED (confirm_booking)
DRAFT → TERMINATED (cancel)
BOOKED → DEPOSIT_PAID (confirm_deposit)
BOOKED → TERMINATED (cancel)
DEPOSIT_PAID → CONTRACT_PENDING (submit_contract)
CONTRACT_PENDING → ACTIVE (activate)
ACTIVE → TERMINATION_REQUESTED (request_termination)
ACTIVE → EXTENDED (extend)
ACTIVE → MAINTENANCE_HOLD (hold_maintenance)
MAINTENANCE_HOLD → ACTIVE (resume_from_hold)
TERMINATION_REQUESTED → TERMINATED (terminate)
EXTENDED → ACTIVE (activate)
```

---

### Endpoint Summary

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/` | Create tenancy (booking) | ✅ | TENANT_ADMIN, VENDOR_ADMIN, CUSTOMER, OCCUPANT |
| GET | `/` | List tenancies | ✅ | TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF, OCCUPANT |
| GET | `/:id` | Get tenancy by ID | ✅ | TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF, OCCUPANT |
| PATCH | `/:id` | Update tenancy details | ✅ | TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT (self) |
| GET | `/:id/history` | Get status history | ✅ | TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF, OCCUPANT (self) |
| POST | `/:id/confirm-booking` | Confirm booking | ✅ | TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/:id/confirm-deposit` | Confirm deposit | ✅ | TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/:id/submit-contract` | Submit contract | ✅ | TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/:id/activate` | Activate tenancy | ✅ | TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/:id/request-termination` | Request termination | ✅ | TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT (self) |
| POST | `/:id/terminate` | Complete termination | ✅ | TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/:id/extend` | Extend tenancy | ✅ | TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/:id/cancel` | Cancel tenancy | ✅ | TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT (self) |

---

### Request/Response Examples

#### Create Tenancy
```http
POST /api/v1/tenancies
Authorization: Bearer {token}
Content-Type: application/json

{
  "listingId": "550e8400-e29b-41d4-a716-446655440000",
  "occupantId": "550e8400-e29b-41d4-a716-446655440001",
  "monthlyRent": 2500.00,
  "securityDeposit": 5000.00,
  "moveInDate": "2026-03-01",
  "leaseStartDate": "2026-03-01",
  "leaseEndDate": "2027-02-28",
  "billingDay": 1,
  "paymentDueDay": 7
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "status": "DRAFT",
    "listingId": "550e8400-e29b-41d4-a716-446655440000",
    "occupantId": "550e8400-e29b-41d4-a716-446655440001",
    "ownerId": "550e8400-e29b-41d4-a716-446655440003",
    "monthlyRent": 2500.00,
    "securityDeposit": 5000.00,
    "applicationDate": "2025-01-15T10:00:00Z",
    "listing": {
      "id": "...",
      "title": "Modern Condo Unit",
      "slug": "modern-condo-unit"
    },
    "occupant": {
      "id": "...",
      "userId": "...",
      "user": { "email": "...", "fullName": "John Doe" }
    },
    "statusHistory": [
      { "fromStatus": null, "toStatus": "DRAFT", "changedAt": "..." }
    ]
  }
}
```

#### Confirm Booking
```http
POST /api/v1/tenancies/{id}/confirm-booking
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Application approved",
  "moveInDate": "2026-03-01",
  "leaseStartDate": "2026-03-01",
  "leaseEndDate": "2027-02-28"
}
```

#### Confirm Deposit
```http
POST /api/v1/tenancies/{id}/confirm-deposit
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentReference": "TXN-12345678",
  "reason": "Deposit received via bank transfer"
}
```

#### Request Termination
```http
POST /api/v1/tenancies/{id}/request-termination
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Relocating for work",
  "requestedEndDate": "2026-06-30"
}
```

---

### Business Rules

1. **TENANT_MANAGED Only**: Tenancy can only be created for listings with `managementType = TENANT_MANAGED`
2. **Single Active Tenancy**: A listing can only have one active tenancy at a time
3. **Immutable Financial Terms**: `monthlyRent` and `securityDeposit` cannot be changed after tenancy becomes ACTIVE
4. **Status History**: All status changes are recorded in `TenancyStatusHistory`
5. **Access Control**: 
   - OCCUPANT can only see/manage own tenancies
   - VENDOR can see/manage tenancies for their properties
   - TENANT_ADMIN has full access

---

### Events Emitted

| Event | When | Payload |
|-------|------|---------|
| `tenancy.created` | Tenancy created | `{ tenancyId, listingId, occupantId, tenantId }` |
| `tenancy.status.changed` | Any status change | `{ tenancyId, fromStatus, toStatus, reason, changedBy }` |
| `tenancy.booked` | DRAFT → BOOKED | `{ tenancyId, fromStatus, toStatus, reason, changedBy }` |
| `tenancy.activated` | CONTRACT_PENDING → ACTIVE | `{ tenancyId, fromStatus, toStatus, reason, changedBy }` |
| `tenancy.terminated` | Any → TERMINATED | `{ tenancyId, fromStatus, toStatus, reason, changedBy }` |
| `tenancy.extended` | ACTIVE → EXTENDED | `{ tenancyId, fromStatus, toStatus, reason, changedBy }` |
| `tenancy.expiry.notice` | Expiry notification sent | `{ tenancyId, tenantId, occupantId, ownerId, daysUntilExpiry, notificationType, leaseEndDate }` |
| `tenancy.auto.terminated` | Auto-terminated (expired) | `{ tenancyId, tenantId, occupantId, ownerId, reason, terminatedAt }` |

---

### Background Jobs (Queue: `tenancy.expiry`)

**Status:** ✅ Implemented (Session 5.4)

#### Job Types

| Job Type | Schedule | Purpose |
|----------|----------|---------|
| `tenancy.check_expiring` | Daily 8:00 AM | Find expiring tenancies (30, 14, 7 days) |
| `tenancy.notify_expiring` | On-demand | Send expiry notification to occupant/owner |
| `tenancy.auto_terminate` | Daily Midnight | Auto-terminate past lease end date |

#### Job Payloads

**tenancy.check_expiring** (Scheduled)
```json
{
  "tenantId": "uuid",
  "type": "tenancy.check_expiring",
  "daysBeforeExpiry": 30,
  "batchSize": 100
}
```

**tenancy.notify_expiring** (On-demand, queued by check_expiring)
```json
{
  "tenantId": "uuid",
  "type": "tenancy.notify_expiring",
  "tenancyId": "uuid",
  "daysUntilExpiry": 30,
  "notificationType": "first_notice"
}
```

**tenancy.auto_terminate** (Scheduled for expired tenancies)
```json
{
  "tenantId": "uuid",
  "type": "tenancy.auto_terminate",
  "tenancyId": "uuid",
  "reason": "Lease term completed - auto-terminated"
}
```

#### Notification Types

| Type | Days Before | Description |
|------|-------------|-------------|
| `first_notice` | 30 days | First expiry warning |
| `reminder` | 14 days | Follow-up reminder |
| `final_notice` | 7 days | Final urgent notice |

---

## 📝 Contracts Module (Session 5.5, 5.6)

### Contract Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/contracts` | Create contract from tenancy | TENANT_ADMIN, VENDOR_ADMIN |
| GET | `/api/v1/contracts` | List contracts with filters | TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |
| GET | `/api/v1/contracts/:id` | Get contract by ID | TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |
| PATCH | `/api/v1/contracts/:id` | Update contract terms | TENANT_ADMIN, VENDOR_ADMIN |
| PATCH | `/api/v1/contracts/:id/status` | Update contract status | TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/api/v1/contracts/:id/generate-pdf` | Generate contract PDF | TENANT_ADMIN, VENDOR_ADMIN |
| GET | `/api/v1/contracts/:id/download` | Get download URL for PDF | TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |
| GET | `/api/v1/contracts/tenancy/:tenancyId` | Get contract by tenancy | TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |

### E-Signature Endpoints (Session 5.6)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/contracts/:id/request-signatures` | Send contract for e-signature | TENANT_ADMIN, VENDOR_ADMIN |
| GET | `/api/v1/contracts/:id/signature-status` | Get signature status | TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |
| POST | `/api/v1/contracts/:id/record-signature` | Manually record signature | TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/api/v1/contracts/:id/void-signatures` | Void/cancel signature request | TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/api/v1/contracts/:id/resend-signature` | Resend notification to signer | TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/api/v1/contracts/webhook` | E-signature provider callback | Public |

### Contract Template Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/contracts/templates` | List contract templates | TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/api/v1/contracts/templates` | Create contract template | TENANT_ADMIN |
| GET | `/api/v1/contracts/templates/:id` | Get template by ID | TENANT_ADMIN, VENDOR_ADMIN |
| PATCH | `/api/v1/contracts/templates/:id` | Update template | TENANT_ADMIN |
| DELETE | `/api/v1/contracts/templates/:id` | Delete (deactivate) template | TENANT_ADMIN |
| GET | `/api/v1/contracts/templates/variables` | Get available template variables | TENANT_ADMIN, VENDOR_ADMIN |

### DTOs

#### CreateContractDto
```typescript
interface CreateContractDto {
  tenancyId: string;      // Required - UUID of the tenancy
  templateId?: string;    // Optional - UUID of template to use
  startDate: string;      // Required - Contract start date (ISO 8601)
  endDate: string;        // Required - Contract end date (ISO 8601)
  terms?: Record<string, unknown>;  // Optional - Additional terms
}
```

#### UpdateContractDto
```typescript
interface UpdateContractDto {
  startDate?: string;     // Optional - New start date
  endDate?: string;       // Optional - New end date
  terms?: Record<string, unknown>;  // Optional - Updated terms
}
```

#### UpdateContractStatusDto
```typescript
interface UpdateContractStatusDto {
  status: ContractStatus;  // Required - New status
  reason?: string;         // Optional - Reason for status change
}
```

#### ContractQueryDto
```typescript
interface ContractQueryDto {
  tenancyId?: string;      // Filter by tenancy
  status?: ContractStatus; // Filter by status
  contractNumber?: string; // Filter by contract number
  page?: number;           // Page number (default: 1)
  limit?: number;          // Items per page (default: 20)
  sortBy?: string;         // Sort field (default: 'createdAt')
  sortDir?: 'asc' | 'desc'; // Sort direction (default: 'desc')
}
```

#### CreateContractTemplateDto
```typescript
interface CreateContractTemplateDto {
  name: string;           // Required - Template name (2-200 chars)
  description?: string;   // Optional - Template description
  content: string;        // Required - Template content with variables
  variables?: string[];   // Optional - List of template variables
  isDefault?: boolean;    // Optional - Set as default template
}
```

#### RequestSignaturesDto (Session 5.6)
```typescript
interface RequestSignaturesDto {
  callbackUrl?: string;   // Optional - Webhook URL for signature provider callbacks
}
```

#### RecordSignatureDto (Session 5.6)
```typescript
interface RecordSignatureDto {
  signerRole: 'owner' | 'occupant';  // Required - Role of the signer
  signatureUrl?: string;              // Optional - URL to signature image
  signedBy?: string;                  // Optional - User ID of signer
}
```

#### VoidSignatureRequestDto (Session 5.6)
```typescript
interface VoidSignatureRequestDto {
  reason: string;         // Required - Reason for voiding
}
```

#### ResendSignatureDto (Session 5.6)
```typescript
interface ResendSignatureDto {
  signerRole: 'owner' | 'occupant';  // Required - Signer to resend to
}
```

#### SignatureStatusResponseDto (Session 5.6)
```typescript
interface SignatureStatusResponseDto {
  contractId: string;
  envelopeId: string;
  status: 'CREATED' | 'SENT' | 'PARTIALLY_SIGNED' | 'COMPLETED' | 'DECLINED' | 'VOIDED' | 'EXPIRED';
  signers: Array<{
    signerId: string;
    email: string;
    role: 'owner' | 'occupant';
    status: 'pending' | 'sent' | 'delivered' | 'signed' | 'declined';
    signedAt?: Date;
    signatureUrl?: string;
  }>;
  completedDocumentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

### Contract Status Enum

```typescript
enum ContractStatus {
  DRAFT = 'DRAFT',                      // Initial state
  PENDING_SIGNATURE = 'PENDING_SIGNATURE', // Awaiting signatures
  PARTIALLY_SIGNED = 'PARTIALLY_SIGNED', // One party signed
  ACTIVE = 'ACTIVE',                    // Both parties signed
  EXPIRED = 'EXPIRED',                  // Contract term ended
  TERMINATED = 'TERMINATED',            // Terminated early
  RENEWED = 'RENEWED'                   // Contract renewed
}
```

### Status Transitions

```
DRAFT → PENDING_SIGNATURE → PARTIALLY_SIGNED → ACTIVE
                                              → TERMINATED
           ACTIVE → EXPIRED
                  → TERMINATED
                  → RENEWED
```

### Template Variables

The following variables are available for contract templates using `{{variableName}}` syntax:

| Variable | Description |
|----------|-------------|
| `contractNumber` | Auto-generated contract number (CON-YYYY-NNNNN) |
| `contractDate` | Date contract was created |
| `propertyTitle` | Listing title |
| `propertyAddress` | Full property address |
| `propertyType` | Type of property |
| `ownerName` | Landlord/property owner name |
| `ownerEmail` | Owner email address |
| `ownerIc` | Owner IC number |
| `ownerAddress` | Owner address |
| `ownerPhone` | Owner phone number |
| `occupantName` | Tenant/occupant name |
| `occupantEmail` | Occupant email address |
| `occupantIc` | Occupant IC number |
| `occupantAddress` | Occupant address |
| `occupantPhone` | Occupant phone number |
| `rentAmount` | Monthly rent (formatted with currency) |
| `rentAmountWords` | Rent amount in words |
| `depositAmount` | Security deposit (formatted) |
| `depositAmountWords` | Deposit in words |
| `startDate` | Tenancy start date |
| `endDate` | Tenancy end date |
| `leaseDuration` | Duration in months |
| `paymentDueDay` | Day of month rent is due |
| `lateFeePercent` | Late payment fee percentage |
| `signedDate` | Date contract was signed |
| `currentDate` | Current date |

### PDF Generation

Contract PDFs are generated using PDFKit and stored in S3:
- Format: `contracts/{tenant-slug}/{contract-id}/{filename}.pdf`
- Download: Presigned S3 URLs (1-hour expiry)
- Hash: SHA256 document hash stored for verification

### Events

| Event | Description |
|-------|-------------|
| `contract.created` | Contract created for tenancy |
| `contract.status.changed` | Contract status updated |
| `contract.signature.requested` | Signatures requested for contract |
| `contract.signer.signed` | A signer completed their signature |
| `contract.fully.signed` | Both parties signed, contract is active |
| `tenancy.activated` | Tenancy auto-activated when contract fully signed |

### E-Signature Workflow (Session 5.6)

```
1. Contract created in DRAFT status
2. PDF generated and stored in S3
3. POST /contracts/:id/request-signatures
   → Contract status: DRAFT → PENDING_SIGNATURE
   → Signing URLs returned for both parties
4. Owner signs (webhook or manual record)
   → Contract status: PARTIALLY_SIGNED
   → ownerSignedAt, ownerSignatureUrl set
5. Occupant signs (webhook or manual record)
   → Contract status: ACTIVE
   → occupantSignedAt, occupantSignatureUrl set
   → Tenancy status: CONTRACT_PENDING → ACTIVE (auto)
```

### Signature Provider Interface

The system uses a provider abstraction for e-signatures:
- **Mock Provider** (MVP): Simulates signatures for testing
- **DocuSign Provider** (Future): Production integration
- **SignNow Provider** (Future): Alternative provider

Switch providers by changing the `SIGNATURE_PROVIDER` injection in `contract.module.ts`.

---

## 💰 Deposits Module (Session 5.7, 7.6)

Manages security, utility, and key deposits for tenancies. Supports collection tracking, deductions, refunds, forfeiture, and claim-linked deposit finalization.

### Deposit Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/deposits` | Create single deposit | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/api/v1/deposits/from-tenancy` | Create all deposits from tenancy amounts | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| GET | `/api/v1/deposits` | List deposits with filters | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF |
| GET | `/api/v1/deposits/tenancy/:tenancyId` | Get all deposits for tenancy | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF |
| GET | `/api/v1/deposits/tenancy/:tenancyId/summary` | Get deposit summary for tenancy | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF |
| GET | `/api/v1/deposits/:id` | Get deposit by ID | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF |
| POST | `/api/v1/deposits/:id/collect` | Mark deposit as collected | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/api/v1/deposits/:id/deduction` | Add deduction to deposit | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| GET | `/api/v1/deposits/:id/refund-calculation` | Calculate refund amount | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF |
| POST | `/api/v1/deposits/:id/refund` | Process deposit refund | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/api/v1/deposits/:id/forfeit` | Forfeit deposit | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/api/v1/deposits/:id/finalize` | Finalize deposit with claim deductions | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/api/v1/deposits/tenancy/:tenancyId/deductions` | Calculate deduction summary | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF |

### Request/Response DTOs

#### CreateDepositDto
```typescript
interface CreateDepositDto {
  tenancyId: string;       // Required - UUID of tenancy
  type: 'SECURITY' | 'UTILITY' | 'KEY';  // Required - Deposit type
  amount: number;          // Required - Amount > 0
}
```

#### CreateDepositsFromTenancyDto
```typescript
interface CreateDepositsFromTenancyDto {
  tenancyId: string;       // Required - UUID of tenancy
  securityDeposit?: number; // Optional - Override tenancy amount
  utilityDeposit?: number;  // Optional - Override tenancy amount
  keyDeposit?: number;      // Optional - Override tenancy amount
}
```

#### CollectDepositDto
```typescript
interface CollectDepositDto {
  collectedVia: string;    // Required - Payment method (e.g., 'BANK_TRANSFER', 'CASH')
  paymentRef?: string;     // Optional - Payment reference number
}
```

#### AddDeductionDto
```typescript
interface AddDeductionDto {
  claimId?: string;        // Optional - Link to maintenance claim
  description: string;     // Required - Description of deduction (2-500 chars)
  amount: number;          // Required - Deduction amount > 0
}
```

#### ProcessRefundDto
```typescript
interface ProcessRefundDto {
  refundRef?: string;      // Optional - Refund reference number
  refundVia?: string;      // Optional - Refund method
}
```

#### ForfeitDepositDto
```typescript
interface ForfeitDepositDto {
  reason: string;          // Required - Reason for forfeiture (5-500 chars)
}
```

#### DepositQueryDto
```typescript
interface DepositQueryDto {
  tenancyId?: string;      // Filter by tenancy
  type?: 'SECURITY' | 'UTILITY' | 'KEY';  // Filter by type
  status?: DepositStatus;  // Filter by status
  ownerId?: string;        // Filter by owner
  occupantId?: string;     // Filter by occupant
  page?: number;           // Page number (default: 1)
  limit?: number;          // Items per page (default: 20, max: 100)
  sortBy?: string;         // Sort field (default: 'createdAt')
  sortDir?: 'asc' | 'desc'; // Sort direction (default: 'desc')
}
```

#### FinalizeDepositDto (Session 7.6)
```typescript
interface FinalizeDepositDto {
  refundRef?: string;      // Optional - Refund reference number
  notes?: string;          // Optional - Finalization notes
}
```

### Deposit Status Enum

```typescript
enum DepositStatus {
  PENDING = 'PENDING',                    // Awaiting collection
  COLLECTED = 'COLLECTED',                // Deposit collected
  HELD = 'HELD',                          // Held with deductions
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED', // Some amount refunded
  FULLY_REFUNDED = 'FULLY_REFUNDED',      // Full amount refunded
  FORFEITED = 'FORFEITED'                 // Deposit forfeited
}
```

### Status Transitions

```
PENDING → COLLECTED → HELD (when deductions added)
                    → FULLY_REFUNDED (when no deductions)
                    → PARTIALLY_REFUNDED (when deductions exist)
                    → FORFEITED (manual forfeit)
COLLECTED → HELD → PARTIALLY_REFUNDED
                 → FORFEITED
```

### Deduction Claims Structure

Deductions are stored as JSON in the `deductionClaims` field:
```typescript
interface DeductionClaim {
  claimId?: string;        // Link to maintenance claim (optional)
  description: string;     // Deduction description
  amount: number;          // Deduction amount
  addedAt: Date;           // When deduction was added
}
```

### Deposit Summary Response

```typescript
interface DepositSummary {
  tenancyId: string;
  totalDeposits: number;      // Sum of all deposit amounts
  totalCollected: number;     // Amount currently held
  totalRefunded: number;      // Amount refunded
  totalDeductions: number;    // Total deductions applied
  totalPending: number;       // Amount pending collection
  deposits: Array<{
    id: string;
    type: string;
    amount: number;
    status: DepositStatus;
    refundableAmount: number | null;
  }>;
}
```

### Refund Calculation Response

```typescript
interface RefundCalculation {
  depositId: string;
  depositType: string;
  originalAmount: number;
  totalDeductions: number;
  refundableAmount: number;
  deductions: DeductionClaim[];
  canRefund: boolean;
  reason?: string;           // If canRefund is false
}
```

### Events

| Event | Description | Payload |
|-------|-------------|---------|
| `deposit.created` | New deposit created | `{ depositId, tenancyId, tenantId, type, amount }` |
| `deposit.collected` | Deposit marked as collected | `{ depositId, tenancyId, tenantId, type, amount }` |
| `deposit.refunded` | Deposit refund processed | `{ depositId, tenancyId, tenantId, type, refundedAmount, deductions }` |
| `deposit.finalized` | Deposit finalized with claim deductions | `{ depositId, tenancyId, tenantId, type, originalAmount, totalDeductions, refundedAmount, claimsApplied }` |

### Business Rules

1. **Deposit Types**: Each tenancy can have one deposit of each type (SECURITY, UTILITY, KEY)
2. **Collection**: Deposits must be in PENDING status to be collected
3. **Deductions**: Can only be added to COLLECTED or HELD deposits; total cannot exceed deposit amount
4. **Refunds**: Tenancy must be TERMINATED before refund can be processed
5. **Forfeit**: Owner can forfeit deposits in COLLECTED or HELD status (e.g., tenant abandonment)
6. **Claim Linking**: Only APPROVED or PARTIALLY_APPROVED claims can be linked; claim must belong to same tenancy
7. **Finalize**: Automatically applies all approved claim deductions, marks claims as SETTLED (DEPOSIT_DEDUCTION), determines PARTIALLY_REFUNDED/FULLY_REFUNDED/FORFEITED status
8. **Deduction Cap**: Total claim deductions capped at deposit amount; excess claims remain unsettled

---

## Rent Billing Module (Phase 6.1)

**Base URL:** `/api/v1/rent-billings`  
**Auth:** JWT Bearer Token required  
**Module:** `src/modules/billing/`

### Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/rent-billings/generate` | Generate a billing statement for a tenancy period | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| `GET` | `/rent-billings` | List billing statements with filtering & pagination | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |
| `GET` | `/rent-billings/:id` | Get a specific billing statement | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |
| `GET` | `/rent-billings/:id/download` | Download billing statement as PDF | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |
| `POST` | `/rent-billings/:id/line-items` | Add a line item to an existing bill | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| `POST` | `/rent-billings/:id/late-fee` | Apply late fee to a bill | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| `POST` | `/rent-billings/:id/send` | Mark bill as sent to occupant | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| `POST` | `/rent-billings/:id/overdue` | Mark bill as overdue | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| `POST` | `/rent-billings/:id/write-off` | Write off a bill as uncollectable | SUPER_ADMIN, TENANT_ADMIN |
| `GET` | `/rent-billings/automation/status` | Get billing automation dashboard status | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| `GET` | `/rent-billings/config/:tenancyId` | Get billing configuration for a tenancy | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| `PATCH` | `/rent-billings/config/:tenancyId` | Update billing configuration for a tenancy | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| `POST` | `/rent-billings/:id/remind` | Send a payment reminder (manual trigger) | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| `GET` | `/rent-billings/:id/reminders` | List reminder history for a billing | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |
| `POST` | `/rent-billings/:id/escalate` | Escalate billing to legal action | SUPER_ADMIN, TENANT_ADMIN |

### Prisma Models

- **RentBilling** — billing statement with amounts, dates, status
- **RentBillingLineItem** — individual charge line items (RENT, UTILITY, LATE_FEE, CLAIM_DEDUCTION, OTHER)
- **RentBillingReminder** — reminders sent for overdue bills (EMAIL, SMS, LETTER, LEGAL_NOTICE)

### Bill Number Format

`BILL-{YYYYMM}-{SEQUENCE}` — e.g., `BILL-202603-0001`

### Status Flow

```
DRAFT → GENERATED → SENT → PAID
                  ↘       ↗
              PARTIALLY_PAID
                  ↘
                 OVERDUE → WRITTEN_OFF
```

### Line Item Types

| Type | Description |
|------|-------------|
| `RENT` | Monthly rent charge |
| `UTILITY` | Utility charges (water, electricity, etc.) |
| `LATE_FEE` | Late payment penalty |
| `CLAIM_DEDUCTION` | Deduction from maintenance claims |
| `OTHER` | Miscellaneous charges |

### Events

| Event | Description | Payload |
|-------|-------------|---------|
| `billing.generated` | New bill generated | `{ billingId, tenancyId, tenantId, billNumber, totalAmount }` |
| `billing.overdue` | Bill marked as overdue | `{ billingId, tenancyId, tenantId, billNumber, balanceDue, dueDate }` |
| `billing.batch.completed` | Batch generation completed | `{ tenantId, billingDay, period, generated, skipped, failed }` |
| `billing.overdue.batch` | Batch overdue detection completed | `{ tenantId, overdueCount }` |

### Automation (Phase 6.2)

**BillingProcessor** (`billing.process` queue):
| Job Type | Description | Schedule |
|----------|-------------|----------|
| `rent-billing.generate-batch` | Find tenancies by billing day, queue individual bill generation | Daily 6AM |
| `rent-billing.generate-single` | Generate bill for a single tenancy | Queued by batch |
| `rent-billing.detect-overdue` | Find past-due bills and mark as OVERDUE | Daily 9AM |
| `rent-billing.apply-late-fees` | Calculate and add LATE_FEE line items | Daily 10AM |

**Billing Configuration:**
- `billingDay`: 1-28 (day of month to generate bills)
- `paymentDueDay`: 1-60 (days after generation for payment)
- `lateFeePercent`: 0-100% (late fee as percentage of overdue balance)

**Notifications:**
- `billing.generated` → EMAIL + IN_APP to occupant (bill number, amount, due date, property)
- `billing.overdue` → Logged (deferred to reminder system in Session 6.5)

### Business Rules

1. **Billable States**: Tenancy must be in ACTIVE, MAINTENANCE_HOLD, INSPECTION_PENDING, or TERMINATION_REQUESTED to generate bills
2. **Duplicate Prevention**: Only one bill per tenancy per billing period
3. **Late Fees**: Calculated as percentage of total overdue balance across all outstanding bills
4. **Line Item Editing**: Can only add line items to DRAFT or GENERATED bills
5. **PDF Generation**: On-demand PDF generation using PDFKit (not stored in S3)
6. **Tenant Isolation**: All queries scoped to current tenant via TenantContextService

---

## Rent Payment Module (Phase 6.3)

### Base URL: `/api/v1/rent-payments`

### Endpoints

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/rent-payments/intent` | Create payment intent (Stripe) | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |
| POST | `/rent-payments/manual` | Record manual/offline payment | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| GET | `/rent-payments/fpx/banks` | Get FPX bank list (Malaysia) | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |
| GET | `/rent-payments` | List payments (paginated) | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |
| GET | `/rent-payments/:id` | Get payment details | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |
| GET | `/rent-payments/:id/receipt` | Download payment receipt PDF | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |

### Prisma Model

**RentPayment** — Payment records linked to RentBilling
- Fields: id, tenantId, billingId, paymentNumber (unique), amount (Decimal 12,2), status (RentPaymentStatus), method, currency, gatewayId, gatewayData, clientSecret, reference, receiptNumber (unique), receiptUrl, paymentDate, processedAt, payerName, payerEmail, createdAt, updatedAt
- Relations: Tenant, RentBilling
- Indexes: tenantId, billingId, status, gatewayId

### Payment Number Format
- Payment: `PAY-{YYYYMM}-{SEQUENCE}` (e.g., PAY-202603-0001)
- Receipt: `RCP-{YYYYMM}-{SEQUENCE}` (e.g., RCP-202603-0001)

### Payment Methods
- `CARD` — Credit/debit card via Stripe
- `FPX` — Malaysian FPX online banking via Stripe
- `BANK_TRANSFER` — Manual bank transfer
- `CASH` — Cash payment
- `OTHER` — Other payment methods

### FPX Banks (Malaysia)
16 supported banks: Affin Bank, Alliance Bank, AmBank, Bank Islam, Bank Muamalat, Bank Rakyat, BSN, CIMB, Hong Leong Bank, HSBC, Maybank, OCBC, Public Bank, RHB, Standard Chartered, UOB

### Status Flow
```
PENDING → PROCESSING → COMPLETED (success via webhook)
PENDING → FAILED (failure via webhook)
COMPLETED (immediate for manual payments)
```

### Events Emitted
- `rent.payment.completed` — Payment successfully processed
- `rent.payment.failed` — Payment failed
- `billing.status.changed` — Billing status updated (PARTIALLY_PAID/PAID)

### Webhook Integration
- StripeWebhookService detects `paymentType: 'rent'` in PaymentIntent metadata
- Routes to `rent.payment.webhook.succeeded` / `rent.payment.webhook.failed` events
- RentPaymentWebhookListener handles events → calls PaymentService

### Business Rules

1. **Payable Statuses**: Only GENERATED, SENT, PARTIALLY_PAID, OVERDUE billing can accept payments
2. **Amount Validation**: Payment amount must not exceed balance due
3. **Idempotent Webhooks**: Completed payments are skipped on repeat webhook calls
4. **Auto-Update Billing**: paidAmount/balanceDue automatically updated; status transitions to PARTIALLY_PAID or PAID
5. **Receipt Generation**: On-demand PDF receipts for completed payments using PDFKit
6. **Manual Payments**: Bank transfer/cash payments recorded immediately as COMPLETED
7. **Tenant Isolation**: All queries scoped to current tenant via TenantContextService

---

## Payment Reconciliation Module (Phase 6.4)

### Base URL: `/api/v1/rent-payments`

### Endpoints

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/rent-payments/advance` | Distribute lump-sum across outstanding billings | JWT | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/rent-payments/reassign` | Reassign completed payment to different billing | JWT | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/rent-payments/reconcile/billing/:id` | Reconcile single billing (recalculate from payments) | JWT | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/rent-payments/reconcile/tenancy/:id` | Batch-reconcile all billings for a tenancy | JWT | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/rent-payments/overpayment/:id` | Detect and resolve overpayment on a billing | JWT | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/rent-payments/match/:id` | Auto-match or manually assign payment to billing | JWT | SUPER_ADMIN, TENANT_ADMIN |

### Statement of Account

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/tenancies/:id/statement` | Get statement of account for a tenancy | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |

### Query Parameters (Statement)
| Parameter | Type | Description |
|-----------|------|-------------|
| `fromDate` | ISO 8601 | Statement period start (defaults to lease start) |
| `toDate` | ISO 8601 | Statement period end (defaults to today) |

### DTOs
- **StatementQueryDto** — fromDate, toDate (optional ISO date strings)
- **ReassignPaymentDto** — paymentId, newBillingId, reason (optional)
- **AdvancePaymentDto** — tenancyId, amount, method (BANK_TRANSFER/CASH/OTHER), reference, payerName, payerEmail

### Statement of Account Response
```json
{
  "tenancyId": "uuid",
  "property": { "id": "uuid", "title": "Unit 101" },
  "owner": { "id": "uuid", "name": "John Owner" },
  "occupant": { "id": "uuid", "name": "Jane Tenant", "email": "jane@test.com" },
  "period": { "from": "2026-01-01", "to": "2026-03-31" },
  "openingBalance": 0,
  "entries": [
    { "date": "2026-01-01", "type": "BILLING", "description": "Rent for January 2026", "reference": "BILL-202601-0001", "debit": 2500, "credit": 0, "balance": 2500 },
    { "date": "2026-01-05", "type": "PAYMENT", "description": "Payment — FPX", "reference": "PAY-202601-0001", "debit": 0, "credit": 2500, "balance": 0 }
  ],
  "closingBalance": 0,
  "summary": { "totalBilled": 2500, "totalPaid": 2500, "totalOutstanding": 0, "totalOverdue": 0 }
}
```

### Reconciliation Features
1. **matchPaymentToBill** — Auto-match by exact amount → date proximity; manual override with billingId
2. **handlePartialPayment** — Updates billing paidAmount/balanceDue; transitions to PARTIALLY_PAID
3. **handleOverpayment** — Caps billing at totalAmount; creates CREDIT payment on next outstanding bill
4. **handleAdvancePayment** — Distributes lump-sum across outstanding billings (oldest first); emits events per bill
5. **reassignPayment** — Reverses old billing, applies to new billing, updates payment.billingId
6. **reconcileBilling** — Recalculates paidAmount from COMPLETED payments; fixes discrepancies
7. **reconcileTenancy** — Batch-reconciles all billings for a tenancy
8. **getStatementOfAccount** — Full statement with opening balance, dated entries, running balance, summary

### Events Emitted
- `rent.payment.reassigned` — Payment moved between billings
- `reconciliation.billing.reconciled` — Billing amounts recalculated
- `reconciliation.overpayment.applied` — Excess credit applied to next billing
- `reconciliation.overpayment.unresolved` — Excess with no next billing to apply to
- `billing.status.changed` — Billing status updated during reconciliation

### Business Rules
1. **Only completed payments** can be matched, reassigned, or reconciled
2. **Overpayment credit** automatically applied to next outstanding billing (oldest first)
3. **Advance payments** distributed across all outstanding billings, oldest first
4. **Auto-match priority**: Exact amount match → Closest billing period date
5. **Currency**: MYR (Malaysian Ringgit), Decimal(12,2)
6. **Tenant isolation**: All queries scoped via TenantContextService

---
## Payment Reminder Module (Phase 6.5)

**Base URL:** `/api/v1/rent-billings`  
**Auth:** JWT Bearer Token required  
**Module:** `src/modules/billing/reminder/`

### Endpoints

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/rent-billings/:id/remind` | Send payment reminder (manual trigger) | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| GET | `/rent-billings/:id/reminders` | List reminder history for a billing | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT |
| POST | `/rent-billings/:id/escalate` | Escalate billing to legal action | JWT | SUPER_ADMIN, TENANT_ADMIN |

### Request Body (POST /remind)
```json
{
  "sequence": 2  // Optional: 1-4; auto-determines next if omitted
}
```

### Reminder Schedule (4-Tier Escalation)

| Sequence | Trigger | Channel | Escalation |
|----------|---------|---------|------------|
| 1 | 3 days before due date | EMAIL | No |
| 2 | On due date | EMAIL | No |
| 3 | 7 days after due date | EMAIL | No |
| 4 | 14 days after due date | LEGAL_NOTICE | Yes — flagged for legal action |

### Cron Schedule
- `0 7 * * *` (Daily at 7 AM) — Batch-scan unpaid billings per tenant and send due reminders

### Job Types
- `rent-billing.process-reminders` — Via BILLING_PROCESS queue, delegated via event to ReminderService

### Events Emitted
- `billing.reminder.sent` — Reminder sent (all sequences)
- `billing.reminder.escalated` — Legal escalation triggered (sequence 4)
- `billing.reminders.process` — Internal event from processor to ReminderService

### ReminderService Methods
1. **sendReminder(billingId, sequence?)** — Send at specific sequence or auto-determine next
2. **scheduleReminders(tenantId)** — Batch scan unpaid billings, send due reminders
3. **escalateToLegal(billingId)** — Force sequence 4 legal notice
4. **listReminders(billingId)** — Get all reminders for a billing

### Business Rules
1. **Eligible statuses**: GENERATED, SENT, PARTIALLY_PAID, OVERDUE
2. **Sequence limit**: 1-4 per billing (duplicate sequences rejected)
3. **Auto-escalation**: Sequence 4 automatically flags for legal action
4. **Occupant email required**: Reminders skipped if no email available
5. **Tenant isolation**: All operations scoped via TenantContextService

---

## Owner Payout Module (Phase 6.6–6.7)

**Base URL:** `/api/v1/payouts`  
**Auth:** JWT Bearer Token required  
**Module:** `src/modules/payout/`

### Endpoints

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/payouts/calculate` | Calculate and create payout for an owner | JWT | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/payouts/process-batch` | Process approved payouts in batch | JWT | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/payouts/bank-file` | Download CSV bank file for approved payouts | JWT | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/payouts` | List payouts with filtering and pagination | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| GET | `/payouts/:id` | Get payout details with all line items | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |
| POST | `/payouts/:id/approve` | Approve a calculated payout | JWT | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/payouts/:id/statement` | Download payout statement PDF | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN |

### Request Body (POST /payouts/calculate)
```json
{
  "ownerId": "550e8400-e29b-41d4-a716-446655440000",
  "periodStart": "2026-03-01",
  "periodEnd": "2026-03-31",
  "platformFeePercent": 10  // Optional, default: 10
}
```

### Response (POST /payouts/calculate)
```json
{
  "payoutId": "uuid",
  "payoutNumber": "PAY-OUT-202603-0001",
  "ownerId": "uuid",
  "ownerName": "John Owner",
  "periodStart": "2026-03-01T00:00:00.000Z",
  "periodEnd": "2026-03-31T00:00:00.000Z",
  "grossRental": 5000.00,
  "platformFee": 500.00,
  "maintenanceCost": 0.00,
  "otherDeductions": 0.00,
  "netPayout": 4500.00,
  "lineItemCount": 4,
  "tenancyCount": 2
}
```

### Query Parameters (GET /payouts)

| Parameter | Type | Description |
|-----------|------|-------------|
| ownerId | UUID | Filter by owner (vendor) ID |
| status | PayoutStatus | Filter by status (PENDING, CALCULATED, APPROVED, PROCESSING, COMPLETED, FAILED) |
| periodStart | ISO Date | Filter payouts with period starting from this date |
| periodEnd | ISO Date | Filter payouts with period ending by this date |
| page | Integer | Page number (default: 1) |
| limit | Integer | Items per page (default: 20, max: 100) |
| sortBy | String | Sort field (default: createdAt) |
| sortOrder | asc/desc | Sort direction (default: desc) |

### Payout Calculation Logic
1. Find all ACTIVE tenancies owned by the vendor
2. Find COMPLETED RentPayments for those tenancies within period
3. Sum all payments as grossRental
4. Calculate platformFee = grossRental × platformFeePercent%
5. netPayout = grossRental - platformFee - maintenanceCost - otherDeductions
6. Create OwnerPayout record with PayoutLineItems (RENTAL per payment, PLATFORM_FEE per tenancy)

### PayoutLineItem Types

| Type | Description |
|------|-------------|
| RENTAL | Rent payment received |
| PLATFORM_FEE | Platform fee deduction (negative) |
| MAINTENANCE | Maintenance cost deduction (future) |
| CLAIM_DEDUCTION | Claim deduction (future) |
| OTHER | Other adjustments |

### Events Emitted
- `payout.calculated` — Payout calculated with gross, fee, net amounts
- `payout.approved` — Payout approved for processing
- `payout.completed` — Payout successfully processed with bank reference
- `payout.failed` — Payout processing failed

### PayoutService Methods
1. **calculatePayout(ownerId, periodStart, periodEnd, platformFeePercent?)** — Calculate and create payout
2. **getPayout(payoutId)** — Get single payout with line items
3. **listPayouts(options)** — Paginated list with filters
4. **approvePayout(payoutId, approvedBy)** — Approve CALCULATED→APPROVED
5. **processBatch(payoutIds?)** — Batch process APPROVED→COMPLETED/FAILED
6. **generateBankFile(payoutIds?)** — Generate CSV bank file for approved payouts
7. **generatePayoutStatementPdf(payoutId)** — Generate A4 PDF statement with line items

### Scheduler
- **Monthly Payout Run**: Cron `0 8 15 * *` — 15th of each month at 8 AM, enqueues per-tenant payout jobs

### Request Body (POST /payouts/:id/approve)
```json
{
  "approvedBy": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response (POST /payouts/:id/approve)
```json
{
  "payoutId": "uuid",
  "payoutNumber": "PAY-OUT-202603-0001",
  "status": "APPROVED",
  "approvedBy": "uuid",
  "approvedAt": "2026-03-15T08:00:00.000Z"
}
```

### Request Body (POST /payouts/process-batch)
```json
{
  "payoutIds": ["uuid1", "uuid2"]  // Optional — omit to process all approved
}
```

### Response (POST /payouts/process-batch)
```json
{
  "processed": 2,
  "failed": 0,
  "results": [
    { "payoutId": "uuid", "payoutNumber": "PAY-OUT-202603-0001", "status": "COMPLETED" },
    { "payoutId": "uuid", "payoutNumber": "PAY-OUT-202603-0002", "status": "COMPLETED" }
  ]
}
```

### GET /payouts/bank-file
- **Query**: `payoutIds` (optional UUID array) — filter specific payouts
- **Response**: CSV file download (`Content-Type: text/csv`)
- **CSV Headers**: Payout Number, Beneficiary Name, Bank Name, Account Number, Account Holder Name, Amount (MYR), Reference, Currency
- **Footer Row**: Total Records count and total amount

### GET /payouts/:id/statement
- **Response**: PDF file download (`Content-Type: application/pdf`)
- **Content**: Payout statement with header, payout details, bank details, line items table, summary (gross rental, platform fee, maintenance, deductions, net payout)

### Business Rules
1. **Overlap prevention**: Cannot create payout for same owner with overlapping period (unless FAILED)
2. **Eligible tenancy statuses**: ACTIVE, MAINTENANCE_HOLD, INSPECTION_PENDING, TERMINATION_REQUESTED, TERMINATED
3. **Payment filter**: Only COMPLETED payments within the period
4. **Platform fee**: Configurable per request (default 10%)
5. **Payout number format**: PAY-OUT-{YYYYMM}-{SEQUENCE}
6. **Tenant isolation**: All operations scoped via TenantContextService

---

## 📊 Financial Reports (Session 6.8)

**Base URL:** `/api/v1/reports`  
**Auth:** JWT Bearer token + X-Tenant-ID header  
**Tags:** Financial Reports

### Endpoints

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| GET | `/reports/revenue` | Platform revenue report (fee income from payouts) | JWT | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/reports/collections` | Rent collection report (billed vs collected) | JWT | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/reports/outstanding` | Outstanding bills report with aging buckets | JWT | SUPER_ADMIN, TENANT_ADMIN |

### GET /reports/revenue
- **Query Params**: `startDate?`, `endDate?`, `period?` (DAILY/WEEKLY/MONTHLY/QUARTERLY/YEARLY/CUSTOM), `ownerId?`
- **Response**:
  ```json
  {
    "data": {
      "summary": { "totalGrossRental", "totalPlatformFee", "totalNetPayout", "totalPayouts" },
      "byPeriod": [{ "period", "grossRental", "platformFee", "netPayout", "payoutCount" }],
      "byOwner": [{ "ownerId", "ownerName", "grossRental", "platformFee", "netPayout", "payoutCount" }]
    }
  }
  ```

### GET /reports/collections
- **Query Params**: `startDate?`, `endDate?`, `period?`, `tenancyId?`
- **Response**:
  ```json
  {
    "data": {
      "summary": { "totalBilled", "totalCollected", "totalOutstanding", "collectionRate", "paymentCount" },
      "byPeriod": [{ "period", "billed", "collected", "outstanding", "paymentCount" }],
      "byMethod": [{ "method", "amount", "count" }]
    }
  }
  ```

### GET /reports/outstanding
- **Query Params**: `asOfDate?`, `ownerId?`, `tenancyId?`
- **Response**:
  ```json
  {
    "data": {
      "summary": { "totalOutstanding", "totalOverdue", "billCount", "overdueBillCount" },
      "aging": { "current", "days1to30", "days31to60", "days61to90", "over90days" },
      "bills": [{ "billId", "billNumber", "tenancyId", "listingTitle", "occupantName", "ownerName", "totalAmount", "paidAmount", "balanceDue", "dueDate", "daysOverdue", "status" }]
    }
  }
  ```

### Business Rules
1. **Default date range**: Last 12 months if no startDate/endDate provided
2. **Tenant isolation**: All reports scoped via TenantContextService
3. **Decimal precision**: All money rounded to 2 decimal places
4. **Revenue source**: Platform fees from COMPLETED/APPROVED/PROCESSING payouts
5. **Collection rate**: (totalCollected / totalBilled) × 100
6. **Aging buckets**: Current (not due), 1-30 days, 31-60 days, 61-90 days, 90+ days

---

## 🔧 Maintenance Tickets (Session 7.1)

**Base URL:** `/api/v1/maintenance`  
**Auth:** JWT Bearer token + X-Tenant-ID header  
**Tags:** Maintenance

### Endpoints

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| POST | `/maintenance` | Create a new maintenance ticket | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF, CUSTOMER, OCCUPANT |
| GET | `/maintenance` | List maintenance tickets with filters | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF, CUSTOMER, OCCUPANT |
| GET | `/maintenance/:id` | Get maintenance ticket by ID | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF, CUSTOMER, OCCUPANT |
| PATCH | `/maintenance/:id` | Update a maintenance ticket | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF |
| POST | `/maintenance/:id/attachments` | Add attachment (returns presigned S3 URL) | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF, CUSTOMER, OCCUPANT |
| POST | `/maintenance/:id/comments` | Add comment/update to ticket | JWT | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF, CUSTOMER, OCCUPANT |

### POST /maintenance
- **Body**: `tenancyId` (UUID, required), `title` (string, required), `description` (string, required), `category` (PLUMBING|ELECTRICAL|APPLIANCE|STRUCTURAL|OTHER, required), `location?` (string), `priority?` (LOW|MEDIUM|HIGH|URGENT, default MEDIUM), `estimatedCost?` (number)
- **Response**: Maintenance ticket with tenancy relations, attachments, updates
- **Validation**: Tenancy must exist, must be ACTIVE or TERMINATION_REQUESTED
- **Side effects**: Emits `maintenance.created` event

### GET /maintenance
- **Query Params**: `status?` (MaintenanceStatus), `priority?` (MaintenancePriority), `category?`, `tenancyId?`, `search?` (ticket number or title), `page?` (default 1), `limit?` (default 20, max 100), `sortBy?` (createdAt|updatedAt|priority|status), `sortOrder?` (asc|desc)
- **Response**: `{ data: MaintenanceView[], total: number, page: number, limit: number }`
- **Role filtering**: CUSTOMER role only sees their own tenancy tickets

### GET /maintenance/:id
- **Params**: `id` (UUID)
- **Response**: Full maintenance ticket with tenancy, attachments, updates
- **Role filtering**: CUSTOMER/GUEST roles have internal notes filtered out from updates

### PATCH /maintenance/:id
- **Params**: `id` (UUID)
- **Body**: `title?`, `description?`, `category?`, `location?`, `priority?`, `estimatedCost?`, `actualCost?`, `paidBy?` (OWNER|OCCUPANT|SHARED), `assignedTo?`, `resolution?`
- **Response**: Updated maintenance ticket
- **Validation**: Cannot update CLOSED or CANCELLED tickets; setting `assignedTo` auto-sets `assignedAt`

### POST /maintenance/:id/attachments
- **Params**: `id` (UUID)
- **Body**: `type` (IMAGE|VIDEO|DOCUMENT, required), `fileName` (string, required), `mimeType` (string, required), `fileSize` (integer, required)
- **Response**: `{ attachment: AttachmentView, uploadUrl: string, expiresAt: Date }`
- **Flow**: Client sends metadata → receives presigned S3 URL → uploads directly to S3
- **Validation**: Cannot add to CLOSED or CANCELLED tickets

### POST /maintenance/:id/comments
- **Params**: `id` (UUID)
- **Body**: `message` (string, required), `isInternal?` (boolean, default false)
- **Response**: Created comment/update record
- **Note**: Internal comments (`isInternal: true`) are hidden from CUSTOMER/GUEST roles
- **Validation**: Cannot add to CLOSED or CANCELLED tickets

### Business Rules
1. **Ticket number format**: MNT-YYYYMMDD-XXXX (auto-generated, unique)
2. **Categories**: PLUMBING, ELECTRICAL, APPLIANCE, STRUCTURAL, OTHER
3. **Priorities**: LOW, MEDIUM, HIGH, URGENT (default: MEDIUM)
4. **Tenant isolation**: All operations scoped via TenantContextService (tenancy must belong to tenant)
5. **Role-based access**: CUSTOMER only sees own tenancy tickets; internal notes hidden from CUSTOMER/GUEST
6. **Immutability**: CLOSED and CANCELLED tickets cannot be updated, no attachments/comments added
7. **S3 storage**: Attachments stored at `tenants/{tenantId}/maintenance/{maintenanceId}/{timestamp}-{fileName}`
8. **Events**: `maintenance.created`, `maintenance.updated`, `maintenance.attachment.added`, `maintenance.comment.added`

---

## Maintenance Workflow (Session 7.2)

### POST /maintenance/:id/verify
- **Description**: Verify a maintenance ticket (OPEN → VERIFIED)
- **Auth**: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF)
- **Params**: `id` (UUID) — Maintenance ticket ID
- **Body**: `VerifyMaintenanceDto`
  - `verificationNotes?` (string) — Verification notes from admin/vendor
- **Response**: Updated maintenance ticket
- **Status Codes**: 200, 400 (invalid transition), 404

### POST /maintenance/:id/assign
- **Description**: Assign a maintenance ticket (VERIFIED → ASSIGNED). Supports vendor staff or external contractor.
- **Auth**: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF)
- **Params**: `id` (UUID) — Maintenance ticket ID
- **Body**: `AssignMaintenanceDto`
  - `assignedTo` (string, required) — Staff name/ID or contractor name
  - `contractorName?` (string) — External contractor name
  - `contractorPhone?` (string) — External contractor phone
  - `estimatedCost?` (number) — Estimated repair cost
- **Response**: Updated maintenance ticket
- **Status Codes**: 200, 400 (invalid transition, missing assignee), 404

### POST /maintenance/:id/start
- **Description**: Start work on a maintenance ticket (ASSIGNED → IN_PROGRESS)
- **Auth**: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF)
- **Params**: `id` (UUID) — Maintenance ticket ID
- **Body**: None
- **Response**: Updated maintenance ticket with `startedAt` timestamp
- **Status Codes**: 200, 400 (invalid transition), 404

### POST /maintenance/:id/resolve
- **Description**: Resolve a maintenance ticket (IN_PROGRESS → PENDING_APPROVAL). Records resolution and actual cost.
- **Auth**: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF)
- **Params**: `id` (UUID) — Maintenance ticket ID
- **Body**: `ResolveMaintenanceDto`
  - `resolution` (string, required) — Description of work completed
  - `actualCost?` (number) — Actual repair cost
  - `paidBy?` (string, enum: OWNER | OCCUPANT | SHARED) — Who pays
- **Response**: Updated maintenance ticket
- **Status Codes**: 200, 400 (invalid transition, missing resolution), 404

### POST /maintenance/:id/close
- **Description**: Close a maintenance ticket (PENDING_APPROVAL | CLAIM_APPROVED → CLOSED)
- **Auth**: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- **Params**: `id` (UUID) — Maintenance ticket ID
- **Body**: `CloseMaintenanceDto`
  - `closingNotes?` (string) — Optional closing notes
- **Response**: Updated maintenance ticket with `closedAt` timestamp
- **Status Codes**: 200, 400 (invalid transition), 404

### POST /maintenance/:id/cancel
- **Description**: Cancel a maintenance ticket (OPEN | VERIFIED | ASSIGNED → CANCELLED)
- **Auth**: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- **Params**: `id` (UUID) — Maintenance ticket ID
- **Body**: `CancelMaintenanceDto`
  - `reason?` (string) — Cancellation reason
- **Response**: Updated maintenance ticket
- **Status Codes**: 200, 400 (invalid transition), 404

### State Machine Transitions
```
Primary Flow:
  OPEN → (verify) → VERIFIED → (assign) → ASSIGNED → (start) → IN_PROGRESS → (resolve) → PENDING_APPROVAL → (close) → CLOSED

Claim Flow:
  IN_PROGRESS/PENDING_APPROVAL → (submit_claim) → CLAIM_SUBMITTED → (approve_claim) → CLAIM_APPROVED → (close) → CLOSED
  CLAIM_SUBMITTED → (reject_claim) → CLAIM_REJECTED

Cancel:
  OPEN/VERIFIED/ASSIGNED → (cancel) → CANCELLED

Reopen:
  CLOSED → (reopen) → OPEN
```

### Business Rules
1. **State machine enforced**: All status changes go through MaintenanceStateMachine — no direct status updates
2. **Assign guard**: Must provide `assignedTo` when assigning a ticket
3. **Resolve guard**: Must provide `resolution` description when resolving
4. **External contractors**: Supports `contractorName` and `contractorPhone` for non-staff assignments
5. **Cost tracking**: `estimatedCost` set at assignment, `actualCost` + `paidBy` set at resolution
6. **System timeline**: All workflow actions auto-create internal `MaintenanceUpdate` records
7. **Events**: `maintenance.status.changed` emitted for every transition (includes fromStatus, toStatus, changedBy)
8. **Cancel restrictions**: Cannot cancel IN_PROGRESS, PENDING_APPROVAL, or later-state tickets
9. **Workflow timestamps**: `verifiedAt`, `assignedAt`, `startedAt`, `resolvedAt`, `closedAt` tracked individually

---

## Inspection Core (Session 7.3)

### POST /inspections
**Schedule a new inspection**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- Body: `{ tenancyId, type, scheduledDate?, scheduledTime?, videoRequested?, onsiteRequired?, notes? }`
- Types: MOVE_IN, PERIODIC, MOVE_OUT, EMERGENCY
- Response: `{ data: Inspection }`
- Events: `inspection.created`

### GET /inspections
**List inspections with filtering and pagination**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT)
- Query: `{ tenancyId?, type?, status?, search?, page?, limit? }`
- Statuses: SCHEDULED, VIDEO_REQUESTED, VIDEO_SUBMITTED, ONSITE_PENDING, COMPLETED, REPORT_GENERATED
- Response: `{ data: { data: Inspection[], total, page, limit } }`

### GET /inspections/:id
**Get inspection details by ID**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT)
- Includes: checklist items, tenancy (listing, owner, occupant)
- Response: `{ data: Inspection }`

### PATCH /inspections/:id/checklist
**Update inspection checklist items**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- Body: `{ items: [{ id?, category, item, condition?, notes?, photoUrls? }] }`
- Categories: BEDROOM, BATHROOM, KITCHEN, LIVING, EXTERIOR, OTHER
- Conditions: EXCELLENT, GOOD, FAIR, POOR, DAMAGED
- Validation: Cannot update completed or report-generated inspections
- Response: `{ data: Inspection }`

### POST /inspections/:id/complete
**Complete an inspection with overall rating**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- Body: `{ overallRating (1-5), notes? }`
- Validation: Cannot complete already completed inspection
- Events: `inspection.completed`
- Response: `{ data: Inspection }`

### GET /inspections/:id/report
**Generate or retrieve inspection PDF report**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT)
- Behavior: Generates PDF on first call, returns cached URL on subsequent calls
- PDF contents: Header, inspection details, notes, checklist grouped by category
- Storage: S3 key `inspections/{tenantId}/{inspectionId}/report.pdf`
- Events: `inspection.report.generated`
- Response: `{ data: { url: string } }`

### Business Rules
1. **Tenant scoping**: All queries scoped via `tenancy.tenantId`
2. **Checklist lock**: Cannot update checklist after inspection is COMPLETED or REPORT_GENERATED
3. **Report prerequisite**: Inspection must be COMPLETED before generating report
4. **Report caching**: Once generated, report URL is returned without re-generating
5. **PDF generation**: PDFKit → Buffer → S3 upload → public URL stored on inspection record
6. **Status flow**: SCHEDULED → ... → COMPLETED → REPORT_GENERATED

---

## Video Inspection (Session 7.4)

### POST /inspections/:id/request-video
**Request video inspection from occupant**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- Body: `{ message? }`
- Status guard: Only SCHEDULED or VIDEO_REQUESTED → VIDEO_REQUESTED
- Clears previous video data on re-request
- Events: `inspection.video.requested`
- Response: `{ data: Inspection }`

### POST /inspections/:id/submit-video
**Submit video for inspection (returns presigned upload URL)**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT)
- Body: `{ fileName, mimeType, fileSize? }`
- Status guard: Only VIDEO_REQUESTED or VIDEO_SUBMITTED → VIDEO_SUBMITTED
- S3 key: `inspections/{tenantId}/{inspectionId}/video/{timestamp}-{fileName}`
- Presigned URL: 2-hour expiry for large video files
- Events: `inspection.video.submitted`
- Response: `{ data: { uploadUrl, expiresAt, inspection } }`

### POST /inspections/:id/review-video
**Review submitted video (approve or request redo)**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- Body: `{ decision: 'APPROVED' | 'REQUEST_REDO', notes? }`
- Status guard: Only VIDEO_SUBMITTED
- APPROVED → ONSITE_PENDING, REQUEST_REDO → VIDEO_REQUESTED (clears video data)
- Notes appended to inspection notes field
- Events: `inspection.video.reviewed`
- Response: `{ data: Inspection }`

### GET /inspections/:id/video
**Get presigned download URL for inspection video**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT)
- Presigned download URL: 1-hour expiry
- Response: `{ data: { url } }`

### Video Inspection Business Rules
1. **Video flow**: SCHEDULED → VIDEO_REQUESTED → VIDEO_SUBMITTED → ONSITE_PENDING (approved) or VIDEO_REQUESTED (redo)
2. **Presigned uploads**: S3 presigned URLs for direct browser upload (2-hour expiry for large files)
3. **Re-upload support**: Owners can request redo, which clears previous video and resets status
4. **Re-submission**: Occupants can re-submit while in VIDEO_SUBMITTED status
5. **Notes tracking**: Review decisions append notes to inspection record for audit trail

---

## Claim Management

**Base URL:** `/claims`
**Module:** `ClaimModule`
**Auth:** JWT + Roles

### POST /claims
**Submit a new claim**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT)
- Body: `{ tenancyId, maintenanceId?, type, title, description, claimedAmount, submittedRole }`
- Validates tenancy exists and belongs to tenant
- Validates maintenance ticket if linked (optional, unique per maintenance)
- Auto-generates claim number: CLM-YYYYMMDD-XXXX
- Emits: `claim.submitted`
- Response: `{ data: Claim }`

### GET /claims
**List claims (paginated)**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT)
- Query: `{ tenancyId?, type?, status?, search?, page?, limit? }`
- Search matches: claimNumber, title, description
- Response: `{ data: Claim[], meta: { total, page, limit, totalPages } }`

### GET /claims/:id
**Get claim details**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT)
- Includes: evidence[], tenancy (listing, owner, occupant)
- Response: `{ data: ClaimView }`

### POST /claims/:id/evidence
**Upload claim evidence (S3 presigned URL)**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT)
- Body: `{ type, fileName, mimeType, fileSize?, description? }`
- Evidence types: PHOTO, VIDEO, RECEIPT, QUOTE
- S3 key: `claims/{tenantId}/{claimId}/evidence/{timestamp}-{fileName}`
- Presigned URL: 1-hour expiry
- Guards: Cannot upload to SETTLED or REJECTED claims
- Emits: `claim.evidence.added`
- Response: `{ data: { evidence, uploadUrl, uploadExpiry } }`

### POST /claims/:id/review
**Review a claim (approve/partial/reject)**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- Body: `{ decision, approvedAmount?, notes? }`
- Decision values: APPROVED (full claimed amount), PARTIALLY_APPROVED (requires approvedAmount < claimedAmount), REJECTED
- Reviewable from: SUBMITTED, UNDER_REVIEW, DISPUTED
- Clears dispute flag on re-review of disputed claims
- Emits: `claim.reviewed`
- Response: `{ data: Claim }`

### POST /claims/:id/dispute
**Dispute a claim decision**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, OCCUPANT)
- Body: `{ reason, notes? }`
- Disputable from: APPROVED, PARTIALLY_APPROVED, REJECTED
- Cannot dispute: SUBMITTED, UNDER_REVIEW, SETTLED, DISPUTED
- Emits: `claim.disputed`
- Response: `{ data: Claim }`

### Claim Business Rules
1. **Claim types**: DAMAGE, CLEANING, MISSING_ITEM, UTILITY, OTHER
2. **Status flow**: SUBMITTED → UNDER_REVIEW → APPROVED/PARTIALLY_APPROVED/REJECTED → SETTLED or DISPUTED → re-review
3. **Unique maintenance link**: One claim per maintenance ticket (optional)
4. **Settlement methods**: DEPOSIT_DEDUCTION, BILLING_DEDUCTION, DIRECT_PAYMENT
5. **Evidence guard**: No uploads allowed on SETTLED or REJECTED claims
6. **Dispute re-review**: Reviewing a disputed claim clears the dispute flag and updates status
7. **Claim number format**: CLM-YYYYMMDD-XXXX (auto-generated, unique)

---

## 🏢 Company Module (Session 8.1)

### POST /api/v1/companies/register
**Register a new company**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Body: `{ name, registrationNo, type, email, phone, address? }`
- Company types: PROPERTY_COMPANY, MANAGEMENT_COMPANY, AGENCY
- Initial status: PENDING
- Creator added as owner admin automatically
- Emits: `company.registered`
- Response: `{ data: CompanyView }`

### GET /api/v1/companies
**List companies (paginated, filterable)**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Query: `{ type?, status?, search?, page?, limit?, sortBy?, sortDir? }`
- Response: `{ data: { data: CompanyView[], total, page, limit, totalPages } }`

### GET /api/v1/companies/:id
**Get company details**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Includes: admins[] with user details
- Response: `{ data: CompanyView }`

### PATCH /api/v1/companies/:id
**Update company**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Body: `{ name?, type?, email?, phone?, address?, businessLicense?, ssmDocument? }`
- Response: `{ data: CompanyView }`

### POST /api/v1/companies/:id/verify
**Verify company (PENDING → ACTIVE)**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN)
- Sets verifiedAt, verifiedBy
- Emits: `company.verified`
- Response: `{ data: CompanyView }`

### POST /api/v1/companies/:id/suspend
**Suspend company**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN)
- Response: `{ data: CompanyView }`

### POST /api/v1/companies/:id/admins
**Add admin to company**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Body: `{ userId, role?, isOwner? }`
- CompanyAdminRole: ADMIN, PIC
- Validates user exists in same tenant
- Emits: `company.admin.added`
- Response: `{ data: CompanyAdminView }`

### GET /api/v1/companies/:id/admins
**List company admins**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Response: `{ data: CompanyAdminView[] }`

### DELETE /api/v1/companies/:id/admins/:userId
**Remove admin from company**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Cannot remove owner or last admin
- Emits: `company.admin.removed`
- Response: 204 No Content

### Company Enums
- **CompanyType**: PROPERTY_COMPANY, MANAGEMENT_COMPANY, AGENCY
- **CompanyStatus**: PENDING, ACTIVE, SUSPENDED
- **CompanyAdminRole**: ADMIN, PIC

### Business Rules
1. **Registration number unique per tenant**: @@unique([tenantId, registrationNo])
2. **Company admin unique**: @@unique([companyId, userId])
3. **Owner protection**: Cannot remove the company owner admin
4. **Last admin protection**: Cannot remove the last admin from a company
5. **Verification flow**: Only PENDING companies can be verified → ACTIVE
6. **Suspend flow**: Cannot suspend an already suspended company
7. **Tenant-scoped**: All queries filtered by tenantId from TenantContextService

---

## 🕵️ Agent Module (Session 8.2)

### POST /api/v1/agents
**Register a new agent**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Body: `{ companyId, userId, renNumber?, renExpiry?, referredBy? }`
- Generates unique 8-char referral code
- Validates company and user exist within tenant
- Emits: `agent.registered`
- Response: `{ data: AgentView }`

### GET /api/v1/agents
**List agents (paginated, filterable)**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, AGENT)
- Query: `{ companyId?, status?, search?, page?, limit?, sortBy?, sortDir? }`
- Search matches: user fullName, email, renNumber, referralCode
- Response: `{ data: { data: AgentView[], total, page, limit, totalPages } }`

### GET /api/v1/agents/:id
**Get agent details**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, AGENT)
- Includes: company, user, active agentListings with listing details
- Response: `{ data: AgentView }`

### PATCH /api/v1/agents/:id
**Update agent profile**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, AGENT)
- Body: `{ renNumber?, renExpiry? }`
- Response: `{ data: AgentView }`

### POST /api/v1/agents/:id/assign-listing
**Assign agent to a listing**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Body: `{ listingId }`
- Validates listing exists within tenant
- Increments agent totalListings
- Emits: `agent.listing.assigned`
- Response: `{ data: AgentListingView }`

### DELETE /api/v1/agents/:id/listings/:listingId
**Unassign agent from a listing**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Soft-removes assignment (sets removedAt)
- Decrements agent totalListings
- Emits: `agent.listing.unassigned`
- Response: 204 No Content

### GET /api/v1/agents/:id/listings
**Get agent's active listings**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, AGENT)
- Returns only active assignments (removedAt: null)
- Response: `{ data: AgentListingView[] }`

### POST /api/v1/agents/:id/suspend
**Suspend an active agent**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Only ACTIVE agents can be suspended
- Response: `{ data: AgentView }`

### POST /api/v1/agents/:id/reactivate
**Reactivate a suspended agent**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Only SUSPENDED agents can be reactivated
- Response: `{ data: AgentView }`

### POST /api/v1/agents/:id/regenerate-referral
**Regenerate referral code for an agent**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, AGENT)
- Generates new unique 8-char uppercase hex code
- Response: `{ data: AgentView }`

### Agent Enums
- **AgentStatus**: ACTIVE, INACTIVE, SUSPENDED

### Business Rules
1. **Agent unique per company**: @@unique([companyId, userId])
2. **Referral code unique**: @@unique([referralCode])
3. **Agent-listing unique**: @@unique([agentId, listingId]) in AgentListing
4. **Soft unassign**: Listing assignments set removedAt instead of delete
5. **Performance stats**: totalListings, totalDeals, totalRevenue tracked on Agent
6. **REN number**: Malaysian Real Estate Negotiator registration number (3-50 chars)
7. **Tenant-scoped**: Agent queries scoped via company.tenantId
8. **Suspend flow**: Only ACTIVE → SUSPENDED, only SUSPENDED → ACTIVE

---

## 💰 Commission Module (Session 8.3)

### POST /api/v1/commissions
**Calculate and create a commission**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Body: `{ agentId, tenancyId, type, rate?, notes? }`
- Type: BOOKING or RENEWAL
- Rate: Optional override (default: 1.0 for BOOKING, 0.5 for RENEWAL)
- Amount calculated: monthlyRent × rate
- Validates agent and tenancy exist within tenant
- Emits: `commission.created`
- Response: `{ data: CommissionView }`

### GET /api/v1/commissions
**List all commissions (paginated, filterable)**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Query: `{ agentId?, tenancyId?, type?, status?, page?, limit?, sortBy?, sortDir? }`
- Response: `{ data: { data: CommissionView[], total, page, limit, totalPages } }`

### GET /api/v1/commissions/:id
**Get commission details**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, AGENT)
- Includes: agent (with user, company), tenancy (with listing)
- Response: `{ data: CommissionView }`

### POST /api/v1/commissions/:id/approve
**Approve a pending commission**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Body: `{ notes? }`
- Only PENDING commissions can be approved
- Sets approvedBy, approvedAt
- Emits: `commission.approved`
- Response: `{ data: CommissionView }`

### POST /api/v1/commissions/:id/pay
**Mark an approved commission as paid**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Body: `{ paidRef?, notes? }`
- Only APPROVED commissions can be marked paid
- Updates agent totalRevenue and totalDeals
- Emits: `commission.paid`
- Response: `{ data: CommissionView }`

### POST /api/v1/commissions/:id/cancel
**Cancel a commission**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN)
- Cannot cancel PAID commissions
- Emits: `commission.cancelled`
- Response: `{ data: CommissionView }`

### GET /api/v1/agents/:id/commissions
**List agent's commissions**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, AGENT)
- Query: `{ type?, status?, page?, limit?, sortBy?, sortDir? }`
- Response: `{ data: { data: CommissionView[], total, page, limit, totalPages } }`

### GET /api/v1/agents/:id/commissions/summary
**Get agent's commission summary**
- Auth: JWT + Roles (SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, AGENT)
- Response: `{ data: CommissionSummary }`
- Summary: totalCommissions, totalAmount, pendingCount/Amount, approvedCount/Amount, paidCount/Amount

### Commission Enums
- **CommissionType**: BOOKING, RENEWAL
- **CommissionStatus**: PENDING, APPROVED, PAID, CANCELLED

### Event Handlers (Auto-Commission)
- **tenancy.activated** → Auto-creates BOOKING commission for agent assigned to listing
- **contract.renewed** → Auto-creates RENEWAL commission for agent assigned to listing

### Business Rules
1. **Status flow**: PENDING → APPROVED → PAID (forward only)
2. **Cancel**: Any non-PAID status can be cancelled
3. **Default rates**: BOOKING = 1.0 month, RENEWAL = 0.5 month
4. **Custom rate**: Override via rate field (0-12 range)
5. **Agent stats update**: On PAID, totalRevenue incremented and totalDeals +1
6. **Duplicate prevention**: Event handlers check for existing commission before creating
7. **Tenant-scoped**: All queries scoped via agent.company.tenantId
8. **Approval notes**: Appended to existing notes with [Approval] prefix
9. **Payment reference**: Optional paidRef for tracking payment receipts
---

## 🤝 Affiliate Module (Session 8.4)

### POST /api/v1/affiliates
**Register a new affiliate**
- Auth: SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN
- Body: `{ userId: UUID, type?: AffiliateType, bankName?, bankAccount?, bankAccountName?, notes? }`
- Generates unique referral code (REF + 8 alphanumeric chars)
- Emits: `affiliate.created`
- Response: `{ data: AffiliateView }`

### GET /api/v1/affiliates
**List all affiliates (paginated, filterable)**
- Auth: SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN
- Query: `{ status?, page?, limit?, sortBy?, sortDir? }`
- Response: `{ data: { data: AffiliateView[], total, page, limit, totalPages } }`

### GET /api/v1/affiliates/code/:code
**Look up affiliate by referral code**
- Auth: SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, AGENT
- Response: `{ data: AffiliateView }`

### GET /api/v1/affiliates/:id
**Get affiliate details**
- Auth: SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, AGENT
- Response: `{ data: AffiliateView }`

### PATCH /api/v1/affiliates/:id
**Update affiliate details (bank, type, notes)**
- Auth: SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN
- Body: `{ type?, bankName?, bankAccount?, bankAccountName?, notes? }`
- Response: `{ data: AffiliateView }`

### POST /api/v1/affiliates/:id/deactivate
**Deactivate an affiliate**
- Auth: SUPER_ADMIN, TENANT_ADMIN
- Emits: `affiliate.deactivated`
- Response: `{ data: AffiliateView }`

### POST /api/v1/affiliates/:id/referrals
**Track a new referral for affiliate**
- Auth: SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN
- Body: `{ affiliateId: UUID, referralType: ReferralType, referredId: UUID, commissionRate?, commissionAmount?, notes? }`
- Default rates: OWNER_REGISTRATION=RM200 flat, TENANT_BOOKING=5% monthly rent, AGENT_SIGNUP=RM100 flat
- Emits: `affiliate.referral.created`
- Response: `{ data: ReferralView }`

### GET /api/v1/affiliates/:id/referrals
**List affiliate's referrals**
- Auth: SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, AGENT
- Query: `{ referralType?, status?, page?, limit?, sortBy?, sortDir? }`
- Response: `{ data: { data: ReferralView[], total, page, limit, totalPages } }`

### POST /api/v1/affiliates/:id/referrals/:refId/confirm
**Confirm a pending referral (adds to unpaid earnings)**
- Auth: SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN
- Status: PENDING → CONFIRMED
- Updates affiliate.unpaidEarnings and totalEarnings
- Emits: `affiliate.referral.confirmed`
- Response: `{ data: ReferralView }`

### GET /api/v1/affiliates/:id/earnings
**Get affiliate's earnings summary**
- Auth: SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, AGENT
- Response: `{ data: { totalEarnings, unpaidEarnings, pendingReferrals, confirmedReferrals, paidReferrals, byType[] } }`

### POST /api/v1/affiliates/:id/payout
**Process payout for unpaid affiliate earnings**
- Auth: SUPER_ADMIN, TENANT_ADMIN
- Body: `{ reference?, notes? }`
- Creates payout record (PROCESSING), marks confirmed referrals as PAID, resets unpaidEarnings
- Emits: `affiliate.payout.created`
- Response: `{ data: PayoutView }`

### GET /api/v1/affiliates/:id/payouts
**List affiliate's payout history**
- Auth: SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, AGENT
- Response: `{ data: PayoutView[] }`

### POST /api/v1/affiliates/payouts/:id/complete
**Mark a processing payout as completed**
- Auth: SUPER_ADMIN, TENANT_ADMIN
- Body: `{ reference?, notes? }`
- Status: PROCESSING → COMPLETED
- Emits: `affiliate.payout.completed`
- Response: `{ data: PayoutView }`

### Affiliate Enums
- **AffiliateType**: INDIVIDUAL, COMPANY
- **AffiliateStatus**: ACTIVE, INACTIVE, SUSPENDED
- **ReferralType**: OWNER_REGISTRATION, TENANT_BOOKING, AGENT_SIGNUP
- **ReferralStatus**: PENDING, CONFIRMED, PAID, CANCELLED
- **AffiliatePayoutStatus**: PENDING, PROCESSING, COMPLETED, FAILED

### Event Handlers (Auto-Referral)
- **vendor.approved** → Auto-tracks OWNER_REGISTRATION referral if referralCode present
- **tenancy.activated** → Auto-tracks TENANT_BOOKING referral if referralCode present

### Business Rules
1. **Unique code**: Each affiliate gets a unique REF + 8 char code
2. **Unique per tenant**: One affiliate per user per tenant
3. **Referral flow**: PENDING → CONFIRMED → PAID
4. **Earnings update**: On CONFIRMED, affiliate.unpaidEarnings and totalEarnings increment
5. **Payout flow**: PENDING → PROCESSING → COMPLETED/FAILED
6. **Payout creates batch**: All CONFIRMED referrals marked PAID, unpaidEarnings reset to 0
7. **Default commission**: OWNER_REGISTRATION=RM200, TENANT_BOOKING=5% rent, AGENT_SIGNUP=RM100
8. **Custom override**: commissionRate and commissionAmount can be overridden per referral
9. **Duplicate prevention**: Cannot create duplicate referral for same affiliate + referredId
10. **Active-only tracking**: Only ACTIVE affiliates can have referrals tracked
---

## ⚖️ Legal Module (Session 8.5, 8.6)

### POST /api/v1/legal-cases
**Create a new legal case**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- Body: `{ tenancyId: UUID, reason: LegalCaseReason, description: string, amountOwed: number, notes?: string }`
- Emits: `legal.case.created`
- Response: `{ data: LegalCaseView }`

### GET /api/v1/legal-cases
**List legal cases (paginated, filterable)**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- Query: `status?`, `reason?`, `tenancyId?`, `page=1`, `limit=20`, `sortBy=createdAt`, `sortDir=desc`
- Response: `{ data: { data: LegalCaseView[], total, page, limit, totalPages } }`

### GET /api/v1/legal-cases/:id
**Get legal case details**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- Response: `{ data: LegalCaseView }` (includes lawyer and documents)

### PATCH /api/v1/legal-cases/:id
**Update legal case details**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN)
- Body: `{ description?, amountOwed?, courtDate?, notes? }`
- Response: `{ data: LegalCaseView }`

### POST /api/v1/legal-cases/:id/assign-lawyer
**Assign a panel lawyer to a legal case**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN)
- Body: `{ lawyerId: UUID }`
- Emits: `legal.lawyer.assigned`
- Response: `{ data: LegalCaseView }`

### POST /api/v1/legal-cases/:id/notice
**Generate a notice document for a legal case**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN)
- Body: `{ type: NoticeType, notes?: string }`
- Emits: `legal.notice.generated`
- Response: `{ data: LegalDocumentView }`

### POST /api/v1/legal-cases/:id/status
**Update legal case status (validated state machine)**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN)
- Query: `status=LegalCaseStatus`
- Emits: `legal.case.status.changed`
- Response: `{ data: LegalCaseView }`

### POST /api/v1/legal-cases/:id/resolve
**Resolve and close a legal case**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN)
- Body: `{ resolution?, settlementAmount?, notes? }`
- Emits: `legal.case.resolved`
- Response: `{ data: LegalCaseView }`

### GET /api/v1/legal-cases/:id/documents
**List documents for a legal case**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- Response: `{ data: LegalDocumentView[] }`

### POST /api/v1/legal-cases/:id/documents
**Upload/attach a document to a legal case**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN)
- Body: `{ type: LegalDocumentType, title: string, fileName: string, fileUrl: string, notes?: string }`
- Emits: `legal.document.uploaded`
- Response: `{ data: LegalDocumentView }`
- Validation: Case must exist and not be CLOSED

### POST /api/v1/panel-lawyers
**Create a panel lawyer**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN)
- Body: `{ name: string, firm?: string, email: string, phone: string, specialization?: string[], notes?: string }`
- Response: `{ data: PanelLawyerView }`

### GET /api/v1/panel-lawyers
**List panel lawyers**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- Query: `activeOnly=true|false`
- Response: `{ data: PanelLawyerView[] }`

### GET /api/v1/panel-lawyers/:id
**Get panel lawyer details**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- Response: `{ data: PanelLawyerView }` (includes activeCaseCount)

### PATCH /api/v1/panel-lawyers/:id
**Update panel lawyer details**
- Auth: JWT (SUPER_ADMIN, TENANT_ADMIN)
- Body: `{ name?, firm?, email?, phone?, specialization?, isActive?, notes? }`
- Response: `{ data: PanelLawyerView }`

### Enums
- **LegalCaseStatus**: NOTICE_SENT, RESPONSE_PENDING, MEDIATION, COURT_FILED, HEARING_SCHEDULED, JUDGMENT, ENFORCING, CLOSED
- **LegalCaseReason**: NON_PAYMENT, BREACH, DAMAGE, OTHER
- **NoticeType**: FIRST_REMINDER, SECOND_REMINDER, LEGAL_NOTICE, TERMINATION_NOTICE
- **LegalDocumentType**: NOTICE, RESPONSE, COURT_FILING, JUDGMENT, FIRST_REMINDER, SECOND_REMINDER, LEGAL_NOTICE, TERMINATION_NOTICE, EVIDENCE, CORRESPONDENCE, SETTLEMENT, OTHER

### Status Transitions (State Machine)
- NOTICE_SENT → RESPONSE_PENDING, CLOSED
- RESPONSE_PENDING → MEDIATION, COURT_FILED, CLOSED
- MEDIATION → COURT_FILED, CLOSED
- COURT_FILED → HEARING_SCHEDULED, CLOSED
- HEARING_SCHEDULED → JUDGMENT, CLOSED
- JUDGMENT → ENFORCING, CLOSED
- ENFORCING → CLOSED
- CLOSED → (terminal)

### Event Handlers
- **billing.escalated.legal** → Auto-creates legal case from overdue billing with NON_PAYMENT reason

### Events Emitted
- **legal.case.created** — When a new legal case is created (manual or auto)
- **legal.lawyer.assigned** — When a panel lawyer is assigned to a case
- **legal.notice.generated** — When a notice document is generated
- **legal.case.status.changed** — When case status transitions
- **legal.case.resolved** — When a case is resolved/closed
- **legal.document.uploaded** — When a document is uploaded to a case

### Notice Templates
1. **FIRST_REMINDER**: Payment reminder with 7-day deadline
2. **SECOND_REMINDER**: Urgent final reminder with 3-day deadline, legal proceedings warning
3. **LEGAL_NOTICE**: Formal 14-day legal notice with specific remedies and consequences
4. **TERMINATION_NOTICE**: Tenancy termination with vacate requirements

### Business Rules
1. **Unique case number**: LEG + 8 random alphanumeric characters
2. **One active case per tenancy**: Cannot create duplicate active case for same tenancy
3. **14-day default deadline**: Notice deadline set to 14 days from case creation
4. **Lawyer must be active**: Only active panel lawyers can be assigned to cases
5. **Closed cases immutable**: Cannot update, assign lawyer, or generate notices for closed cases
6. **Template substitution**: Notice content generated from templates with variable replacement
7. **Status validation**: All transitions validated against state machine rules
8. **Resolution tracking**: Closed cases track resolution text, settlement amount, and resolvedAt
9. **Tenant isolation**: All queries filtered by tenant context
10. **Auto-create from billing**: billing.escalated.legal event triggers auto case creation
---