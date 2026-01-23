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

### Post-Session Command (Run at END of each session)
```
Session X.X completed.

Please update the following documentation:
1. docs/PROGRESS.md - Mark session X.X as completed
2. docs/NAV-STRUCTURE.md - Add any new navigation items

Summary of what was implemented:
- [List key deliverables]

Any notes or issues:
- [List any deviations or problems]
```

---

## 🔧 PHASE 1 — FOUNDATION

### Session 1.1: Initialize Next.js Project
```
I'm starting Zam-Property frontend development.

FIRST, read these foundation documents to understand the project:
1. docs/ai-prompt/master-prompt.md - Master Project Brief
2. docs/ai-prompt/part-0.md - Global Rules & Standards
3. docs/ai-prompt/part-1.md - Project Brief & Dashboard Scope
4. docs/ai-prompt/part-2.md - Architecture & Routing

Task: Initialize the Next.js project with:
1. Create Next.js 14+ project with App Router
2. Install all dependencies (TanStack Query, Zustand, React Hook Form, Zod, etc.)
3. Create folder structure per Part 2 (src/app, src/components, src/modules, src/lib, src/verticals)
4. Setup tsconfig paths (@/, @components/, @modules/, @lib/)
5. Create .env.example file with all required variables
6. Configure Tailwind CSS and install shadcn/ui

Do NOT create business logic yet. Just the skeleton.
```
- [ ] Completed

---

### Session 1.2: shadcn/ui Setup & Theme
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-5.md (UI Composition & Layouts)

Task: Setup shadcn/ui and theming:
1. Initialize shadcn/ui with default config
2. Install core components (Button, Card, Input, Dialog, etc.)
3. Configure theme with CSS variables
4. Create dark/light mode toggle
5. Create base typography styles

Components to install: button, card, input, label, dialog, dropdown-menu, 
avatar, badge, separator, skeleton, toast, tabs, table
```
- [ ] Completed

---

### Session 1.3: API Client & Query Setup
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-3.md (API Client, OpenAPI & Query Strategy)

Task: Setup API infrastructure:
1. Create API client with axios/fetch
2. Setup TanStack Query provider with defaults
3. Create base query/mutation hooks pattern
4. Setup request/response interceptors
5. Create error handling utilities
6. Setup query key factory pattern

API base URL should come from NEXT_PUBLIC_API_URL env var.
```
- [ ] Completed

---

### Session 1.4: Auth Context & Session Management
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-4.md (Auth, Session & Route Guards)

Task: Implement Auth infrastructure:
1. Create AuthContext with user state
2. Create useAuth hook
3. Implement JWT token storage (httpOnly cookie preferred)
4. Create login/logout functions
5. Setup token refresh logic
6. Create auth state persistence

Token refresh should happen automatically before expiry.
```
- [ ] Completed

---

### Session 1.5: Login & Register Pages
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-4.md (Auth pages section)

Task: Implement Auth pages:
1. Create /login page with form
2. Create /register page with form
3. Implement form validation with Zod
4. Connect to backend auth endpoints
5. Handle auth errors gracefully
6. Redirect to appropriate portal after login

Forms: email, password for login. Add fullName, phone for register.
```
- [ ] Completed

---

### Session 1.6: Route Guards & Middleware
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-4.md (Route Guards section)

Task: Implement Route Protection:
1. Create Next.js middleware for route protection
2. Implement role-based redirects
3. Create ProtectedRoute wrapper component
4. Setup portal access rules (platform, tenant, vendor)
5. Handle unauthenticated access

Routes:
- /platform/* → SUPER_ADMIN only
- /tenant/* → TENANT_ADMIN only
- /vendor/* → VENDOR_ADMIN, VENDOR_STAFF
```
- [ ] Completed

---

### Session 1.7: Layout Shells
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-5.md (Layouts & Navigation section)

Task: Create Layout Shells:
1. Create root layout with providers
2. Create PlatformLayout shell (sidebar, header)
3. Create TenantLayout shell
4. Create VendorLayout shell
5. Create PublicLayout for unauthenticated pages
6. Implement responsive sidebar toggle

Each portal has distinct branding/colors.
```
- [ ] Completed

---

### Session 1.8: Navigation Components
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-5.md (Navigation section)

Task: Build Navigation:
1. Create Sidebar component with nav items
2. Create Header component with user menu
3. Create Breadcrumb component
4. Create mobile navigation drawer
5. Implement active state highlighting
6. Create nav item config per portal

Navigation must be configurable per portal and role.
```
- [ ] Completed

---

### Session 1.9: Tenant Context
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-4.md (Tenant Context section)

Task: Implement Tenant Context:
1. Create TenantContext to hold current tenant
2. Extract tenant from subdomain or header
3. Create useTenant hook
4. Pass tenant in all API requests
5. Create tenant-aware query keys

Tenant resolution: subdomain first, then X-Tenant-ID header.
```
- [ ] Completed

---

### Session 1.10: Error Handling & Boundaries
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-3.md (Error Normalization section)
Read docs/ai-prompt/part-15.md (User Feedback Patterns)

Task: Implement Error Handling:
1. Create ErrorBoundary component
2. Create global error handler
3. Create toast notification system
4. Map backend error codes to user messages
5. Create error page (404, 500)
6. Setup Suspense boundaries

All errors must show user-friendly messages.
```
- [ ] Completed

---

### Session 1.11: Loading States & Skeletons
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-17.md (Performance section)

Task: Implement Loading States:
1. Create Skeleton components for common patterns
2. Create LoadingSpinner component
3. Create page-level loading states
4. Create component-level loading states
5. Setup Suspense fallbacks

Loading states for: cards, tables, forms, page shells.
```
- [ ] Completed

---

### Session 1.12: Form Infrastructure
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-6.md (Domain Module Patterns - Forms)

Task: Setup Form Infrastructure:
1. Create base Form component with React Hook Form
2. Create FormField wrapper components
3. Create common input components (text, select, checkbox, etc.)
4. Setup Zod schema pattern
5. Create form error display component
6. Create submit button with loading state

All forms must use React Hook Form + Zod.
```
- [ ] Completed

---

## ✅ PHASE 1 CHECKPOINT
```
Before continuing to Phase 2, verify:

1. Run: pnpm build (should compile without errors)
2. Run: pnpm dev (should start without errors)
3. Test: Login flow works
4. Test: Route guards redirect correctly
5. Test: Layouts render per portal
6. Test: Navigation works
7. Check: No TypeScript errors

If all pass, continue to Phase 2.
```
- [ ] All checks passed

---

## 🏢 PHASE 2 — CORE MODULES

### Session 2.1: Listing List View
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-8.md (Listings Dashboard Module)

Task: Implement Listing List:
1. Create modules/listing folder structure
2. Create useListings query hook
3. Create ListingCard component
4. Create ListingList component with grid/list toggle
5. Create ListingFilters component
6. Implement pagination

Display: title, price, status, location, primary image.
```
- [ ] Completed

---

### Session 2.2: Listing Detail View
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-8.md (Detail View section)

Task: Implement Listing Detail:
1. Create useListing(id) query hook
2. Create ListingDetail page component
3. Create ListingGallery component
4. Create ListingInfo component
5. Create ListingActions component (edit, publish, archive)
6. Create ListingStats component

Detail shows all listing data + status actions.
```
- [ ] Completed

---

### Session 2.3: Listing Create/Edit Form
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-8.md (Create/Edit section)
Read docs/ai-prompt/part-7.md (Vertical UI Plugin)

Task: Implement Listing Form:
1. Create useListingMutations hook (create, update)
2. Create ListingForm component
3. Create dynamic attribute fields based on vertical
4. Implement image upload with preview
5. Implement draft save functionality
6. Add form validation per vertical schema

Form must support multiple verticals via schema registry.
```
- [ ] Completed

---

### Session 2.4: Vendor List & Detail
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-9.md (Vendors Module)

Task: Implement Vendor Views:
1. Create modules/vendor folder structure
2. Create useVendors, useVendor hooks
3. Create VendorList component
4. Create VendorCard component
5. Create VendorDetail page
6. Create VendorApprovalActions (approve, reject, suspend)

Show: name, status, listing count, rating, contact info.
```
- [ ] Completed

---

### Session 2.5: Vendor Onboarding Form
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-9.md (Onboarding section)

Task: Implement Vendor Onboarding:
1. Create vendor registration flow
2. Create multi-step onboarding form
3. Create document upload for verification
4. Create profile completion form
5. Create useVendorMutations hook
6. Implement progress indicator

Steps: Basic Info → Business Details → Documents → Review
```
- [ ] Completed

---

### Session 2.6: Tenant Management (Platform Admin)
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-9.md (Tenants Module)

Task: Implement Tenant Views:
1. Create modules/tenant folder structure
2. Create useTenants, useTenant hooks
3. Create TenantList for platform admin
4. Create TenantDetail page
5. Create TenantSettings form
6. Create TenantStatusActions

Only visible in Platform Admin portal.
```
- [ ] Completed

---

### Session 2.7: Interactions/Inbox Module
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-10.md (Interactions Module)

Task: Implement Interactions:
1. Create modules/interaction folder structure
2. Create useInteractions hook with filters
3. Create InteractionList (inbox view)
4. Create InteractionCard component
5. Create InteractionDetail with messages
6. Create InteractionStatusActions
7. Create InteractionReplyForm

Types: LEAD, ENQUIRY, BOOKING
Status workflow: NEW → CONTACTED → CONFIRMED → CLOSED
```
- [ ] Completed

---

### Session 2.8: Reviews Module
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-11.md (Reviews Module)

Task: Implement Reviews:
1. Create modules/review folder structure
2. Create useReviews hook
3. Create ReviewList component
4. Create ReviewCard with rating display
5. Create ReviewModerationActions (approve, reject, flag)
6. Create ReviewStats component

Vendor portal: see own reviews
Tenant admin: moderate reviews
```
- [ ] Completed

---

### Session 2.9: Media Upload Component
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-8.md (Media section)

Task: Implement Media Upload:
1. Create MediaUploader component
2. Implement presigned URL upload flow
3. Create image preview with crop
4. Create drag-and-drop zone
5. Create upload progress indicator
6. Create media gallery selector

Flow: Request presigned URL → Upload to S3 → Confirm → Display
```
- [ ] Completed

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

If all pass, continue to Phase 3.
```
- [ ] All checks passed

---

## 🔌 PHASE 3 — REAL-TIME & VERTICALS

### Session 3.1: WebSocket Infrastructure
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-22.md (WebSocket Integration)

Task: Setup WebSocket:
1. Create lib/websocket folder
2. Create useWebSocket hook
3. Implement Socket.IO client connection
4. Handle authentication (JWT in handshake)
5. Create reconnection logic
6. Create connection status indicator

Events to handle: listing:updated, interaction:new, notification:new
```
- [ ] Completed

---

### Session 3.2: Real-time Notifications
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-15.md (Notifications section)
Read docs/ai-prompt/part-22.md (Real-time events)

Task: Implement Real-time Notifications:
1. Create modules/notification folder
2. Create useNotifications hook
3. Create NotificationBell component
4. Create NotificationList dropdown
5. Create NotificationItem component
6. Handle WebSocket notification events
7. Implement mark as read

Show unread count on bell icon.
```
- [ ] Completed

---

### Session 3.3: Real-time Updates
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-22.md (Live Updates section)

Task: Implement Live Updates:
1. Listen for listing:updated events
2. Listen for interaction:new events
3. Invalidate relevant queries on events
4. Show toast for important updates
5. Update UI optimistically
6. Handle offline/reconnection gracefully

Updates should reflect immediately without page refresh.
```
- [ ] Completed

---

### Session 3.4: Vertical Registry
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-7.md (Vertical UI Plugin)

Task: Implement Vertical Registry:
1. Create verticals/registry folder
2. Create VerticalRegistry class
3. Create attribute schema types
4. Create AttributeRenderer component
5. Create DynamicForm generator
6. Create FilterBuilder for vertical attributes

Registry enables pluggable vertical support without hardcoding.
```
- [ ] Completed

---

### Session 3.5: Real Estate Vertical - Forms
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-24.md (Real Estate Vertical)

Task: Implement Real Estate Forms:
1. Create verticals/real-estate folder
2. Register real estate attribute schema
3. Create property type selector
4. Create real estate specific fields
5. Create tenure, furnishing selectors
6. Implement conditional field logic

Attributes: propertyType, listingType, tenure, bedrooms, bathrooms, 
builtUpSize, landSize, furnishing, facilities, etc.
```
- [ ] Completed

---

### Session 3.6: Real Estate Vertical - Filters
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-24.md (Search & Filters section)
Read docs/ai-prompt/part-16.md (Search UI)

Task: Implement Real Estate Filters:
1. Create RealEstateFilters component
2. Create property type facet filter
3. Create bedroom/bathroom filters
4. Create price range slider
5. Create furnishing filter
6. Create location/area filter

Filters should work with search and listing pages.
```
- [ ] Completed

---

## ✅ PHASE 3 CHECKPOINT
```
Before continuing to Phase 4, verify:

1. WebSocket connects successfully
2. Real-time notifications appear
3. Live updates reflect on listings
4. Vertical registry loads schemas
5. Real estate form renders all fields
6. Real estate filters work correctly

If all pass, continue to Phase 4.
```
- [ ] All checks passed

---

## 🚀 PHASE 4 — PLATFORM FEATURES

### Session 4.1: Global Search
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-25.md (Global Search & Discovery)
Read docs/ai-prompt/part-16.md (Search UI Deep Dive)

Task: Implement Global Search:
1. Create modules/search folder
2. Create useSearch hook with OpenSearch
3. Create SearchBar component with autocomplete
4. Create SearchResults page
5. Create faceted filter sidebar
6. Create search result cards
7. Implement saved searches

Search must support: text query, filters, facets, geo, sorting.
```
- [ ] Completed

---

### Session 4.2: Subscriptions & Plans UI
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-12.md (Subscriptions UI)

Task: Implement Subscriptions UI:
1. Create modules/subscription folder
2. Create usePlan, useSubscription hooks
3. Create PlanComparisonTable component
4. Create CurrentPlanCard component
5. Create UsageMeters component
6. Create UpgradePrompt component

Show: current plan, usage limits, upgrade options.
```
- [ ] Completed

---

### Session 4.3: Analytics Dashboard
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-13.md (Analytics Dashboards)

Task: Implement Analytics:
1. Create modules/analytics folder
2. Create useAnalytics hooks (vendor, tenant, platform)
3. Create DashboardStats component
4. Create MetricCard component
5. Create chart components (line, bar, pie)
6. Create date range selector
7. Create export functionality

Metrics: views, inquiries, conversions, top listings.
```
- [ ] Completed

---

### Session 4.4: Audit Logs UI
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-14.md (Audit Logs section)

Task: Implement Audit Logs:
1. Create modules/audit folder
2. Create useAuditLogs hook
3. Create AuditLogList component
4. Create AuditLogItem component
5. Create audit log filters (user, action, resource)
6. Create detail modal for log entry

Show: timestamp, user, action, resource, changes.
```
- [ ] Completed

---

### Session 4.5: Feature Flags UI
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-14.md (Feature Flags section)

Task: Implement Feature Flags UI:
1. Create useFeatureFlags hook
2. Create FeatureFlagList for admin
3. Create FeatureFlagToggle component
4. Create useFeature(flagName) hook for checking
5. Create FeatureGate wrapper component

Admin can view and toggle flags. Components check flags before rendering.
```
- [ ] Completed

---

### Session 4.6: Activity Feeds
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-15.md (Activity Feeds section)

Task: Implement Activity Feeds:
1. Create ActivityFeed component
2. Create ActivityItem component
3. Create activity type icons
4. Implement infinite scroll
5. Create "View All" link to full activity page

Show recent actions: listings created, status changes, reviews, etc.
```
- [ ] Completed

---

### Session 4.7: Public Listing Page
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-8.md (Public section)

Task: Implement Public Listing Page:
1. Create /(public)/listing/[slug]/page.tsx
2. Create public listing detail view
3. Create inquiry form for visitors
4. Create share button
5. Create related listings section
6. Implement SEO metadata

Public pages must work without authentication.
```
- [ ] Completed

---

### Session 4.8: Accessibility Compliance
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-21.md (Accessibility Deep Dive)

Task: Implement Accessibility:
1. Add aria-* attributes to all interactive elements
2. Implement keyboard navigation
3. Add skip links
4. Ensure color contrast compliance
5. Add screen reader announcements
6. Test with accessibility tools

Must comply with WCAG 2.1 AA standards.
```
- [ ] Completed

---

### Session 4.9: Performance Optimization
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-17.md (Performance & SSR/CSR)

Task: Optimize Performance:
1. Implement proper SSR/CSR split
2. Add image optimization with next/image
3. Implement route prefetching
4. Add proper caching headers
5. Implement code splitting
6. Add loading boundaries

Target: LCP < 2.5s, FID < 100ms, CLS < 0.1
```
- [ ] Completed

---

### Session 4.10: Testing Setup
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-18.md (Testing Strategy)

Task: Setup Testing:
1. Configure Vitest for unit tests
2. Configure Playwright for E2E tests
3. Create test utilities (render with providers)
4. Write tests for auth flow
5. Write tests for listing CRUD
6. Setup CI test pipeline

Coverage target: 80% for critical paths.
```
- [ ] Completed

---

### Session 4.11: ENV Config & Deployment
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-19.md (ENV Config, Build/Deploy Setup)

Task: Configure Environment & Deployment:
1. Create comprehensive .env.example with all variables
2. Setup build-time vs runtime config separation
3. Configure next.config.js for production
4. Setup Docker configuration (optional)
5. Create deployment documentation
6. Configure security headers
7. Setup environment validation with Zod

Environments: development, staging, production.
Secrets must NEVER be in client bundles.
```
- [ ] Completed

---

### Session 4.12: Backend Alignment Check
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-23.md (Backend Alignment & Contracts)

Task: Verify Backend Alignment:
1. Verify role enums match backend exactly
2. Verify status enums match backend exactly
3. Verify all DTOs align with OpenAPI spec
4. Verify API endpoint paths match backend routes
5. Verify error codes are handled correctly
6. Create alignment validation tests
7. Document any frontend-specific extensions

Frontend must NOT invent roles, statuses, or permissions.
```
- [ ] Completed

---

### Session 4.13: Final Checklist & Handover
```
Continuing Zam-Property frontend development.

Read docs/ai-prompt/part-20.md (Final Web Spine Checklist)

Task: Complete Final Checklist:
1. Verify all modules exist per checklist
2. Run full build validation (pnpm build)
3. Run all tests (pnpm test)
4. Verify all routes are protected correctly
5. Verify all forms have validation
6. Verify accessibility compliance
7. Create handover documentation
8. Update all progress tracking docs

This is the final validation before release.
```
- [ ] Completed

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
8. All tests passing

Frontend is now ready for integration testing.
```
- [ ] All checks passed

---

## 📝 Session Completion Template

After completing each session, use this prompt:
```
Session [X.X] completed.

Please update the following documentation:
1. docs/PROGRESS.md - Mark session [X.X] as completed with today's date
2. docs/NAV-STRUCTURE.md - Add any new routes or navigation items

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
1. Is the query key structured correctly?
2. Is staleTime/cacheTime appropriate?
3. Is error handling in place?
```

### Check Form Validation
```
Review the [form] for validation issues:
1. Is Zod schema complete and correct?
2. Do field names match backend DTOs?
3. Are error messages user-friendly?
```

