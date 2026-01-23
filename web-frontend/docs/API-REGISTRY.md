# Zam-Property Web Frontend - API & Hooks Registry

> **This document tracks ALL API hooks and data fetching patterns.**  
> Update this file after implementing any new hook.

---

## 📋 Summary

| Module | Hooks | Status |
|--------|-------|--------|
| Auth | 0 | ⏳ Pending |
| Listings | 0 | ⏳ Pending |
| Vendors | 0 | ⏳ Pending |
| Tenants | 0 | ⏳ Pending |
| Interactions | 0 | ⏳ Pending |
| Reviews | 0 | ⏳ Pending |
| Subscriptions | 0 | ⏳ Pending |
| Analytics | 0 | ⏳ Pending |
| Notifications | 0 | ⏳ Pending |
| Search | 0 | ⏳ Pending |
| Media | 0 | ⏳ Pending |
| **Total** | **0** | |

---

## 📐 Conventions

### Query Key Structure
```typescript
// Pattern: [resource, ...identifiers, ...filters]
['listings']                           // All listings
['listings', listingId]                // Single listing
['listings', { status: 'PUBLISHED' }]  // Filtered listings
['listings', 'infinite', filters]      // Infinite query
['vendors', vendorId, 'listings']      // Vendor's listings
```

### Hook Naming
```typescript
// Queries
useListings()           // List with filters
useListing(id)          // Single by ID
useListingStats(id)     // Related data

// Mutations
useCreateListing()      // Create
useUpdateListing()      // Update
useDeleteListing()      // Delete
usePublishListing()     // Action

// Infinite
useListingsInfinite()   // Infinite scroll
```

### File Structure
```
modules/<domain>/
├── hooks/
│   ├── use-<domain>.ts           # Main query
│   ├── use-<domain>-mutations.ts # All mutations
│   └── queries.ts                # Query key factory
```

---

## 🔐 Auth Module

### useAuth
Get current auth state and actions.

**File:** `src/modules/auth/hooks/use-auth.ts`
**Status:** ⏳ Pending

```typescript
const { user, isAuthenticated, isLoading, login, logout, refresh } = useAuth();
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Current user |
| `isAuthenticated` | `boolean` | Auth status |
| `isLoading` | `boolean` | Loading state |
| `login` | `(credentials) => Promise` | Login function |
| `logout` | `() => Promise` | Logout function |
| `refresh` | `() => Promise` | Refresh token |

---

### useLogin
Login mutation.

**File:** `src/modules/auth/hooks/use-auth-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: login, isPending } = useLogin();

login({ email, password }, {
  onSuccess: (data) => { /* redirect */ },
  onError: (error) => { /* show error */ }
});
```

**Request:**
```typescript
{ email: string; password: string; }
```

**Response:**
```typescript
{ accessToken: string; refreshToken: string; user: User; }
```

---

### useRegister
Register mutation.

**File:** `src/modules/auth/hooks/use-auth-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: register, isPending } = useRegister();

register({ email, password, fullName, phone });
```

---

## 📦 Listings Module

### useListings
Fetch paginated listings.

**File:** `src/modules/listing/hooks/use-listings.ts`
**Status:** ⏳ Pending

```typescript
const { data, isLoading, error } = useListings({
  page: 1,
  pageSize: 20,
  status: 'PUBLISHED',
  verticalType: 'real_estate',
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
```

**Query Key:** `['listings', filters]`

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `pageSize` | number | 20 | Items per page |
| `status` | ListingStatus | - | Filter by status |
| `verticalType` | string | - | Filter by vertical |
| `vendorId` | string | - | Filter by vendor |
| `sortBy` | string | `createdAt` | Sort field |
| `sortOrder` | `asc \| desc` | `desc` | Sort direction |

**Returns:**
```typescript
{
  data: Listing[];
  meta: {
    pagination: { page, pageSize, totalItems, totalPages }
  }
}
```

---

### useListing
Fetch single listing by ID.

**File:** `src/modules/listing/hooks/use-listings.ts`
**Status:** ⏳ Pending

```typescript
const { data: listing, isLoading } = useListing(listingId);
```

**Query Key:** `['listings', listingId]`

---

### useListingsInfinite
Infinite scroll listings.

**File:** `src/modules/listing/hooks/use-listings.ts`
**Status:** ⏳ Pending

```typescript
const { 
  data, 
  fetchNextPage, 
  hasNextPage, 
  isFetchingNextPage 
} = useListingsInfinite(filters);
```

**Query Key:** `['listings', 'infinite', filters]`

---

### useCreateListing
Create listing mutation.

**File:** `src/modules/listing/hooks/use-listing-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: createListing, isPending } = useCreateListing();

createListing({
  title: 'Beautiful Condo',
  verticalType: 'real_estate',
  price: 500000,
  currency: 'MYR',
  location: { ... },
  attributes: { ... }
});
```

**Invalidates:** `['listings']`

---

### useUpdateListing
Update listing mutation.

**File:** `src/modules/listing/hooks/use-listing-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: updateListing } = useUpdateListing();

updateListing({ id: listingId, data: { title: 'New Title' } });
```

**Invalidates:** `['listings']`, `['listings', listingId]`

---

### usePublishListing
Publish listing action.

**File:** `src/modules/listing/hooks/use-listing-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: publishListing } = usePublishListing();

publishListing(listingId);
```

---

### useArchiveListing
Archive listing action.

**File:** `src/modules/listing/hooks/use-listing-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: archiveListing } = useArchiveListing();

archiveListing(listingId);
```

---

## 🏪 Vendors Module

### useVendors
Fetch paginated vendors.

**File:** `src/modules/vendor/hooks/use-vendors.ts`
**Status:** ⏳ Pending

```typescript
const { data, isLoading } = useVendors({
  status: 'APPROVED',
  page: 1,
  pageSize: 20
});
```

**Query Key:** `['vendors', filters]`

---

### useVendor
Fetch single vendor.

**File:** `src/modules/vendor/hooks/use-vendors.ts`
**Status:** ⏳ Pending

```typescript
const { data: vendor } = useVendor(vendorId);
```

**Query Key:** `['vendors', vendorId]`

---

### useApproveVendor
Approve vendor action.

**File:** `src/modules/vendor/hooks/use-vendor-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: approveVendor } = useApproveVendor();

approveVendor(vendorId);
```

---

### useRejectVendor
Reject vendor action.

**File:** `src/modules/vendor/hooks/use-vendor-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: rejectVendor } = useRejectVendor();

rejectVendor({ vendorId, reason: 'Incomplete documents' });
```

---

## 💬 Interactions Module

### useInteractions
Fetch interactions (inbox).

**File:** `src/modules/interaction/hooks/use-interactions.ts`
**Status:** ⏳ Pending

```typescript
const { data } = useInteractions({
  status: 'NEW',
  type: 'ENQUIRY'
});
```

**Query Key:** `['interactions', filters]`

---

### useInteraction
Fetch single interaction with messages.

**File:** `src/modules/interaction/hooks/use-interactions.ts`
**Status:** ⏳ Pending

```typescript
const { data: interaction } = useInteraction(interactionId);
```

**Query Key:** `['interactions', interactionId]`

---

### useSendMessage
Send message in interaction.

**File:** `src/modules/interaction/hooks/use-interaction-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: sendMessage } = useSendMessage();

sendMessage({ interactionId, content: 'Hello...' });
```

---

## ⭐ Reviews Module

### useReviews
Fetch reviews.

**File:** `src/modules/review/hooks/use-reviews.ts`
**Status:** ⏳ Pending

```typescript
const { data } = useReviews({
  vendorId,
  status: 'APPROVED'
});
```

**Query Key:** `['reviews', filters]`

---

### useApproveReview
Approve review (moderation).

**File:** `src/modules/review/hooks/use-review-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: approveReview } = useApproveReview();

approveReview(reviewId);
```

---

## 🔔 Notifications Module

### useNotifications
Fetch user notifications.

**File:** `src/modules/notification/hooks/use-notifications.ts`
**Status:** ⏳ Pending

```typescript
const { data, unreadCount } = useNotifications();
```

**Query Key:** `['notifications']`

---

### useMarkAsRead
Mark notification as read.

**File:** `src/modules/notification/hooks/use-notification-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: markAsRead } = useMarkAsRead();

markAsRead(notificationId);
```

---

## 🔍 Search Module

### useSearch
Search with OpenSearch.

**File:** `src/modules/search/hooks/use-search.ts`
**Status:** ⏳ Pending

```typescript
const { data, isLoading } = useSearch({
  q: 'condo',
  verticalType: 'real_estate',
  priceMin: 100000,
  priceMax: 500000,
  location: { lat: 3.1390, lng: 101.6869, radius: 10 }
});
```

**Query Key:** `['search', query, filters]`

**Returns:**
```typescript
{
  data: SearchResult[];
  facets: {
    propertyTypes: FacetItem[];
    cities: FacetItem[];
    priceRanges: FacetItem[];
  };
  meta: { pagination }
}
```

---

### useSearchSuggestions
Autocomplete suggestions.

**File:** `src/modules/search/hooks/use-search.ts`
**Status:** ⏳ Pending

```typescript
const { data: suggestions } = useSearchSuggestions(query);
```

**Query Key:** `['search', 'suggestions', query]`

---

## 📊 Analytics Module

### useVendorAnalytics
Vendor analytics data.

**File:** `src/modules/analytics/hooks/use-analytics.ts`
**Status:** ⏳ Pending

```typescript
const { data } = useVendorAnalytics({
  dateFrom: '2025-01-01',
  dateTo: '2025-01-31'
});
```

**Query Key:** `['analytics', 'vendor', dateRange]`

---

### useTenantAnalytics
Tenant-wide analytics.

**File:** `src/modules/analytics/hooks/use-analytics.ts`
**Status:** ⏳ Pending

```typescript
const { data } = useTenantAnalytics(dateRange);
```

**Query Key:** `['analytics', 'tenant', dateRange]`

---

## 🖼️ Media Module

### usePresignedUrl
Request presigned URL for upload.

**File:** `src/modules/media/hooks/use-media.ts`
**Status:** ⏳ Pending

```typescript
const { mutateAsync: getPresignedUrl } = usePresignedUrl();

const { uploadUrl, uploadId } = await getPresignedUrl({
  filename: 'photo.jpg',
  contentType: 'image/jpeg',
  size: 1048576
});
```

---

### useConfirmUpload
Confirm upload completion.

**File:** `src/modules/media/hooks/use-media.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: confirmUpload } = useConfirmUpload();

confirmUpload(uploadId);
```

---

## ⚡ WebSocket Hooks

### useWebSocket
WebSocket connection management.

**File:** `src/lib/websocket/use-websocket.ts`
**Status:** ⏳ Pending

```typescript
const { isConnected, socket } = useWebSocket();
```

---

### useRealtimeNotifications
Listen for real-time notifications.

**File:** `src/lib/websocket/use-realtime.ts`
**Status:** ⏳ Pending

```typescript
useRealtimeNotifications((notification) => {
  // Handle new notification
});
```

---

### useRealtimeListingUpdates
Listen for listing updates.

**File:** `src/lib/websocket/use-realtime.ts`
**Status:** ⏳ Pending

```typescript
useRealtimeListingUpdates(listingId, (update) => {
  // Handle listing update
  queryClient.invalidateQueries(['listings', listingId]);
});
```

---

## 📝 Changelog

| Date | Session | Changes |
|------|---------|---------|
| - | - | Initial template created |

