# Zam-Property Web Frontend - API & Hooks Registry

> **This document tracks ALL API hooks and data fetching patterns.**  
> Update this file after implementing any new hook.

---

## 🔗 Backend API Reference

For complete backend API documentation, see: **[backend/docs/API-REGISTRY.md](../../backend/docs/API-REGISTRY.md)**

| Resource | Backend Endpoints |
|----------|------------------|
| Backend Base URL | `http://localhost:3000/api/v1` |
| Swagger Docs | `http://localhost:3000/api/docs` |
| All API Endpoints | [backend/docs/API-REGISTRY.md](../../backend/docs/API-REGISTRY.md) |

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
| Subscriptions | 9 | ✅ Session 4.2 |
| Analytics | 0 | ⏳ Pending |
| Notifications | 5 | ✅ Session 3.2 |
| Search | 5 | ✅ Session 4.1 |
| Media | 8 | ✅ Session 2.9 |
| Account | 0 | ⏳ Pending |
| **Total** | **27** | |

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

**File:** `modules/auth/hooks/use-auth.ts`
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

**File:** `modules/auth/hooks/use-auth-mutations.ts`
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

**File:** `modules/auth/hooks/use-auth-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: register, isPending } = useRegister();

register({ email, password, fullName, phone });
```

---

## 📦 Listings Module

### useListings
Fetch paginated listings.

**File:** `modules/listing/hooks/use-listings.ts`
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

**File:** `modules/listing/hooks/use-listings.ts`
**Status:** ⏳ Pending

```typescript
const { data: listing, isLoading } = useListing(listingId);
```

**Query Key:** `['listings', listingId]`

---

### useListingsInfinite
Infinite scroll listings.

**File:** `modules/listing/hooks/use-listings.ts`
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

**File:** `modules/listing/hooks/use-listing-mutations.ts`
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

**File:** `modules/listing/hooks/use-listing-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: updateListing } = useUpdateListing();

updateListing({ id: listingId, data: { title: 'New Title' } });
```

**Invalidates:** `['listings']`, `['listings', listingId]`

---

### usePublishListing
Publish listing action.

**File:** `modules/listing/hooks/use-listing-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: publishListing } = usePublishListing();

publishListing(listingId);
```

---

### useArchiveListing
Archive listing action.

**File:** `modules/listing/hooks/use-listing-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: archiveListing } = useArchiveListing();

archiveListing(listingId);
```

---

## 🏪 Vendors Module

### useVendors
Fetch paginated vendors.

**File:** `modules/vendor/hooks/use-vendors.ts`
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

**File:** `modules/vendor/hooks/use-vendors.ts`
**Status:** ⏳ Pending

```typescript
const { data: vendor } = useVendor(vendorId);
```

**Query Key:** `['vendors', vendorId]`

---

### useApproveVendor
Approve vendor action.

**File:** `modules/vendor/hooks/use-vendor-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: approveVendor } = useApproveVendor();

approveVendor(vendorId);
```

---

### useRejectVendor
Reject vendor action.

**File:** `modules/vendor/hooks/use-vendor-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: rejectVendor } = useRejectVendor();

rejectVendor({ vendorId, reason: 'Incomplete documents' });
```

---

## 💬 Interactions Module

### useInteractions
Fetch interactions (inbox).

**File:** `modules/interaction/hooks/use-interactions.ts`
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

**File:** `modules/interaction/hooks/use-interactions.ts`
**Status:** ⏳ Pending

```typescript
const { data: interaction } = useInteraction(interactionId);
```

**Query Key:** `['interactions', interactionId]`

---

### useSendMessage
Send message in interaction.

**File:** `modules/interaction/hooks/use-interaction-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: sendMessage } = useSendMessage();

sendMessage({ interactionId, content: 'Hello...' });
```

---

## ⭐ Reviews Module

### useReviews
Fetch reviews.

**File:** `modules/review/hooks/use-reviews.ts`
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

**File:** `modules/review/hooks/use-review-mutations.ts`
**Status:** ⏳ Pending

```typescript
const { mutate: approveReview } = useApproveReview();

approveReview(reviewId);
```

---

## � Subscriptions Module

### useSubscription
Fetch current subscription details.

**File:** `modules/subscription/hooks/use-subscription.ts`
**Status:** ✅ Session 4.2
**API:** `GET /subscriptions/current`

```typescript
const { subscription, isLoading, error, refetch } = useSubscription({
  vendorId: 'optional-vendor-id',
  enabled: true,
});
```

**Query Key:** `['subscriptions', 'current', vendorId]`

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `subscription` | `Subscription` | Current subscription with plan details |
| `isLoading` | `boolean` | Loading state |
| `error` | `Error \| null` | Error if any |
| `refetch` | `() => void` | Refetch subscription |

---

### useSubscriptionSummary
Fetch subscription summary with usage data.

**File:** `modules/subscription/hooks/use-subscription.ts`
**Status:** ✅ Session 4.2
**API:** `GET /subscriptions/summary`

```typescript
const { summary, isLoading, error, refetch } = useSubscriptionSummary({
  tenantId: 'optional-tenant-id',
});
```

**Query Key:** `['subscriptions', 'summary', tenantId]`

---

### usePlans
Fetch all available plans.

**File:** `modules/subscription/hooks/use-plan.ts`
**Status:** ✅ Session 4.2
**API:** `GET /plans`

```typescript
const { plans, isLoading, error, refetch } = usePlans();
```

**Query Key:** `['subscriptions', 'plans']`

---

### usePlan
Fetch a single plan by ID.

**File:** `modules/subscription/hooks/use-plan.ts`
**Status:** ✅ Session 4.2
**API:** `GET /plans/:planId`

```typescript
const { plan, isLoading, error, refetch } = usePlan({ planId: 'plan-123' });
```

**Query Key:** `['subscriptions', 'plan', planId]`

---

### useUpgradeInfo
Fetch upgrade info with recommended plan.

**File:** `modules/subscription/hooks/use-plan.ts`
**Status:** ✅ Session 4.2
**API:** `GET /subscriptions/upgrade-info`

```typescript
const { upgradeInfo, isLoading, error } = useUpgradeInfo();

// Returns current plan, available plans, recommended plan ID, CTA options
```

**Query Key:** `['subscriptions', 'upgrade-info']`

---

### useUsage
Fetch usage data with computed warnings.

**File:** `modules/subscription/hooks/use-usage.ts`
**Status:** ✅ Session 4.2
**API:** `GET /usage`

```typescript
const { 
  usage,
  counters,
  warnings,
  hasExceededLimits,
  hasWarnings,
  isLoading 
} = useUsage({
  context: { tenantId: 'tenant-123' },
});
```

**Query Key:** `['subscriptions', 'usage', context]`

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `usage` | `UsageSnapshot` | Raw usage data |
| `counters` | `UsageCounter[]` | All usage counters |
| `warnings` | `UsageWarning[]` | Counters at warning level or above |
| `hasExceededLimits` | `boolean` | Any limit exceeded |
| `hasWarnings` | `boolean` | Any warnings present |

---

### useEntitlements
Fetch entitlements with feature check helpers.

**File:** `modules/subscription/hooks/use-usage.ts`
**Status:** ✅ Session 4.2
**API:** `GET /entitlements`

```typescript
const { 
  entitlements,
  isFeatureEnabled,
  getEntitlement,
  isLoading 
} = useEntitlements({
  context: { vendorId: 'vendor-123' },
});

// Check if feature is enabled
if (isFeatureEnabled('CUSTOM_DOMAIN')) {
  // Show custom domain settings
}

// Get entitlement details
const apiAccess = getEntitlement('API_ACCESS');
// { enabled: true, limit: 10000, used: 4500 }
```

**Query Key:** `['subscriptions', 'entitlements', context]`

---

### useRequestUpgrade
Request plan upgrade (informational - no billing).

**File:** `modules/subscription/hooks/use-subscription.ts`
**Status:** ✅ Session 4.2
**API:** `POST /subscriptions/request-upgrade`

```typescript
const { mutate: requestUpgrade, isPending } = useRequestUpgrade();

requestUpgrade({
  targetPlanId: 'plan-professional',
  message: 'Need more listings',
});
```

---

### useCancelSubscription
Cancel subscription.

**File:** `modules/subscription/hooks/use-subscription.ts`
**Status:** ✅ Session 4.2
**API:** `POST /subscriptions/cancel`

```typescript
const { mutate: cancelSubscription, isPending } = useCancelSubscription();

cancelSubscription({
  reason: 'No longer needed',
  feedback: 'Great product, just closing business',
  cancelImmediately: false,
});
```

---

## �🔔 Notifications Module

### useNotifications
Fetch paginated list of notifications.

**File:** `modules/notification/hooks/use-notifications.ts`
**Status:** ✅ Implemented

```typescript
const { notifications, pagination, isLoading, refetch } = useNotifications();

// With filters
const { notifications } = useNotifications({ isRead: false, pageSize: 10 });
```

**Query Key:** `['notifications', 'list', filters]`

---

### useUnreadCount
Fetch unread notification count.

**File:** `modules/notification/hooks/use-notifications.ts`
**Status:** ✅ Implemented

```typescript
const { unreadCount, isLoading } = useUnreadCount();
```

**Query Key:** `['notifications', 'unread']`

---

### useNotificationBell
Convenience hook combining recent notifications and unread count.

**File:** `modules/notification/hooks/use-notifications.ts`
**Status:** ✅ Implemented

```typescript
const { notifications, unreadCount, isLoading, refetch } = useNotificationBell(5);
```

---

### useNotificationMutations
Mutation hooks for notification operations.

**File:** `modules/notification/hooks/use-notification-mutations.ts`
**Status:** ✅ Implemented

```typescript
const { 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  clearAllNotifications,
  isMarkingAsRead,
  isMarkingAllAsRead 
} = useNotificationMutations();

// Mark single as read
markAsRead(notificationId);

// Mark all as read
markAllAsRead();
```

---

### useRealtimeNotifications
Subscribe to real-time notification events via WebSocket.

**File:** `modules/notification/hooks/use-realtime-notifications.ts`
**Status:** ✅ Implemented

```typescript
// Auto-toasts and cache invalidation
useRealtimeNotifications();

// With custom options
useRealtimeNotifications({
  showToast: false,
  types: ['INTERACTION_NEW', 'INTERACTION_REPLY'],
  onNotification: (notification) => console.log(notification),
});
```

---

## 🔍 Search Module

### useSearch
Core search hook with URL synchronization and debouncing.

**File:** `modules/search/hooks/use-search.ts`
**Status:** ✅ Session 4.1
**API:** `GET /search/listings`

```typescript
const {
  data,
  results,
  isLoading,
  error,
  params,
  activeFilters,
  setQuery,
  setPage,
  setSort,
  setParams,
  setFilter,
  removeFilter,
  clearFilters,
} = useSearch({
  defaultParams: { verticalType: 'REAL_ESTATE' },
  syncToUrl: true,
  debounceMs: 300,
});
```

**Query Key:** `['search', 'listings', params]`

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultParams` | `Partial<SearchParams>` | `{}` | Default search parameters |
| `syncToUrl` | `boolean` | `true` | Sync params to URL for shareable searches |
| `debounceMs` | `number` | `300` | Debounce delay for search query |

**Returns:**
```typescript
{
  results: {
    hits: SearchHit[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    facets?: SearchFacets;
  };
  params: SearchParams;
  activeFilters: ActiveFilter[];
  setQuery: (q: string) => void;
  setPage: (page: number) => void;
  setSort: (sort: SearchSort) => void;
  setParams: (params: Partial<SearchParams>) => void;
  setFilter: (key: string, value: unknown) => void;
  removeFilter: (key: string, value?: unknown) => void;
  clearFilters: () => void;
}
```

---

### useAutocomplete
Autocomplete suggestions with debouncing and recent searches.

**File:** `modules/search/hooks/use-autocomplete.ts`
**Status:** ✅ Session 4.1
**API:** `GET /search/suggestions`

```typescript
const {
  query,
  setQuery,
  suggestions,
  recentSearches,
  isLoading,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} = useAutocomplete();
```

**Query Key:** `['search', 'suggestions', query]`

**Returns:**
```typescript
{
  query: string;
  setQuery: (q: string) => void;
  suggestions: Suggestion[];
  recentSearches: RecentSearch[];
  isLoading: boolean;
  addRecentSearch: (search: RecentSearch) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}
```

---

### usePopularSearches
Get popular search terms.

**File:** `modules/search/hooks/use-autocomplete.ts`
**Status:** ✅ Session 4.1
**API:** `GET /search/popular`

```typescript
const { data: popularSearches, isLoading } = usePopularSearches();
```

**Query Key:** `['search', 'popular']`

---

### useSearchFacets
Format facets from search response into display options.

**File:** `modules/search/hooks/use-search-facets.ts`
**Status:** ✅ Session 4.1

```typescript
const formattedFacets = useSearchFacets(results?.facets);
// Returns formatted options with labels and icons for each facet type
```

---

### useSavedSearches
Manage saved searches with backend sync.

**File:** `modules/search/hooks/use-saved-searches.ts`
**Status:** ✅ Session 4.1
**API:** `GET/POST/PUT/DELETE /search/saved`

```typescript
const { data: savedSearches, isLoading } = useSavedSearches();

const { createMutation, updateMutation, deleteMutation } = useSavedSearchMutations();

// Create saved search
createMutation.mutate({ name: 'My Search', params: currentParams });

// Update saved search
updateMutation.mutate({ id: 'search-1', data: { name: 'Updated Name' } });

// Delete saved search
deleteMutation.mutate('search-1');
```

**Query Keys:**
- `['search', 'saved', 'list']` - List of saved searches
- `['search', 'saved', 'detail', id]` - Single saved search

---

## 📊 Analytics Module

### useVendorAnalytics
Vendor analytics data.

**File:** `modules/analytics/hooks/use-analytics.ts`
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

**File:** `modules/analytics/hooks/use-analytics.ts`
**Status:** ⏳ Pending

```typescript
const { data } = useTenantAnalytics(dateRange);
```

**Query Key:** `['analytics', 'tenant', dateRange]`

---

## 🖼️ Media Module

### usePresignedUrl
Request presigned URL for upload.

**File:** `modules/media/hooks/use-media.ts`
**Status:** ✅ Implemented (Session 2.9)

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

**File:** `modules/media/hooks/use-media.ts`
**Status:** ✅ Implemented (Session 2.9)

```typescript
const { mutate: confirmUpload } = useConfirmUpload();

confirmUpload(uploadId);
```

---

### useMediaList
List media with filtering.

**File:** `modules/media/hooks/use-media.ts`
**Status:** ✅ Implemented (Session 2.9)

```typescript
const { data, isLoading } = useMediaList({
  page: 1,
  limit: 20,
  type: 'IMAGE',
  visibility: 'PUBLIC'
});
```

---

### useOwnerMedia
Get media for a specific owner.

**File:** `modules/media/hooks/use-media.ts`
**Status:** ✅ Implemented (Session 2.9)

```typescript
const { data } = useOwnerMedia('listing', listingId);
```

---

### useMedia
Get single media by ID.

**File:** `modules/media/hooks/use-media.ts`
**Status:** ✅ Implemented (Session 2.9)

```typescript
const { data: media } = useMedia(mediaId);
```

---

### useUpdateMedia
Update media metadata.

**File:** `modules/media/hooks/use-media.ts`
**Status:** ✅ Implemented (Session 2.9)

```typescript
const { mutate: updateMedia } = useUpdateMedia();

updateMedia({
  id: mediaId,
  altText: 'New alt text',
  metadata: { caption: 'Photo caption' }
});
```

---

### useDeleteMedia
Delete media.

**File:** `modules/media/hooks/use-media.ts`
**Status:** ✅ Implemented (Session 2.9)

```typescript
const { mutate: deleteMedia } = useDeleteMedia();

deleteMedia(mediaId);
```

---

### useMediaMutations
Combined media mutations hook.

**File:** `modules/media/hooks/use-media.ts`
**Status:** ✅ Implemented (Session 2.9)

```typescript
const { presignedUrl, confirmUpload, updateMedia, deleteMedia } = useMediaMutations();

// Request presigned URL
const { uploadUrl, uploadId } = await presignedUrl.mutateAsync({
  filename: 'photo.jpg',
  contentType: 'image/jpeg',
  size: 1048576
});

// Upload to S3 via XMLHttpRequest with progress...

// Confirm upload
await confirmUpload.mutateAsync({ uploadId, ownerId, ownerType: 'listing' });
```

---

## ⚡ WebSocket Hooks

### useWebSocket
WebSocket connection management.

**File:** `lib/websocket/use-websocket.ts`
**Status:** ⏳ Pending

```typescript
const { isConnected, socket } = useWebSocket();
```

---

### useRealtimeNotifications
Listen for real-time notifications.

**File:** `lib/websocket/use-realtime.ts`
**Status:** ⏳ Pending

```typescript
useRealtimeNotifications((notification) => {
  // Handle new notification
});
```

---

### useRealtimeListingUpdates
Listen for listing updates.

**File:** `lib/websocket/use-realtime.ts`
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
| 2026-01-30 | 2.9 | Added 8 media hooks: useMediaList, useOwnerMedia, useMedia, usePresignedUrl, useConfirmUpload, useUpdateMedia, useDeleteMedia, useMediaMutations |
| - | - | Initial template created |


