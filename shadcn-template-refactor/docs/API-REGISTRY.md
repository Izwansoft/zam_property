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
| **Backend Contracts** | **[types/backend-contracts.ts](../types/backend-contracts.ts)** — All 22 backend Prisma enums, 4 API response formats, error/pagination/audit contracts |

---

## 📋 Summary

### Marketplace Modules (Phases 1-4) ✅

| Module | Hooks | Status |
|--------|-------|--------|
| Auth | 5 | ✅ Done (Session 1.4) |
| Tenant Context | 7 | ✅ Done (Session 1.9) |
| Listings | 5 | ✅ Sessions 2.1-2.3 (list, detail, mutations) |
| Vendors | 5 | ✅ Session 2.4 |
| Tenants | 6 | ✅ Done (Session 2.6) |
| Interactions | 5 | ✅ Done (Session 2.7) |
| Reviews | 7 | ✅ Done (Session 2.8) |
| Media | 6 | ✅ Done (Session 2.9) |
| Account | 4 | ✅ Done (Session 2.10) |
| Subscriptions | 4 | ✅ Done (Session 4.2) |
| Analytics | 4 | ✅ Done (Session 4.3) |
| Audit | 6 | ✅ Done (Session 4.4) |
| Feature Flags | 11 | ✅ Done (Session 4.5) |
| Notifications | 7 | ✅ Done (Session 3.2, 4.15) |
| Search | 4 | ✅ Implemented (Session 4.1) |
| Activity | 2 | ✅ Done (Session 4.6) |
| Pricing | 11 | ✅ Done (Session 4.12) |
| Jobs | 12 | ✅ Done (Session 4.13) |
| Admin Listings | 8 | ✅ Done (Session 4.14) |
| Vendor Settings | 3 | ✅ Done (Session 4.15) |
| Error Handling | 13 | ✅ Done (Session 1.10) |
| Loading & Skeletons | 13 | ✅ Done (Session 1.11) |
| Form Infrastructure | 33 | ✅ Done (Session 1.12) |
| **Marketplace Total** | **135** | |

### Property Management Modules (Phases 5-8) ✅

| Module | Hooks | Status |
|--------|-------|--------|
| Occupants | 4 | ✅ Session 5.1-5.2 |
| Tenancies | 16 | ✅ Session 5.3-5.10 |
| Contracts | 7 | ✅ Session 5.6-5.7 |
| Deposits | 12 | ✅ Session 5.8 |
| Bills | 5 | ✅ Session 6.1-6.5 |
| Payments | 3 | ✅ Session 6.3-6.4 |
| Payouts | 3 | ✅ Session 6.6-6.7 |
| Maintenance | 14 | ✅ Session 7.1-7.3 |
| Inspections | 12 | ✅ Session 7.4-7.5 |
| Claims | 6 | ✅ Session 7.6 |
| Companies | 9 | ✅ Session 8.1-8.2 |
| Agents | 10 | ✅ Session 8.3 |
| Commissions | 8 | ✅ Session 8.4 |
| Affiliates | 7 | ✅ Session 8.5 |
| Legal Cases | 12 | ✅ Session 8.6 |
| Admin PM | 6 | ✅ Session 8.7 |
| **PM Total** | **134** | |

**Grand Total: ~269 hooks implemented**

---

## 🧱 Base Hooks (Session 1.3)

These are the foundational hooks that all domain modules build upon:

| Hook | File | Purpose |
|------|------|---------|
| `useApiQuery<T>` | `hooks/use-api-query.ts` | Single-entity GET with error normalization |
| `useApiPaginatedQuery<T>` | `hooks/use-api-query.ts` | Paginated list GET, normalizes all 4 backend formats (A/B/C/D) |
| `useApiMutation<TData, TVariables>` | `hooks/use-api-mutation.ts` | POST/PUT/PATCH/DELETE with cache invalidation |
| `useApiDelete<TData>` | `hooks/use-api-mutation.ts` | Convenience DELETE by ID |

### Error Normalization (`lib/errors/index.ts`)

| Export | Purpose |
|--------|---------|
| `normalizeError(error)` | Converts any thrown value to `AppError` |
| `extractFieldErrors(error)` | Maps field errors to `Record<string, string>` for RHF |
| `isAuthError(error)` | Check if error should redirect to login |
| `isRetryableError(error)` | Check if error is retryable (5xx/network/rate-limit) |

### Error Handler (`lib/errors/error-handler.ts`) — Session 1.10

| Export | Purpose |
|--------|--------|
| `getUserMessage(error)` | Returns user-friendly message for any `AppError` (code→kind fallback) |
| `handleGlobalError(error, options?)` | Central handler: normalizes, routes (401→login, 403→forbidden), triggers toasts |
| `getMutationErrorMessage(error)` | Quick message extraction for mutation error callbacks |
| `isSessionExpiredError(error)` | Check if error is TOKEN_EXPIRED or AUTH_SESSION_EXPIRED |

### Toast Helpers (`lib/errors/toast-helpers.ts`) — Session 1.10

| Export | Purpose |
|--------|--------|
| `showSuccess(msg, opts?)` | Success toast (3s auto-dismiss) |
| `showError(msg, opts?)` | Error toast (6s duration) |
| `showWarning(msg, opts?)` | Warning toast (5s) |
| `showInfo(msg, opts?)` | Info toast (4s) |
| `showApiError(error, opts?)` | Normalizes any error → user-friendly error toast |
| `showMutationSuccess(entity, action)` | "Entity action successfully" toast |
| `showMutationError(error, entity?, action?)` | "Failed to action entity: message" toast |
| `showLoading(promise, messages)` | Promise toast (loading→success/error) |
| `dismissToast(id?)` | Dismiss specific or all toasts |

### Loading & Skeleton Components (Session 1.11)

#### Page Skeletons (`components/common/page-skeletons.tsx`)

| Export | Purpose |
|--------|---------|
| `CardSkeleton` | Single card placeholder (configurable image/lines/badges) |
| `CardGridSkeleton` | Grid of card placeholders (2/3/4 columns) |
| `TableSkeleton` | Table with toolbar, header, rows, pagination placeholder |
| `ListSkeleton` | Vertical list items with avatar + text |
| `FormSkeleton` | Form fields, textarea, two-column row, actions |
| `PageShellSkeleton` | Page header + composable content area (table/cards/list/empty) |
| `DashboardSkeleton` | Stats cards + chart area + recent items table |
| `DetailSkeleton` | Detail header + gallery + tabs + info fields + sidebar |
| `StatCardSkeleton` | Single stat/metric card |

#### Loading Button (`components/common/loading-button.tsx`)

| Export | Purpose |
|--------|---------|
| `LoadingButton` | Button with spinner, disabled state, aria-busy, loadingText |
| `SaveButton` | Preset: "Saving..." loading text |
| `SubmitButton` | Preset: "Submitting..." loading text, type="submit" |
| `DeleteButton` | Preset: "Deleting..." loading text, variant="destructive" |

#### Lazy Component Factory (`components/common/lazy-component.tsx`)

| Export | Purpose |
|--------|---------|
| `createLazyComponent(importFn, opts)` | React.lazy + Suspense wrapper with configurable fallback |
| `createLazyChart(importFn)` | Preset: skeleton-card fallback for charts |
| `createLazyForm(importFn)` | Preset: skeleton-form fallback for forms |
| `createLazyTable(importFn)` | Preset: skeleton-table fallback for tables |

### Form Infrastructure (Session 1.12)

**Form Wrapper & Layout** (`components/forms/form-wrapper.tsx`)

| Export | Description |
|--------|-------------|
| `FormWrapper<TValues>` | RHF + Zod auto-connected form wrapper with server error mapping |
| `FormSection` | Visual group with heading and description |
| `FormGrid` | Responsive 1-4 column grid for fields |
| `FormActions` | Standard form action bar (left/center/right/between) |
| `setServerErrors` | Re-exported `extractFieldErrors` for mapping server errors to RHF |

**Field Wrappers** (`components/forms/form-fields.tsx`)

| Export | Description |
|--------|-------------|
| `TextField` | Text/email/tel/url input with label, description, validation |
| `PasswordField` | Password input with show/hide toggle |
| `NumberField` | Numeric input with prefix/suffix support (e.g. "RM", "sq ft") |
| `TextAreaField` | Multi-line textarea with optional char counter |
| `SelectField` | Radix Select dropdown with options |
| `CheckboxField` | Checkbox with label and description |
| `SwitchField` | Toggle switch with bordered card layout |
| `RadioGroupField` | Radio group with horizontal/vertical orientation |
| `SelectOption` | Shared option type: `{ label, value, disabled? }` |

**Error Display** (`components/forms/form-errors.tsx`)

| Export | Description |
|--------|-------------|
| `FormRootError` | Root-level error banner with alert icon |
| `FormErrorSummary` | Lists all current validation errors with field names |
| `FieldError` | Standalone inline error for non-RHF contexts |

**Schema Patterns** (`components/forms/schema-patterns.ts`)

| Export | Description |
|--------|-------------|
| `emailSchema` | Email validation + lowercase transform |
| `phoneSchema` | Malaysian phone format (+60XXXXXXXXX) |
| `optionalPhoneSchema` | Optional phone variant |
| `passwordSchema` | Strong password (8+ chars, upper/lower/number/special) |
| `loginPasswordSchema` | Simple required password (no strength rules) |
| `priceSchema` | MYR price (0-999M, 2 decimal places) |
| `optionalPriceSchema` | Optional price variant |
| `requiredStringSchema(label)` | Required trimmed string (1-255 chars) |
| `optionalStringSchema(maxLen)` | Optional trimmed string |
| `descriptionSchema(label)` | Long text (1-5000 chars) |
| `optionalDescriptionSchema(maxLen)` | Optional long text |
| `urlSchema` | URL validation (max 2048) |
| `optionalUrlSchema` | Optional URL variant |
| `positiveIntSchema(label)` | Positive integer |
| `nonNegativeIntSchema(label)` | Non-negative integer |
| `dateSchema` | ISO datetime string |
| `optionalDateSchema` | Optional datetime |
| `uuidSchema` | UUID format validation |
| `enumSchema(values, label)` | Create Zod enum from string array |
| `confirmPasswordSchema(field)` | Password + confirm password refinement |
| `paginationSchema` | Page (1+) + pageSize (1-100, default 20) |
| `sortSchema` | sortBy + sortOrder (asc/desc) |

### API Client (`lib/api/client.ts`)

| Export | Purpose |
|--------|---------|
| `api` / `apiClient` | Axios instance with auth/tenant/portal headers |
| `normalizePaginated(response, format)` | Normalizes paginated responses to `NormalizedPaginatedResult` |
| `setTokenGetter(fn)` | Wire auth token ✅ (wired Session 1.4) |
| `setRefreshHandler(fn)` | Wire 401 refresh handler ✅ (wired Session 1.4) |
| `setTenantIdGetter(fn)` | Wire tenant ID ✅ (wired Session 1.9) |
| `setPortalGetter(fn)` | Wire portal context (Session 1.7) |

---

## � Auth Module (Session 1.4)

### API Functions (`modules/auth/api/auth-api.ts`)

| Function | Method | Endpoint | Returns |
|----------|--------|----------|---------|
| `loginApi(credentials)` | POST | `/auth/login` | `LoginResponse` (tokens + user) |
| `refreshTokenApi(refreshToken)` | POST | `/auth/refresh` | `RefreshResponse` (new tokens) |
| `registerApi(data)` | POST | `/auth/register` | `User` |
| `fetchCurrentUser()` | GET | `/users/me` | `User` |
| `logoutApi()` | POST | `/auth/logout` | `void` (best-effort) |

### Auth Hooks (`modules/auth/hooks/use-auth.ts`)

| Hook | Purpose |
|------|---------|
| `useAuth()` | Full auth context: user, status, login/logout/refresh, hasRole/hasPermission |
| `useAuthUser()` | Non-null user (throws if not authenticated — for guarded pages) |
| `usePermissions()` | Role & permission helpers: hasRole, canAccessPortal, isPlatformAdmin, etc. |
| `useLoginRedirect()` | returnTo URL handling: redirectToLogin(reason), handlePostLogin(user) |

### Auth Types (`modules/auth/types/index.ts`)

| Export | Kind | Description |
|--------|------|-------------|
| `Role` | Enum | SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF, CUSTOMER, GUEST |
| `UserStatus` | Enum | ACTIVE, SUSPENDED, DEACTIVATED |
| `User` | Interface | id, email, fullName, phone, role, status, tenantId, vendorId |
| `AuthTokens` | Interface | accessToken, refreshToken, expiresIn |
| `LoginRequest` | Interface | email, password |
| `LoginResponse` | Interface | AuthTokens + user |
| `RegisterRequest` | Interface | email, password, fullName, phone? |
| `Portal` | Type | "platform" \| "tenant" \| "vendor" \| "account" |
| `roleToPortal(role)` | Function | Maps Role → Portal |
| `roleToDefaultPath(role)` | Function | Maps Role → "/dashboard/{portal}" |
| `isRoleAtLeast(userRole, requiredRole)` | Function | Role hierarchy comparison |

---

## 🏢 Tenant Module (Session 1.9)

### Tenant Context (`modules/tenant/context/tenant-context.tsx`)

| Export | Purpose |
|--------|---------|
| `TenantProvider` | Context provider with tenant resolution (subdomain → stored → membership) |
| `TenantContext` | React context for tenant state |

### Tenant Hooks (`modules/tenant/hooks/use-tenant.ts`)

| Hook | Purpose |
|------|---------|
| `useTenant()` | Full tenant context: tenantId, status, setTenantId, clearTenant, etc. |
| `useTenantId()` | Just the current tenant ID (null if unresolved/none) |
| `useTenantRequired()` | Non-null tenant ID (throws if missing — for tenant/vendor portals) |
| `useTenantSwitcher()` | Switching helpers: availableTenants, canSwitch, switchTenant |
| `useTenantInfo()` | Current tenant entity details (if loaded) |
| `useTenantStatus()` | Resolution status: isReady, isResolving, hasError, isRequired |

### Tenant Query Helpers (`hooks/use-tenant-query.ts`)

| Export | Purpose |
|--------|---------|
| `useTenantQueryKey()` | Hook: scopedKey(), invalidateAllTenantQueries(), invalidateTenantResource() |
| `makeTenantQueryKey(tenantId, ...segments)` | Standalone: creates tenant-scoped query key |

### Tenant Getter (`lib/auth/tenant-getter.ts`)

| Export | Purpose |
|--------|---------|
| `setTenantGetter(fn)` | Set singleton getter (called by TenantProvider) |
| `getCurrentTenantId()` | Get tenant ID for non-React consumers (WebSocket, analytics) |
| `isTenantGetterRegistered()` | Check if getter has been registered |

### Tenant Types (`modules/tenant/types/index.ts`)

| Export | Kind | Description |
|--------|------|-------------|
| `TenantStatus` | Enum | ACTIVE, SUSPENDED, DEACTIVATED |
| `Tenant` | Interface | id, name, slug, domain, status, logo, settings |
| `TenantMembership` | Interface | tenantId, tenantName, tenantSlug, role, vendorId |
| `TenantResolutionStatus` | Type | idle \| resolving \| resolved \| error \| not-required |
| `TenantContextState` | Interface | tenantId, tenant, status, error, isRequired, isReady |
| `TenantSwitcherState` | Interface | availableTenants, canSwitch |

### Portal Layout Integration

| Portal | Mode | Behaviour |
|--------|------|-----------|
| Platform (`/dashboard/platform/*`) | `optional` | Can select/switch tenants for support ops |
| Tenant (`/dashboard/tenant/*`) | `required` | Must resolve tenant or block |
| Vendor (`/dashboard/vendor/*`) | `derived` | Tenant derived from vendor association, no switching |
| Account (`/dashboard/account/*`) | `none` | No tenant context needed |

---

## 🏢 Tenant Management Module (Session 2.6)

### Management Types (`modules/tenant/types/index.ts`)

| Export | Kind | Description |
|--------|------|-------------|
| `TenantDetail` | Interface | Extends Tenant with plan, vendorCount, listingCount, usage, subscription |
| `TenantSubscription` | Interface | plan, status, currentPeriodStart/End, cancelAtPeriodEnd |
| `TenantUsage` | Interface | vendorsUsed/Limit, listingsUsed/Limit, storageUsedMB/LimitMB |
| `TenantFilters` | Interface | page, pageSize, status, plan, search, sortBy, sortOrder |
| `TenantSortBy` | Type | createdAt \| updatedAt \| name \| vendorCount |
| `TenantPlan` | Type | FREE \| STARTER \| PROFESSIONAL \| ENTERPRISE |
| `TenantSettingsDto` | Interface | name, domain, logo, enabledVerticals, settings |
| `DEFAULT_TENANT_FILTERS` | Const | Default filter values |

### Management Hooks

| Hook | File | Backend Endpoint | Description |
|------|------|-----------------|-------------|
| `useTenants(filters)` | `hooks/use-tenants.ts` | `GET /admin/tenants` | Paginated tenant list (Format A) |
| `useTenantDetail(id)` | `hooks/use-tenant-detail.ts` | `GET /admin/tenants/:id` | Single tenant detail |
| `useSuspendTenant()` | `hooks/use-tenant-mutations.ts` | `PATCH /admin/tenants/:id/suspend` | Suspend active tenant |
| `useReactivateTenant()` | `hooks/use-tenant-mutations.ts` | `PATCH /admin/tenants/:id/reactivate` | Reactivate suspended tenant |
| `useDeactivateTenant()` | `hooks/use-tenant-mutations.ts` | `PATCH /admin/tenants/:id/deactivate` | Deactivate tenant |
| `useUpdateTenantSettings(id)` | `hooks/use-tenant-mutations.ts` | `PATCH /admin/tenants/:id/settings` | Update tenant settings |

### Management Components

| Component | File | Description |
|-----------|------|-------------|
| `TenantCard` | `components/tenant-card.tsx` | Card for grid view with status/plan badges |
| `TenantCardSkeleton` | `components/tenant-card.tsx` | Loading skeleton |
| `TenantFiltersBar` | `components/tenant-filters.tsx` | Search, status, plan filters + sort |
| `TenantList` | `components/tenant-list.tsx` | Grid with filters + pagination + empty state |
| `TenantPagination` | `components/tenant-pagination.tsx` | Pagination controls |
| `TenantDetailView` | `components/tenant-detail.tsx` | Full detail with info, usage, subscription, verticals |
| `TenantDetailSkeleton` | `components/tenant-detail.tsx` | Loading skeleton |
| `TenantStatusActions` | `components/tenant-status-actions.tsx` | Suspend/Reactivate/Deactivate with confirmations |
| `TenantSettingsForm` | `components/tenant-settings-form.tsx` | Edit name, domain, verticals |
| `TenantSettingsFormSkeleton` | `components/tenant-settings-form.tsx` | Loading skeleton |

### Utils (`modules/tenant/utils/index.ts`)

| Export | Description |
|--------|-------------|
| `TENANT_STATUS_CONFIG` | Status → label + badge variant |
| `TENANT_PLAN_CONFIG` | Plan → label + badge variant |
| `getTenantPlanLabel(plan)` | Human-readable plan label |
| `formatDate(dateStr)` | Format date (en-MY) |
| `formatDateTime(dateStr)` | Format date + time |
| `formatRelativeDate(dateStr)` | Relative time ("2d ago") |
| `formatUsage(used, limit)` | "used / limit" string |
| `getUsagePercentage(used, limit)` | 0-100 percentage |
| `formatStorage(mb)` | MB/GB display |
| `cleanTenantFilters(filters)` | Remove empty filter values |

### MSW Handlers (`lib/mocks/handlers/tenants.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/tenants` | GET | Paginated list, filter by status/plan/search, sort |
| `/admin/tenants/:id` | GET | Single tenant with detail fields |
| `/admin/tenants/:id/suspend` | PATCH | Suspend (ACTIVE → SUSPENDED) |
| `/admin/tenants/:id/reactivate` | PATCH | Reactivate (SUSPENDED → ACTIVE) |
| `/admin/tenants/:id/deactivate` | PATCH | Deactivate (any → DEACTIVATED) |
| `/admin/tenants/:id/settings` | PATCH | Update name, domain, verticals, settings |

### Platform Pages

| Route | Files |
|-------|-------|
| `/dashboard/platform/tenants` | page.tsx, content.tsx, loading.tsx |
| `/dashboard/platform/tenants/[id]` | page.tsx, content.tsx, loading.tsx |
| `/dashboard/platform/tenants/[id]/settings` | page.tsx, content.tsx, loading.tsx |

---

## �📐 Conventions

### Query Key Structure
```typescript
// Pattern: [scope, scopeId?, resource, action?, params?]
['tenant', tenantId, 'listings', 'list', params]   // Tenant-scoped listing list
['tenant', tenantId, 'listings', 'detail', id]     // Single listing
['platform', 'tenants', 'list', params]             // Platform-scoped tenant list
['auth', 'me']                                       // Auth user
['notifications', 'unread-count']                    // Global scope
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
usePublishListing()     // Status change
```

### Query Key Factory
```typescript
// All keys scoped by tenant
const listingKeys = {
  all: ['listings'] as const,
  lists: () => [...listingKeys.all, 'list'] as const,
  list: (filters: ListingFilters) => [...listingKeys.lists(), filters] as const,
  details: () => [...listingKeys.all, 'detail'] as const,
  detail: (id: string) => [...listingKeys.details(), id] as const,
};
```

### Standard Hook Pattern
```typescript
// Query hook
function useListings(filters: ListingFilters) {
  return useApiQuery({
    queryKey: listingKeys.list(filters),
    queryFn: () => listingApi.getListings(filters),
    staleTime: 30_000,
    keepPreviousData: true,
  });
}

// Mutation hook
function useCreateListing() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (data: CreateListingDto) => listingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
      showSuccess('Listing created successfully');
    },
  });
}
```

---

## 🔐 Auth Hooks

> Session 1.4 — Not yet implemented

| Hook | Endpoint | Method | Description |
|------|----------|--------|-------------|
| — | — | — | — |

---

## 🏢 Listing Hooks

> Session 2.1 — List view implemented (2026-02-16)
> Session 2.2 — Detail view implemented (2026-02-16)
> Session 2.3 — Create/Edit form implemented (2026-02-16)

| Hook | Endpoint | Method | Description |
|------|----------|--------|-------------|
| `useListings(filters)` | `GET /api/v1/listings` | GET | Paginated listing list with filters (status, search, sort, price range, city, vendor, featured). Format A. |
| `useListing(id)` | `GET /api/v1/listings/:id` | GET | Single listing detail with vendor and media. Uses `useApiQuery`. |
| `useCreateListing()` | `POST /api/v1/listings` | POST | Create new listing as DRAFT. Returns `ListingDetail`. Invalidates `queryKeys.listings.all`. |
| `useUpdateListing()` | `PATCH /api/v1/listings/:id` | PATCH | Update existing listing. Variable includes `id` + update fields. Invalidates `queryKeys.listings.all`. |
| `usePublishListing()` | `PATCH /api/v1/listings/:id/publish` | PATCH | Publish listing (DRAFT/EXPIRED/ARCHIVED → PUBLISHED). Variable is listing ID string. |

**MSW Lifecycle Mutations (Session 2.2–2.3):**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/listings` | POST | Create listing (validates verticalType + title required) |
| `/api/v1/listings/:id` | PATCH | Update listing (mutable fields only) |
| `/api/v1/listings/:id/publish` | PATCH | Publish listing (DRAFT/EXPIRED/ARCHIVED → PUBLISHED) |
| `/api/v1/listings/:id/unpublish` | PATCH | Unpublish listing (PUBLISHED → DRAFT) |
| `/api/v1/listings/:id/archive` | PATCH | Archive listing (any → ARCHIVED) |
| `/api/v1/listings/:id` | DELETE | Delete listing |

**DTOs:**
- `CreateListingDto`: `{ verticalType, schemaVersion, title, description?, price, currency, priceType?, location, attributes? }`
- `UpdateListingDto`: `{ title?, description?, price?, currency?, priceType?, location?, attributes? }`

**Files:**
- Types: `modules/listing/types/index.ts`
- Hooks: `modules/listing/hooks/use-listings.ts`, `use-listing.ts`, `use-listing-mutations.ts`
- Utils: `modules/listing/utils/index.ts`
- Components: `listing-card.tsx`, `listing-list.tsx`, `listing-filters.tsx`, `listing-pagination.tsx`, `listing-gallery.tsx`, `listing-info.tsx`, `listing-stats.tsx`, `listing-actions.tsx`, `listing-detail.tsx`
- Form: `listing-form/` (listing-form.tsx, listing-form-schema.ts, listing-form-types.ts, step-vertical-select.tsx, step-core-fields.tsx, step-attributes.tsx, step-media.tsx, step-review.tsx)
- MSW: `lib/mocks/handlers/listings.ts` (48 mock listings, multi-image gallery, CRUD + lifecycle mutations)

**Filter Params:** `page`, `pageSize`, `status`, `search`, `verticalType`, `vendorId`, `isFeatured`, `minPrice`, `maxPrice`, `city`, `state`, `sortBy`, `sortOrder`

---

## 👤 Vendor Hooks

> Session 2.4 — Implemented

| Hook | Endpoint | Method | Description |
|------|----------|--------|-------------|
| `useVendors(filters)` | `GET /api/v1/vendors` | GET | Paginated vendor list with filters (status, type, search, sort). Format A. Uses `useApiPaginatedQuery`. |
| `useVendor(id)` | `GET /api/v1/vendors/:id` | GET | Single vendor detail with stats, timeline, reasons. Uses `useApiQuery`. |
| `useApproveVendor()` | `PATCH /api/v1/vendors/:id/approve` | PATCH | Approve a PENDING vendor. Invalidates `vendors.all`. |
| `useRejectVendor()` | `PATCH /api/v1/vendors/:id/reject` | PATCH | Reject a PENDING vendor with reason. Invalidates `vendors.all`. |
| `useSuspendVendor()` | `PATCH /api/v1/vendors/:id/suspend` | PATCH | Suspend an APPROVED vendor with reason. Invalidates `vendors.all`. |
| `useVendorOnboarding()` | `POST /api/v1/vendors/onboard` | POST | Submit vendor onboarding form. Creates vendor with PENDING status. Invalidates `vendors.all`. (Session 2.5) |
| `useVendorSettings(vendorId)` | `GET /api/v1/vendors/:id/settings` | GET | Vendor self-service settings (business info, logo, visibility). 60s staleTime. (Session 4.15) |
| `useUpdateVendorSettings(vendorId)` | `PATCH /api/v1/vendors/:id/settings` | PATCH | Update vendor settings. Invalidates settings + detail keys. (Session 4.15) |
| `useUploadVendorLogo(vendorId)` | `POST /api/v1/vendors/:id/logo` | POST | Upload vendor logo (multipart/form-data, max 5MB). Invalidates settings + detail keys. (Session 4.15) |

### Types (Session 2.5 additions)

| Type | Kind | Fields |
|------|------|--------|
| `VendorOnboardingDto` | Interface | name, type, email, phone, description?, registrationNumber, address (line1, line2?, city, state, postalCode, country), documentNames? |
| `OnboardingFormData` | Interface | name, type, email, phone, description, registrationNumber, address, documentNames |
| `OnboardingFormValues` | Zod inferred | Merged basicInfoSchema + businessDetailsSchema + documentsSchema |

### Types

| Type | Kind | Fields |
|------|------|--------|
| `VendorStatus` | Type | "PENDING" \| "APPROVED" \| "REJECTED" \| "SUSPENDED" |
| `VendorType` | Type | "AGENCY" \| "INDIVIDUAL" \| "DEVELOPER" |
| `VendorSortBy` | Type | "createdAt" \| "updatedAt" \| "name" \| "listingCount" |
| `Vendor` | Interface | id, name, slug, type, email, phone, status, description, logo, address, registrationNumber, listingCount, activeListingCount, rating, reviewCount, createdAt, updatedAt |
| `VendorDetail` | Interface (extends Vendor) | + rejectionReason, suspensionReason, verificationNotes, lastActivityAt, totalInteractions, totalRevenue |
| `VendorFilters` | Interface | page, pageSize, status, type, search, sortBy, sortOrder |
| `RejectVendorDto` | Interface | reason: string |
| `SuspendVendorDto` | Interface | reason: string |

**Filter Params:** `page`, `pageSize`, `status`, `type`, `search`, `sortBy`, `sortOrder`

---

## 🏗️ Tenant Hooks

> Session 2.6 — Not yet implemented

| Hook | Endpoint | Method | Description |
|------|----------|--------|-------------|
| — | — | — | — |

---

## 💬 Interaction Module (Session 2.7)

### Interaction Types (`modules/interaction/types/index.ts`)

| Export | Kind | Description |
|--------|------|-------------|
| `InteractionType` | Type | LEAD \| ENQUIRY \| BOOKING |
| `InteractionStatus` | Type | NEW \| CONTACTED \| CONFIRMED \| CLOSED \| INVALID |
| `Interaction` | Interface | Core interaction with tenantId, vendorId, listingId, type, status, customer info |
| `InteractionDetail` | Interface | Extends Interaction with vendorName, messages, bookingDetails, internalNotes |
| `InteractionMessage` | Interface | id, interactionId, content, senderId, senderName, senderRole |
| `InteractionFilters` | Interface | page, pageSize, status, type, search, sortBy, sortOrder |
| `UpdateInteractionStatusDto` | Interface | status |
| `SendMessageDto` | Interface | content |
| `VALID_STATUS_TRANSITIONS` | Const | NEW→[CONTACTED,INVALID], CONTACTED→[CONFIRMED,CLOSED], CONFIRMED→[CLOSED] |
| `DEFAULT_INTERACTION_FILTERS` | Const | Default filter values |

### Interaction Hooks

| Hook | File | Backend Endpoint | Description |
|------|------|-----------------|-------------|
| `useInteractions(filters)` | `hooks/use-interactions.ts` | `GET /interactions` | Paginated interaction list (Format A) |
| `useInteractionDetail(id)` | `hooks/use-interaction-detail.ts` | `GET /interactions/:id` | Single interaction with messages |
| `useCreateInteraction()` | `hooks/use-create-interaction.ts` | `POST /interactions` | Create new interaction (inquiry/lead) |
| `useUpdateInteractionStatus()` | `hooks/use-interaction-mutations.ts` | `PATCH /interactions/:id/status` | Update status (validates transitions) |
| `useSendMessage()` | `hooks/use-interaction-mutations.ts` | `POST /interactions/:id/messages` | Send message in conversation |

### Interaction Components

| Component | File | Description |
|-----------|------|-------------|
| `InteractionCard` | `components/interaction-card.tsx` | Card with type icon (color-coded), status badge, customer, last message |
| `InteractionCardSkeleton` | `components/interaction-card.tsx` | Loading skeleton |
| `InteractionFiltersBar` | `components/interaction-filters.tsx` | Search (debounced), status, type, sort filters |
| `InteractionList` | `components/interaction-list.tsx` | Stacked cards with filters + pagination + empty state |
| `InteractionPagination` | `components/interaction-pagination.tsx` | Pagination controls |
| `InteractionDetailView` | `components/interaction-detail.tsx` | Two-column: conversation thread + sidebar (details, customer, booking, timeline) |
| `InteractionDetailSkeleton` | `components/interaction-detail.tsx` | Loading skeleton |
| `InteractionStatusActions` | `components/interaction-status-actions.tsx` | Valid transition buttons with AlertDialog confirmation |
| `InteractionReplyForm` | `components/interaction-reply-form.tsx` | Textarea with character count (2000 max), send button |

### Utils (`modules/interaction/utils/index.ts`)

| Export | Description |
|--------|-------------|
| `INTERACTION_STATUS_CONFIG` | Status → label + badge variant |
| `INTERACTION_TYPE_CONFIG` | Type → label + description |
| `STATUS_TRANSITION_LABELS` | Human-readable transition labels |
| `getInteractionTypeLabel(type)` | Human-readable type label |
| `formatDate(dateStr)` | Format date (en-MY) |
| `formatDateTime(dateStr)` | Format date + time |
| `formatRelativeDate(dateStr)` | Relative time ("2d ago") |
| `cleanInteractionFilters(filters)` | Remove empty filter values |

### MSW Handlers (`lib/mocks/handlers/interactions.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/interactions` | GET | Paginated list, filter by status/type/search, sort |
| `/interactions/:id` | GET | Single interaction with messages thread |
| `/interactions/:id/status` | PATCH | Update status (validates VALID_STATUS_TRANSITIONS) |
| `/interactions/:id/messages` | POST | Send message (validates content required) |

### Vendor Inbox Pages

| Route | Files |
|-------|-------|
| `/dashboard/vendor/inbox` | page.tsx, content.tsx, loading.tsx |
| `/dashboard/vendor/inbox/[id]` | page.tsx, content.tsx, loading.tsx |

---

## ⭐ Review Module (Session 2.8)

### Review Types (`modules/review/types/index.ts`)

| Export | Kind | Description |
|--------|------|-------------|
| `ReviewStatus` | Type | PENDING \| APPROVED \| REJECTED \| FLAGGED |
| `ReviewSortBy` | Type | createdAt \| updatedAt \| rating |
| `Review` | Interface | Core review with tenantId, vendorId, listingId, rating, title, content, status, vendorReply |
| `ReviewDetail` | Interface | Extends Review with customerEmail, customerPhone, interactionId, internalNotes, editHistory, reportReasons, metadata |
| `ReviewEditEntry` | Interface | editedAt, editedBy, previousContent |
| `ReviewStats` | Interface | averageRating, totalReviews, distribution (Record<1\|2\|3\|4\|5, number>), trend |
| `ReviewFilters` | Interface | page, pageSize, status, rating, search, sortBy, sortOrder |
| `ApproveReviewDto` | Interface | note? |
| `RejectReviewDto` | Interface | reason (required) |
| `FlagReviewDto` | Interface | reason (required) |
| `ReplyToReviewDto` | Interface | content (required) |
| `DEFAULT_REVIEW_FILTERS` | Const | Default filter values |

### Review Hooks

| Hook | File | Backend Endpoint | Description |
|------|------|-----------------|-------------|
| `useReviews(filters)` | `hooks/use-reviews.ts` | `GET /reviews` | Paginated review list (Format A) |
| `useReviewDetail(id)` | `hooks/use-review-detail.ts` | `GET /reviews/:id` | Single review with extended details |
| `useReviewStats()` | `hooks/use-review-stats.ts` | `GET /reviews/stats` | Aggregated rating stats (avg, distribution, trend) |
| `useApproveReview()` | `hooks/use-review-mutations.ts` | `PATCH /reviews/:id/approve` | Approve a pending/flagged review |
| `useRejectReview()` | `hooks/use-review-mutations.ts` | `PATCH /reviews/:id/reject` | Reject review (reason required) |
| `useFlagReview()` | `hooks/use-review-mutations.ts` | `PATCH /reviews/:id/flag` | Flag review for moderation (reason required) |
| `useReplyToReview()` | `hooks/use-review-mutations.ts` | `POST /reviews/:id/reply` | Vendor reply (once per review) |

### Review Components

| Component | File | Description |
|-----------|------|-------------|
| `ReviewCard` | `components/review-card.tsx` | Card with star rating, status badge, content preview, customer info |
| `ReviewCardSkeleton` | `components/review-card.tsx` | Loading skeleton |
| `StarRating` | `components/review-card.tsx` | Reusable star rating display |
| `ReviewFiltersBar` | `components/review-filters.tsx` | Search (debounced), status, rating, sort filters |
| `ReviewList` | `components/review-list.tsx` | Stacked cards with filters + pagination + empty state |
| `ReviewPagination` | `components/review-pagination.tsx` | Pagination controls |
| `ReviewStatsDisplay` | `components/review-stats.tsx` | Self-contained: avg rating, distribution bars, trend (fetches own data) |
| `ReviewStatsSkeleton` | `components/review-stats.tsx` | Loading skeleton |
| `ReviewModerationActions` | `components/review-moderation-actions.tsx` | Approve/reject/flag with AlertDialog + reason input |
| `ReviewReplyForm` | `components/review-reply-form.tsx` | Textarea with 1000 char limit, disabled if already replied |
| `ReviewDetailView` | `components/review-detail.tsx` | Two-column: review content + reply (left), details + timeline (right) |
| `ReviewDetailSkeleton` | `components/review-detail.tsx` | Loading skeleton |

### Utils (`modules/review/utils/index.ts`)

| Export | Description |
|--------|-------------|
| `REVIEW_STATUS_CONFIG` | Status → label + badge variant (PENDING=secondary, APPROVED=default, REJECTED=destructive, FLAGGED=outline) |
| `getRatingLabel(rating)` | 1=Poor, 2=Fair, 3=Good, 4=Very Good, 5=Excellent |
| `getRatingColor(rating)` | Color class based on rating value |
| `formatDate(dateStr)` | Format date (en-MY) |
| `formatDateTime(dateStr)` | Format date + time |
| `formatRelativeDate(dateStr)` | Relative time ("2d ago") |
| `cleanReviewFilters(filters)` | Remove empty filter values |

### MSW Handlers (`lib/mocks/handlers/reviews.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/reviews` | GET | Paginated list, filter by status/rating/search, sort |
| `/reviews/stats` | GET | Aggregated stats (avg, distribution from APPROVED, trend) |
| `/reviews/:id` | GET | Single review with extended detail |
| `/reviews/:id/approve` | PATCH | Approve (validates not already approved) |
| `/reviews/:id/reject` | PATCH | Reject (validates reason required) |
| `/reviews/:id/flag` | PATCH | Flag (validates reason required) |
| `/reviews/:id/reply` | POST | Vendor reply (validates content required, not already replied) |

### Portal Pages

| Route | Files |
|-------|-------|
| `/dashboard/vendor/reviews` | page.tsx, content.tsx, loading.tsx |
| `/dashboard/vendor/reviews/[id]` | page.tsx, content.tsx, loading.tsx |
| `/dashboard/tenant/reviews` | page.tsx, content.tsx, loading.tsx |
| `/dashboard/tenant/reviews/[id]` | page.tsx, content.tsx, loading.tsx |

---

## 📸 Media Hooks

> Session 2.9 — Complete

| Hook | Endpoint | Method | Description |
|------|----------|--------|-------------|
| `usePresignedUrl()` | `POST /api/v1/media/presigned-url` | POST | Request a presigned S3/MinIO upload URL. Returns upload URL, CDN URL, media ID. |
| `useConfirmUpload()` | `PATCH /api/v1/media/:id/confirm` | PATCH | Confirm upload completion. Accepts optional width, height, altText. |
| `useDeleteMedia()` | `DELETE /api/v1/media/:id` | DELETE | Delete a media item (logical). Invalidates media cache. |
| `useReorderMedia()` | `PATCH /api/v1/media/reorder` | PATCH | Reorder media items by providing ordered array of media IDs. |
| `useSetPrimaryMedia()` | `PATCH /api/v1/media/:id/primary` | PATCH | Set a media item as the primary image. Clears existing primary. |
| `useMediaUpload()` | — (orchestration) | — | Client-side hook orchestrating presign → upload → confirm flow with progress tracking. |

### Media Components

| Component | File | Description |
|-----------|------|-------------|
| `MediaUploader` | `modules/media/components/media-uploader.tsx` | Drag-and-drop upload zone with progress, file validation, retry |
| `ImagePreview` | `modules/media/components/image-preview.tsx` | Preview dialog with zoom slider, rotate CW/CCW, fit-to-screen, download |
| `MediaGallery` | `modules/media/components/media-gallery.tsx` | Sortable grid with drag-reorder, set primary, delete confirmation |
| `MediaGallerySkeleton` | `modules/media/components/media-gallery.tsx` | Loading skeleton for gallery grid |

### Media MSW Handlers (6 endpoints)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/media/presigned-url` | POST | Returns mock presigned URL, CDN URL, media ID |
| `/media/:id/confirm` | PATCH | Confirms upload, creates/updates media record |
| `/media/:id` | DELETE | Removes media from in-memory store |
| `/media/reorder` | PATCH | Updates sort order for media items |
| `/media/:id/primary` | PATCH | Sets primary image flag |
| `/media` | GET | Lists media by entityType/entityId query params |

---

## 👤 Account Hooks

> Sessions 2.10–2.11 — Complete

| Hook | Endpoint | Method | Description |
|------|----------|--------|-------------|
| `useProfile` | `/users/me` | `GET` | Fetch current user profile (5-min staleTime) |
| `useUpdateProfile` | `/account/profile` | `PATCH` | Update profile fields (fullName, phone) |
| `useDashboardStats` | `/account/dashboard` | `GET` | Dashboard aggregated stats (1-min staleTime) |
| `useRecentActivity` | `/account/activity` | `GET` | Recent activity feed (limit param) |
| `useInquiries` | `/account/inquiries` | `GET` | Paginated inquiries list (search, status filters) |
| `useSavedListings` | `/account/saved` | `GET` | Paginated saved listings list (search filter) |
| `useUnsaveListing` | `/account/saved/:id` | `DELETE` | Remove a saved listing |
| `useCustomerReviews` | `/account/reviews` | `GET` | Paginated customer reviews (search, rating filters) |
| `useNotificationPreferences` | `/account/notification-preferences` | `GET` | Notification channel preferences (5-min staleTime) |
| `useUpdateNotificationPreferences` | `/account/notification-preferences` | `PATCH` | Update notification channel toggles |
| `useAccountSettings` | `/account/settings` | `GET` | Account settings (language, timezone, privacy; 5-min staleTime) |
| `useUpdateAccountSettings` | `/account/settings` | `PATCH` | Update account settings |
| `useChangePassword` | `/account/change-password` | `POST` | Change password (current + new) |
| `useDeleteAccount` | `/account/delete-account` | `POST` | Request account deletion (password + reason) |

### Account Components

| Component | Location | Description |
|-----------|----------|-------------|
| `ProfileViewCard` | `modules/account/components/profile-view-card.tsx` | Read-only profile display (avatar, email, phone, dates) |
| `ProfileViewCardSkeleton` | (same file) | Loading skeleton for profile card |
| `ProfileEditForm` | `modules/account/components/profile-edit-form.tsx` | Edit form with Zod validation (fullName, phone) |
| `AccountDashboard` | `modules/account/components/account-dashboard.tsx` | Stats grid + quick actions + recent activity |
| `AccountDashboardSkeleton` | (same file) | Loading skeleton for dashboard |
| `InquiryList` | `modules/account/components/inquiry-list.tsx` | Inquiry cards with filter bar + pagination |
| `InquiryCardSkeleton` | (same file) | Loading skeleton for inquiry cards |
| `SavedListingsList` | `modules/account/components/saved-listings-list.tsx` | Saved listings with unsave + pagination |
| `SavedListingCardSkeleton` | (same file) | Loading skeleton for saved listing cards |
| `CustomerReviewList` | `modules/account/components/customer-review-list.tsx` | Customer reviews with star ratings + vendor replies |
| `CustomerReviewCardSkeleton` | (same file) | Loading skeleton for review cards |
| `NotificationPreferencesGrid` | `modules/account/components/notification-preferences-grid.tsx` | Channel × type grid with switch toggles |
| `NotificationPreferencesGridSkeleton` | (same file) | Loading skeleton for preferences grid |
| `AccountSettingsForm` | `modules/account/components/account-settings-form.tsx` | Language, timezone, privacy settings form |
| `AccountSettingsFormSkeleton` | (same file) | Loading skeleton for settings form |
| `SecurityForm` | `modules/account/components/security-form.tsx` | Change password + delete account sections |
| `SecurityFormSkeleton` | (same file) | Loading skeleton for security form |

### Account MSW Handlers

| Handler | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Dashboard | `/account/dashboard` | `GET` | Mock dashboard stats |
| Activity | `/account/activity` | `GET` | Mock recent activity (limit support) |
| Update Profile | `/account/profile` | `PATCH` | Mock profile update |
| Inquiries | `/account/inquiries` | `GET` | Mock paginated inquiries (15 items) |
| Saved Listings | `/account/saved` | `GET` | Mock paginated saved listings (12 items) |
| Unsave Listing | `/account/saved/:id` | `DELETE` | Mock unsave listing |
| Customer Reviews | `/account/reviews` | `GET` | Mock paginated reviews (10 items) |
| Notification Prefs | `/account/notification-preferences` | `GET` | Mock notification preferences (13 types × 5 channels) |
| Update Notif Prefs | `/account/notification-preferences` | `PATCH` | Mock update preferences |
| Settings | `/account/settings` | `GET` | Mock account settings |
| Update Settings | `/account/settings` | `PATCH` | Mock update settings |
| Change Password | `/account/change-password` | `POST` | Mock password change |
| Delete Account | `/account/delete-account` | `POST` | Mock account deletion |

---

## 💳 Subscription Hooks

> Session 4.2 — ✅ Implemented

| Hook | Endpoint | Method | Description |
|------|----------|--------|-------------|
| `usePlans(params?)` | `GET /api/v1/plans` | GET | Paginated plan list (Format B). Params: isActive, isPublic, page, pageSize. 5-min staleTime. |
| `useSubscription()` | `GET /api/v1/subscriptions/current` | GET | Current tenant subscription with embedded PlanSummary. Tenant-scoped (useTenantId). 1-min staleTime. |
| `useUsage(params?)` | `GET /api/v1/subscriptions/usage` | GET | Usage metrics for current billing period. Optional metricKey filter. 30s staleTime. |
| `useEntitlements()` | `GET /api/v1/subscriptions/entitlements` | GET | Resolved entitlements (plan + overrides merged). Tenant-scoped. 5-min staleTime. |

### Subscription Types (`modules/subscription/types/index.ts`)

| Export | Kind | Description |
|--------|------|-------------|
| `Plan` | Interface | id, name, slug, description, monthlyPrice, annualPrice, trialDays, isActive, isPublic, entitlements, features, metadata |
| `PlanSummary` | Interface | id, name, slug (embedded in Subscription) |
| `PlanEntitlements` | Interface | maxListings, maxInteractions, maxMediaPerListing, maxStorageMB, maxVerticals, allowApi |
| `Subscription` | Interface | id, tenantId, planId, status, currentPeriodStart/End, cancelAtPeriodEnd, plan (PlanSummary), externalProvider, externalId, autoRenew |
| `SubscriptionStatus` | Type | ACTIVE \| PAST_DUE \| PAUSED \| CANCELLED |
| `ResolvedEntitlements` | Interface | plan, overrides, resolved (merged), appliedAt |
| `UsageMetric` | Interface | metricKey, label, description, currentValue, limit, usagePercentage, warningLevel, lastUpdatedAt |
| `UsagePeriod` | Interface | periodStart, periodEnd, resetDate, metrics |
| `UsageWarningLevel` | Type | NORMAL \| WARNING \| CRITICAL \| EXCEEDED |
| `FeatureCategory` | Interface | category, features (FeatureRow[]) |
| `FeatureRow` | Interface | key, label, description?, type (boolean/number/string) |
| `getUsageWarningLevel(pct)` | Function | Returns warning level: 0-79% Normal, 80-94% Warning, 95-99% Critical, 100%+ Exceeded |
| `SUBSCRIPTION_STATUS_CONFIG` | Const | Status → label + badge variant + icon |
| `METRIC_KEY_LABELS` | Const | Metric key → human-readable label |
| `METRIC_KEY_DESCRIPTIONS` | Const | Metric key → description |
| `PLAN_FEATURE_CATEGORIES` | Const | 6 feature categories (Listings, Interactions, Media, Features, Verticals, API) with 25+ feature rows |

### Subscription Components

| Component | File | Description |
|-----------|------|-------------|
| `PlanComparisonTable` | `modules/subscription/components/plan-comparison-table.tsx` | Side-by-side plan grid sorted by price, current plan highlighted with badge, feature categories with tooltips, boolean check/X icons |
| `CurrentPlanCard` | `modules/subscription/components/current-plan-card.tsx` | Status badge (ACTIVE/PAST_DUE/PAUSED/CANCELLED), billing period dates, days remaining, expiring-soon warning (≤7 days), last-updated timestamp |
| `UsageMeters` | `modules/subscription/components/usage-meters.tsx` | Progress bars with 4 warning levels (Normal=green, Warning=amber, Critical=orange, Exceeded=red), sorted by severity, refresh button, alert count badge |
| `UpgradePrompt` | `modules/subscription/components/upgrade-prompt.tsx` | Informational CTA (no checkout). 3 variants: card (gradient), inline (compact), banner (horizontal). 4 reasons: limit_reached, feature_locked, plan_comparison, general |
| `EntitlementsDisplay` | `modules/subscription/components/entitlements-display.tsx` | Resolved entitlements grouped by domain (Listings, Interactions, Media, Features, Verticals, API). Boolean → Enabled/Not Included badges |

### Subscription MSW Handlers (`lib/mocks/handlers/subscriptions.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/plans` | GET | Paginated plan list (Format B). 3 plans: Starter (RM99/mo), Professional (RM299/mo), Enterprise (RM799/mo) |
| `/plans/:id` | GET | Single plan detail |
| `/subscriptions/current` | GET | Active Professional subscription with PlanSummary |
| `/subscriptions/entitlements` | GET | Full resolved entitlements (plan + overrides merged) |
| `/subscriptions/usage` | GET | 4 usage metrics: listings (70%), interactions (84%), media (14%), storage (40%) |

### Portal Pages

| Route | Files | Description |
|-------|-------|-------------|
| `/dashboard/tenant/subscription` | page.tsx, content.tsx, loading.tsx | Full subscription dashboard: plan card, usage meters, entitlements, expandable plan comparison |
| `/dashboard/vendor/subscription` | page.tsx, content.tsx, loading.tsx | Read-only view: plan info, usage, entitlements. Contact admin CTA for upgrades |
| `/dashboard/platform/subscriptions` | page.tsx, content.tsx, loading.tsx | Admin overview: plan summary table + full plan comparison grid |

---

## 📊 Analytics Hooks

> Session 4.3 — ✅ Implemented

### Hooks (4)

| Hook | Endpoint | Method | Description |
|------|----------|--------|-------------|
| `usePlatformAnalytics` | `/admin/dashboard/stats` | GET | Platform-level admin dashboard stats |
| `useTenantAnalytics` | `/analytics/tenant/overview` | GET | Tenant marketplace analytics overview |
| `useVendorAnalytics` | `/analytics/vendor/overview` | GET | Vendor performance overview |
| `useVendorListingAnalytics` | `/analytics/vendor/listings` | GET | Per-listing analytics breakdown |

### Utility Hooks

| Hook | Description |
|------|-------------|
| `useAnalyticsDateRange` | Stateful date range management with presets (7d/30d/90d/1y/custom) |

### Types

| Type | Description |
|------|-------------|
| `TenantAnalyticsOverview` | Response: startDate, endDate, totals (views/leads/enquiries/bookings) |
| `VendorAnalyticsOverview` | Response: vendorId, dates, totals |
| `VendorListingAnalytics` | Response: vendorId, dates, items (per-listing breakdown) |
| `AdminDashboardStats` | Response: vendorsByStatus, listingsByStatus, interactions, pending counts |
| `AnalyticsTotals` | Shared: viewsCount, leadsCount, enquiriesCount, bookingsCount |
| `AnalyticsDateRange` | startDate/endDate ISO strings |
| `DateRangePreset` | "7d" \| "30d" \| "90d" \| "1y" \| "custom" |
| `MetricTrend` | "up" \| "down" \| "neutral" |
| `MetricCardConfig` | Config for metric card (label, value, format, icon) |
| `ChartDataPoint` | Generic chart data point |
| `PieChartSlice` | Pie chart slice (name, value, fill) |
| `TopItem` | Ranked item for TopItemsTable |

### Components

| Component | Description |
|-----------|-------------|
| `MetricCard` | Single KPI card with trend indicator (up/down/neutral) |
| `MetricCardSkeleton` | Loading skeleton for MetricCard |
| `DashboardStats` | Grid of 4 KPI cards (views, leads, enquiries, bookings) |
| `AnalyticsLineChart` | Line chart wrapper (shadcn Chart + Recharts) |
| `AnalyticsBarChart` | Bar chart wrapper with optional stacking |
| `AnalyticsPieChart` | Donut/pie chart wrapper |
| `AnalyticsDateRangePicker` | Preset buttons + custom calendar range picker |
| `TopItemsTable` | Ranked table for top-performing items |
| `ExportButton` | CSV export button with dropdown |

### MSW Handlers

| Handler | Path | Description |
|---------|------|-------------|
| GET | `/analytics/tenant/overview` | Mock tenant analytics (12.4k views, 342 leads) |
| GET | `/analytics/vendor/overview` | Mock vendor analytics (3.2k views, 89 leads) |
| GET | `/analytics/vendor/listings` | Mock 5 listings with per-listing metrics |
| GET | `/admin/dashboard/stats` | Mock admin stats (42 ACTIVE vendors, 156 PUBLISHED listings) |

### Portal Pages

| Portal | Route | Components |
|--------|-------|------------|
| Platform | `/dashboard/platform` | PlatformDashboardContent (pie charts, bar chart, KPI cards) |
| Tenant | `/dashboard/tenant` | TenantDashboardContent (KPI cards, date range picker, bar chart) |
| Vendor | `/dashboard/vendor` | VendorDashboardContent (KPI cards, top listings table, CSV export) |

---

## 📋 Audit Hooks

> Session 4.4 — ✅ Implemented

| Hook | Endpoint | Method | Description |
|------|----------|--------|-------------|
| `useAuditLogs(filters)` | `/audit/logs` | `GET` | Paginated audit log list with filters (format B) |
| `useAuditLogDetail(id)` | `/audit/logs/:id` | `GET` | Single audit log entry (immutable, 5min cache) |
| `useAuditLogsByTarget(targetType, targetId)` | `/audit/target/:targetType/:targetId` | `GET` | Audit logs for a specific entity |
| `useAuditLogsByActor(actorId)` | `/audit/actor/:actorId` | `GET` | Audit logs by actor (user) |
| `useAuditActionTypes()` | `/audit/action-types` | `GET` | Distinct action types for filter dropdowns (10min cache) |
| `useAuditTargetTypes()` | `/audit/target-types` | `GET` | Distinct target types for filter dropdowns (10min cache) |

### Audit Components

| Component | Description |
|-----------|-------------|
| `AuditLogList` | Paginated table with dynamic filters, pagination, row-click detail |
| `AuditLogItem` | Table row with timestamp, actor icon, action badge, target info |
| `AuditLogFiltersBar` | Filters: action type, target type, actor type, target ID search, date range |
| `AuditLogDetailModal` | Full detail: actor, changes diff (old→new), metadata JSON, request info |
| `ViewAuditHistoryLink` | Contextual link component for entity detail pages |

### Audit Portal Pages

| Portal | Route | Component |
|--------|-------|-----------|
| Platform | `/dashboard/platform/audit` | PlatformAuditContent (global audit logs) |
| Tenant | `/dashboard/tenant/audit` | TenantAuditContent (tenant-scoped logs) |

---

## 🚩 Feature Flags & Experiments Hooks

> Session 4.5 — ✅ Implemented

| Hook | Endpoint | Method | Description |
|------|----------|--------|-------------|
| `useFeatureFlags()` | `/admin/feature-flags` | `GET` | Non-paginated flag list, 30s stale |
| `useFeatureFlagDetail(key)` | `/admin/feature-flags/:key` | `GET` | Includes overrides + targets |
| `useCreateFeatureFlag()` | `/admin/feature-flags` | `POST` | Invalidates `featureFlags.all` |
| `useUpdateFeatureFlag()` | `/admin/feature-flags/:key` | `PATCH` | Dynamic path, invalidates `featureFlags.all` |
| `useAddFlagOverride()` | `/admin/feature-flags/:key/overrides` | `POST` | Invalidates `featureFlags.all` |
| `useAddFlagUserTarget()` | `/admin/feature-flags/:key/user-targets` | `POST` | Invalidates `featureFlags.all` |
| `useCheckFeatureFlag(key)` | `/feature-flags/check?key=...` | `GET` | 5-min stale, any role |
| `useExperiments()` | `/admin/experiments` | `GET` | Non-paginated, 30s stale |
| `useExperimentDetail(key)` | `/admin/experiments/:key` | `GET` | Experiment with variants |
| `useCreateExperiment()` | `/admin/experiments` | `POST` | Invalidates `experiments.all` |
| `useOptInTenantExperiment()` | `/admin/experiments/:key/tenant-opt-in` | `POST` | Invalidates `experiments.all` |

### Feature Flag & Experiment Components

| Component | Description |
|-----------|-------------|
| `FeatureGate` | Conditional rendering based on runtime flag check |
| `FeatureFlagList` | Data table with search, filters, toggle switches |
| `FeatureFlagCreateDialog` | Create form (RHF + Zod) |
| `FeatureFlagDetailView` | Detail page with overrides/user-targets tables |
| `ExperimentsList` | Data table with search, status badges |
| `ExperimentCreateDialog` | Create form with dynamic variants |
| `ExperimentDetailView` | Detail page with variants visualization, tenant opt-in |

### Feature Flag & Experiment Portal Pages

| Portal | Route | Component |
|--------|-------|-----------|
| Platform | `/dashboard/platform/feature-flags` | FeatureFlagList (flag management) |
| Platform | `/dashboard/platform/feature-flags/[key]` | FeatureFlagDetailView (flag detail) |
| Platform | `/dashboard/platform/experiments` | ExperimentsList (experiment management) |
| Platform | `/dashboard/platform/experiments/[key]` | ExperimentDetailView (experiment detail) |

### Feature Flag MSW Mocks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/feature-flags` | `GET` | List all feature flags |
| `/admin/feature-flags` | `POST` | Create feature flag |
| `/admin/feature-flags/:key` | `GET` | Get feature flag detail |
| `/admin/feature-flags/:key` | `PATCH` | Update feature flag |
| `/admin/feature-flags/:key/overrides` | `POST` | Add flag override |
| `/admin/feature-flags/:key/user-targets` | `POST` | Add flag user target |
| `/feature-flags/check` | `GET` | Check feature flag value |
| `/admin/experiments` | `GET` | List all experiments |
| `/admin/experiments` | `POST` | Create experiment |
| `/admin/experiments/:key` | `GET` | Get experiment detail |
| `/admin/experiments/:key/tenant-opt-in` | `POST` | Opt-in tenant to experiment |

---

## 🔔 Notification Hooks

> Session 3.2 — ✅ Implemented

| Hook | Endpoint | Method | Description |
|------|----------|--------|-------------|
| `useNotifications(filters?)` | `/notifications` | `GET` | Paginated notification list (format A) — supports isRead filter |
| `useUnreadCount()` | `/notifications/unread-count` | `GET` | Unread notification count (10s staleTime) |
| `useMarkAsRead()` | `/notifications/:id/read` | `PATCH` | Mark single notification as read |
| `useMarkAllAsRead()` | `/notifications/mark-all-read` | `POST` | Mark all notifications as read |
| `useRealtimeNotifications()` | WebSocket | — | Listens to `notification:new` and `notification:count` events; shows toast + invalidates queries |
| `useNotificationPreferences()` | `/notifications/preferences` | `GET` | User's notification preferences (13 types × 5 channels), 60s staleTime |
| `useUpdateNotificationPreferences()` | `/notifications/preferences` | `PATCH` | Update notification channel toggles (debounced auto-save) |

### Notification Components

| Component | File | Description |
|-----------|------|-------------|
| `NotificationBell` | `modules/notification/components/notification-bell.tsx` | Popover bell icon with unread badge (1-9, 10-99, 99+), pagination |
| `NotificationList` | `modules/notification/components/notification-list.tsx` | Scrollable list with mark-all-read, empty state, load more |
| `NotificationItem` | `modules/notification/components/notification-item.tsx` | Type-specific Lucide icons (19 types), click to navigate + mark read |
| `NotificationPreferencesGrid` | `modules/notification/components/notification-preferences-grid.tsx` | Category-grouped toggle grid (13 types × 5 channels), debounced auto-save, showWebhook prop |
| `NotificationPreferencesGridSkeleton` | (same file) | Loading skeleton for preferences grid |

### Notification MSW Mocks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/notifications` | `GET` | Paginated mock notifications (10 items, isRead filter) |
| `/notifications/unread-count` | `GET` | Unread count from mutable store |
| `/notifications/:id/read` | `PATCH` | Mark notification read (mutable store) |
| `/notifications/mark-all-read` | `POST` | Mark all read (mutable store) |

---

## 🔍 Search Hooks

> Session 4.1 — ✅ Implemented

| Hook | Endpoint | Method | Description |
|------|----------|--------|-------------|
| `useSearch({ isPublic?, defaults? })` | `/search/listings` or `/public/search/listings` | GET | Core search with URL-synced params, 300ms debounce, keepPreviousData. Returns data, params, setQuery, setPage, setSort, setParams, clearFilters. Format B. |
| `useAutocomplete(query)` | `/search/suggestions` | GET | Autocomplete suggestions, 150ms debounce, min 2 chars. Returns Suggestion[]. |
| `useSearchFacets(facets?)` | — | — | Memoized facet formatting from SearchResponse.meta.facets into FormattedFacets. |
| `useSearchKeyboard({ onSelect, itemCount, isOpen, onClose })` | — | — | Arrow/Enter/Escape keyboard navigation for autocomplete dropdown. |

### Search Types

| Type | File | Fields |
|------|------|--------|
| `SearchParams` | `modules/search/types/index.ts` | q, verticalType, priceMin, priceMax, city, state, lat, lng, radius, attributes, sort, page, pageSize, highlight, featuredOnly |
| `SearchResponse` | `modules/search/types/index.ts` | data: SearchHit[], meta: { requestId, pagination, facets? } |
| `SearchHit` | `modules/search/types/index.ts` | id, title, slug, price, currency, location, primaryImageUrl, verticalType, attributes, vendor, isFeatured, highlights |
| `Suggestion` | `modules/search/types/index.ts` | id, title, slug, price, city |
| `SearchFacets` | `modules/search/types/index.ts` | verticalTypes, cities, priceRanges, propertyTypes, bedrooms, furnishing |
| `SearchSort` | `modules/search/types/index.ts` | "relevance" \| "newest" \| "oldest" \| "price:asc" \| "price:desc" |

### Search Components

| Component | File | Description |
|-----------|------|-------------|
| `SearchInput` | `modules/search/components/search-input.tsx` | Search bar with autocomplete, keyboard nav, clear, size variants |
| `SearchResults` | `modules/search/components/search-results.tsx` | Results with grid/list toggle, pagination, empty state |
| `SearchResultCard` | `modules/search/components/search-result-card.tsx` | Grid + list card views with skeletons |
| `SearchFilters` | `modules/search/components/search-filters.tsx` | Sheet-based mobile filter panel |
| `SearchFiltersSidebar` | `modules/search/components/search-filters.tsx` | Desktop sticky sidebar filters |
| `SearchSortSelect` | `modules/search/components/search-sort-select.tsx` | Sort dropdown |
| `SuggestionsList` | `modules/search/components/suggestions-list.tsx` | Autocomplete dropdown |
| `HighlightedText` | `modules/search/components/highlighted-text.tsx` | Safe HTML rendering for OpenSearch highlights |
| `GeoSearchControls` | `modules/search/components/geo-search-controls.tsx` | Geolocation + radius slider |
| `SearchResultsSkeleton` | `modules/search/components/search-results-skeleton.tsx` | Loading skeleton |

### Search MSW Handlers

| Endpoint | Method | Mock Data |
|----------|--------|-----------|
| `/search/listings` | GET | 12 Malaysian property listings with filtering, sorting, highlights, facets |
| `/public/search/listings` | GET | Same as above (public endpoint) |
| `/search/suggestions` | GET | Filtered suggestions (min 2 chars, max 5 results) |

---

## 📰 Activity Hooks

> Session 4.6 — ✅ Implemented

Activity feeds are a **presentation layer** over existing audit log endpoints. No new backend API needed.

### Activity Hooks

| Hook | Endpoint | Method | Description |
|------|----------|--------|-------------|
| `useActivityFeed({ targetType, targetId, page?, pageSize?, hideInternal?, enabled? })` | `GET /audit/target/:targetType/:targetId` | GET | Entity-scoped activity with pagination. Transforms `AuditLogEntry` → `ActivityItem` |
| `useRecentActivity({ portal, limit?, actionType?, hideInternal?, enabled? })` | `GET /audit/logs` | GET | Dashboard widget — recent activity with small page size |

### Activity Types

| Type | Location | Description |
|------|----------|-------------|
| `ActivityItem` | `modules/activity/types/index.ts` | UI-friendly wrapper: id, description, actor, actorType, actionType, category, targetType, targetId, timestamp, isInternal, metadata, oldValue, newValue |
| `ActivityCategory` | `modules/activity/types/index.ts` | 10 categories: auth, listing, vendor, tenant, interaction, review, media, subscription, admin, system |
| `ActivityFeedParams` | `modules/activity/types/index.ts` | Feed query params |

### Activity Components

| Component | Location | Description |
|-----------|----------|-------------|
| `ActivityItemComponent` | `modules/activity/components/activity-item.tsx` | Single timeline entry with category icon, expandable before/after diff, relative time |
| `ActivityFeed` | `modules/activity/components/activity-feed.tsx` | Full timeline view with pagination controls, loading skeleton, empty state |
| `ActivityFeedWidget` | `modules/activity/components/activity-feed-widget.tsx` | Compact dashboard card with ScrollArea, uses `useRecentActivity` |

### Activity Utilities

| Utility | Description |
|---------|-------------|
| `toActivityItem(entry)` | Transforms `AuditLogEntry` → `ActivityItem` |
| `filterForVendor(items)` | Removes internal-only activities |
| `getActivityCategory(actionType)` | Maps action type prefix → category |

### Activity MSW Mocks

Reuses existing audit handlers — no new handler file needed:
- `GET /audit/logs` → `lib/mocks/handlers/audit.ts`
- `GET /audit/target/:targetType/:targetId` → `lib/mocks/handlers/audit.ts`

---

## 🌐 WebSocket Events

> Session 3.1 — ✅ Implemented

### WebSocket Hooks

| Hook | Location | Description |
|------|----------|-------------|
| `useSocket()` | `lib/websocket/socket-provider.tsx` | Access SocketContext — `socket`, `notificationSocket`, `isConnected`, `emit`, `joinRoom`, `leaveRoom`, `disconnect` |
| `useSocketEvent<T>(event, handler, deps?, options?)` | `lib/websocket/use-socket-event.ts` | Subscribe to a Socket.IO event with auto-cleanup. Options: `target` (main/notification), `enabled` |
| `useSocketRoom(room)` | `lib/websocket/use-socket-room.ts` | Join a room on mount, leave on unmount. Returns `{ joined }` |
| `useRealtimeSync({ tenantId, showToasts? })` | `lib/websocket/hooks/use-realtime-sync.ts` | Master event→query invalidation: 12 event subscriptions across listings, interactions, vendors, reviews, subscriptions |
| `useListingViewerCount(listingId)` | `lib/websocket/hooks/use-listing-viewer-count.ts` | Live viewer count — joins listing room, returns `{ viewerCount, joined }` |
| `useInteractionTyping(interactionId)` | `lib/websocket/hooks/use-interaction-typing.ts` | Typing indicators — 3s timeout, throttled `sendTyping()`, returns `{ typingUserIds, isAnyoneTyping, sendTyping, joined }` |
| `useReconnectionHandler()` | `lib/websocket/hooks/use-reconnection-handler.ts` | Detects reconnection, invalidates all stale queries, shows success toast |

### WebSocket Components

| Component | Location | Description |
|-----------|----------|-------------|
| `SocketProvider` | `lib/websocket/socket-provider.tsx` | Context provider — dual connections (portal namespace + /notifications), JWT auth, exponential backoff. Props: `token`, `portal`, `tenantId?`, `disabled?` |
| `RealtimeSyncProvider` | `lib/websocket/realtime-sync-provider.tsx` | Composite provider — activates `useRealtimeSync`, `useRealtimeNotifications`, `useReconnectionHandler`. Must be inside SocketProvider + TenantProvider |
| `ConnectionStatusBanner` | `lib/websocket/connection-status.tsx` | Fixed bottom banner shown after 2s of disconnection. Auto-hides on reconnection |
| `ConnectionStatusIndicator` | `lib/websocket/connection-status.tsx` | Small colored dot with optional label. Props: `showLabel?`, `className?` |
| `ConnectionStatusIcon` | `lib/websocket/connection-status.tsx` | Wifi/WifiOff icon with status color |

### Socket.IO Namespaces

| Namespace | Portal | Description |
|-----------|--------|-------------|
| `/` | Customer (default) | Default namespace for customers |
| `/platform` | Platform Admin | SUPER_ADMIN events |
| `/tenant` | Tenant Admin | Tenant-scoped events |
| `/vendor` | Vendor Portal | Vendor-scoped events |
| `/notifications` | All portals | Always connected, notification events |

### Event Constants

| Constant Group | Events | Location |
|----------------|--------|----------|
| `LISTING_EVENTS` | `listing:created`, `listing:updated`, `listing:published`, `listing:unpublished`, `listing:deleted`, `listing:viewers` | `lib/websocket/types.ts` |
| `INTERACTION_EVENTS` | `interaction:new`, `interaction:updated`, `interaction:message`, `interaction:typing` | `lib/websocket/types.ts` |
| `VENDOR_EVENTS` | `vendor:approved`, `vendor:suspended` | `lib/websocket/types.ts` |
| `REVIEW_EVENTS` | `review:created` | `lib/websocket/types.ts` |
| `SUBSCRIPTION_EVENTS` | `subscription:changed` | `lib/websocket/types.ts` |
| `NOTIFICATION_EVENTS` | `notification:new`, `notification:count` | `lib/websocket/types.ts` |
| `PRESENCE_EVENTS` | `presence:online`, `presence:offline` | `lib/websocket/types.ts` |

### Provider Integration

SocketProvider is integrated in all 4 portal layouts (with RealtimeSyncProvider):
- `app/dashboard/(auth)/platform/layout.tsx` — portal="platform"
- `app/dashboard/(auth)/tenant/layout.tsx` — portal="tenant", tenantId from context
- `app/dashboard/(auth)/vendor/layout.tsx` — portal="vendor", tenantId from context
- `app/dashboard/(auth)/account/layout.tsx` — portal="account"

### Event → Query Invalidation Mapping (Session 3.3)

| WebSocket Event | Query Keys Invalidated | Toast |
|-----------------|------------------------|-------|
| `listing:created` | `["tenant", tenantId, "listings"]` | "A new listing has been created" |
| `listing:updated` | `["tenant", tenantId, "listings"]`, `[...listings, "detail", listingId]` | — |
| `listing:published` | `["tenant", tenantId, "listings"]`, `[...listings, "detail", listingId]` | "A listing has been published" |
| `listing:unpublished` | `["tenant", tenantId, "listings"]`, `[...listings, "detail", listingId]` | — |
| `listing:deleted` | `["tenant", tenantId, "listings"]` | — |
| `interaction:new` | `["tenant", tenantId, "interactions"]` | "New inquiry received" |
| `interaction:updated` | `["tenant", tenantId, "interactions"]`, `[...interactions, "detail", id]` | — |
| `interaction:message` | `[...interactions, "detail", interactionId]` | "New message from {sender}" |
| `vendor:approved` | `["tenant", tenantId, "vendors"]`, `[...vendors, "detail", vendorId]` | "A vendor has been approved" |
| `vendor:suspended` | `["tenant", tenantId, "vendors"]`, `[...vendors, "detail", vendorId]` | — |
| `review:created` | `["tenant", tenantId, "reviews"]`, `[...vendors, "detail", vendorId]` | "A new review has been submitted" |
| `subscription:changed` | `["tenant", tenantId, "subscriptions"]` | "Subscription has been updated" |

---

## 🏗️ Vertical Registry (Session 3.4)

### Vertical API Functions

| Function | File | Endpoint | Description |
|----------|------|----------|-------------|
| `fetchVerticals()` | `verticals/registry/api.ts` | `GET /api/v1/verticals` | Fetch all vertical definitions |
| `fetchVertical(type)` | `verticals/registry/api.ts` | `GET /api/v1/verticals/:type` | Fetch single vertical by type |
| `fetchVerticalSchema(type, version?)` | `verticals/registry/api.ts` | `GET /api/v1/verticals/:type/schema` | Fetch attribute schema for a vertical |

### Vertical Query Hooks

| Hook | File | Query Key | staleTime | Description |
|------|------|-----------|-----------|-------------|
| `useVerticals()` | `verticals/registry/queries.ts` | `["verticals", "list"]` | 30 min | All vertical definitions |
| `useVertical(type)` | `verticals/registry/queries.ts` | `["verticals", "schema", type]` | 30 min | Single vertical definition |
| `useVerticalSchema(type, version?)` | `verticals/registry/queries.ts` | `["verticals", "schema", type]` | 30 min | Attribute schema for a vertical |

### Vertical Registry Singleton

| Method | Description |
|--------|-------------|
| `VerticalRegistry.loadDefinitions()` | Load all definitions into cache |
| `VerticalRegistry.getDefinition(type)` | Get cached definition by type |
| `VerticalRegistry.getAllDefinitions()` | Get all cached definitions |
| `VerticalRegistry.loadSchema(type, version?)` | Load and cache a schema |
| `VerticalRegistry.getSchema(type, version?)` | Get cached schema |
| `VerticalRegistry.getSearchMapping(type)` | Get search mapping for a vertical |
| `VerticalRegistry.getAttributes(type, version?, group?)` | Get attributes, optionally filtered by group |
| `VerticalRegistry.invalidate()` | Clear all caches |

### Zod Schema Generator

| Function | File | Description |
|----------|------|-------------|
| `generateZodSchema(schema, mode)` | `verticals/registry/zod.ts` | Generate Zod validation from AttributeSchema. Mode: `"draft"` (minimal) or `"publish"` (strict) |

### Mapper Utilities

| Function | File | Description |
|----------|------|-------------|
| `groupAttributes(schema)` | `verticals/registry/mappers.ts` | Group attributes by UI group, sorted by order |
| `getRequiredAttributes(schema, mode)` | `verticals/registry/mappers.ts` | Get attributes required for draft/publish |
| `getCardDisplayAttributes(schema)` | `verticals/registry/mappers.ts` | Get attributes to show in card views |
| `getDetailDisplayAttributes(schema)` | `verticals/registry/mappers.ts` | Get attributes to show in detail views |
| `buildDefaultValues(schema)` | `verticals/registry/mappers.ts` | Build RHF default values from attribute definitions |
| `getFilterGroups(mapping)` | `verticals/registry/mappers.ts` | Extract grouped filterable fields from search mapping |

### Attribute Renderer Components

| Component | File | Description |
|-----------|------|-------------|
| `AttributeRenderer` | `verticals/attribute-renderer/renderer.tsx` | Type-based field selection — maps attribute type to field component |
| `DynamicForm` | `verticals/attribute-renderer/dynamic-form.tsx` | Renders full attribute schema as grouped, collapsible sections |
| `StringField` | `verticals/attribute-renderer/fields/StringField.tsx` | String/textarea field |
| `NumberField` | `verticals/attribute-renderer/fields/NumberField.tsx` | Numeric input with prefix/suffix units |
| `SelectField` | `verticals/attribute-renderer/fields/SelectField.tsx` | Enum single-select dropdown |
| `MultiSelectField` | `verticals/attribute-renderer/fields/MultiSelectField.tsx` | Multi-select with checkboxes and badges |
| `BooleanField` | `verticals/attribute-renderer/fields/BooleanField.tsx` | Boolean toggle switch |
| `DateField` | `verticals/attribute-renderer/fields/DateField.tsx` | Date input |
| `RangeField` | `verticals/attribute-renderer/fields/RangeField.tsx` | Min/max range input pair |

### Attribute Display Helpers

| Function | File | Description |
|----------|------|-------------|
| `formatAttributeValue(attribute, value)` | `verticals/attribute-renderer/helpers.ts` | Format a single attribute value for display |
| `formatAttributesForDisplay(schema, values)` | `verticals/attribute-renderer/helpers.ts` | Get formatted attribute display list |
| `getAttributeOptions(attribute)` | `verticals/attribute-renderer/helpers.ts` | Get non-deprecated options for select fields |

### Filter Builder Components

| Component | File | Description |
|-----------|------|-------------|
| `FilterBuilder` | `verticals/filter-builder/builder.tsx` | Dynamic filter UI with URL sync. Variants: `sidebar`, `horizontal`, `sheet` |
| `SelectFilter` | `verticals/filter-builder/components/SelectFilter.tsx` | Single-select filter |
| `MultiSelectFilter` | `verticals/filter-builder/components/MultiSelectFilter.tsx` | Multi-select filter with checkboxes |
| `RangeFilter` | `verticals/filter-builder/components/RangeFilter.tsx` | Min/max range filter with presets |
| `TextFilter` | `verticals/filter-builder/components/TextFilter.tsx` | Text search filter |
| `BooleanFilter` | `verticals/filter-builder/components/BooleanFilter.tsx` | Boolean toggle filter |

### Filter Querystring Utilities

| Function | File | Description |
|----------|------|-------------|
| `serializeFilters(filters, mapping)` | `verticals/filter-builder/querystring.ts` | Convert filter values to URLSearchParams |
| `deserializeFilters(params, mapping)` | `verticals/filter-builder/querystring.ts` | Parse URLSearchParams into filter values |
| `buildApiParams(filters, mapping)` | `verticals/filter-builder/querystring.ts` | Convert filter values to API query params |
| `countActiveFilters(filters)` | `verticals/filter-builder/querystring.ts` | Count non-empty filter values |

### MSW Mock Handlers (Verticals)

| Handler | Endpoint | Description |
|---------|----------|-------------|
| `GET /api/v1/verticals` | List all verticals | Returns REAL_ESTATE definition with full schema |
| `GET /api/v1/verticals/:type` | Get single vertical | Returns definition by type (case-insensitive) |
| `GET /api/v1/verticals/:type/schema` | Get attribute schema | Returns AttributeSchema with 16 attributes in 4 groups |

---

## 🏠 Real Estate Vertical (Session 3.5)

### Types & Constants

| Export | File | Description |
|--------|------|-------------|
| `PropertyType` | `verticals/real-estate/types.ts` | Union of 16 property types (apartment, condominium, terrace, etc.) |
| `ListingType` | `verticals/real-estate/types.ts` | `"sale"` \| `"rent"` |
| `TenureType` | `verticals/real-estate/types.ts` | freehold, leasehold, malay_reserve, bumi_lot |
| `FurnishingType` | `verticals/real-estate/types.ts` | unfurnished, partially_furnished, fully_furnished |
| `RealEstateAttributes` | `verticals/real-estate/types.ts` | Full attributes interface |
| `RESIDENTIAL_PROPERTY_TYPES` | `verticals/real-estate/types.ts` | Array of types requiring bedrooms |
| `HIGHRISE_PROPERTY_TYPES` | `verticals/real-estate/types.ts` | Array of types requiring floor level |
| `PROPERTY_TYPE_LABELS` | `verticals/real-estate/constants.ts` | Display labels for all 16 property types |

### Attribute Schema

| Export | File | Description |
|--------|------|-------------|
| `realEstateSchema` | `verticals/real-estate/schema.ts` | AttributeSchema: 20 attributes in 9 groups |

### Zod Validation Schemas

| Schema | File | Description |
|--------|------|-------------|
| `realEstateDraftSchema` | `verticals/real-estate/validation.ts` | Draft mode: propertyType + listingType required |
| `realEstatePublishSchema` | `verticals/real-estate/validation.ts` | Publish mode: builtUpSize, bedrooms, bathrooms required + cross-field validation |
| `realEstateAttributesSchema` | `verticals/real-estate/validation.ts` | General validation with cross-field rules |

**Cross-field validations:**
- Bedrooms required for residential property types
- Land size required for land listings
- Built-up size required for publish (except land)

### Formatters

| Function | File | Description |
|----------|------|-------------|
| `formatPrice(value, attrs?)` | `verticals/real-estate/formatters.ts` | MYR currency format, adds "/month" for rent |
| `formatCompactPrice(value)` | `verticals/real-estate/formatters.ts` | Compact format (RM300K, RM1.2M) |
| `formatSize(value)` | `verticals/real-estate/formatters.ts` | Size with "sq ft" unit |
| `formatBedrooms(value)` | `verticals/real-estate/formatters.ts` | "3 beds" format |
| `formatPropertyType(value)` | `verticals/real-estate/formatters.ts` | Enum → display label |
| `realEstateFormatters` | `verticals/real-estate/formatters.ts` | Combined formatters record for vertical registration |

### Components

| Component | File | Description |
|-----------|------|-------------|
| `PropertyTypeSelector` | `verticals/real-estate/components/PropertyTypeSelector.tsx` | Visual grid selector with icons for 16 property types |
| `ListingTypeSelector` | `verticals/real-estate/components/ListingTypeSelector.tsx` | Toggle-style Sale/Rent selector |
| `TenureSelector` | `verticals/real-estate/components/TenureSelector.tsx` | Dropdown with Malaysian tenure types |
| `FurnishingSelector` | `verticals/real-estate/components/FurnishingSelector.tsx` | Toggle-style furnishing level selector |
| `RealEstateAttributeForm` | `verticals/real-estate/components/RealEstateAttributeForm.tsx` | Complete grouped form with conditional field visibility |

**Conditional visibility rules:**
- Tenure section: only shown when `listingType === "sale"`
- Rental Terms section: only shown when `listingType === "rent"`
- Floor Level: only shown for highrise types (apartment, condominium, studio, penthouse, duplex)
- Total Floors: only for apartment/condominium
- Rooms & Parking: only for residential property types
- Land Size: only for terrace, semi_detached, bungalow, land
- Built-up Size: only for property types that have built-up area

---

## Session 3.6: Real Estate Vertical - Filters

### Filter Configuration

| Export | File | Description |
|--------|------|-------------|
| `realEstateSearchMapping` | `verticals/real-estate/filters.ts` | VerticalSearchMapping with 8 filterable, 5 sortable, 3 range, 4 facet fields |
| `realEstateFilters` | `verticals/real-estate/filters.ts` | Alias for realEstateSearchMapping |
| `SALE_PRICE_PRESETS` | `verticals/real-estate/filters.ts` | 5 presets: Under RM300K → Above RM2M |
| `RENT_PRICE_PRESETS` | `verticals/real-estate/filters.ts` | 4 presets: Under RM1,500 → Above RM5,000 |
| `BEDROOM_OPTIONS` | `verticals/real-estate/filters.ts` | 1, 2, 3, 4, 5+ bedroom options |
| `BATHROOM_OPTIONS` | `verticals/real-estate/filters.ts` | 1, 2, 3+ bathroom options |
| `getPricePresets(listingType?)` | `verticals/real-estate/filters.ts` | Returns sale or rent presets based on listing type |

### Filter Components

| Component | File | Description |
|-----------|------|-------------|
| `PriceRangeFilter` | `verticals/real-estate/components/PriceRangeFilter.tsx` | MYR price range with sale/rent preset toggles, custom min/max inputs |
| `RoomCountFilter` | `verticals/real-estate/components/RoomCountFilter.tsx` | Bedroom/bathroom toggle groups (1-5+ beds, 1-3+ baths) |
| `PropertyTypeFacet` | `verticals/real-estate/components/PropertyTypeFacet.tsx` | Property type facet with icons, counts, expand/collapse |
| `RealEstateSearchFilters` | `verticals/real-estate/components/RealEstateSearchFilters.tsx` | Composite panel: sidebar, horizontal, mobile sheet variants |

### Filter Hooks

| Hook | File | Description |
|------|------|-------------|
| `useRealEstateFilters` | `verticals/real-estate/hooks/use-real-estate-filters.ts` | URL-synced typed filter state with `setFilter`, `setPriceRange`, `setRoomCounts`, `setPropertyTypes`, `clearAll`, `apiParams`, `setSort`, `setPage` |

### MSW Mock Endpoints (Filters)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/listings/facets` | Facet counts for propertyType, listingType, furnishing. Optional `?listingType=` param |

**Attribute-level filters added to `GET /api/v1/listings`:**
- `propertyType` (comma-separated multi), `listingType`, `bedrooms` (supports "5+"), `bathrooms` (supports "3+"), `furnishing`, `price_min/price_max`, `builtUpSize_min/builtUpSize_max`

---

## Session 4.7: Public Listing & Vendor Pages

> **Architecture Note:** Public pages use Server Components with native `fetch()` (ISR-compatible) instead of TanStack Query hooks. No new client-side hooks were added.

### Server Fetch Functions

| Function | File | Description |
|----------|------|-------------|
| `publicFetch<T>()` | `lib/api/public-api.ts` | Generic server-side fetch with ISR revalidation, 429/404 handling |
| `fetchPublicListing(idOrSlug)` | `lib/api/public-api.ts` | Fetch single listing by ID or slug (revalidate: 60s) |
| `fetchPublicVendor(idOrSlug)` | `lib/api/public-api.ts` | Fetch single vendor by ID or slug (revalidate: 120s) |
| `fetchPublicSearch(params)` | `lib/api/public-api.ts` | Search listings with filters/pagination (revalidate: 30s) |
| `fetchRelatedListings(listing, limit)` | `lib/api/public-api.ts` | Fetch related listings by vertical/city (revalidate: 60s) |
| `fetchVendorListings(vendorId, page, pageSize)` | `lib/api/public-api.ts` | Fetch vendor's active listings (revalidate: 60s) |

### Public API Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/public/listings/:idOrSlug` | Public listing detail (by ID or slug) |
| GET | `/api/v1/public/vendors/:idOrSlug` | Public vendor profile (by ID or slug) |
| GET | `/api/v1/public/search/listings` | Public search with q, verticalType, city, vendorId, price range, sort, pagination |

### Components

| Component | File | Description |
|-----------|------|-------------|
| `ListingGallery` | `app/(public)/listings/[idOrSlug]/_components/listing-gallery.tsx` | Multi-image grid (primary + 4 thumbs, +N overlay) |
| `ListingInfo` | `app/(public)/listings/[idOrSlug]/_components/listing-info.tsx` | Title, price, location, description, badges |
| `ListingAttributes` | `app/(public)/listings/[idOrSlug]/_components/listing-attributes.tsx` | Icon-mapped key attributes (beds, baths, area, etc.) |
| `ListingVendorCard` | `app/(public)/listings/[idOrSlug]/_components/listing-vendor-card.tsx` | Vendor sidebar card with rating and contact |
| `ListingInquiryCta` | `app/(public)/listings/[idOrSlug]/_components/listing-inquiry-cta.tsx` | Inquiry/call/save CTAs (redirect to login) |
| `ListingBreadcrumbs` | `app/(public)/listings/[idOrSlug]/_components/listing-breadcrumbs.tsx` | Home > Search > Vertical > City > Title |
| `ListingSchemaOrg` | `app/(public)/listings/[idOrSlug]/_components/listing-schema-org.tsx` | JSON-LD (RealEstateListing or Product) |
| `RelatedListings` | `app/(public)/listings/[idOrSlug]/_components/related-listings.tsx` | Grid of 4 related listing cards |
| `VendorHeader` | `app/(public)/vendors/[idOrSlug]/_components/vendor-header.tsx` | Logo, name, type badge, rating, stats |
| `VendorInfo` | `app/(public)/vendors/[idOrSlug]/_components/vendor-info.tsx` | Description, contact, address, stats grid |
| `VendorListingsGrid` | `app/(public)/vendors/[idOrSlug]/_components/vendor-listings-grid.tsx` | Active listings grid with empty state |
| `VendorBreadcrumbs` | `app/(public)/vendors/[idOrSlug]/_components/vendor-breadcrumbs.tsx` | Home > Search > Vendor Name |
| `VendorSchemaOrg` | `app/(public)/vendors/[idOrSlug]/_components/vendor-schema-org.tsx` | JSON-LD Organization schema |
| `RateLimitFallback` | `components/common/rate-limit-fallback.tsx` | Shared 429 fallback with retry countdown |

### MSW Mock Handlers

| Handler | File | Description |
|---------|------|-------------|
| GET `/public/listings/:idOrSlug` | `lib/mocks/handlers/public.ts` | 4 mock listings (by ID or slug match) |
| GET `/public/vendors/:idOrSlug` | `lib/mocks/handlers/public.ts` | 3 mock vendors (by ID or slug match) |
| GET `/public/search/listings` | `lib/mocks/handlers/public.ts` | Filter/sort/paginate mock listings |

### Types

| Type | File | Description |
|------|------|-------------|
| `PublicListingDetail` | `lib/api/public-api.ts` | Full listing detail with media, vendor, location, attributes |
| `PublicVendorProfile` | `lib/api/public-api.ts` | Vendor profile with contact, stats, rating |
| `PublicSearchHit` | `lib/api/public-api.ts` | Search result item (listing summary) |
| `PublicSearchResponse` | `lib/api/public-api.ts` | Paginated search response with facets |
| `RateLimitError` | `lib/api/public-api.ts` | Error class with retryAfter for 429 responses |

**Running Total: 99 hooks** (unchanged — Session 4.7 uses Server Component fetch, not client hooks)

---

## Session 4.8: Accessibility Compliance

> No new API query hooks — this session creates accessibility utilities (hooks + components + testing).

### Accessibility Hooks (`lib/accessibility/hooks/`)

| Hook | File | Purpose |
|------|------|---------|
| `useReducedMotion` | `use-reduced-motion.ts` | Detects `prefers-reduced-motion: reduce` media query |
| `useAnnounce` | `use-announce.ts` | Returns `announce(message, priority)` + `Announcer` component for live regions |
| `useFocusTrap` | `use-focus-trap.ts` | Traps focus within a container (Tab/Shift+Tab cycling) |
| `useArrowNavigation` | `use-arrow-navigation.ts` | Arrow key navigation for lists (horizontal/vertical, loop, Home/End) |
| `useKeyboardShortcuts` | `use-keyboard-shortcuts.ts` | Global/scoped keyboard shortcuts with modifier keys |

### Accessibility Components (`lib/accessibility/components/`)

| Component | File | Purpose |
|-----------|------|---------|
| `SkipLink` | `skip-link.tsx` | Skip-to-main-content link (sr-only → visible on focus) |
| `VisuallyHidden` | `visually-hidden.tsx` | Render content visible only to screen readers |
| `LiveRegion` | `live-region.tsx` | ARIA live region wrapper (polite/assertive) |
| `AccessibleField` | `accessible-field.tsx` | Form field wrapper with label, error, aria-describedby |
| `AccessibleButton` | `accessible-button.tsx` | Button with loading state, icon-only support, 44px touch target |
| `RouteAnnouncer` | `route-announcer.tsx` | Announces page navigation to screen readers |

### Testing Utilities (`lib/accessibility/testing/`)

| Export | File | Purpose |
|--------|------|---------|
| `checkA11y` | `axe-config.ts` | Run axe-core audit on a DOM element |
| `formatViolations` | `axe-config.ts` | Format violations into readable console output |
| `initAxeDevTools` | `axe-config.ts` | Initialize @axe-core/react for dev-time auditing |
| `AXE_WCAG_TAGS` | `axe-config.ts` | WCAG 2.1 AA rule tag constants |
| `AXE_DEFAULT_OPTIONS` | `axe-config.ts` | Default axe run options for WCAG 2.1 AA |

### ARIA Improvements Summary

| File | Improvements |
|------|-------------|
| `components/common/page-skeletons.tsx` | 8 skeleton wrappers: `role="status" aria-busy="true"` + sr-only text |
| `components/common/error-boundary.tsx` | 3 fallbacks: `role="alert" aria-live="assertive"` + `aria-hidden` on icons |
| `components/common/suspense-boundary.tsx` | 4 fallbacks: `role="status" aria-busy="true"` + `aria-hidden` on spinners |
| `components/common/list-page.tsx` | ~13 improvements: `aria-label`, `aria-pressed`, `aria-hidden`, `<nav>` pagination |
| `components/common/page-header.tsx` | 4 improvements: skeleton status, `aria-hidden` icons, status aria-label |

### CSS Enhancements (`app/globals.css`)

| Feature | Description |
|---------|-------------|
| `:focus-visible` | Enhanced outline ring for keyboard navigation |
| `prefers-reduced-motion` | Disables all animations/transitions |
| `forced-colors: active` | High contrast mode support with visible borders |

**Running Total: 99 hooks** (unchanged — Session 4.8 creates accessibility utilities, not API query hooks)

---

## Session 4.9: Performance Optimization

**No new API hooks** — this session creates client-side performance utilities.

### Performance Hooks (3 hooks — not API-bound)

| Hook | File | Description |
|------|------|-------------|
| `useDebounce` | `lib/performance/hooks/use-debounce.ts` | Imperative callback debounce with cancel/flush |
| `useThrottle` | `lib/performance/hooks/use-throttle.ts` | Leading-edge throttle with trailing call support |
| `useIntersectionObserver` | `lib/performance/hooks/use-intersection-observer.ts` | Viewport detection via IntersectionObserver |

### Performance Components (4 components)

| Component | File | Description |
|-----------|------|-------------|
| `WebVitalsReporter` | `lib/performance/web-vitals.tsx` | Web Vitals monitoring (LCP, CLS, INP, FCP, TTFB) |
| `OptimizedImage` | `lib/performance/components/optimized-image.tsx` | Next.js Image wrapper with placeholder, lazy loading, CLS prevention |
| `PrefetchLink` | `lib/performance/components/prefetch-link.tsx` | Next.js Link with hover/visible/eager/none prefetch strategies |
| `LoadingBoundary` | `lib/performance/components/loading-boundary.tsx` | Suspense wrapper with 7 fallback variants |

### Performance Utilities (1 factory)

| Utility | File | Description |
|---------|------|-------------|
| `lazyComponent` | `lib/performance/lazy.tsx` | Code-splitting factory with Suspense + preload |

### next.config.ts Enhancements

| Feature | Description |
|---------|-------------|
| Image formats | AVIF/WebP with device sizes |
| Caching headers | Static assets (1yr immutable), images (1d + SWR), fonts (1yr immutable) |
| Security headers | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy |
| Console removal | Production builds strip console.log (keep warn/error) |

### Web Vitals Thresholds

| Metric | Good | Needs Improvement |
|--------|------|-------------------|
| LCP | < 2500ms | < 4000ms |
| CLS | < 0.1 | < 0.25 |
| INP | < 200ms | < 500ms |
| FCP | < 1800ms | < 3000ms |
| TTFB | < 800ms | < 1800ms |

**Running Total: 99 hooks** (unchanged — Session 4.9 creates performance utilities, not API query hooks)

---

## Session 4.10: Testing Setup

No new API hooks. This session sets up the testing infrastructure.

### Testing Stack

| Package | Version | Purpose |
|---------|---------|---------|
| vitest | 4.0.18 | Unit/integration test runner |
| @testing-library/react | 16.3.2 | React component testing |
| @testing-library/jest-dom | - | DOM assertion matchers |
| @testing-library/user-event | 14.6.1 | User interaction simulation |
| jsdom | 28.1.0 | DOM environment |
| @playwright/test | - | E2E testing |
| msw | 2.12.10 | API mocking (pre-existing) |

### Test Coverage

| Test File | Tests | Duration |
|-----------|-------|----------|
| query-keys.test.ts | 25 | 23ms |
| normalize-error.test.ts | 33 | 15ms |
| permissions.test.tsx | 30 | 44ms |
| zod-schema.test.ts | 24 | 31ms |
| querystring.test.ts | 28 | 24ms |
| auth-flow.test.ts | 9 | 1942ms |
| **Total** | **149** | **~2s** |

### npm Scripts Added

| Script | Command |
|--------|---------|
| `test` | `vitest run` |
| `test:unit` | `vitest run --exclude e2e` |
| `test:watch` | `vitest` |
| `test:coverage` | `vitest run --coverage` |
| `test:e2e` | `playwright test` |

**Running Total: 99 hooks** (unchanged — Session 4.10 creates testing infrastructure, not API query hooks)

---

## Session 4.11: ENV Config & Deployment

> No new API hooks — this session covers environment configuration, security headers, and deployment infrastructure.

### Configuration Modules

| Module | File | Description |
|--------|------|-------------|
| `env` | `lib/config/env.ts` | Zod-validated env vars (client + server schemas) |
| `buildConfig` | `lib/config/index.ts` | Static build-time config (bundled into JS) |
| `runtimeConfig` | `lib/config/index.ts` | Dynamic runtime config (server-aware getters) |

### Environment Variables

| Variable | Scope | Default |
|----------|-------|---------|
| `NEXT_PUBLIC_APP_ENV` | Client | `local` |
| `NEXT_PUBLIC_API_BASE_URL` | Client | `http://localhost:3000/api/v1` |
| `NEXT_PUBLIC_WS_URL` | Client | `http://localhost:3000` |
| `NEXT_PUBLIC_PORTAL_NAME` | Client | `Zam-Property` |
| `NEXT_PUBLIC_API_MOCKING` | Client | `false` |
| `NEXT_PUBLIC_ENABLE_OPS_UI` | Client | `false` |
| `NEXT_PUBLIC_SENTRY_DSN` | Client | _(empty)_ |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Client | _(empty)_ |
| `API_INTERNAL_BASE_URL` | Server | `http://localhost:3000/api/v1` |
| `OPENAPI_SPEC_URL` | Server | `http://localhost:3000/api/docs-json` |
| `SENTRY_AUTH_TOKEN` | Server | _(none)_ |

### Security Headers

| Header | Value |
|--------|-------|
| Content-Security-Policy | Dynamic CSP (based on API/WS origins) |
| Strict-Transport-Security | 1 year + includeSubDomains + preload (prod only) |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| Cross-Origin-Opener-Policy | same-origin |
| Cross-Origin-Resource-Policy | same-origin |

**Running Total: 99 hooks** (unchanged — Session 4.11 is env/deploy configuration, not API hooks)

---

## � Pricing Hooks

> Session 4.12 — ✅ Implemented

### Hooks (11)

| Hook | Endpoint | Method | Notes |
|------|----------|--------|-------|
| `usePricingConfigs(params)` | `/pricing/configs` | `GET` | Paginated (format B), 30s stale |
| `usePricingConfig(id)` | `/pricing/configs/:id` | `GET` | Single entity, 1 min stale |
| `useCreatePricingConfig()` | `/pricing/configs` | `POST` | Invalidates pricing.all |
| `useUpdatePricingConfig()` | `/pricing/configs/:id` | `PATCH` | Dynamic path, invalidates pricing.all |
| `useDeletePricingConfig()` | `/pricing/configs/:id` | `DELETE` | useApiDelete, invalidates pricing.all |
| `usePricingRules(params)` | `/pricing/rules` | `GET` | Paginated (format B), 30s stale |
| `useCreatePricingRule()` | `/pricing/rules` | `POST` | Invalidates pricing.all |
| `useDeletePricingRule()` | `/pricing/rules/:id` | `DELETE` | useApiDelete, invalidates pricing.all |
| `useChargeEvents(params)` | `/pricing/charge-events` | `GET` | Paginated (format B), 30s stale |
| `useChargeEvent(id)` | `/pricing/charge-events/:id` | `GET` | 5 min stale (immutable) |
| `useCalculateCharge()` | `/pricing/calculate` | `POST` | No invalidation (preview only) |

### Pricing Types (`modules/pricing/types/index.ts`)

| Type | Description |
|------|-------------|
| `ChargeType` | Enum: LISTING_PUBLISH, LISTING_FEATURE, LISTING_REFRESH, LEAD_GENERATION, SUBSCRIPTION_BASE, OVERAGE, CUSTOM |
| `PricingModel` | Enum: FLAT, TIERED, PER_UNIT, PERCENTAGE, CUSTOM |
| `ChargeEventStatus` | Enum: PENDING, COMPLETED, FAILED, REFUNDED |
| `PricingConfig` | Config entity (id, name, chargeType, pricingModel, currency, baseAmount, etc.) |
| `PricingRule` | Rule entity (id, pricingConfigId, name, condition, multiplier, priority) |
| `ChargeEvent` | Event entity (id, chargeType, amount, status, tenantId, vendorId, etc.) |
| `CalculateChargeDto` | Input: chargeType, tenantId, vendorId?, quantity?, metadata? |
| `CalculateChargeResult` | Output: baseAmount, appliedRules[], adjustments, finalAmount, currency |

### Pricing Components

| Component | Description |
|-----------|-------------|
| `PricingConfigFilters` | Filter bar with search, chargeType, pricingModel, isActive selects |
| `PricingConfigList` | Paginated CRUD table with skeleton, row dropdown, delete confirmation |
| `PricingConfigFormDialog` | Create/edit dialog (Zod validation, 8 fields) |
| `PricingConfigDetail` | Detail view with back nav, edit dialog, associated rules list |
| `PricingRulesList` | Rules table with create/delete, optional pricingConfigId filter |
| `PricingRuleFormDialog` | Create dialog with JSON condition field |
| `ChargeEventsList` | Read-only filterable table with detail modal, date range filters |
| `ChargeCalculator` | Two-card layout: input form + result breakdown display |

### Pricing Portal Pages

| Portal | Route | Component |
|--------|-------|-----------|
| Platform | `/dashboard/platform/pricing` | Tabs: Configs, Rules, Events, Calculator |
| Platform | `/dashboard/platform/pricing/configs/[id]` | PricingConfigDetail |
| Platform | `/dashboard/platform/pricing/charge-events` | ChargeEventsList |

### Pricing Query Keys

| Key | Pattern |
|-----|---------|
| `pricing.all` | `["pricing"]` |
| `pricing.configs(params)` | `["pricing", "configs", params]` |
| `pricing.configDetail(id)` | `["pricing", "configs", "detail", id]` |
| `pricing.rules(params)` | `["pricing", "rules", params]` |
| `pricing.chargeEvents(params)` | `["pricing", "charge-events", params]` |
| `pricing.chargeEventDetail(id)` | `["pricing", "charge-events", "detail", id]` |

**Running Total: 110 hooks** (99 + 11 new pricing hooks)

---

## 🔧 Job Queue Hooks

Added in Session 4.13.

### Query Hooks

| Hook | Endpoint | Method | Notes |
|------|----------|--------|-------|
| `useJobsHealth(pollingEnabled?)` | `/admin/jobs/health` | `GET` | 10s stale, optional 10s polling |
| `useQueueStats(queueName, pollingEnabled?)` | `/admin/jobs/queues/:queueName` | `GET` | 10s stale, optional polling, enabled by queueName |
| `useJobsList(filters, pollingEnabled?)` | `/admin/jobs/list` | `GET` | Paginated (format D), 10s stale, optional polling |
| `useJobDetail(queueName, jobId)` | `/admin/jobs/:queueName/:jobId` | `GET` | Single entity, 15s stale, enabled by both params |

### Mutation Hooks

| Hook | Endpoint | Method | Notes |
|------|----------|--------|-------|
| `useRetryJob()` | `/admin/jobs/retry` | `POST` | Invalidates jobs.all |
| `useRetryAllFailed()` | `/admin/jobs/retry-all/:queueName` | `POST` | Dynamic path, invalidates jobs.all |
| `useAddJob()` | `/admin/jobs/add` | `POST` | Invalidates jobs.all |
| `usePauseQueue()` | `/admin/jobs/queues/:queueName/pause` | `POST` | Dynamic path, invalidates jobs.all |
| `useResumeQueue()` | `/admin/jobs/queues/:queueName/resume` | `POST` | Dynamic path, invalidates jobs.all |
| `useCleanQueue()` | `/admin/jobs/queues/:queueName/clean` | `POST` | Dynamic path, invalidates jobs.all |
| `useTriggerSearchReindex()` | `/admin/bulk/search/reindex` | `POST` | Invalidates jobs.all |
| `useTriggerExpireListings()` | `/admin/bulk/listings/expire` | `POST` | Invalidates jobs.all |

### Jobs Query Keys

| Key | Pattern |
|-----|---------|
| `jobs.all` | `["jobs"]` |
| `jobs.health()` | `["jobs", "health"]` |
| `jobs.queueStats(queueName)` | `["jobs", "queue", queueName]` |
| `jobs.list(params)` | `["jobs", "list", params]` |
| `jobs.detail(queueName, jobId)` | `["jobs", "detail", queueName, jobId]` |

**Running Total: 122 hooks** (110 + 12 new job queue hooks)

---

## 🏢 Admin Listing Hooks

> Session 4.14 · File: `modules/admin/hooks/admin-listings.ts`

### Query Hooks (2)

| Hook | Endpoint | Method | Notes |
|------|----------|--------|-------|
| `useAdminListings(filters)` | `/admin/listings` | `GET` | Paginated (format A), 30s stale, cleanAdminFilters applied |
| `useAdminListingDetail(id)` | `/admin/listings/:id` | `GET` | Single entity, 60s stale, enabled by id |

### Mutation Hooks (6)

| Hook | Endpoint | Method | Notes |
|------|----------|--------|-------|
| `useAdminPublishListing()` | `/admin/listings/:id/publish` | `POST` | Variable: string (listing ID), invalidates adminListings.all |
| `useAdminUnpublishListing()` | `/admin/listings/:id/unpublish` | `POST` | Variable: {id, reason?}, invalidates adminListings.all |
| `useAdminExpireListing()` | `/admin/listings/:id/expire` | `POST` | Variable: {id, reason?}, invalidates adminListings.all |
| `useAdminArchiveListing()` | `/admin/listings/:id/archive` | `POST` | Variable: {id, reason?}, invalidates adminListings.all |
| `useAdminFeatureListing()` | `/admin/listings/:id/feature` | `POST` | Variable: string (listing ID), invalidates adminListings.all |
| `useAdminUnfeatureListing()` | `/admin/listings/:id/unfeature` | `POST` | Variable: string (listing ID), invalidates adminListings.all |

### Admin Listings Query Keys

| Key | Pattern |
|-----|---------|
| `adminListings.all` | `["admin-listings"]` |
| `adminListings.list(params)` | `["admin-listings", "list", params]` |
| `adminListings.detail(listingId)` | `["admin-listings", "detail", listingId]` |

**Running Total: 130 hooks** (122 + 8 new admin listing hooks)

---

# 🏠 Property Management Modules (Phases 5-8)

> These sections will be populated as PM frontend sessions are completed.
> For backend API documentation, see [backend/docs/API-REGISTRY.md](../../backend/docs/API-REGISTRY.md)

---

## 👤 Occupant Hooks

> Session 5.1-5.2 · File: `modules/occupant/hooks/index.ts`

### ✅ Implemented (Session 5.1-5.2)

| Hook | Endpoint | Description |
|------|----------|-------------|
| `useOccupantProfile()` | `GET /occupants/me` | Get current occupant profile |
| `useUpdateOccupantProfile()` | `PATCH /occupants/me` | Update occupant details |
| `useUploadOccupantDocument()` | `POST /occupants/documents/presigned-url` | Upload IC/payslip/etc |
| `useSubmitOccupantOnboarding()` | `POST /occupants/onboarding` | Complete onboarding wizard |

### ⏳ Pending (Future Sessions)
- `useOccupantDocuments()` — List occupant documents
- `useOccupantOnboardingStatus()` — Check onboarding completion
- `useOccupantDashboard()` — Dashboard statistics
- `useOccupantActivity()` — Recent activity feed

**Backend Endpoints:** `/api/v1/occupants/*`

---

## 🏘️ Tenancy Hooks

> Session 5.3-5.5, 5.9 · File: `modules/tenancy/hooks/index.ts`

### ✅ Implemented (Session 5.3-5.5)

| Hook | Endpoint | Description |
|------|----------|-------------|
| `useTenancies(filters)` | `GET /occupants/me/tenancies` | List occupant's tenancies with filters |
| `useTenancy(id)` | `GET /tenancies/:id` | Get single tenancy details |
| `useRequestTermination()` | `POST /tenancies/:id/request-termination` | Request tenancy termination |
| `useUpdateTenancyStatus()` | `PATCH /tenancies/:id/status` | Update tenancy status |
| `useCreateTenancy()` | `POST /tenancies` | Create new tenancy booking |

### ✅ Implemented (Session 5.9) — Owner Tenancy Management

| Hook | Endpoint | Description |
|------|----------|-------------|
| `useOwnerTenancies(filters)` | `GET /vendors/me/tenancies` | List owner's tenancies across all properties |
| `useOwnerTenancySummary()` | `GET /vendors/me/tenancies/summary` | Get owner tenancy stats |
| `useApproveTenancy()` | `POST /tenancies/:id/approve` | Approve pending booking |
| `useRejectTenancy()` | `POST /tenancies/:id/reject` | Reject pending booking with reason |
| `useConfirmDeposit()` | `POST /tenancies/:id/confirm-deposit` | Confirm deposit received |
| `useProcessTermination()` | `POST /tenancies/:id/process-termination` | Process termination request |

### ✅ Implemented (Session 5.10) — Owner Tenancy Actions

| Hook | Endpoint | Description |
|------|----------|-------------|
| `useSignContract()` | `POST /tenancies/:id/sign-contract` | Owner signs tenancy contract |
| `useCompleteHandover()` | `POST /tenancies/:id/complete-handover` | Complete property handover and activate tenancy |
| `useRequestInspection()` | `POST /tenancies/:id/request-inspection` | Request property inspection |

### Owner Tenancy Components (Session 5.9)

| Component | Description |
|-----------|-------------|
| `OwnerTenancyCard` | Card with tenant info, status, quick approve/reject actions |
| `OwnerTenancyList` | List with summary stats, filters, and property grouping |
| `TenancySummaryCard` | Stats cards (total, active, pending, revenue) |
| `PropertyGroupCard` | Collapsible group for tenancies by property |

### Owner Tenancy Components (Session 5.10)

| Component | Description |
|-----------|-------------|
| `OwnerTenancyActions` | Context-aware action buttons based on tenancy status |
| `TenantScreeningPanel` | Displays screening results (credit, income, employment, references) |
| `HandoverChecklist` | Move-in checklist with keys, utilities, inventory, documentation |
| `ApproveDialog` | Confirm approval of pending booking |
| `RejectDialog` | Reject booking with reason |
| `ConfirmDepositDialog` | Record deposit payment received |
| `ProcessTerminationDialog` | Process termination with deductions |
| `CompleteHandoverDialog` | Finalize handover and activate tenancy |

### Navigation & Breadcrumb Components (Session 5.11)

| Component / Hook | Description |
|------------------|-------------|
| `useTenancyBreadcrumbOverrides(id)` | Resolves tenancy ID to property title for breadcrumb display |
| `SEGMENT_LABELS` (auto-breadcrumb) | Extended with 19 PM-specific segment labels (tenancy, tenancies, bills, maintenance, etc.) |
| `vendorNav` (navigation.ts) | Extended with Finance (Billing, Payouts) and Insights (Analytics) groups |

### ⏳ Pending (Future Sessions)
- `useTenancyTimeline(id)` — Get tenancy event timeline
- `useTenancyOccupants(id)` — List tenancy occupants
- `useAddOccupantToTenancy()` — Add occupant to tenancy

**Backend Endpoints:** `/api/v1/tenancies/*`, `/api/v1/occupants/me/tenancies`, `/api/v1/vendors/me/tenancies`

---

### Test Suites — Phase 5 (Session 5.12)

| Test File | Tests | Coverage Area |
|-----------|-------|---------------|
| `modules/occupant/__tests__/onboarding-store.test.ts` | 17 | Zustand store: step nav, data persistence, documents, emergency contacts, submit flow |
| `modules/tenancy/__tests__/tenancy-list.test.tsx` | 30 | TenancyList filtering/pagination/empty/loading, TenancyCard rendering, getStatusesForFilter |
| `modules/contract/__tests__/contract-viewer.test.tsx` | 20 | ContractViewer header/actions/tabs, sign/download, Document/Signers/Terms tabs |
| `modules/deposit/__tests__/deposit-tracker.test.tsx` | 30 | DepositTracker rendering/sorting, status variants, deductions, summary, compact/empty/loading |
| `test/factories.ts` | — | PM factories: createTenancy, createContract(Detail), createDeposit(Summary) |

**Validation:** TypeScript 0 errors, 246 tests passing across 10 files

---

## 📝 Contract Hooks

> Session 5.6-5.7 · File: `modules/contract/hooks/index.ts`

### ✅ Implemented (Session 5.6-5.7)

| Hook | Endpoint | Description |
|------|----------|-------------|
| `useContract(id)` | `GET /contracts/:id` | Get contract details |
| `useContractByTenancy(tenancyId)` | `GET /tenancies/:id/contract` | Get contract for tenancy |
| `useContractPdf(id)` | `GET /contracts/:id/pdf` | Get presigned PDF URL |
| `useSignContract(id)` | `POST /contracts/:id/sign` | Sign contract (typed/drawn signature) |
| `useResendContractEmail(id)` | `POST /contracts/:id/resend` | Resend contract email |
| `useVoidContract(id)` | `POST /contracts/:id/void` | Void/cancel contract |
| `useContractRealtime(options)` | WebSocket | Real-time contract events (signed, executed) |

### Contract Components (Session 5.7)

| Component | Description |
|-----------|-------------|
| `SignatureFlow` | Visual progress of signatures (Owner → Occupant → Active) |
| `SignaturePad` | Canvas drawing or typed name signature input |
| `ESignatureDialog` | Enhanced signing dialog with external provider support |
| `ContractCelebration` | Confetti celebration when all parties sign |

### WebSocket Events (Session 5.7)
- `contract:signed` — When a signer completes signing
- `contract:executed` — When all parties have signed
- `contract:voided` — When contract is cancelled

**Backend Endpoints:** `/api/v1/contracts/*`

---

## 💵 Deposit Hooks

> Session 5.8 · File: `modules/deposit/hooks/useDeposits.ts`

### ✅ Implemented (Session 5.8)

| Hook | Endpoint | Description |
|------|----------|-------------|
| `useDepositsByTenancy(tenancyId)` | `GET /tenancies/:id/deposits` | Get all deposits for a tenancy |
| `useDepositSummary(tenancyId)` | `GET /tenancies/:id/deposits/summary` | Get deposit summary with totals |
| `useDeposit(depositId)` | `GET /deposits/:id` | Get single deposit details |
| `useDeposits(filters)` | `GET /deposits` | List deposits with filters (admin) |
| `useRefundCalculation(depositId)` | `GET /deposits/:id/refund-calculation` | Get refund calculation breakdown |
| `useDepositTransactions(depositId)` | `GET /deposits/:id/transactions` | Get transaction history |
| `useCreateDeposit()` | `POST /deposits` | Create new deposit |
| `useCollectDeposit()` | `POST /deposits/:id/collect` | Mark deposit as collected |
| `useAddDeduction()` | `POST /deposits/:id/deduction` | Add deduction claim |
| `useRefundDeposit()` | `POST /deposits/:id/refund` | Process deposit refund |
| `useForfeitDeposit()` | `POST /deposits/:id/forfeit` | Forfeit deposit |
| `useFinalizeDeposit()` | `POST /deposits/:id/finalize` | Finalize deposit status |

### Deposit Components (Session 5.8)

| Component | Description |
|-----------|-------------|
| `DepositTracker` | Main tracker with lifecycle progress (Pending→Collected→Held→Refunded) |
| `DepositItem` | Individual deposit card with status badge and progress |
| `DepositSummaryCard` | Overview of all deposits with collection progress |
| `DepositTrackerSkeleton` | Loading state skeleton |
| `DepositRefundStatus` | Refund status with deduction breakdown |
| `RefundTimeline` | Visual timeline of refund progress |
| `DepositRefundCard` | Single deposit refund details card |
| `DeductionItem` | Linked deduction claim display |

### Types (Session 5.8)

| Type | Description |
|------|-------------|
| `DepositType` | Enum: SECURITY, UTILITY, KEY |
| `DepositStatus` | Enum: PENDING, COLLECTED, HELD, PARTIALLY_REFUNDED, FULLY_REFUNDED, FORFEITED |
| `Deposit` | Full deposit entity with deductions |
| `DepositSummary` | Summary with totals by type |
| `RefundCalculation` | Refund breakdown with net amount |
| `DeductionClaim` | Linked deduction claim |
| `DEPOSIT_STATUS_CONFIG` | Status badge colors and labels |
| `DEPOSIT_TYPE_CONFIG` | Type icons and labels |

**Backend Endpoints:** `/api/v1/deposits/*`

---

## 📃 Bill Hooks

> Session 6.1-6.2 · File: `modules/billing/hooks/useBillings.ts`, `modules/billing/hooks/useBilling.ts`, `modules/billing/hooks/usePaymentsByBilling.ts`

### ✅ Implemented (Session 6.1-6.2)

| Hook | Endpoint | Description |
|------|----------|-------------|
| `useBillings(filters)` | `GET /rent-billings` | List bills with pagination & filters |
| `useBilling(billingId)` | `GET /rent-billings/:id` | Get bill detail with line items & tenancy |
| `usePaymentsByBilling(billingId)` | `GET /rent-payments?billingId=` | List payments for a billing |

### ⏳ Planned (Session 6.3+)

- `useGenerateBill()` — Manually generate bill
- `useBillPdf(id)` — Get bill PDF URL
- `useOutstandingBills()` — Get overdue/pending bills
- `useBillingSummary()` — Get billing statistics

### Billing Components (Session 6.1-6.2, 6.5)

| Component | Description |
|-----------|-------------|
| `BillList` | List with filter tabs (All/Pending/Overdue/Partial/Paid), pagination, empty state |
| `BillCard` | Card with amount, due date, status badge, pay button, late fee indicator |
| `BillCardSkeleton` | Loading skeleton for bill card |
| `BillingStatusBadge` | Status badge with variant colors and overdue urgency animation |
| `BillDetail` | Composite detail: header, amount summary, line items, payment history, pay button, sidebar |
| `BillDetailSkeleton` | Loading skeleton for bill detail |
| `BillingLineItemTable` | Table with type badges, deduction support, subtotals, total due footer |
| `BillingLineItemTableSkeleton` | Loading skeleton for line item table |
| `PaymentHistory` | Payment list with status icons, method labels, receipt links, empty state |
| `PaymentHistorySkeleton` | Loading skeleton for payment history |
| `BillingStatsCards` | Owner dashboard summary cards (Total Due, Collected, Overdue, Total Billed) — Session 6.5 |
| `BillingStatsCardsSkeleton` | Loading skeleton for stats cards — Session 6.5 |
| `OwnerBillList` | Owner bill list with property grouping, filter tabs, date range, search — Session 6.5 |
| `OwnerBillListSkeleton` | Loading skeleton for owner bill list — Session 6.5 |
| `OwnerBillingDashboard` | Composite: BillingStatsCards + OwnerBillList — Session 6.5 |
| `OwnerBillingDashboardSkeleton` | Loading skeleton for owner dashboard — Session 6.5 |

### Types (Session 6.1-6.2, 6.5)

| Type | Description |
|------|-------------|
| `BillingStatus` | Enum: DRAFT, GENERATED, SENT, PARTIALLY_PAID, PAID, OVERDUE, WRITTEN_OFF |
| `BillingLineItemType` | Enum: RENT, UTILITY, LATE_FEE, CLAIM_DEDUCTION, OTHER |
| `BillingReminderType` | Enum: EMAIL, SMS, LETTER, LEGAL_NOTICE |
| `PaymentStatus` | Enum: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, DISPUTED |
| `PaymentMethod` | Enum: CARD, FPX, BANK_TRANSFER, CASH, OTHER |
| `Billing` | Full billing entity with line items, tenancy ref, reminders |
| `BillingLineItem` | Individual line item in a bill |
| `BillingPayment` | Payment record with status, method, receipt info |
| `BillingFilters` | Filter params for list query |
| `BillingSummary` | Summary stats (totalBilled/Paid/Outstanding, overdueCount) — Session 6.5 |
| `OwnerBillingStats` | Owner dashboard aggregate stats — Session 6.5 |
| `OwnerBillingFilters` | Owner filters (extends BillingFilters with listingId) — Session 6.5 |
| `PropertyBillingGroup` | Property group with billings, totals — Session 6.5 |
| `BILLING_STATUS_CONFIG` | Status badge colors, labels, descriptions |
| `PAYMENT_STATUS_CONFIG` | Payment status badge colors, labels, icons |
| `PAYMENT_METHOD_LABELS` | Human-readable labels for payment methods |
| `BILLING_FILTER_TABS` | Tab configuration for occupant list filtering |
| `OWNER_BILLING_FILTER_TABS` | Tab configuration for owner list filtering — Session 6.5 |

### Query Keys (Session 6.1-6.2, 6.5)

| Key Pattern | Description |
|------------|-------------|
| `["tenant", tenantId, "rent-billings"]` | All billing queries |
| `["tenant", tenantId, "rent-billings", "list", params]` | Filtered list |
| `["tenant", tenantId, "rent-billings", "detail", billingId]` | Single billing detail |
| `["tenant", tenantId, "rent-billings", "summary", params]` | Billing summary stats — Session 6.5 |
| `["tenant", tenantId, "rent-payments"]` | All payment queries |
| `["tenant", tenantId, "rent-payments", "list", params]` | Filtered payment list |
| `["tenant", tenantId, "rent-payments", "detail", paymentId]` | Single payment detail |
| `["tenant", tenantId, "rent-payments", "billing", billingId]` | Payments for a billing |

### MSW Handlers (Session 6.1-6.2, 6.5)

| Endpoint | Description |
|----------|-------------|
| `GET /rent-billings` | 7 mock bills with tenancy references (PAID, OVERDUE, PARTIALLY_PAID, SENT, GENERATED, WRITTEN_OFF). Enriched with tenancy data for property grouping — Session 6.5 |
| `GET /rent-billings/:id` | Detail with tenancy reference |
| `GET /rent-billings/summary` | Summary stats for a tenancy |
| `GET /rent-payments` | 4 mock payments filterable by billingId, status, method |
| `GET /rent-payments/:id` | Single payment detail |

**Backend Endpoints:** `/api/v1/rent-billings/*`, `/api/v1/rent-payments/*`

---

## 💳 Payment Hooks

> Session 6.2-6.5 · Files: `modules/billing/hooks/usePaymentsByBilling.ts`, `modules/billing/hooks/useOwnerBillings.ts`, `modules/billing/hooks/useOwnerBillingSummary.ts`, `modules/payment/hooks/`

✅ **Core hooks implemented** (Session 6.2-6.3):

| Hook | Method | Endpoint | Status |
|------|--------|----------|--------|
| `usePaymentsByBilling(billingId)` | GET | `/rent-payments?billingId=xxx` | ✅ 6.2 |
| `useCreatePayment()` | POST | `/rent-payments` | ✅ 6.3 |
| `usePaymentStatus({ paymentId })` | GET | `/rent-payments/:id` (polling) | ✅ 6.3 |
| `useReceipt({ paymentId })` | GET | `/rent-payments/:id` (cached, 5min stale) | ✅ 6.4 |
| `useOwnerBillings(filters)` | GET | `/rent-billings` (owner-scoped list) | ✅ 6.5 |
| `useOwnerBillingSummary(tenancyId?)` | GET | `/rent-billings/summary` (2min stale) | ✅ 6.5 |

Remaining (Session 6.5+):
- `usePaymentsByTenancy(tenancyId)` — List payments for tenancy

**Payment Module Components** (Session 6.3-6.4):
- `PaymentDialog` — Multi-step dialog (Amount → Method → Processing → Success/Failed) with receipt link
- `FPXPaymentForm` — Malaysian bank selection (14 banks)
- `FPXBankOption` — Inline bank option variant
- `PaymentProcessing` — Redirect return handler with status polling
- `ReceiptViewer` — Professional printable receipt display (Session 6.4)
- `ReceiptViewerSkeleton` — Loading skeleton for receipt page (Session 6.4)
- `ReceiptDownload` — PDF download button with browser print fallback (Session 6.4)

**Payment Types** (Session 6.3):
- `PaymentIntent`, `CreatePaymentDto`, `PaymentStatusResponse`
- `PaymentDialogStep`, `FPXBank`, `PaymentMethodOption`
- `BankTransferDetails`, `FPX_BANKS`, `PAYMENT_METHOD_OPTIONS`

**MSW Endpoints:**
- `GET /rent-payments` — List payments (filter: billingId, status, method)
- `GET /rent-payments/:id` — Payment detail
- `POST /rent-payments` — Create payment intent (simulates async completion)

**Backend Endpoints:** `/api/v1/payments/*`, `/api/v1/rent-payments/*`

---

## 💰 Payout Hooks

> Session 6.6 · File: `modules/payout/hooks/usePayouts.ts`

✅ **Core hook implemented** (Session 6.6):

| Hook | Method | Endpoint | Status |
|------|--------|----------|--------|
| `usePayouts(filters)` | GET | `/payouts` (paginated, format A) | ✅ 6.6 |
| `usePayout(id)` | GET | `/payouts/:id` (detail with line items) | ✅ 6.7 |
| `usePayoutStatement(id)` | GET | `/payouts/:id/statement` (PDF URL, on-demand) | ✅ 6.7 |

### Payout Types (Session 6.6)

| Type | Description |
|------|-------------|
| `PayoutStatus` | Enum: PENDING, CALCULATED, APPROVED, PROCESSING, COMPLETED, FAILED |
| `PayoutLineItemType` | Enum: RENTAL, PLATFORM_FEE, MAINTENANCE, CLAIM_DEDUCTION, OTHER |
| `Payout` | Full payout entity with amounts, bank details, processing info |
| `PayoutLineItem` | Individual line item (rental, fee, deduction) |
| `PayoutFilters` | Filter params (status, periodStart/End, page, pageSize) |
| `PAYOUT_STATUS_CONFIG` | Status badge colors, labels, descriptions |
| `PAYOUT_FILTER_TABS` | Tab configuration for list filtering (6 tabs) |

### Payout Components (Sessions 6.6-6.7)

| Component | Description |
|-----------|-------------|
| `PayoutStatusBadge` | Status badge with variant colors |
| `PayoutList` | List with filter tabs, date range, summary cards, pagination |
| `PayoutListSkeleton` | Loading skeleton for payout list |
| `PayoutDetail` | Full detail view: summary cards, line items, bank details, timeline |
| `PayoutDetailSkeleton` | Loading skeleton for payout detail |
| `PayoutTimeline` | Visual 4-step status timeline (Calculated → Approved → Processing → Completed/Failed) |
| `PayoutStatement` | Professional printable invoice-style document |

### Query Keys (Session 6.6)

| Key Pattern | Description |
|------------|-------------|
| `["tenant", tenantId, "payouts"]` | All payout queries |
| `["tenant", tenantId, "payouts", "list", params]` | Filtered list |
| `["tenant", tenantId, "payouts", "detail", payoutId]` | Single payout detail |

### MSW Handlers (Session 6.6)

| Endpoint | Description |
|----------|-------------|
| `GET /payouts` | 5 mock payouts (3 COMPLETED, 1 APPROVED, 1 CALCULATED) with filtering |
| `GET /payouts/:id` | Payout detail with line items |
| `GET /payouts/:id/statement` | Mock statement PDF URL |

**Backend Endpoints:** `/api/v1/payouts/*`

---

## 🔧 Maintenance Hooks

> Session 7.1-7.3 · File: `modules/maintenance/hooks/index.ts`

✅ **Implemented in Session 7.1:**
- `useMaintenanceTickets(filters)` — List maintenance requests (paginated, format "A")
- `useMaintenanceTicket(id)` — Get request details
- `useCreateMaintenance()` — Submit new request (POST /maintenance)
- `useAddMaintenanceAttachment(ticketId)` — Upload attachment (POST /maintenance/:id/attachments)
- `useAddMaintenanceComment(ticketId)` — Add comment (POST /maintenance/:id/comments)

✅ **Implemented in Session 7.2:**
- `useMaintenanceRealtime({ tenantId, ticketId?, onStatusChanged?, onCommentAdded? })` — WebSocket real-time updates for maintenance events (lib/websocket/hooks/)
  - Subscribes to: `maintenance:updated`, `maintenance:status_changed`, `maintenance:comment_added`, `maintenance:assigned`
  - Auto-invalidates detail + list query caches
  - Toast notifications for status changes and new comments

✅ **Implemented in Session 7.3:**
- `useOwnerMaintenanceTickets(filters)` — List owner's maintenance tickets with `scope: "owner"` (paginated)
- `useVerifyMaintenance(ticketId)` — Verify ticket (PATCH /maintenance/:id/verify)
- `useAssignMaintenance(ticketId)` — Assign to staff/contractor (PATCH /maintenance/:id/assign)
- `useStartMaintenance(ticketId)` — Start work (PATCH /maintenance/:id/start)
- `useResolveMaintenance(ticketId)` — Mark resolved (PATCH /maintenance/:id/resolve)
- `useCloseMaintenance(ticketId)` — Close ticket (PATCH /maintenance/:id/close)
- `useCancelMaintenance(ticketId)` — Cancel ticket (PATCH /maintenance/:id/cancel)

**Backend Endpoints:** `/api/v1/maintenance/*`

---

## 🔍 Inspection Hooks

> Session 7.4-7.5 · File: `modules/inspection/hooks/useInspections.ts`, `modules/inspection/hooks/useVideoInspection.ts`

✅ **Implemented (Session 7.4):**
- `useInspections(filters)` — List inspections (paginated, tenant-scoped) — `GET /inspections`
- `useInspection(id)` — Get inspection details — `GET /inspections/:id`
- `useInspectionsByTenancy(tenancyId)` — List inspections for a tenancy — `GET /inspections?tenancyId=`
- `useScheduleInspection()` — Schedule new inspection — `POST /inspections`
- `useCompleteInspection(id)` — Complete inspection with rating — `POST /inspections/:id/complete`
- `useUpdateChecklist(id)` — Update checklist items — `PATCH /inspections/:id/checklist`
- `useCancelInspection()` — Cancel scheduled inspection — `PATCH /inspections/:id/cancel`
- `useRescheduleInspection(id)` — Reschedule inspection — `PATCH /inspections/:id/reschedule`

✅ **Implemented (Session 7.5):**
- `useRequestVideo(id)` — Owner requests video from occupant — `POST /inspections/:id/request-video`
- `useSubmitVideo(id)` — Occupant submits video (returns presigned upload URL) — `POST /inspections/:id/submit-video`
- `useReviewVideo(id)` — Owner reviews video (APPROVED | REQUEST_REDO) — `POST /inspections/:id/review-video`
- `useInspectionVideo(id)` — Get presigned video download URL — `GET /inspections/:id/video`

**Query Keys:** `queryKeys.inspections.all|list|detail|byTenancy|report|media`
**Backend Endpoints:** `/api/v1/inspections/*`

---

## 📋 Claim Hooks

> Session 7.6 · File: `modules/claim/hooks/useClaims.ts`

✅ **Implemented (Session 7.6):**
- `useClaims(filters)` — List claims (paginated, tenant-scoped) — `GET /claims`
- `useClaim(id)` — Get claim details — `GET /claims/:id`
- `useCreateClaim()` — Submit new claim — `POST /claims`
- `useReviewClaim(id)` — Review claim (approve/partial/reject) — `POST /claims/:id/review`
- `useDisputeClaim(id)` — Dispute a claim decision — `POST /claims/:id/dispute`
- `useUploadEvidence(id)` — Upload evidence file (returns presigned URL) — `POST /claims/:id/evidence`

**Query Keys:** `queryKeys.claims.all|list|detail`
**Backend Endpoints:** `/api/v1/claims/*`

---

## 🏢 Company Hooks

> Session 8.1 · File: `modules/company/hooks/useCompany.ts`

✅ **Implemented (Session 8.1):**
- `useCompanies(filters)` — List companies (paginated, tenant-scoped) — `GET /companies`
- `useCompany(id)` — Get company details — `GET /companies/:id`
- `useRegisterCompany()` — Register new company — `POST /companies/register`
- `useUpdateCompany(id)` — Update company details — `PATCH /companies/:id`
- `useVerifyCompany(id)` — Verify company (PENDING→ACTIVE) — `POST /companies/:id/verify`
- `useSuspendCompany(id)` — Suspend company — `POST /companies/:id/suspend`
- `useCompanyAdmins(id)` — List company admins — `GET /companies/:id/admins`
- `useAddCompanyAdmin(id)` — Add admin to company — `POST /companies/:id/admins`
- `useRemoveCompanyAdmin(id)` — Remove admin — `DELETE /companies/:id/admins/:userId`

**Query Keys:** `queryKeys.companies.all|list|detail|admins`
**Backend Endpoints:** `/api/v1/companies/*`

---

## 👔 Agent Hooks

> Session 8.3 · File: `modules/agent/hooks/useAgents.ts`

✅ **Implemented** (10 hooks):
- `useAgents(filters)` — List agents (paginated, Format A) — `GET /agents`
- `useAgent(agentId)` — Get agent details — `GET /agents/:id`
- `useAgentListings(agentId)` — Get agent's assigned listings — `GET /agents/:id/listings`
- `useRegisterAgent()` — Register new agent — `POST /agents`
- `useUpdateAgent()` — Update agent profile — `PATCH /agents/:id`
- `useAssignListing()` — Assign listing to agent — `POST /agents/:id/assign-listing`
- `useUnassignListing()` — Remove listing from agent — `DELETE /agents/:id/listings/:listingId`
- `useSuspendAgent()` — Suspend agent — `POST /agents/:id/suspend`
- `useReactivateAgent()` — Reactivate agent — `POST /agents/:id/reactivate`
- `useRegenerateReferralCode()` — Regenerate referral code — `POST /agents/:id/regenerate-referral`

**Backend Endpoints:** `/api/v1/agents/*`
**Query Keys:** `agents.all`, `agents.list`, `agents.detail`, `agents.listings`

---

## � Commission Hooks

> Session 8.4 · File: `modules/commission/hooks/useCommissions.ts`

✅ **Implemented** (8 hooks):
- `useCommissions(filters)` — List commissions (paginated, Format A) — `GET /commissions`
- `useCommission(commissionId)` — Get commission details — `GET /commissions/:id`
- `useAgentCommissions(agentId, filters)` — List agent's commissions (paginated) — `GET /agents/:id/commissions`
- `useAgentCommissionSummary(agentId)` — Get agent commission summary — `GET /agents/:id/commissions/summary`
- `useCreateCommission()` — Create commission — `POST /commissions`
- `useApproveCommission()` — Approve commission — `POST /commissions/:id/approve`
- `usePayCommission()` — Pay commission — `POST /commissions/:id/pay`
- `useCancelCommission()` — Cancel commission — `POST /commissions/:id/cancel`

**Backend Endpoints:** `/api/v1/commissions/*`, `/api/v1/agents/:id/commissions/*`
**Query Keys:** `commissions.all`, `commissions.list`, `commissions.detail`, `commissions.agentCommissions`, `commissions.agentSummary`

---

## �🔗 Affiliate Hooks

> Session 8.5 · File: `modules/affiliate/hooks/useAffiliate.ts`

✅ **Implemented** (7 hooks):
- `useAffiliateProfile(affiliateId)` — Get affiliate profile — `GET /affiliates/:id`
- `useAffiliateReferrals(affiliateId, filters)` — List referrals (paginated, Format A) — `GET /affiliates/:id/referrals`
- `useAffiliateEarnings(affiliateId)` — Get earnings summary — `GET /affiliates/:id/earnings`
- `useAffiliatePayouts(affiliateId, filters)` — List payouts (paginated, Format A) — `GET /affiliates/:id/payouts`
- `useUpdateAffiliate()` — Update affiliate profile — `PATCH /affiliates/:id`
- `useRequestPayout()` — Request payout — `POST /affiliates/:id/payout`
- `useCompletePayout()` — Complete payout (admin) — `POST /affiliates/payouts/:id/complete`

**Backend Endpoints:** `/api/v1/affiliates/*`
**Query Keys:** `affiliates.all`, `affiliates.profile`, `affiliates.referrals`, `affiliates.earnings`, `affiliates.payouts`

---

## ⚖️ Legal Case Hooks

> Session 8.6 · File: `modules/legal/hooks/useLegalCases.ts`

✅ **Implemented** — 12 hooks:

### Legal Cases (10 hooks)
| Hook | Type | Endpoint | Description |
|------|------|----------|-------------|
| `useLegalCases(filters)` | Query | `GET /legal-cases` | Paginated list with status/reason filters |
| `useLegalCase(id)` | Query | `GET /legal-cases/:id` | Single case with lawyer, tenancy, documents |
| `useLegalCaseDocuments(id)` | Query | `GET /legal-cases/:id/documents` | Case documents list |
| `useCreateLegalCase()` | Mutation | `POST /legal-cases` | Create new legal case |
| `useUpdateLegalCase()` | Mutation | `PATCH /legal-cases/:id` | Update case description/amount/notes |
| `useAssignLawyer()` | Mutation | `POST /legal-cases/:id/assign-lawyer` | Assign panel lawyer |
| `useGenerateNotice()` | Mutation | `POST /legal-cases/:id/notice` | Generate notice document |
| `useUpdateCaseStatus()` | Mutation | `PATCH /legal-cases/:id/status` | Transition case status |
| `useResolveCase()` | Mutation | `POST /legal-cases/:id/resolve` | Resolve and close case |
| `useUploadLegalDocument()` | Mutation | `POST /legal-cases/:id/documents` | Upload case document |

### Panel Lawyers (2 hooks)
| Hook | Type | Endpoint | Description |
|------|------|----------|-------------|
| `usePanelLawyers(params)` | Query | `GET /panel-lawyers` | Paginated list of panel lawyers |
| `usePanelLawyer(id)` | Query | `GET /panel-lawyers/:id` | Single lawyer detail |

**Backend Endpoints:** `/api/v1/legal-cases/*`, `/api/v1/panel-lawyers/*`
**Query Keys:** `legalCases.all`, `legalCases.list`, `legalCases.detail`, `legalCases.documents`, `panelLawyers.all`, `panelLawyers.list`, `panelLawyers.detail`

---

## 🛠️ Admin PM Hooks

> Session 8.7 · File: `modules/admin/hooks/admin-pm.ts`

| Hook | Method | Endpoint | Description |
|------|--------|----------|-------------|
| `useAdminPMStats()` | GET | `/admin/dashboard/pm-stats` | ✅ Platform-wide PM aggregate stats (10 sections) |
| `useAdminTenancies(filters)` | GET | `/admin/tenancies` | ✅ Cross-tenant tenancy list with pagination |
| `useAdminBills(filters)` | GET | `/admin/billings` | ✅ Cross-tenant billing list with pagination |
| `useAdminPayouts(filters)` | GET | `/admin/payouts` | ✅ Cross-tenant payout list with pagination |
| `useBulkApprovePayout()` | POST | `/admin/payouts/bulk-approve` | ✅ Bulk approve calculated payouts |
| `useBulkProcessBills()` | POST | `/admin/billings/bulk-process` | ✅ Bulk process bills (send/write-off) |

**Types:** `AdminPMStats`, `StatusCountDto`, `AdminTenancyFilters`, `AdminBillingFilters`, `AdminPayoutFilters`, `BulkApprovePayoutVariables`, `BulkProcessBillsVariables`
**Backend Endpoints:** `/api/v1/admin/dashboard/pm-stats`, `/api/v1/admin/*`
**Query Keys:** `adminPM.all`, `adminPM.stats`, `adminPM.tenancies`, `adminPM.bills`, `adminPM.payouts`, `adminPM.maintenance`, `adminPM.claims`, `adminPM.companies`

---

## 🔗 Related Documents

- [DEVELOPMENT-CHEATSHEET.md](DEVELOPMENT-CHEATSHEET.md) — Session prompts
- [PROGRESS.md](PROGRESS.md) — Session completion tracking
- [Backend API-REGISTRY.md](../../backend/docs/API-REGISTRY.md) — Backend endpoints reference


