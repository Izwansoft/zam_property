# FRONTEND (WEB) — PART 26 — UNCOVERED BACKEND MODULES SUPPLEMENT (LOCKED)

This part covers backend modules that have full API implementations but lack detailed frontend prompt coverage.
It provides the API contracts, UI specifications, and hook definitions needed to build complete admin and public UIs.

All rules from WEB PART 0–25 apply fully.

---

## 26.1 PRICING CONFIG MANAGEMENT (PLATFORM ADMIN)

### Overview
The backend Pricing module manages configurable pricing rules, charge calculations, and charge event tracking.
This is a **Platform Admin-only** feature for managing how vendors are charged.

### Route
`app/dashboard/(auth)/platform/pricing/` — pricing configs, rules, and charge events

### Backend Endpoints (11)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/pricing/configs` | List pricing configs (paginated) |
| GET | `/api/v1/pricing/configs/:id` | Get pricing config detail |
| POST | `/api/v1/pricing/configs` | Create pricing config |
| PATCH | `/api/v1/pricing/configs/:id` | Update pricing config |
| DELETE | `/api/v1/pricing/configs/:id` | Delete pricing config |
| GET | `/api/v1/pricing/rules` | List pricing rules |
| POST | `/api/v1/pricing/rules` | Create pricing rule |
| DELETE | `/api/v1/pricing/rules/:id` | Delete pricing rule |
| POST | `/api/v1/pricing/calculate` | Calculate charges (preview) |
| GET | `/api/v1/pricing/charge-events` | List charge events (paginated) |
| GET | `/api/v1/pricing/charge-events/:id` | Get charge event detail |

### Prisma Enums

```typescript
export enum ChargeType {
  LISTING_PUBLISH = 'LISTING_PUBLISH',
  LISTING_FEATURE = 'LISTING_FEATURE',
  LISTING_REFRESH = 'LISTING_REFRESH',
  LEAD_GENERATION = 'LEAD_GENERATION',
  SUBSCRIPTION_BASE = 'SUBSCRIPTION_BASE',
  OVERAGE = 'OVERAGE',
  CUSTOM = 'CUSTOM',
}

export enum PricingModel {
  FLAT = 'FLAT',
  TIERED = 'TIERED',
  PER_UNIT = 'PER_UNIT',
  PERCENTAGE = 'PERCENTAGE',
  CUSTOM = 'CUSTOM',
}
```

### UI Pages

**Pricing Configs List** (`/platform/pricing/configs`)
- Filterable data table with columns: Name, Charge Type, Pricing Model, Currency, Status, Created
- Actions: Create, Edit, Delete (with confirmation)
- Search by name

**Pricing Config Detail/Edit** (`/platform/pricing/configs/:id`)
- Form with fields: name, description, chargeType (select), pricingModel (select), currency, baseAmount, metadata (JSON editor)
- Show associated pricing rules
- Validation via Zod schema

**Pricing Rules List** (`/platform/pricing/rules`)
- Table with: Config Name, Rule Name, Condition, Multiplier, Priority
- Create/Delete actions
- Rules are associated with a pricing config

**Charge Events List** (`/platform/pricing/charge-events`)
- Read-only paginated table: Tenant, Vendor, Charge Type, Amount, Status, Timestamp
- Filter by: tenant, vendor, chargeType, date range, status
- Detail view showing full calculation breakdown

**Charge Calculator** (`/platform/pricing/calculator`)
- Preview tool: select chargeType, tenant, vendor → shows calculated amount
- Uses `POST /pricing/calculate` endpoint
- Read-only output, no mutation

### Module API Surface

```typescript
// modules/pricing/hooks/

// Queries
usePricingConfigs(params)         // GET /pricing/configs
usePricingConfig(id)              // GET /pricing/configs/:id
usePricingRules(params)           // GET /pricing/rules
useChargeEvents(params)           // GET /pricing/charge-events
useChargeEvent(id)                // GET /pricing/charge-events/:id

// Mutations
useCreatePricingConfig()          // POST /pricing/configs
useUpdatePricingConfig()          // PATCH /pricing/configs/:id
useDeletePricingConfig()          // DELETE /pricing/configs/:id
useCreatePricingRule()            // POST /pricing/rules
useDeletePricingRule()            // DELETE /pricing/rules/:id
useCalculateCharge()              // POST /pricing/calculate
```

---

## 26.2 FEATURE FLAGS & EXPERIMENTS CRUD (PLATFORM ADMIN)

### Overview
Extends Part-14 §14.5-14.6 with full CRUD details. Backend has comprehensive feature flag and experiment management.

### Route
`app/dashboard/(auth)/platform/feature-flags/` — flags and experiments management

### Backend Endpoints (10+)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/feature-flags` | List all feature flags |
| GET | `/api/v1/admin/feature-flags/:key` | Get flag by key |
| POST | `/api/v1/admin/feature-flags` | Create feature flag |
| PATCH | `/api/v1/admin/feature-flags/:key` | Update feature flag |
| POST | `/api/v1/admin/feature-flags/:key/overrides` | Add tenant/vertical override |
| POST | `/api/v1/admin/feature-flags/:key/user-targets` | Add user-level targeting |
| GET | `/api/v1/admin/experiments` | List experiments |
| GET | `/api/v1/admin/experiments/:key` | Get experiment detail |
| POST | `/api/v1/admin/experiments` | Create experiment |
| POST | `/api/v1/admin/experiments/:key/tenant-opt-in` | Opt tenant into experiment |
| GET | `/api/v1/feature-flags/check` | Runtime flag evaluation (any role) |

### Prisma Enums

```typescript
export enum FeatureFlagType {
  BOOLEAN = 'BOOLEAN',
  PERCENTAGE = 'PERCENTAGE',
}
```

### UI Pages

**Feature Flags List** (`/platform/feature-flags`)
- Data table: Key, Description, Type (BOOLEAN/PERCENTAGE), Enabled, Scope (Global/Tenant/Vertical), Last Modified
- Toggle switch for quick enable/disable (with confirmation)
- Actions: Create, Edit, View Overrides
- Filter by: type, enabled status, scope

**Feature Flag Detail** (`/platform/feature-flags/:key`)
- Overview: key, description, type, enabled, percentage (if PERCENTAGE type)
- Overrides table: tenant/vertical-specific overrides with add/remove
- User targets table: specific user targeting with add/remove
- Audit history of changes

**Experiments List** (`/platform/experiments`)
- Data table: Key, Description, Status, Variants, Opted-in Tenants
- Actions: Create, View, Opt-in Tenant

**Experiment Detail** (`/platform/experiments/:key`)
- Variants configuration
- Tenant opt-in management table
- Results/metrics (read-only if available)

### Module API Surface

```typescript
// modules/feature-flags/hooks/

// Queries
useFeatureFlags()                          // GET /admin/feature-flags
useFeatureFlag(key)                        // GET /admin/feature-flags/:key
useExperiments()                           // GET /admin/experiments
useExperiment(key)                         // GET /admin/experiments/:key
useCheckFeatureFlag(key)                   // GET /feature-flags/check?key=...

// Mutations
useCreateFeatureFlag()                     // POST /admin/feature-flags
useUpdateFeatureFlag()                     // PATCH /admin/feature-flags/:key
useAddFlagOverride()                       // POST /admin/feature-flags/:key/overrides
useAddFlagUserTarget()                     // POST /admin/feature-flags/:key/user-targets
useCreateExperiment()                      // POST /admin/experiments
useOptInTenantExperiment()                 // POST /admin/experiments/:key/tenant-opt-in
```

### useFeatureFlag Client Hook (for all portals)

```typescript
// lib/hooks/use-feature-flag.ts
// Lightweight hook for runtime feature flag checking in any portal

export function useFeatureFlag(key: string): {
  enabled: boolean;
  loading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flags', 'check', key],
    queryFn: () => api.get(`/feature-flags/check`, { params: { key } }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return { enabled: data?.enabled ?? false, loading: isLoading };
}
```

---

## 26.3 JOB QUEUE DASHBOARD (PLATFORM ADMIN)

### Overview
Backend has BullMQ-based job queue management with health monitoring, job inspection, retry, pause/resume, and bulk operations.

### Route
`app/dashboard/(auth)/platform/jobs/` — queue monitoring and management

### Backend Endpoints (12)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/jobs/health` | Queue health summary |
| GET | `/api/v1/admin/jobs/queues/:queueName` | Queue-specific stats |
| GET | `/api/v1/admin/jobs/list` | List jobs with filters |
| GET | `/api/v1/admin/jobs/:queueName/:jobId` | Job detail |
| POST | `/api/v1/admin/jobs/retry` | Retry specific job |
| POST | `/api/v1/admin/jobs/retry-all/:queueName` | Retry all failed in queue |
| POST | `/api/v1/admin/jobs/add` | Manually add job |
| POST | `/api/v1/admin/jobs/queues/:queueName/pause` | Pause queue |
| POST | `/api/v1/admin/jobs/queues/:queueName/resume` | Resume queue |
| POST | `/api/v1/admin/jobs/queues/:queueName/clean` | Clean completed/failed jobs |
| POST | `/api/v1/admin/bulk/search/reindex` | Trigger full search reindex |
| POST | `/api/v1/admin/bulk/listings/expire` | Expire stale listings |

### UI Pages

**Queue Health Dashboard** (`/platform/jobs`)
- Overview cards: Total Queues, Active Jobs, Failed Jobs, Waiting Jobs
- Per-queue status table: Queue Name, Active, Waiting, Completed, Failed, Paused (boolean)
- Auto-refresh toggle (poll every 10s)
- Quick actions per queue: Pause/Resume, Retry All Failed, Clean

**Job List** (`/platform/jobs/list`)
- Filterable table: Job ID, Queue, Status (active/waiting/completed/failed/delayed), Data preview, Created, Processed
- Filter by: queue, status, date range
- Actions: View Detail, Retry (failed only)
- **NOTE**: Response format is non-standard: `{ jobs: [...], total: N }` — handle in API client

**Job Detail** (`/platform/jobs/:queueName/:jobId`)
- Full job data (JSON viewer)
- Stack trace / error info (for failed jobs)
- Attempt history
- Retry button (for failed)

**Bulk Operations** (`/platform/jobs/bulk`)
- Search Reindex trigger: confirmation dialog, shows progress
- Expire Listings trigger: confirmation dialog with optional filters
- Each bulk action shows outcome summary

### Module API Surface

```typescript
// modules/jobs/hooks/

// Queries
useJobsHealth()                            // GET /admin/jobs/health
useQueueStats(queueName)                   // GET /admin/jobs/queues/:queueName
useJobsList(params)                        // GET /admin/jobs/list
useJobDetail(queueName, jobId)             // GET /admin/jobs/:queueName/:jobId

// Mutations
useRetryJob()                              // POST /admin/jobs/retry
useRetryAllFailed(queueName)               // POST /admin/jobs/retry-all/:queueName
useAddJob()                                // POST /admin/jobs/add
usePauseQueue()                            // POST /admin/jobs/queues/:queueName/pause
useResumeQueue()                           // POST /admin/jobs/queues/:queueName/resume
useCleanQueue()                            // POST /admin/jobs/queues/:queueName/clean
useTriggerSearchReindex()                  // POST /admin/bulk/search/reindex
useTriggerExpireListings()                 // POST /admin/bulk/listings/expire
```

---

## 26.4 ADMIN LISTING MODERATION (PLATFORM & TENANT ADMIN)

### Overview
Admins need additional listing management actions beyond what vendors can do. Backend provides specific admin endpoints for publishing, unpublishing, expiring, archiving, and featuring listings.

### Route
Platform: `app/dashboard/(auth)/platform/listings/` — admin listing management
Tenant: `app/dashboard/(auth)/tenant/listings/` — tenant listing oversight

### Backend Admin Endpoints (8 action endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/listings/:id/publish` | Admin publish (bypass vendor) |
| POST | `/api/v1/admin/listings/:id/unpublish` | Admin unpublish |
| POST | `/api/v1/admin/listings/:id/expire` | Admin force expire |
| POST | `/api/v1/admin/listings/:id/archive` | Admin archive |
| POST | `/api/v1/admin/listings/:id/feature` | Feature a listing (promoted) |
| POST | `/api/v1/admin/listings/:id/unfeature` | Remove featured status |
| GET | `/api/v1/admin/listings` | List all listings (cross-tenant) |
| GET | `/api/v1/admin/listings/:id` | Get listing detail (admin view) |

### UI Enhancements

**Admin Listings List** extends the vendor listing table with:
- Additional columns: Tenant Name, Vendor Name, Featured badge
- Bulk action toolbar: Publish Selected, Unpublish Selected, Feature Selected
- Admin-specific filters: tenant, featured status, moderation status
- Row actions dropdown with all admin actions

**Admin Listing Actions**
Each action must:
- Show confirmation dialog with listing title
- Optional reason field (for unpublish/expire/archive)
- Show success/error toast
- Invalidate listing queries on success

**Featured Listing Management**
- Toggle featured status with `feature` / `unfeature` endpoints
- Show current featured count for tenant (entitlement-aware)
- Highlight featured listings visually in the table

### Module API Surface

```typescript
// modules/admin/hooks/admin-listings.ts

// Queries
useAdminListings(params)                   // GET /admin/listings
useAdminListingDetail(id)                  // GET /admin/listings/:id

// Mutations
useAdminPublishListing()                   // POST /admin/listings/:id/publish
useAdminUnpublishListing()                 // POST /admin/listings/:id/unpublish
useAdminExpireListing()                    // POST /admin/listings/:id/expire
useAdminArchiveListing()                   // POST /admin/listings/:id/archive
useAdminFeatureListing()                   // POST /admin/listings/:id/feature
useAdminUnfeatureListing()                 // POST /admin/listings/:id/unfeature
```

---

## 26.5 AUDIT LOG VIEWER DETAIL (ALL ADMIN PORTALS)

### Overview
Extends Part-14 §14.3-14.4 with full endpoint mapping and filter/detail UI specifications.

### Backend Endpoints (6)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/audit/logs` | Query logs (paginated, filtered) |
| GET | `/api/v1/audit/logs/:id` | Get log entry by ID |
| GET | `/api/v1/audit/target/:targetType/:targetId` | Logs for a specific entity |
| GET | `/api/v1/audit/actor/:actorId` | Logs by actor |
| GET | `/api/v1/audit/action-types` | Distinct action types (for filter dropdowns) |
| GET | `/api/v1/audit/target-types` | Distinct target types (for filter dropdowns) |

### Filter Dropdowns

The `action-types` and `target-types` endpoints return string arrays for populating filter select dropdowns dynamically. Do NOT hardcode these values — fetch from the backend.

### Contextual Audit Links

When viewing entity detail pages (listing, vendor, tenant, user), provide a "View Audit History" link that navigates to:
`/platform/audit?targetType={type}&targetId={id}`

This uses the `GET /audit/target/:targetType/:targetId` endpoint.

### Module API Surface

```typescript
// modules/audit/hooks/

// Queries
useAuditLogs(params)                       // GET /audit/logs
useAuditLogDetail(id)                      // GET /audit/logs/:id
useAuditLogsByTarget(targetType, targetId) // GET /audit/target/:targetType/:targetId
useAuditLogsByActor(actorId)               // GET /audit/actor/:actorId
useAuditActionTypes()                      // GET /audit/action-types
useAuditTargetTypes()                      // GET /audit/target-types
```

---

## 26.6 PUBLIC LISTING & VENDOR PAGES

### Overview
Backend has a Public module serving unauthenticated endpoints with rate limiting and caching.
These pages are SEO-critical and must use Next.js Server Components with proper metadata.

### Route
`app/(public)/listings/[idOrSlug]/` — public listing detail
`app/(public)/vendors/[idOrSlug]/` — public vendor profile

### Backend Public Endpoints (3)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/public/search/listings` | Public search (rate-limited) |
| GET | `/api/v1/public/listings/:idOrSlug` | Public listing detail |
| GET | `/api/v1/public/vendors/:idOrSlug` | Public vendor profile |

### Public Listing Detail Page

Must include:
- Listing title, description, images gallery
- Price display (formatted per currency)
- Vertical-specific attributes rendered via schema
- Vendor info card (name, logo, rating)
- Contact/inquiry CTA (redirects to login if not authenticated)
- SEO metadata (title, description, OG tags)
- Breadcrumbs (Home > Search > Listing)
- Schema.org structured data (Product/Service)

### Public Vendor Profile Page

Must include:
- Vendor name, logo, description
- Active listings grid (from public search with vendorId filter)
- Rating/review summary (if public)
- Contact info (as allowed by vendor settings)
- SEO metadata

### Rate Limit Handling

Public endpoints are rate-limited. The frontend must:
- Handle 429 responses gracefully with retry-after display
- Cache aggressively (ISR with appropriate revalidation)
- Show fallback content during rate limit windows

### Module Structure

```typescript
// No module needed — these are Server Components that fetch directly
// app/(public)/listings/[idOrSlug]/page.tsx
// app/(public)/vendors/[idOrSlug]/page.tsx

// If client-side data is needed:
usePublicListing(idOrSlug)     // GET /public/listings/:idOrSlug
usePublicVendor(idOrSlug)      // GET /public/vendors/:idOrSlug
usePublicSearch(params)        // GET /public/search/listings
```

---

## 26.7 NOTIFICATION PREFERENCES UI

### Overview
Extends Part-15 §15.12. Backend supports per-type per-channel notification preference management.

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications/preferences` | Get user preferences |
| PATCH | `/api/v1/notifications/preferences` | Update user preferences |

### Prisma Enums

```typescript
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WEBHOOK = 'WEBHOOK',
}
```

### UI: Notification Preferences Page

Route: `app/dashboard/(auth)/*/settings/notifications/` (available in all portals)

Layout: Grid/table with:
- Rows: Each NotificationType (13 types from Part-23 §23.5)
- Columns: Each NotificationChannel (IN_APP, EMAIL, SMS, PUSH, WEBHOOK)
- Cells: Toggle switch (enabled/disabled)
- Group headers: Listings, Interactions, Reviews, Subscriptions, Payments, Vendors, System

Rules:
- IN_APP channel may be non-toggleable (always on for critical types)
- WEBHOOK channel only visible to users with webhook integration
- Changes auto-save on toggle (debounced PATCH)
- Show success toast on save

### Module API Surface

```typescript
// modules/notifications/hooks/

// (extends Part-15 hooks)
useNotificationPreferences()               // GET /notifications/preferences
useUpdateNotificationPreferences()         // PATCH /notifications/preferences
```

---

## 26.8 VENDOR SELF-SERVICE SETTINGS

### Overview
Backend has dedicated vendor settings endpoints beyond basic CRUD.

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vendors/:id/settings` | Get vendor settings |
| PATCH | `/api/v1/vendors/:id/settings` | Update vendor settings |
| POST | `/api/v1/vendors/:id/logo` | Upload vendor logo |

### UI: Vendor Settings Page

Route: `app/dashboard/(auth)/vendor/settings/`

Sections:
- Business Info: name, description, contact details
- Logo upload (uses media upload flow from Part-23)
- Notification preferences (link to §26.7)
- Visibility settings: public profile, contact visibility

### Module API Surface

```typescript
// modules/vendors/hooks/

// (extends existing vendor hooks)
useVendorSettings(vendorId)                // GET /vendors/:id/settings
useUpdateVendorSettings()                  // PATCH /vendors/:id/settings
useUploadVendorLogo()                      // POST /vendors/:id/logo
```

---

## 26.9 EXECUTION DIRECTIVE

All modules defined in this part must:
- Follow the same module architecture from Part-6
- Use the same query/mutation patterns from Part-5
- Apply role-based visibility from Part-3
- Be tested per Part-19 requirements
- Use backend endpoint paths EXACTLY as documented here

These are NOT optional features — each has full backend support already built.

END OF WEB PART 26.
