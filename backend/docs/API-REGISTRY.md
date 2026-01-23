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
| **Total** | **160** | |

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
- `BillingNotificationHandler`: billing.payment.succeeded, billing.payment.failed
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
