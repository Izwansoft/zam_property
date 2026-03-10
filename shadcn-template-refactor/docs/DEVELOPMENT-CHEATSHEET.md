# Zam-Property Web Frontend Development Cheatsheet

> **Copy-paste these prompts in order. Each prompt = one session.**
> After each session, check the box [x] to track progress.

---

## 🧠 How AI Context Works

| File | Auto-Loaded? | When to Explicitly Read |
|------|--------------|-------------------------|
| `.github/copilot-instructions.md` | ✅ **YES** - Every chat | Never (automatic) |
| `docs/ai-prompt/master-prompt.md` | ❌ No | Session 1.1 only (foundation) |
| `docs/ai-prompt/part-0.md` | ❌ No | Session 1.1 only (foundation) |
| `docs/ai-prompt/part-X.md` (specific) | ❌ No | Each session reads its own part |

**Session 1.1** = Read full foundation (master-prompt, part-0, part-1, part-2)
**Session 1.2+** = Just say "Continuing Zam-Property frontend development" + read specific part-X

The AI will automatically get the quick reference from `copilot-instructions.md` for every new chat.

---

## 📚 Documentation Files (MANDATORY Updates)

After **EVERY session**, ensure the AI updates these files:

| File | Purpose | When to Update |
|------|---------|----------------|
| `docs/PROGRESS.md` | Track session completion | After each session ✅ |
| `docs/NAV-STRUCTURE.md` | Navigation tree per portal | After adding routes/pages |
| `docs/API-REGISTRY.md` | Hooks & API patterns | After implementing any hook |

### Post-Session Command (Run at END of each session)
```
Session X.X completed.

Please update the following documentation:
1. docs/PROGRESS.md - Mark session X.X as completed
2. docs/NAV-STRUCTURE.md - Add any new navigation items
3. docs/API-REGISTRY.md - Add any new hooks

Summary of what was implemented:
- [List key deliverables]

Any notes or issues:
- [List any deviations or problems]
```

---

## ⚠️ TEMPLATE BASELINE — READ THIS FIRST

This project uses an **existing shadcn UI kit template** with these pre-existing assets:

| What Exists | Location |
|-------------|----------|
| 58+ shadcn/ui components | `components/ui/` |
| Sidebar + Header layout | `components/layout/` |
| Dashboard auth layout | `app/dashboard/(auth)/layout.tsx` |
| Portal stub pages | `app/dashboard/(auth)/platform\|tenant\|vendor\|account/page.tsx` |
| Login/Register DESIGN REFERENCE | `app/dashboard/(guest)/login/`, `register/` |
| UI kit reference pages | `app/dashboard/(auth)/reference/` (17+ sections) |
| Theme system (dark/light) | `app/globals.css`, `components/active-theme.tsx` |
| Fonts | `lib/fonts.ts` |
| Zustand | Installed in package.json |
| React Hook Form + Zod | Installed in package.json |
| Recharts | Installed in package.json |

**What does NOT exist (must be created):**
- `modules/` directory (all domain modules)
- `verticals/` directory (vertical plugins)
- `config/` directory (navigation, routes)
- `lib/api/` (API client)
- `lib/auth/` (auth utilities)
- `lib/query/` (TanStack Query setup)
- `lib/errors/` (error normalization)
- `lib/websocket/` (Socket.IO client)
- `app/(public)/` route group (public pages)
- `app/(auth)/` route group (auth pages)
- `app/providers.tsx` (global providers)
- `@tanstack/react-query` (NOT installed)
- `axios` (NOT installed)
- `socket.io-client` (NOT installed)
- `.env.example` file
- tsconfig path aliases (`@modules/`, `@verticals/`, etc.)

---

## 🔧 PHASE 1 — FOUNDATION

### Session 1.1: Initialize Project & Dependencies
```
I'm starting Zam-Property frontend development.

FIRST, read these foundation documents to understand the project:
1. docs/ai-prompt/master-prompt.md - Master Project Brief
2. docs/ai-prompt/part-0.md - Global Rules & Standards
3. docs/ai-prompt/part-1.md - Project Brief & Dashboard Scope
4. docs/ai-prompt/part-2.md - Architecture & Routing

IMPORTANT CONTEXT:
- This project uses an EXISTING shadcn UI kit template (shadcn-template-refactor/)
- Next.js 16.0.10, React 19.2.3, TypeScript 5.9+ are already installed
- 58+ shadcn/ui components pre-installed (components/ui/)
- Template layout exists at app/dashboard/(auth)/layout.tsx with sidebar + header
- Portal stub pages exist at app/dashboard/(auth)/platform|tenant|vendor|account/page.tsx
- Login/register DESIGN REFERENCES exist at app/dashboard/(guest)/login/ and register/
- UI kit reference pages exist at app/dashboard/(auth)/reference/ (17+ sections)
- Zustand, React Hook Form, Zod already installed

Task: Initialize project infrastructure (DO NOT break existing template):
1. Install missing dependencies:
   - @tanstack/react-query @tanstack/react-query-devtools
   - axios
   - socket.io-client
2. Create folder structure (empty index.ts barrel files):
   - modules/ (auth, listing, vendor, tenant, interaction, review, subscription, analytics, audit, notification, account)
   - verticals/ (registry, attribute-renderer, filter-builder)
   - config/
   - lib/api/, lib/auth/, lib/query/, lib/errors/, lib/websocket/
   - components/common/, components/forms/
3. Add tsconfig path aliases: @modules/, @verticals/, @config/, @lib/, @hooks/
4. Create .env.example with all required variables (see part-19.md)
5. Create app/providers.tsx (QueryClientProvider, ThemeProvider wrapper)

Do NOT:
- Modify existing template layouts or components
- Create business logic yet
- Break the existing dashboard/(auth)/ layout
```
- [x] Completed

---

### Session 1.2: shadcn/ui Setup & Theme ✅
```
Pre-existing in template. Verified:
- shadcn/ui initialized (components.json, new-york style)
- 58+ components installed (components/ui/)
- Theme CSS variables configured (app/globals.css)
- Dark/light mode toggle (next-themes)
- Fonts configured (lib/fonts.ts)
```
- [x] Completed (Pre-existing in template)

---

### Session 1.3: API Client & Query Setup
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-3.md (API Client, OpenAPI & Query Strategy)
Read docs/ai-prompt/part-23.md §23.4 (Response Formats — for MSW mock data)

Task: Setup API infrastructure:
1. Create lib/api/client.ts — Axios instance with interceptors:
   - X-Request-Id header (UUID per request)
   - X-Tenant-ID header (from tenant context)
   - Authorization header (Bearer token)
   - X-Client: web-dashboard
   - X-Portal header (current portal)
2. Create lib/query/index.ts — QueryClient with defaults:
   - staleTime: 30s default, retry: 3 for 5xx, 0 for 4xx
   - Query key factory pattern (tenant-scoped)
3. Create hooks/use-api-query.ts — Base query hook wrapper
4. Create hooks/use-api-mutation.ts — Base mutation hook with cache invalidation
5. Create lib/errors/index.ts — Error normalization:
   - AppError type with: kind, code, message, fieldErrors, status, requestId
   - Map backend { error: { code, message, details } } to AppError
6. Update app/providers.tsx with QueryClientProvider
7. Install and configure MSW (Mock Service Worker) for development mocking:
   - Install: msw (dev dependency)
   - Create lib/mocks/browser.ts — MSW browser worker setup
   - Create lib/mocks/handlers.ts — Root handler array (re-exports all domain handlers)
   - Create lib/mocks/server.ts — MSW server setup (for tests)
   - Create lib/mocks/utils.ts — Helper factories:
     - mockSuccessResponse(data, pagination?) → { data, meta: { requestId, pagination? } }
     - mockErrorResponse(code, message, details?) → { error: { code, message, details? }, meta: { requestId, timestamp } }
     - mockPaginatedResponse(items, page, pageSize, total) → full paginated wrapper
     - mockAuditResponse(items) → { data, meta: { total, filters } }
   - Create lib/mocks/handlers/ directory with domain-specific handlers:
     - auth.ts — POST /api/v1/auth/login, /refresh, /register, GET /users/me
     - listings.ts — GET /api/v1/listings (paginated), GET /:id (single)
     - vendors.ts — GET /api/v1/vendors (paginated), GET /:id (single)
   - Run npx msw init public/ to generate service worker file
   - Create conditional initialization in app/providers.tsx:
     - Only start MSW in development when NEXT_PUBLIC_API_MOCKING=true
8. All mock responses MUST match the 4 backend response formats from Part-23 §23.4:
   - Single entity: { data: { ...entity }, meta: { requestId } }
   - Paginated list: { data: [...], meta: { requestId, pagination: { page, pageSize, total, totalPages } } }
   - Error: { error: { code, message, details? }, meta: { requestId, timestamp } }
   - Audit logs: { data: [...], meta: { total, filters: { ... } } }

Backend API: http://localhost:3000/api/v1
Response format: { data: ..., meta: { requestId, pagination? } }
Error format: { error: { code, message, details? }, meta: { requestId, timestamp } }

MSW toggle: Set NEXT_PUBLIC_API_MOCKING=true in .env.local to enable mocks.
When mocking is disabled, requests go directly to the real backend.
```
- [x] Completed

---

### Session 1.4: Auth Context & Session Management
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-4.md (Auth, Session & Route Guards)

Task: Implement Auth infrastructure:
1. Create modules/auth/context/auth-context.tsx — AuthProvider:
   - User state, isAuthenticated, isLoading
   - Login/logout/refresh actions
   - Permission helpers (hasRole, hasPermission)
2. Create modules/auth/hooks/use-auth.ts — useAuth, useAuthUser, usePermissions
3. Create modules/auth/api/auth-api.ts — API functions:
   - POST /api/v1/auth/login (email, password)
   - POST /api/v1/auth/refresh (refreshToken)
   - POST /api/v1/auth/register
   - GET /api/v1/users/me
4. Create modules/auth/types/index.ts — User, AuthState, Role enum
5. Implement token storage (localStorage for access, httpOnly cookie preferred)
6. Setup token refresh logic (401 response interceptor)
7. Update app/providers.tsx with AuthProvider

Backend roles: SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF, CUSTOMER, GUEST
```
- [x] Completed

---

### Session 1.5: Login & Register Pages
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-4.md (Auth pages section)

IMPORTANT: Reference the DESIGN from app/dashboard/(guest)/login/v1/ and register/v1/
to match the visual style, but create actual functioning auth pages.

Task: Implement Auth pages:
1. Create app/(auth)/layout.tsx — Guest-only layout (redirect if authenticated)
2. Create app/(auth)/login/page.tsx — Login form:
   - Email + password fields
   - Form validation with Zod
   - Connect to POST /api/v1/auth/login
   - Handle auth errors (invalid credentials, account locked, etc.)
   - Redirect to appropriate portal after login based on role
3. Create app/(auth)/register/page.tsx — Register form:
   - Email, password, fullName, phone fields
   - Connect to POST /api/v1/auth/register
4. Create app/(auth)/forgot-password/page.tsx — Forgot password form
5. Create app/session-expired/page.tsx — Session expired page
6. Create app/forbidden/page.tsx — 403 Forbidden page

Route mapping:
- /login → app/(auth)/login/page.tsx
- /register → app/(auth)/register/page.tsx
- /forgot-password → app/(auth)/forgot-password/page.tsx
- /session-expired → app/session-expired/page.tsx
- /forbidden → app/forbidden/page.tsx
```
- [x] Completed

---

### Session 1.6: Route Guards & Middleware
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-4.md (Route Guards section)

Task: Implement Route Protection:
1. Create proxy.ts (Next.js 16+ edge proxy for route protection):
   - Redirect unauthenticated users to /login
   - Redirect authenticated users away from /login, /register
   - Check role-based access for portal routes
2. Create lib/auth/route-config.ts — Route → role mapping
3. Create components/common/protected-route.tsx — Client-side role guard
4. Create components/common/guest-route.tsx — Client-side guest-only guard
5. Create portal-specific layouts with guards:
   - app/dashboard/(auth)/platform/layout.tsx → SUPER_ADMIN only
   - app/dashboard/(auth)/tenant/layout.tsx → TENANT_ADMIN
   - app/dashboard/(auth)/vendor/layout.tsx → VENDOR_ADMIN, VENDOR_STAFF
   - app/dashboard/(auth)/account/layout.tsx → CUSTOMER (any authenticated)

Route rules:
- /dashboard/platform/* → SUPER_ADMIN only
- /dashboard/tenant/* → TENANT_ADMIN only
- /dashboard/vendor/* → VENDOR_ADMIN, VENDOR_STAFF
- /dashboard/account/* → any authenticated user (CUSTOMER)
- /(public)/* → no auth required
- /(auth)/* → guest only (redirect if authenticated)
```
- [x] Completed

---

### Session 1.7: Layout Shells & Navigation
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-5.md (UI Composition, Layouts & Navigation)

IMPORTANT: The existing template at app/dashboard/(auth)/layout.tsx already has
a sidebar + header layout. EXTEND it, don't replace it.

Task: Create Portal Navigation & Layout Extensions:
1. Create config/navigation.ts — Navigation config per portal:
   - Platform nav: Dashboard, Tenants, Plans, Feature Flags, Audit Logs
   - Tenant nav: Dashboard, Vendors, Listings, Reviews, Analytics
   - Vendor nav: Dashboard, Listings, Inbox, Reviews, Profile
   - Account nav: Dashboard, Profile, Inquiries, Saved, Settings
2. Extend the existing sidebar to be portal-aware:
   - Detect portal from pathname (/dashboard/platform/*, etc.)
   - Filter nav items by role
3. Create PublicLayout for app/(public)/layout.tsx:
   - Simple header + footer, no sidebar
4. Create mobile navigation drawer
5. Implement active state highlighting
6. Create user menu dropdown (profile, logout)

Each portal shares the same sidebar component but with different nav items.
```
- [x] Completed

---

### Session 1.8: Breadcrumb & Page Templates
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-5.md (Page Patterns section)

Task: Build Page Infrastructure:
1. Create components/common/auto-breadcrumb.tsx — Auto path-based breadcrumbs
2. Create page template patterns:
   - ListPage template (filters, table/grid, pagination)
   - DetailPage template (header, tabs, content sections)
   - FormPage template (header, form, actions)
3. Integrate breadcrumb into portal header
4. Create components/common/page-header.tsx — Standard page header

All pages must follow consistent visual patterns.
```
- [x] Completed

---

### Session 1.9: Tenant Context
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-4.md (Tenant Context section)

Task: Implement Tenant Context:
1. Create modules/tenant/context/tenant-context.tsx — TenantProvider:
   - Resolve tenant from: subdomain → stored → user membership
   - Hold current tenant ID
2. Create modules/tenant/hooks/use-tenant.ts — useTenant, useTenantId
3. Create lib/auth/tenant-getter.ts — Singleton for API client interceptor
4. Update lib/api/client.ts — X-Tenant-ID header from tenant context
5. Create hooks/use-tenant-query.ts — Tenant-scoped query key helpers
6. Integrate TenantProvider in portal layouts:
   - Tenant portal: required (must have tenant)
   - Vendor portal: derived from vendor's tenant
   - Platform portal: optional (can switch tenants)

Backend expects: X-Tenant-ID header on all tenant-scoped requests.
```
- [x] Completed

---

### Session 1.10: Error Handling & Boundaries
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-3.md (Error Normalization section)
Read docs/ai-prompt/part-15.md (User Feedback Patterns)

Task: Implement Error Handling:
1. Create components/common/error-boundary.tsx — ErrorBoundary with retry
2. Create lib/errors/error-handler.ts — Global error handler:
   - Map backend error codes to user messages
   - Handle 401 → redirect to login
   - Handle 403 → show forbidden
   - Handle 422 → show field errors
   - Handle 5xx → show generic error
3. Create lib/errors/toast-helpers.ts — Toast utilities:
   - showSuccess, showError, showWarning, showInfo
4. Create app/error.tsx — Root error page
5. Update app/not-found.tsx — Improve 404 page
6. Create components/common/suspense-boundary.tsx — Loading states

All errors must show user-friendly messages, never raw error objects.
```
- [x] Completed

---

### Session 1.11: Loading States & Skeletons
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-17.md (Performance section)

Task: Implement Loading States:
1. Create components/common/page-skeletons.tsx — Skeleton patterns:
   - CardSkeleton, TableSkeleton, ListSkeleton, FormSkeleton
   - PageShellSkeleton, DashboardSkeleton, DetailSkeleton
2. Create components/common/loading-button.tsx — Button loading variants
3. Create portal loading.tsx files:
   - app/dashboard/(auth)/platform/loading.tsx
   - app/dashboard/(auth)/tenant/loading.tsx
   - app/dashboard/(auth)/vendor/loading.tsx
   - app/dashboard/(auth)/account/loading.tsx
4. Setup Suspense fallbacks for lazy-loaded components

Loading states for: cards, tables, forms, page shells.
```
- [x] Completed

---

### Session 1.12: Form Infrastructure
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-6.md (Domain Module Patterns - Forms)

Task: Setup Form Infrastructure:
1. Create components/forms/form-wrapper.tsx — FormWrapper with RHF + Zod:
   - Auto-connect to Zod resolver
   - FormSection, FormGrid, FormActions helpers
2. Create components/forms/form-fields.tsx — Field wrappers:
   - TextField, PasswordField, NumberField, TextAreaField
   - SelectField, CheckboxField, SwitchField, RadioGroupField
3. Create components/forms/form-errors.tsx — Error display components:
   - FormRootError, FormErrorSummary, FieldError
4. Create components/forms/schema-patterns.ts — Reusable Zod schemas:
   - emailSchema, phoneSchema, passwordSchema, priceSchema
5. Create components/forms/index.ts — Barrel exports

All forms must use React Hook Form + Zod. No uncontrolled forms.
```
- [x] Completed

---

## ✅ PHASE 1 CHECKPOINT
```
Before continuing to Phase 2, verify:

1. Run: pnpm build (should compile without errors)
2. Run: pnpm dev (should start without errors)
3. Test: Login flow works (POST /api/v1/auth/login)
4. Test: Route guards redirect correctly
5. Test: Portal layouts render with correct nav items
6. Test: Tenant context resolves correctly
7. Check: No TypeScript errors
8. Verify: Existing template UI kit reference pages still work

If all pass, continue to Phase 2.
```
- [x] All checks passed (2026-02-16)

---

## 🏢 PHASE 2 — CORE MODULES

### Session 2.1: Listing List View
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-8.md (Listings Dashboard Module)

Task: Implement Listing List:
1. Create modules/listing/ folder structure (types, hooks, components, utils)
2. Create modules/listing/hooks/use-listings.ts — useListings query hook:
   - GET /api/v1/listings (with filters, pagination)
   - Query key: ['listings', filters]
3. Create modules/listing/components/listing-card.tsx — ListingCard + Skeleton
4. Create modules/listing/components/listing-list.tsx — Grid/list toggle view
5. Create modules/listing/components/listing-filters.tsx — URL-driven filters:
   - Status, verticalType, search, dateRange, sortBy
6. Create portal pages:
   - app/dashboard/(auth)/vendor/listings/page.tsx
   - app/dashboard/(auth)/vendor/listings/content.tsx (client component)
   - app/dashboard/(auth)/vendor/listings/loading.tsx
   - app/dashboard/(auth)/tenant/listings/page.tsx (+ content, loading)

Display: title, price, status badge, location, primary image, date.
Pagination: page-based, pageSize=20, with page controls.
```
- [x] Completed

---

### Session 2.2: Listing Detail View
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-8.md (Detail View section)

Task: Implement Listing Detail:
1. Create modules/listing/hooks/use-listing.ts — useListing(id) query hook:
   - GET /api/v1/listings/:id
   - Query key: ['listings', listingId]
2. Create modules/listing/components/listing-gallery.tsx — Image gallery with lightbox
3. Create modules/listing/components/listing-info.tsx — Core info display
4. Create modules/listing/components/listing-actions.tsx — Status actions:
   - Edit, Publish, Archive, Delete (with confirmation dialogs)
5. Create modules/listing/components/listing-stats.tsx — View/inquiry counts
6. Create modules/listing/components/listing-detail.tsx — Composite component
7. Create portal pages:
   - app/dashboard/(auth)/vendor/listings/[id]/page.tsx (+ content, loading)
   - app/dashboard/(auth)/tenant/listings/[id]/page.tsx (+ content, loading)

Status workflow: DRAFT → PUBLISHED → EXPIRED/ARCHIVED
```
- [x] Completed

---

### Session 2.3: Listing Create/Edit Form
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-8.md (Create/Edit section)
Read docs/ai-prompt/part-7.md (Vertical UI Plugin)

Task: Implement Listing Form:
1. Create modules/listing/hooks/use-listing-mutations.ts:
   - useCreateListing → POST /api/v1/listings
   - useUpdateListing → PATCH /api/v1/listings/:id
   - usePublishListing → PATCH /api/v1/listings/:id/publish
2. Create modules/listing/components/listing-form/ (multi-step):
   - Step 1: Select vertical type (immutable after create)
   - Step 2: Core fields (title, description, price, location)
   - Step 3: Vertical-specific attributes (placeholder for Session 3.4)
   - Step 4: Media upload (placeholder for Session 2.9)
   - Step 5: Review & save as draft
3. Create portal pages:
   - app/dashboard/(auth)/vendor/listings/create/page.tsx
   - app/dashboard/(auth)/vendor/listings/[id]/edit/page.tsx

vertical_type is IMMUTABLE after creation. schema_version captured at create.
```
- [x] Completed

---

### Session 2.4: Vendor List & Detail
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-9.md (Vendors Module)

Task: Implement Vendor Views:
1. Create modules/vendor/ (types, hooks, components, utils)
2. Create hooks: useVendors, useVendor — GET /api/v1/vendors
3. Create VendorCard, VendorList, VendorFiltersBar components
4. Create VendorDetail with: info, stats, listing count
5. Create VendorApprovalActions (approve, reject, suspend):
   - PATCH /api/v1/vendors/:id/approve
   - PATCH /api/v1/vendors/:id/reject (with reason)
   - PATCH /api/v1/vendors/:id/suspend
6. Create portal pages:
   - app/dashboard/(auth)/tenant/vendors/page.tsx (+ content, loading)
   - app/dashboard/(auth)/tenant/vendors/[id]/page.tsx (+ content, loading)

Vendor status: PENDING → APPROVED/REJECTED → SUSPENDED
```
- [x] Completed

---

### Session 2.5: Vendor Onboarding Form
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-9.md (Onboarding section)

Task: Implement Vendor Onboarding:
1. Create multi-step onboarding form:
   - Step 1: Basic Info (name, type, contact)
   - Step 2: Business Details (registration, address)
   - Step 3: Documents (upload for verification)
   - Step 4: Review & Submit
2. Create modules/vendor/hooks/use-vendor-onboarding.ts
3. Create Zustand store for onboarding state persistence
4. Create portal page:
   - app/dashboard/(auth)/vendor/onboarding/page.tsx (+ content, loading)

Vendor starts as PENDING after submission, awaits approval.
```
- [x] Completed

---

### Session 2.6: Tenant Management (Platform Admin)
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-9.md (Tenants Module)

Task: Implement Tenant Views:
1. Create modules/tenant/ (types, hooks, components, utils)
2. Create hooks: useTenants, useTenantDetail — GET /api/v1/admin/tenants
3. Create TenantCard, TenantList, TenantFilters components
4. Create TenantDetail with: info, stats, subscription, audit tabs
5. Create TenantSettings form: branding, verticals, notifications
6. Create TenantStatusActions (suspend, reactivate, deactivate)
7. Create portal pages:
   - app/dashboard/(auth)/platform/tenants/page.tsx (+ content, loading)
   - app/dashboard/(auth)/platform/tenants/[id]/page.tsx (+ content, loading)
   - app/dashboard/(auth)/platform/tenants/[id]/settings/page.tsx

Only visible in Platform Admin portal (SUPER_ADMIN).
```
- [x] Completed (2026-02-17)

---

### Session 2.7: Interactions/Inbox Module
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-10.md (Interactions Module)

Task: Implement Interactions:
1. Create modules/interaction/ (types, hooks, components, utils)
2. Create hooks: useInteractions, useInteractionDetail
   - GET /api/v1/interactions (with filters)
   - GET /api/v1/interactions/:id
3. Create InteractionList (inbox view with tabs: all/new/responded/closed)
4. Create InteractionCard with status badge, type icon
5. Create InteractionDetail with conversation thread
6. Create InteractionReplyForm with character count
7. Create InteractionStatusActions (respond, accept, reject, close, escalate)
8. Create portal pages:
   - app/dashboard/(auth)/vendor/inbox/page.tsx (+ content, loading)
   - app/dashboard/(auth)/vendor/inbox/[id]/page.tsx (+ content, loading)

Types: LEAD, ENQUIRY, BOOKING
Status: NEW → CONTACTED → CONFIRMED → CLOSED/INVALID
```
- [x] Completed (2026-02-16)

---

### Session 2.8: Reviews Module
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-11.md (Reviews Module)

Task: Implement Reviews:
1. Create modules/review/ (types, hooks, components, utils)
2. Create hooks: useReviews, useReviewDetail
   - GET /api/v1/reviews (with filters)
3. Create ReviewCard with star rating, vendor reply section
4. Create ReviewList with pagination
5. Create ReviewModerationActions (approve, reject, flag)
6. Create ReviewStats (rating distribution, average)
7. Create portal pages:
   - app/dashboard/(auth)/vendor/reviews/page.tsx — vendor sees own reviews
   - app/dashboard/(auth)/vendor/reviews/[id]/page.tsx
   - app/dashboard/(auth)/tenant/reviews/page.tsx — tenant moderates
   - app/dashboard/(auth)/tenant/reviews/[id]/page.tsx

Vendors can REPLY but NOT delete/hide/edit reviews.
Rating calculations come from backend only.
```
- [x] Completed

---

### Session 2.9: Media Upload Component
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-8.md (Media section)

Task: Implement Media Upload:
1. Create modules/media/ (types, hooks, components)
2. Create hooks:
   - usePresignedUrl → POST /api/v1/media/presigned-url
   - useConfirmUpload → POST /api/v1/media/:id/confirm
3. Create MediaUploader component:
   - Drag-and-drop zone
   - Upload progress indicator
   - File type/size validation
4. Create ImagePreview with crop/rotate
5. Create MediaGallery with drag-reorder, set primary, delete
6. Integrate with ListingForm (Session 2.3 placeholder)

Flow: Request presigned URL → Upload to S3/MinIO → Confirm → Display
```
- [x] Completed

---

### Session 2.10: Customer Account Portal
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-4.md (Customer section)

Task: Implement Customer Account Portal:
1. Create modules/account/ (types, hooks, components)
2. Create modules/account/hooks/use-profile.ts — useProfile, useUpdateProfile
3. Create ProfileViewCard + ProfileEditForm with Zod validation
4. Create AccountSidebar navigation config
5. Create AccountDashboard with stats cards, quick actions
6. Create portal pages:
   - app/dashboard/(auth)/account/page.tsx — Dashboard
   - app/dashboard/(auth)/account/profile/page.tsx — Profile view/edit
   - app/dashboard/(auth)/account/loading.tsx

Account portal is for CUSTOMER role.
```
- [x] Completed

---

### Session 2.11: Customer Account Features
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-4.md (Customer features)
Read docs/ai-prompt/part-10.md (Inquiries from customer view)

Task: Implement Customer Account Features:
1. Create My Inquiries page (customer's sent inquiries)
2. Create Saved Listings page (wishlist/favorites)
3. Create My Reviews page (reviews written by customer)
4. Create Notifications preferences page
5. Create Account Settings page (language, timezone, privacy)
6. Create Security page (password change, delete account)
7. Create portal pages under app/dashboard/(auth)/account/:
   - inquiries/, saved/, reviews/, notifications/, settings/, security/

Customer can view inquiry history, saved listings, and reviews they've written.
```
- [x] Completed

---

## ✅ PHASE 2 CHECKPOINT
```
Before continuing to Phase 3, verify:

1. Listing CRUD works (create, view, edit)
2. Vendor list and detail views work
3. Vendor onboarding flow complete
4. Tenant management works (platform admin)
5. Interactions inbox displays messages
6. Reviews can be viewed and moderated
7. Media upload completes successfully
8. Customer account pages render

If all pass, continue to Phase 3.
```
- [x] All checks passed (2026-02-17)

---

## 🔌 PHASE 3 — REAL-TIME & VERTICALS

### Session 3.1: WebSocket Infrastructure
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-22.md (WebSocket Integration)

Task: Setup WebSocket:
1. Create lib/websocket/ (types, hooks, provider)
2. Create SocketProvider with React Context:
   - Namespace-based connections per portal (/platform, /tenant, /vendor)
   - Separate /notifications namespace (always connected)
3. Create hooks:
   - useWebSocket — connection status, emit, join/leave rooms
   - useSocketEvent — type-safe event subscription
   - useSocketRoom — room management with auto-cleanup
4. Create components: ConnectionStatusBanner, ConnectionStatusIndicator
5. Implement JWT authentication in handshake
6. Auto-reconnection with exponential backoff
7. Integrate SocketProvider in app/providers.tsx

Backend WebSocket: Socket.IO with namespaces (/tenant, /vendor, /notifications)
```
- [x] Completed (2026-02-17)

---

### Session 3.2: Real-time Notifications
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-15.md (Notifications section)
Read docs/ai-prompt/part-22.md (Real-time events)

Task: Implement Real-time Notifications:
1. Create modules/notification/ (types, hooks, components)
2. Create hooks:
   - useNotifications → GET /api/v1/notifications
   - useUnreadCount → unread count
   - useMarkAsRead, useMarkAllAsRead → mutations
3. Create NotificationBell with unread badge
4. Create NotificationList dropdown
5. Create NotificationItem with type-specific icons
6. Create useRealtimeNotifications — WebSocket event handler:
   - notification:new → show toast + invalidate queries
   - notification:count → sync unread count
7. Integrate bell component in portal header

Show unread count on bell icon. Auto-dismiss success toasts.
```
- [x] Completed (2026-02-17)

---

### Session 3.3: Real-time Updates
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-22.md (Live Updates section)

Task: Implement Live Updates:
1. Create lib/websocket/hooks/use-realtime-sync.ts — Master sync hook:
   - Event → Query invalidation mapping (30+ event types)
   - listing:created → invalidate ['listings']
   - listing:updated → invalidate ['listings', listingId]
   - interaction:new → invalidate ['interactions']
   - vendor:approved → invalidate ['vendors']
   - subscription:changed → invalidate ['subscription']
2. Create listing-specific hooks (useListingViewerCount)
3. Create interaction-specific hooks (useInteractionTyping)
4. Create offline/reconnection handler:
   - Show banner after 2s disconnection
   - Refetch stale queries on reconnection
5. Show toast for important live events

Updates should reflect immediately without page refresh.
```
- [x] Completed (2026-02-17)

---

### Session 3.4: Vertical Registry
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-7.md (Vertical UI Plugin)

Task: Implement Vertical Registry:
1. Create verticals/types/ — Core type definitions:
   - VerticalType, VerticalDefinition, AttributeDefinition, AttributeSchema
   - FilterableField, SortableField, VerticalSearchMapping
2. Create verticals/registry/ — Registry infrastructure:
   - API functions (GET /api/v1/verticals, GET /api/v1/verticals/:type/schema)
   - TanStack Query hooks with 30-min staleTime
   - VerticalRegistry singleton class with local caching
   - Zod schema generator from attribute definitions
3. Create verticals/attribute-renderer/ — Dynamic form fields:
   - AttributeRenderer (type-based field selection)
   - DynamicForm (groups, collapsible sections)
   - Field components: string, number, select, multiselect, boolean, date, range
4. Create verticals/filter-builder/ — Dynamic filter UI:
   - FilterBuilder with URL state sync
   - Filter components: select, multiselect, range, text, boolean

Registry enables pluggable vertical support without hardcoding.
```
- [x] Completed (2026-02-17)

---

### Session 3.5: Real Estate Vertical - Forms
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-24.md (Real Estate Vertical)

Task: Implement Real Estate Forms:
1. Create verticals/real-estate/ (types, schema, validation, formatters)
2. Define attribute schema (16+ attributes in 10 groups):
   - propertyType, listingType, tenure, bedrooms, bathrooms
   - builtUpSize, landSize, furnishing, facilities, amenities
3. Create Zod validation schemas:
   - Draft schema (minimal required)
   - Publish schema (all required-by-publish enforced)
   - Cross-field validation (bedrooms required for residential, etc.)
4. Create components:
   - PropertyTypeSelector, ListingTypeSelector
   - TenureSelector, FurnishingSelector
   - RealEstateAttributeForm with conditional field visibility
5. Register as vertical plugin in verticals/index.ts

Malaysian market: MYR currency, 16 property types, Malay Reserve/Bumi Lot tenure.
```
- [x] Completed (2026-02-17)

---

### Session 3.6: Real Estate Vertical - Filters
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-24.md (Search & Filters section)
Read docs/ai-prompt/part-16.md (Search UI)

Task: Implement Real Estate Filters:
1. Define filter configuration (filterable fields, sortable fields, facets)
2. Create RealEstateSearchFilters (sidebar, horizontal, mobile sheet variants)
3. Create PriceRangeFilter with sale/rent presets (MYR)
4. Create RoomCountFilter (bedroom/bathroom toggle groups)
5. Create PropertyTypeFacet with icons and counts
6. Create useRealEstateFilters hook with URL sync

Price presets: Sale (RM300K-RM2M+), Rent (RM1,500-RM5,000+)
Filters must work with both search and listing pages.
```
- [x] Completed (2026-02-17)

---

## ✅ PHASE 3 CHECKPOINT
```
Before continuing to Phase 4, verify:

1. WebSocket connects successfully
2. Real-time notifications appear
3. Live updates reflect on listings/interactions
4. Vertical registry loads schemas
5. Real estate form renders all fields with validation
6. Real estate filters work with URL sync

If all pass, continue to Phase 4.
```
- [x] All checks passed (2026-02-17)

---

## 🚀 PHASE 4 — PLATFORM FEATURES

### Session 4.1: Global Search
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-25.md (Global Search & Discovery)
Read docs/ai-prompt/part-16.md (Search UI Deep Dive)

Task: Implement Global Search:
1. Create modules/search/ (types, hooks, components)
2. Create hooks:
   - useSearch — URL-synced, debounced (300ms), paginated
     GET /api/v1/search/listings
   - useAutocomplete — 150ms debounce
     GET /api/v1/search/suggestions
   - useSearchFacets — facet formatting
3. Create SearchInput with autocomplete dropdown + keyboard navigation
4. Create SearchResults page with grid/list toggle
5. Create SearchFilters panel (Sheet-based with facets)
6. Create SearchResultCard with highlights
7. Create app/(public)/search/page.tsx — Public search page
8. Geo search integration (browser geolocation, radius slider)

Search must support: text query, filters, facets, geo, sorting.
keepPreviousData for smooth pagination transitions.
```
- [x] Completed

---

### Session 4.2: Subscriptions & Plans UI
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-12.md (Subscriptions UI)

Task: Implement Subscriptions UI:
1. Create modules/subscription/ (types, hooks, components)
2. Create hooks:
   - usePlans → GET /api/v1/plans
   - useSubscription → GET /api/v1/subscriptions/current
   - useUsage → GET /api/v1/usage
   - useEntitlements → GET /api/v1/entitlements
3. Create PlanComparisonTable with feature categories
4. Create CurrentPlanCard with status + renewal info
5. Create UsageMeters with warning levels (Normal/Warning/Critical/Exceeded)
6. Create UpgradePrompt (informational only, no checkout)

UI explains access; never computes billing. Show "last updated" timestamp.
```
- [x] Completed

---

### Session 4.3: Analytics Dashboard
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-13.md (Analytics Dashboards)

Task: Implement Analytics:
1. Create modules/analytics/ (types, hooks, components)
2. Create hooks: usePlatformAnalytics, useTenantAnalytics, useVendorAnalytics
   - GET /api/v1/analytics/dashboard
3. Create MetricCard with trend indicators (up/down/neutral)
4. Create DashboardStats grid of KPI cards
5. Create charts (line, bar, pie) using Recharts via shadcn ChartContainer
6. Create DateRangePicker with presets (7d, 30d, 90d, 1y, custom)
7. Create TopItemsTable (top listings, top vendors)
8. Create ExportButton (CSV, XLSX, PDF)
9. Create portal dashboard pages:
   - app/dashboard/(auth)/platform/page.tsx — Platform analytics
   - app/dashboard/(auth)/tenant/page.tsx — Tenant analytics
   - app/dashboard/(auth)/vendor/page.tsx — Vendor analytics

Default time range: last 30 days. No client-side computation.
Vendors see only their own data.
```
- [x] Completed

---

### Session 4.4: Audit Logs UI
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-14.md (Audit Logs section)
Read docs/ai-prompt/part-26.md §26.5 (Audit Log detail)

Task: Implement Audit Logs:
1. Create modules/audit/ (types, hooks, components)
2. Create hooks:
   - useAuditLogs(params) → GET /api/v1/audit/logs
   - useAuditLogDetail(id) → GET /api/v1/audit/logs/:id
   - useAuditLogsByTarget(targetType, targetId) → GET /api/v1/audit/target/:targetType/:targetId
   - useAuditLogsByActor(actorId) → GET /api/v1/audit/actor/:actorId
   - useAuditActionTypes() → GET /api/v1/audit/action-types (for filter dropdowns)
   - useAuditTargetTypes() → GET /api/v1/audit/target-types (for filter dropdowns)
3. Create AuditLogList with paginated table
4. Create AuditLogItem with proper AuditLog interface (see Part-23 §23.4)
5. Create audit filters — use dynamic action-types and target-types from backend
6. Create AuditLogDetailModal (actor details, old/new values diff, metadata, requestId)
7. Add contextual "View Audit History" links on entity detail pages
8. Create portal pages:
   - app/dashboard/(auth)/platform/audit/page.tsx
   - app/dashboard/(auth)/tenant/audit/page.tsx (tenant-scoped)

Audit records are immutable — no edit/delete UI.
Filter dropdowns must be populated from backend (not hardcoded).
```
- [x] Completed

---

### Session 4.5: Feature Flags & Experiments UI
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-14.md (Feature Flags section)
Read docs/ai-prompt/part-26.md §26.2 (Feature Flags & Experiments CRUD)

Task: Implement Feature Flags & Experiments UI:
1. Create modules/feature-flags/ (types, hooks, components)
2. Create hooks:
   - useFeatureFlags() → GET /api/v1/admin/feature-flags
   - useFeatureFlag(key) → GET /api/v1/admin/feature-flags/:key
   - useCreateFeatureFlag() → POST /api/v1/admin/feature-flags
   - useUpdateFeatureFlag() → PATCH /api/v1/admin/feature-flags/:key
   - useAddFlagOverride() → POST /api/v1/admin/feature-flags/:key/overrides
   - useAddFlagUserTarget() → POST /api/v1/admin/feature-flags/:key/user-targets
   - useExperiments() → GET /api/v1/admin/experiments
   - useExperiment(key) → GET /api/v1/admin/experiments/:key
   - useCreateExperiment() → POST /api/v1/admin/experiments
   - useCheckFeatureFlag(key) → GET /api/v1/feature-flags/check?key=...
3. Create FeatureFlagList page (data table with toggle switches)
4. Create FeatureFlagDetail page (overrides table, user targets)
5. Create FeatureGate component: <FeatureGate flag="name">...</FeatureGate>
6. Create useFeatureFlag(key) client hook for runtime checking (any role)
7. Create ExperimentsList and ExperimentDetail pages
8. Create portal pages:
   - app/dashboard/(auth)/platform/feature-flags/page.tsx
   - app/dashboard/(auth)/platform/feature-flags/[key]/page.tsx
   - app/dashboard/(auth)/platform/experiments/page.tsx

Flag changes require confirmation and are audited.
Emergency kill switches must be visually distinct.
FeatureFlagType enum: BOOLEAN, PERCENTAGE.
```
- [x] Completed

---

### Session 4.6: Activity Feeds
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-15.md (Activity Feeds section)

Task: Implement Activity Feeds:
1. Create modules/activity/ (types, hooks, components)
2. Create hooks: useActivityFeed with infinite scroll
3. Create ActivityFeed component (timeline view)
4. Create ActivityItem with type-specific icons
5. Create widget variant for dashboard sidebar
6. Integrate into portal dashboard pages

Activity feeds: read-only, time-ordered, hide internal notes from vendors.
```
- [x] Completed

---

### Session 4.7: Public Listing & Vendor Pages
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-26.md §26.6 (Public Listing & Vendor Pages)
Read docs/ai-prompt/part-25.md (Search — public vs authenticated)

Task: Implement Public Pages:
1. Update/extend app/(public)/layout.tsx — Add header + footer for public layout (created in 1.7)
2. Create app/(public)/listings/[idOrSlug]/page.tsx with generateMetadata for SEO
   - Backend: GET /api/v1/public/listings/:idOrSlug
   - Use Server Component for SSR/ISR
3. Create public listing detail view (gallery, info, attributes, location)
4. Create Schema.org structured data (Product/Service)
5. Create inquiry CTA (redirects to login if not authenticated)
6. Create app/(public)/vendors/[idOrSlug]/page.tsx with generateMetadata
   - Backend: GET /api/v1/public/vendors/:idOrSlug
7. Create public vendor profile (name, logo, listings grid, rating)
8. Enhance app/(public)/search/page.tsx (created in 4.1) to use public search endpoint
   - Backend: GET /api/v1/public/search/listings (rate-limited, no auth)
9. Handle 429 rate limit responses gracefully
10. Create related listings section
11. Create loading.tsx and not-found.tsx for each route

Public pages work WITHOUT authentication.
Use /api/v1/public/* endpoints (NOT authenticated endpoints).
```
- [x] Completed

---

### Session 4.8: Accessibility Compliance
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-21.md (Accessibility Deep Dive)

Task: Implement Accessibility:
1. Create lib/accessibility/ utilities:
   - useReducedMotion, useAnnounce, useFocusTrap
   - useArrowNavigation, useKeyboardShortcuts
   - SkipLink, VisuallyHidden, LiveRegion
   - AccessibleField, AccessibleButton
2. Add skip links to root layout
3. Ensure all interactive elements are keyboard accessible
4. Add aria-* attributes to custom components
5. Ensure color contrast compliance (4.5:1 text, 3:1 UI)
6. Add screen reader announcements for dynamic content
7. Test with axe-core

Must comply with WCAG 2.1 AA standards.
```
- [x] Completed

---

### Session 4.9: Performance Optimization
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-17.md (Performance & SSR/CSR)

Task: Optimize Performance:
1. Create lib/performance/ utilities:
   - Web Vitals monitoring (LCP, CLS, INP)
   - OptimizedImage component (blur placeholder, lazy loading)
   - PrefetchLink (hover/visible strategies)
   - Lazy component factory (code splitting)
   - LoadingBoundary with variant fallbacks
2. Update next.config.ts:
   - Image optimization (AVIF/WebP, device sizes)
   - Caching headers (static assets, fonts, API)
   - Security headers
3. Create performance hooks (useDebounce, useThrottle, useIntersectionObserver)
4. Install web-vitals package

Target: LCP < 2.5s, CLS < 0.1, INP < 200ms
```
- [x] Completed

---

### Session 4.10: Testing Setup
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-18.md (Testing Strategy)

Task: Setup Testing:
1. Configure Vitest for unit tests
2. Configure Playwright for E2E tests
3. Create test utilities (render with providers: QueryClient, Auth, Router)
4. Write unit tests for:
   - Query key factory
   - Error normalization
   - Permission guards
   - Zod schema generation
   - Filter serialization
5. Write integration tests for auth flow (with MSW or mocked API)
6. Write E2E test for vendor listing journey
7. Add scripts to package.json: test, test:unit, test:e2e

Coverage target: 80% for critical paths (auth, permissions, forms).
```
- [x] Completed

---

### Session 4.11: ENV Config & Deployment
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-19.md (ENV Config, Build/Deploy Setup)

Task: Configure Environment & Deployment:
1. Create comprehensive .env.example with ALL variables:
   - NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL
   - NEXT_PUBLIC_APP_ENV (development/staging/production)
   - NEXT_PUBLIC_PORTAL_NAME
   - API_INTERNAL_BASE_URL (server-side)
2. Create lib/config/env.ts — Zod validation for env vars (fail-fast)
3. Build-time vs runtime config separation
4. Configure next.config.ts for production optimizations
5. Create Dockerfile (optional)
6. Configure security headers (CSP, HSTS, etc.)
7. Document deployment steps in README.md

Secrets must NEVER use NEXT_PUBLIC_ prefix.
```
- [x] Completed

---

### Session 4.12: Pricing Config Management
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-26.md §26.1 (Pricing Config Management)

Task: Implement Pricing Module (Platform Admin):
1. Create modules/pricing/ (types, hooks, components)
2. Create hooks:
   - usePricingConfigs(params) → GET /api/v1/pricing/configs
   - usePricingConfig(id) → GET /api/v1/pricing/configs/:id
   - useCreatePricingConfig() → POST /api/v1/pricing/configs
   - useUpdatePricingConfig() → PATCH /api/v1/pricing/configs/:id
   - useDeletePricingConfig() → DELETE /api/v1/pricing/configs/:id
   - usePricingRules(params) → GET /api/v1/pricing/rules
   - useCreatePricingRule() → POST /api/v1/pricing/rules
   - useDeletePricingRule() → DELETE /api/v1/pricing/rules/:id
   - useChargeEvents(params) → GET /api/v1/pricing/charge-events
   - useChargeEvent(id) → GET /api/v1/pricing/charge-events/:id
   - useCalculateCharge() → POST /api/v1/pricing/calculate
3. Create PricingConfigList page (data table with CRUD)
4. Create PricingConfigForm (create/edit — ChargeType, PricingModel selects)
5. Create PricingRulesList page
6. Create ChargeEventsList (read-only, filterable)
7. Create ChargeCalculator tool (preview calculations)
8. Create portal pages:
   - app/dashboard/(auth)/platform/pricing/page.tsx
   - app/dashboard/(auth)/platform/pricing/configs/[id]/page.tsx
   - app/dashboard/(auth)/platform/pricing/charge-events/page.tsx

Enums: ChargeType (7 values), PricingModel (5 values).
```
- [x] Completed

---

### Session 4.13: Job Queue Dashboard
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-26.md §26.3 (Job Queue Dashboard)

Task: Implement Job Queue Dashboard (Platform Admin):
1. Create modules/jobs/ (types, hooks, components)
2. Create hooks for all 12 job queue endpoints (see Part-26)
3. Create Queue Health Dashboard (overview cards, per-queue stats)
4. Create Job List page (filterable by queue, status)
5. Create Job Detail view (JSON viewer, error trace, retry)
6. Create Bulk Operations page (reindex, expire with confirmation)
7. Add auto-refresh toggle (poll every 10s)
8. Create portal page:
   - app/dashboard/(auth)/platform/jobs/page.tsx

NOTE: Jobs API response is non-standard: { jobs: [...], total: N }.
```
- [x] Completed

---

### Session 4.14: Admin Listing Moderation
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-26.md §26.4 (Admin Listing Moderation)

Task: Implement Admin Listing Moderation:
1. Create modules/admin/hooks/admin-listings.ts with all 8 admin hooks
2. Enhance admin listing table with: Tenant, Vendor, Featured badge
3. Create action dropdown with admin actions (confirmation dialogs)
4. Create bulk action toolbar (Publish/Unpublish/Feature selected)
5. Add featured listing toggle
6. Create portal pages:
   - app/dashboard/(auth)/platform/listings/page.tsx
   - app/dashboard/(auth)/tenant/listings/page.tsx (tenant-scoped)

Use /api/v1/admin/listings/* endpoints (NOT /api/v1/listings/*).
```
- [x] Completed

---

### Session 4.15: Notification Preferences & Vendor Settings
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-26.md §26.7-26.8 (Preferences & Vendor Settings)

Task: Implement Notification Preferences & Vendor Settings:
1. Add useNotificationPreferences, useUpdateNotificationPreferences hooks
2. Create NotificationPreferencesGrid (13 types × 5 channels toggle grid)
3. Create notification preferences page for all portals
4. Add useVendorSettings, useUpdateVendorSettings, useUploadVendorLogo hooks
5. Create vendor settings page (business info, logo, visibility)
6. Create portal pages:
   - app/dashboard/(auth)/*/settings/notifications/page.tsx
   - app/dashboard/(auth)/vendor/settings/page.tsx
```
- [x] Completed

---

### Session 4.16: Backend Alignment Check
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-23.md (Backend Alignment & Contracts)

Task: Verify Backend Alignment:
1. Verify ALL enums match backend Prisma schema exactly
2. Verify ALL 4 API response formats are handled (Part-23 §23.4)
3. Verify error format handling
4. Create types/backend-contracts.ts with all shared types
5. Verify pagination params: page (1-indexed), pageSize (default 20, max 100)
6. Document any frontend-specific extensions

Frontend must NOT invent roles, statuses, or permissions.
Backend API docs: backend/docs/API-REGISTRY.md (160+ endpoints)
```
- [x] Completed

---

### Session 4.17: Final Checklist & Handover
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-20.md (Final Web Spine Checklist)

Task: Complete Final Checklist:
1. Verify all modules exist per part-20 checklist
2. Run full build validation: pnpm build
3. Run all tests: pnpm test
4. Verify boundary rules:
   - app/* doesn't call API directly
   - modules call lib/api/*
   - No cross-module deep imports
   - verticals don't fetch domain data
   - Core listing UI never hardcodes vertical fields
5. Verify all routes are protected correctly
6. Verify all forms have validation
7. Verify accessibility compliance
8. Create handover documentation
9. Update all progress tracking docs

This is the final validation before release.
```
- [x] Completed

---

## ✅ PHASE 4 CHECKPOINT (FRONTEND COMPLETE)
```
Final verification:

1. All pages render without errors
2. All forms submit correctly
3. WebSocket connects and updates work
4. Search returns correct results
5. Analytics display correctly
6. Accessibility audit passes
7. Performance metrics acceptable
8. All tests passing (149/149)
9. pnpm build succeeds with no errors (114/114 pages)

Frontend is now ready for integration testing.
```
- [x] All checks passed

---

## 🏠 PHASE 5 — PROPERTY MANAGEMENT: FOUNDATION UI

> **Reference:** `docs/PROPERTY-MANAGEMENT-EXTENSION.md` for full schema design  
> **Backend API:** Must complete backend Phase 5 first (or use MSW mocks)

### Session 5.1: Occupant Portal Setup
```
Continuing Zam-Property frontend development.

Read docs/PROPERTY-MANAGEMENT-EXTENSION.md (Section 7: Integration Points)

Task: Create Occupant portal foundation:
1. Add OCCUPANT to UserRole in modules/auth
2. Create app/dashboard/(auth)/occupant/ folder structure:
   - page.tsx (dashboard redirect)
   - layout.tsx (occupant-specific layout)
3. Add occupantNav to config/navigation.ts:
   - Dashboard, My Tenancy, Bills, Maintenance, Inspections, Documents, Profile, Settings
4. Create modules/occupant/ folder:
   - types/index.ts (Occupant, OccupantDocument interfaces)
   - hooks/index.ts (barrel export)
   - components/index.ts (barrel export)
5. Update auth flow to redirect OCCUPANT to /dashboard/occupant

Navigation items: Dashboard, My Tenancy, Bills & Payments, Maintenance, Inspections, Documents
```
- [x] Completed (2026-02-24)

---

### Session 5.2: Occupant Onboarding
```
Continuing Zam-Property frontend development.

Task: Create occupant onboarding flow:
1. Create app/dashboard/(auth)/occupant/onboarding/:
   - page.tsx
   - content.tsx (multi-step wizard)
2. Create OnboardingWizard component:
   - Step 1: Personal details (IC, employment)
   - Step 2: Document upload (IC front/back, payslip)
   - Step 3: Emergency contact
   - Step 4: Review & submit
3. Create modules/occupant/hooks/:
   - useOccupantProfile.ts
   - useUploadDocument.ts
4. Create DocumentUploader component with S3 presigned upload
5. Add MSW handlers for occupant endpoints

Reuse: MediaUploader pattern from modules/media
```
- [x] Completed (2026-02-24)

---

### Session 5.3: Tenancy List Page
```
Continuing Zam-Property frontend development.

Task: Create My Tenancy page:
1. Create app/dashboard/(auth)/occupant/tenancy/:
   - page.tsx
   - content.tsx
   - loading.tsx
2. Create modules/tenancy/ folder:
   - types/index.ts (Tenancy, TenancyStatus interfaces)
   - hooks/useTenancies.ts
   - hooks/useTenancy.ts
3. Create TenancyList component:
   - Filter by status (ACTIVE, TERMINATED, etc.)
   - Show property thumbnail, address, dates
   - Status badge with color coding
4. Create TenancyCard component for list items
5. Add MSW handlers for /tenancies endpoints

Status colors: ACTIVE=green, TERMINATED=gray, OVERDUE=red
```
- [x] Completed (2026-02-24)

---

### Session 5.4: Tenancy Detail Page
```
Continuing Zam-Property frontend development.

Task: Create tenancy detail view:
1. Create app/dashboard/(auth)/occupant/tenancy/[id]/:
   - page.tsx
   - content.tsx
   - loading.tsx
2. Create TenancyDetail component:
   - Property info section
   - Tenancy dates & status
   - Financial summary (rent, deposits)
   - Documents section (contract)
   - Action buttons based on status
3. Create TenancyTimeline component:
   - Show status history
   - Interactive timeline with dates
4. Create TenancyActions component:
   - Request termination
   - Request maintenance
   - View contract
5. Add useTenancyDetail hook

Actions change based on status (e.g., can't terminate if already terminated).
```
- [x] Completed (2026-02-24)

---

### Session 5.5: Tenancy Booking Wizard
```
Continuing Zam-Property frontend development.

Task: Create booking flow for new tenancy:
1. Create modules/tenancy/components/TenancyBookingWizard.tsx:
   - Step 1: Confirm property details
   - Step 2: Personal verification (link to onboarding if needed)
   - Step 3: Deposit payment intent
   - Step 4: Confirmation
2. Create useCreateTenancy hook
3. Integrate with existing listing detail page:
   - Add "Book This Property" button
   - Opens wizard dialog
4. Create PaymentStep component (Stripe/FPX)
5. Handle success/failure states

Entry point: From listing detail page → Book → Wizard
```
- [x] Completed (2026-02-24)

---

### Session 5.6: Contract View
```
Continuing Zam-Property frontend development.

Task: Create contract viewing:
1. Create modules/contract/ folder:
   - types/index.ts
   - hooks/useContract.ts
2. Create app/dashboard/(auth)/occupant/tenancy/[id]/contract/:
   - page.tsx
   - content.tsx
3. Create ContractViewer component:
   - PDF embed/preview
   - Download button
   - Signature status display
   - Sign button (if pending)
4. Create ContractStatusBadge component
5. Show contract terms summary

PDF viewer: Use react-pdf or iframe for PDF display.
```
- [x] Completed (2026-02-24)

---

### Session 5.7: E-Signature Integration
```
Continuing Zam-Property frontend development.

Task: Create signature flow:
1. Create modules/contract/components/SignatureFlow.tsx:
   - Show who has signed
   - Pending signatures highlighted
   - Sign button for current user
2. Integrate with e-signature provider:
   - Embed signing iframe (DocuSign/SignNow)
   - OR redirect to signing URL
3. Create useSignContract hook
4. Handle webhook callbacks (contract signed event)
5. Auto-refresh contract status after signing
6. Show celebration/success on full execution

Flow: Owner signs → Occupant signs → Contract active → Tenancy active
```
- [x] Completed (2026-02-24)

---

### Session 5.8: Deposit Tracking
```
Continuing Zam-Property frontend development.

Task: Create deposit management UI:
1. Create modules/deposit/ folder:
   - types/index.ts (Deposit, DepositStatus)
   - hooks/useDeposits.ts
2. Create DepositTracker component:
   - Show all deposits for tenancy (security, utility, key)
   - Status badges
   - Amount collected vs pending
3. Create DepositRefundStatus component:
   - Show deductions (linked claims)
   - Net refundable amount
   - Refund processing status
4. Add to TenancyDetail page
5. Add MSW handlers for /deposits endpoints

Display: Visual progress of deposit lifecycle (Pending → Collected → Held → Refunded)
```
- [x] Completed (2026-02-24)

---

### Session 5.9: Owner Tenancy Management
```
Continuing Zam-Property frontend development.

Task: Create owner view of tenancies:
1. Create app/dashboard/(auth)/vendor/tenancies/:
   - page.tsx
   - content.tsx (list all tenancies for owner's properties)
2. Create OwnerTenancyList component:
   - Group by property
   - Filter by status
   - Quick actions (approve, reject)
3. Create OwnerTenancyCard with actions
4. Add to vendor navigation
5. Create hooks/useOwnerTenancies.ts

Owner sees all tenancies across all their properties.
```
- [x] Completed (2026-02-24)

---

### Session 5.10: Owner Tenancy Actions
```
Continuing Zam-Property frontend development.

Task: Create owner action panels:
1. Create app/dashboard/(auth)/vendor/tenancies/[id]/:
   - page.tsx
   - content.tsx
2. Create OwnerTenancyActions component:
   - Approve/Reject booking
   - Confirm deposit received
   - Sign contract
   - Handover property (checklist)
   - Request inspection
   - Process termination
3. Create TenantScreeningPanel (view screening results)
4. Create HandoverChecklist component
5. Add action confirmation dialogs

Actions are context-aware based on tenancy status.
```
- [x] Completed

---

### Session 5.11: Navigation & Route Updates
```
Continuing Zam-Property frontend development.

Task: Update navigation and routing:
1. Update config/navigation.ts:
   - Add occupantNav (full nav tree)
   - Add tenancy items to vendorNav
2. Update NAV-STRUCTURE.md with new routes
3. Update auth redirect logic:
   - OCCUPANT → /dashboard/occupant
4. Add breadcrumbs for tenancy routes
5. Create shared TenancyBreadcrumb component
6. Test all navigation flows

Ensure: Role-based nav tree selection works correctly.
```
- [x] Completed

---

### Session 5.12: Phase 5 Frontend Testing
```
Continuing Zam-Property frontend development.

Task: Testing and validation:
1. Create tests for:
   - Occupant onboarding wizard
   - Tenancy list filtering
   - Contract viewer
   - Deposit tracker
2. Run TypeScript validation (0 errors)
3. Run full test suite (all passing)
4. Update docs/PROGRESS.md
5. Create demo walkthrough of flows

Verify: Complete occupant journey from registration to active tenancy.
```
- [x] Completed

---

## ✅ PHASE 5 FRONTEND CHECKPOINT
```
Verify Phase 5 UI completion:
1. Occupant can onboard with documents
2. Occupant can view their tenancies
3. Contract viewing and signing works
4. Deposit tracking displays correctly
5. Owner can manage tenancies
6. Navigation is correct for all roles
7. All tests passing
```
- [x] All checks passed

---

## 💰 PHASE 6 — BILLING & PAYMENT UI

### Session 6.1: Bill List Page
```
Continuing Zam-Property frontend development.

Task: Create bills listing for occupant:
1. Create modules/billing/ folder:
   - types/index.ts (Billing, BillingLineItem, BillingStatus)
   - hooks/useBillings.ts
   - hooks/useBilling.ts
2. Create app/dashboard/(auth)/occupant/bills/:
   - page.tsx
   - content.tsx
   - loading.tsx
3. Create BillList component:
   - Filter: All, Pending, Paid, Overdue
   - Columns: Period, Amount, Due Date, Status, Actions
4. Create BillingStatusBadge component
5. Add MSW handlers for /billings endpoints

Overdue bills highlighted in red with urgency indicator.
```
- [x] Completed

---

### Session 6.2: Bill Detail & Line Items
```
Continuing Zam-Property frontend development.

Task: Create bill detail view:
1. Create app/dashboard/(auth)/occupant/bills/[id]/:
   - page.tsx
   - content.tsx
2. Create BillDetail component:
   - Header: Bill number, period, status
   - Line items table (rent, utilities, deductions)
   - Payment history
   - Pay button (if not fully paid)
3. Create BillingLineItemTable component
4. Create PaymentHistory component
5. Add PDF download button

Show breakdown: Rent + Utilities - Claims = Total Due
```
- [x] Completed

---

### Session 6.3: Payment Flow
```
Continuing Zam-Property frontend development.

Task: Create payment UI:
1. Create modules/payment/ folder:
   - types/index.ts
   - hooks/useCreatePayment.ts
   - hooks/usePaymentStatus.ts
2. Create PaymentDialog component:
   - Amount (default full, allow partial)
   - Payment method selection (Card, FPX, Bank Transfer)
   - Stripe Elements embed
3. Create FPXPaymentForm for Malaysian payments
4. Handle payment success/failure redirects
5. Show processing state during payment

Methods: Credit Card (Stripe), FPX (Malaysia), Manual Bank Transfer
```
- [x] Completed

---

### Session 6.4: Payment Receipt
```
Continuing Zam-Property frontend development.

Task: Create receipt display:
1. Create modules/payment/components/Receipt.tsx:
   - Receipt number
   - Payment details
   - Amount paid
   - Date/time
   - Download PDF button
2. Create app/dashboard/(auth)/occupant/bills/[id]/receipt/:
   - page.tsx
3. Create ReceiptDownload component
4. Add receipt link to payment history
5. Success page after payment with receipt link

Receipt should be printable (clean CSS).
```
- [x] Completed

---

### Session 6.5: Owner Billing Dashboard
```
Continuing Zam-Property frontend development.

Task: Create owner view of all bills:
1. Create app/dashboard/(auth)/vendor/billing/:
   - page.tsx
   - content.tsx
2. Create OwnerBillingDashboard:
   - Summary cards (Total Due, Collected, Overdue)
   - Bills by property
   - Filter by property, status, date range
3. Create BillingStatsCards component
4. Create OwnerBillList with property grouping
5. Add to vendor navigation

Owner sees collection status across all properties.
```
- [x] Completed

---

### Session 6.6: Owner Payout List
```
Continuing Zam-Property frontend development.

Task: Create payout history for owners:
1. Create modules/payout/ folder:
   - types/index.ts
   - hooks/usePayouts.ts
2. Create app/dashboard/(auth)/vendor/payouts/:
   - page.tsx
   - content.tsx
3. Create PayoutList component:
   - Period, Gross, Fees, Net, Status
   - Filter by date range
4. Create PayoutStatusBadge
5. Add to vendor navigation

Show: What owner is getting paid and when.
```
- [x] Completed

---

### Session 6.7: Payout Detail & Statement
```
Continuing Zam-Property frontend development.

Task: Create payout detail view:
1. Create app/dashboard/(auth)/vendor/payouts/[id]/:
   - page.tsx
   - content.tsx
2. Create PayoutDetail component:
   - Period dates
   - Line items (rental income per property)
   - Deductions (platform fee, maintenance, claims)
   - Net payout amount
   - Bank transfer details
3. Create PayoutStatement component (printable)
4. Add download PDF button
5. Show payout timeline (calculated → approved → processed)

Statement format: Professional invoice-style document.
```
- [x] Completed

---

### Session 6.8: Phase 6 Frontend Testing
```
Continuing Zam-Property frontend development.

Task: Testing and validation:
1. Create tests for:
   - Bill list filtering
   - Payment flow (mock Stripe)
   - Receipt display
   - Payout detail
2. Run TypeScript validation
3. Run full test suite
4. E2E test: View bill → Pay → See receipt
5. Update docs/PROGRESS.md

Verify: Complete payment journey works end-to-end.
```
- [x] Completed

---

## ✅ PHASE 6 FRONTEND CHECKPOINT
```
Verify Phase 6 UI completion:
1. Occupant can view bills
2. Occupant can pay bills
3. Receipts display and download
4. Owner sees billing dashboard
5. Owner sees payout history
6. All tests passing
```
- [x] All checks passed

---

## 🔧 PHASE 7 — OPERATIONS UI

### Session 7.1: Maintenance Request Form
```
Continuing Zam-Property frontend development.

Task: Create maintenance request UI:
1. Create modules/maintenance/ folder:
   - types/index.ts (Maintenance, MaintenanceStatus, MaintenancePriority)
   - hooks/useMaintenance.ts
   - hooks/useCreateMaintenance.ts
2. Create app/dashboard/(auth)/occupant/maintenance/:
   - page.tsx
   - content.tsx (list + create)
3. Create MaintenanceRequestForm:
   - Category dropdown
   - Title, Description
   - Priority selection
   - Photo upload (multiple)
4. Create MaintenanceList component
5. Add quick action from tenancy detail

Categories: Plumbing, Electrical, Appliance, Structural, Other
```
- [x] Completed

---

### Session 7.2: Maintenance Tracking
```
Continuing Zam-Property frontend development.

Task: Create maintenance detail view:
1. Create app/dashboard/(auth)/occupant/maintenance/[id]/:
   - page.tsx
   - content.tsx
2. Create MaintenanceDetail component:
   - Status badge and timeline
   - Issue description and photos
   - Updates/comments thread
   - Add update button
3. Create MaintenanceTimeline component
4. Create MaintenanceComments component
5. Real-time updates via WebSocket

Occupant can see progress and add comments.
```
- [x] Completed

---

### Session 7.3: Owner Maintenance Inbox
```
Continuing Zam-Property frontend development.

Task: Create owner maintenance management:
1. Create app/dashboard/(auth)/vendor/maintenance/:
   - page.tsx
   - content.tsx
2. Create OwnerMaintenanceInbox:
   - Group by property
   - Filter by status, priority
   - Quick actions (verify, assign, resolve)
3. Create MaintenanceAssignDialog:
   - Assign to staff member
   - OR external contractor (name, phone)
   - Set estimated cost
4. Create OwnerMaintenanceDetail page
5. Add resolve and close actions

Owner manages all maintenance for their properties.
```
- [x] Completed

---

### Session 7.4: Inspection Scheduling
```
Continuing Zam-Property frontend development.

Task: Create inspection scheduling:
1. Create modules/inspection/ folder:
   - types/index.ts
   - hooks/useInspections.ts
2. Create app/dashboard/(auth)/occupant/inspections/:
   - page.tsx
   - content.tsx
3. Create InspectionList component
4. Create InspectionScheduler:
   - Calendar date picker
   - Time slot selection
   - Type selection (if applicable)
5. Add inspection card to tenancy detail

Types: Move-in, Periodic, Move-out, Emergency
```
- [x] Completed

---

### Session 7.5: Video Inspection
```
Continuing Zam-Property frontend development.

Task: Create video inspection flow:
1. Create InspectionDetail page:
   - app/dashboard/(auth)/occupant/inspections/[id]/
2. Create VideoInspectionUploader:
   - Request video notice
   - Large file upload (chunked)
   - Progress indicator
   - Preview after upload
3. Create VideoPlayer component for review
4. Owner view: Review video, approve or request redo
5. Support mobile camera capture

Upload: Support large video files (up to 500MB).
```
- [x] Completed

---

### Session 7.6: Claim Management UI
```
Continuing Zam-Property frontend development.

Task: Create claim submission and tracking:
1. Create modules/claim/ folder:
   - types/index.ts
   - hooks/useClaims.ts
2. Create ClaimSubmissionForm:
   - Type selection
   - Description
   - Amount claimed
   - Evidence upload (photos, receipts)
3. Create ClaimList component (for occupant)
4. Create ClaimDetail with status tracking
5. Owner view: Review claims, approve/reject
6. Create ClaimReviewPanel for owner

Evidence: Photos of damage, receipts for repairs, quotes.
```
- [x] Completed

---

## ✅ PHASE 7 FRONTEND CHECKPOINT
```
Verify Phase 7 UI completion:
1. Occupant can submit maintenance requests
2. Maintenance tracking works with timeline
3. Owner can manage maintenance inbox
4. Inspections can be scheduled
5. Video inspections upload and play
6. Claims can be submitted and reviewed
7. All tests passing
```
- [x] All checks passed

---

## 🚀 PHASE 8 — GROWTH FEATURES UI

### Session 8.1: Company Registration
```
Continuing Zam-Property frontend development.

Task: Create company registration flow:
1. Create modules/company/ folder:
   - types/index.ts
   - hooks/useCompany.ts
2. Create public registration wizard:
   - app/(auth)/register/company/
3. Create CompanyRegistrationWizard:
   - Step 1: Company details
   - Step 2: Admin user details
   - Step 3: Document upload (SSM, license)
   - Step 4: Package selection
   - Step 5: Payment
   - Step 6: Confirmation
4. Reuse existing subscription/payment components
5. Handle verification pending state

Company types: Property Company, Management Company, Agency
```
- [x] Completed

---

### Session 8.2: Company Dashboard
```
Continuing Zam-Property frontend development.

Task: Create company admin dashboard:
1. Create app/dashboard/(auth)/company/:
   - page.tsx (dashboard)
   - layout.tsx
2. Add companyNav to config/navigation.ts
3. Create CompanyDashboard:
   - Stats: Properties, Agents, Active Tenancies, Revenue
   - Recent activity feed
   - Quick actions
4. Create CompanyStatsCards component
5. Add COMPANY_ADMIN to portal routing

Company admin sees aggregate stats across all their listings.
```
- [x] Completed

---

### Session 8.3: Agent Management
```
Continuing Zam-Property frontend development.

Task: Create agent CRUD:
1. Create app/dashboard/(auth)/company/agents/:
   - page.tsx
   - content.tsx (list)
   - [id]/page.tsx (detail)
2. Create modules/agent/ folder:
   - types/index.ts
   - hooks/useAgents.ts
3. Create AgentList component
4. Create AgentRegistrationForm:
   - User details
   - REN number
   - Photo
5. Create AgentProfileCard
6. Create AssignListingDialog

Agents belong to a company and can be assigned to listings.
```
- [x] Completed

---

### Session 8.4: Agent Dashboard & Commission
```
Continuing Zam-Property frontend development.

Task: Create agent-specific views:
1. Create app/dashboard/(auth)/agent/:
   - page.tsx (dashboard)
   - layout.tsx
2. Add agentNav to config/navigation.ts
3. Create AgentDashboard:
   - My Listings
   - My Tenancies
   - Commission summary
   - Referral code
4. Create CommissionList component
5. Create CommissionDetail component
6. Show pending vs paid commissions

Agent sees their performance and earnings.
```
- [x] Completed

---

### Session 8.5: Affiliate Dashboard
```
Continuing Zam-Property frontend development.

Task: Create affiliate portal:
1. Create modules/affiliate/ folder:
   - types/index.ts
   - hooks/useAffiliate.ts
2. Create app/dashboard/(auth)/affiliate/:
   - page.tsx
3. Create AffiliateDashboard:
   - Referral code display (copy button)
   - Shareable link generator
   - Referral stats
   - Earnings summary
   - Payout history
4. Create ReferralList component
5. Create AffiliatePayoutRequest

Affiliate can share code and track earnings.
```
- [x] Completed

---

### Session 8.6: Legal Case View
```
Continuing Zam-Property frontend development.

Task: Create legal case management UI:
1. Create modules/legal/ folder:
   - types/index.ts
   - hooks/useLegalCases.ts
2. Create app/dashboard/(auth)/vendor/legal/:
   - page.tsx (list)
   - [id]/page.tsx (detail)
3. Create LegalCaseList component
4. Create LegalCaseDetail:
   - Case timeline
   - Document list
   - Assigned lawyer
   - Status updates
5. Owner-only view (escalated cases)

Shows cases escalated from overdue payments.
```
- [x] Completed

---

### Session 8.7: Platform Admin - Property Management
```
Continuing Zam-Property frontend development.

Task: Add property management to platform admin:
1. Create app/dashboard/(auth)/platform/tenancies/:
   - Overview of all tenancies across tenants
2. Create app/dashboard/(auth)/platform/billing/:
   - Platform-wide billing overview
3. Create app/dashboard/(auth)/platform/payouts/:
   - All payouts, approval queue
4. Add to platform navigation
5. Create aggregate stats dashboard

Platform admin sees everything across all tenants.
```
- [x] Completed

---

### Session 8.8: Final Testing & Documentation
```
Continuing Zam-Property frontend development.

Task: Final validation:
1. Run full TypeScript check (0 errors)
2. Run all tests (must pass)
3. Update NAV-STRUCTURE.md with all new routes
4. Update API-REGISTRY.md with all new hooks
5. Update PROGRESS.md
6. Create user flow documentation
7. pnpm build must succeed

Verify: All role-based flows work end-to-end.
```
- [x] Completed

---

## ✅ PHASE 8 FRONTEND CHECKPOINT (PROPERTY MANAGEMENT COMPLETE)
```
Final verification:
1. Company registration works
2. Company dashboard shows stats
3. Agent management works
4. Agent sees their dashboard
5. Affiliate tracking works
6. Legal cases display
7. Platform admin has overview
8. All tests passing
9. Build succeeds

Property Management frontend is now complete.
```
- [x] All checks passed (2026-02-26)

---

## 📝 Session Completion Template

After completing each session, use this prompt:
```
Session [X.X] completed.

Please update the following documentation:
1. docs/PROGRESS.md - Mark session [X.X] as completed with today's date
2. docs/NAV-STRUCTURE.md - Add any new routes or navigation items
3. docs/API-REGISTRY.md - Add any new hooks

Summary of what was implemented:
- [List key deliverables]

Any notes or issues:
- [List any deviations or problems]
```

---

## 🔍 Quick Debugging Prompts

### Check Component Rendering
```
Review the [component] for rendering issues:
1. Is 'use client' directive present if needed?
2. Are loading/error states handled?
3. Is Suspense boundary in place?
```

### Check Query Implementation
```
Review the [hook] for query issues:
1. Is the query key structured correctly (tenant-scoped)?
2. Is staleTime appropriate for the data type?
3. Is error handling in place?
4. Is keepPreviousData set for list queries?
```

### Check Form Validation
```
Review the [form] for validation issues:
1. Is Zod schema complete and correct?
2. Do field names match backend DTOs?
3. Are error messages user-friendly?
4. Is the form using React Hook Form + Zod resolver?
```

### Check Route Protection
```
Review route protection for [portal]:
1. Is layout.tsx guarding by role?
2. Is middleware checking auth state?
3. Is the redirect target correct?
4. Does it handle loading state (no auth flicker)?
```
