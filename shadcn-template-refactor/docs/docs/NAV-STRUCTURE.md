# Zam-Property Web Frontend - Navigation Structure

> **This document defines ALL navigation items across portals.**  
> Update this file after adding any new routes or pages.

---

## 📋 Summary

| Portal | Nav Items | Status |
|--------|-----------|--------|
| Platform Admin | 4 | 🔄 In Progress |
| Tenant Admin | 5 | 🔄 In Progress |
| Vendor Portal | 4 | 🔄 In Progress |
| Customer Account | 9 | ✅ Done |
| Public Pages | 1 | 🔄 In Progress |
| **Total** | **23** | |

---

## 🏗️ Route Structure

### App Router Organization
```
app/
├── (public)/                 # Public pages (no auth)
│   ├── page.tsx              # Home
│   ├── search/               # Search results
│   └── listing/[slug]/       # Public listing detail
├── (auth)/                   # Auth pages
│   ├── login/
│   └── register/
└── dashboard/                # All authenticated portals
    ├── (auth)/               # Auth-protected routes
    │   ├── platform/         # Platform Admin portal
    │   │   └── [...routes]
    │   ├── tenant/           # Tenant Admin portal
    │   │   └── [...routes]
    │   ├── vendor/           # Vendor portal
    │   │   └── [...routes]
    │   └── account/          # Customer Account portal
    │       └── [...routes]
    └── reference/            # Template reference (shadcn-ui-kit)
        └── [...template]     # Reuse components from here
```

---

## 🔵 Platform Admin Portal (`/dashboard/platform/*`)

**Access:** SUPER_ADMIN only

### Sidebar Navigation

```
📊 Dashboard                  /dashboard/platform
├── 🏢 Tenants               /dashboard/platform/tenants
│   ├── All Tenants          /dashboard/platform/tenants
│   ├── Create Tenant        /dashboard/platform/tenants/create
│   └── [id]                 /dashboard/platform/tenants/[id]
├── 📦 Listings (Global)     /dashboard/platform/listings
│   ├── All Listings         /dashboard/platform/listings
│   ├── Moderation Queue     /dashboard/platform/listings/moderation
│   └── [id]                 /dashboard/platform/listings/[id]
├── 🏪 Vendors (Global)      /dashboard/platform/vendors
│   ├── All Vendors          /dashboard/platform/vendors
│   ├── Pending Approvals    /dashboard/platform/vendors/pending
│   └── [id]                 /dashboard/platform/vendors/[id]
├── 👥 Users (Global)        /dashboard/platform/users
│   ├── All Users            /dashboard/platform/users
│   └── [id]                 /dashboard/platform/users/[id]
├── 📊 Analytics             /dashboard/platform/analytics
│   ├── Overview             /dashboard/platform/analytics
│   ├── Revenue              /dashboard/platform/analytics/revenue
│   └── Growth               /dashboard/platform/analytics/growth
├── 🔧 Settings              /dashboard/platform/settings
│   ├── Feature Flags        /dashboard/platform/settings/feature-flags
│   ├── Verticals            /dashboard/platform/settings/verticals
│   └── System Config        /dashboard/platform/settings/config
├── 📜 Audit Logs            /dashboard/platform/audit-logs
└── ⚙️ System                /dashboard/platform/system
    ├── Health               /dashboard/platform/system/health
    └── Jobs                 /dashboard/platform/system/jobs
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard/platform` | `DashboardPage` | ✅ Implemented (stub) |
| `/dashboard/platform/tenants` | `TenantListPage` | ✅ Implemented |
| `/dashboard/platform/tenants/create` | `TenantCreatePage` | ✅ Implemented (stub) |
| `/dashboard/platform/tenants/[id]` | `TenantDetailPage` | ✅ Implemented |
| `/dashboard/platform/tenants/[id]/settings` | `TenantSettingsPage` | ✅ Implemented |
| `/dashboard/platform/listings` | `ListingListPage` | ✅ Implemented (stub) |
| `/dashboard/platform/listings/[id]` | `ListingDetailPage` | ✅ Implemented (stub) |
| `/dashboard/platform/listings/moderation` | `ModerationQueuePage` | ✅ Implemented (stub) |
| `/dashboard/platform/vendors` | `VendorListPage` | ✅ Implemented (stub) |
| `/dashboard/platform/vendors/[id]` | `VendorDetailPage` | ✅ Implemented (stub) |
| `/dashboard/platform/vendors/pending` | `VendorApprovalPage` | ✅ Implemented (stub) |
| `/dashboard/platform/users` | `UserListPage` | ✅ Implemented (stub) |
| `/dashboard/platform/users/[id]` | `UserDetailPage` | ✅ Implemented (stub) |
| `/dashboard/platform/analytics` | `AnalyticsPage` | ✅ Implemented (stub) |
| `/dashboard/platform/analytics/revenue` | `RevenueAnalyticsPage` | ✅ Implemented (stub) |
| `/dashboard/platform/analytics/growth` | `GrowthAnalyticsPage` | ✅ Implemented (stub) |
| `/dashboard/platform/settings` | `SettingsPage` | ✅ Implemented (stub) |
| `/dashboard/platform/settings/feature-flags` | `FeatureFlagsPage` | ✅ Implemented (stub) |
| `/dashboard/platform/settings/verticals` | `VerticalsPage` | ✅ Implemented (stub) |
| `/dashboard/platform/settings/config` | `SystemConfigPage` | ✅ Implemented (stub) |
| `/dashboard/platform/audit-logs` | `AuditLogsPage` | ✅ Implemented (stub) |
| `/dashboard/platform/system` | `SystemPage` | ✅ Implemented (stub) |
| `/dashboard/platform/system/health` | `HealthPage` | ✅ Implemented (stub) |
| `/dashboard/platform/system/jobs` | `JobsPage` | ✅ Implemented (stub) |

---

## 🟢 Tenant Admin Portal (`/dashboard/tenant/*`)

**Access:** TENANT_ADMIN only

### Sidebar Navigation

```
📊 Dashboard                  /dashboard/tenant
├── 📦 Listings              /dashboard/tenant/listings
│   ├── All Listings         /dashboard/tenant/listings
│   ├── Moderation Queue     /dashboard/tenant/listings/moderation
│   ├── Create Listing       /dashboard/tenant/listings/create
│   └── [id]                 /dashboard/tenant/listings/[id]
├── 🏪 Vendors               /dashboard/tenant/vendors
│   ├── All Vendors          /dashboard/tenant/vendors
│   ├── Pending Approvals    /dashboard/tenant/vendors/pending
│   └── [id]                 /dashboard/tenant/vendors/[id]
├── 👥 Users                 /dashboard/tenant/users
│   ├── All Users            /dashboard/tenant/users
│   ├── Invite User          /dashboard/tenant/users/invite
│   └── [id]                 /dashboard/tenant/users/[id]
├── 💬 Interactions          /dashboard/tenant/interactions
│   ├── All                  /dashboard/tenant/interactions
│   └── [id]                 /dashboard/tenant/interactions/[id]
├── ⭐ Reviews               /dashboard/tenant/reviews
│   ├── All Reviews          /dashboard/tenant/reviews
│   ├── Pending              /dashboard/tenant/reviews/pending
│   └── [id]                 /dashboard/tenant/reviews/[id]
├── 📊 Analytics             /dashboard/tenant/analytics
│   ├── Overview             /dashboard/tenant/analytics
│   ├── Listings             /dashboard/tenant/analytics/listings
│   └── Vendors              /dashboard/tenant/analytics/vendors
├── 💳 Subscriptions         /dashboard/tenant/subscriptions
│   ├── Plans                /dashboard/tenant/subscriptions/plans
│   └── Billing              /dashboard/tenant/subscriptions/billing
├── 🔧 Settings              /dashboard/tenant/settings
│   ├── General              /dashboard/tenant/settings
│   ├── Branding             /dashboard/tenant/settings/branding
│   ├── Domains              /dashboard/tenant/settings/domains
│   └── Notifications        /dashboard/tenant/settings/notifications
└── 📜 Audit Logs            /dashboard/tenant/audit-logs
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard/tenant` | `DashboardPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/listings` | `ListingListPage` | ✅ Done (2.1) |
| `/dashboard/tenant/listings/[id]` | `ListingDetailPage` | ✅ Done (2.2) |
| `/dashboard/tenant/listings/moderation` | `ModerationQueuePage` | ✅ Implemented (stub) |
| `/dashboard/tenant/listings/create` | `ListingCreatePage` | ✅ Implemented (stub) |
| `/dashboard/tenant/vendors` | `VendorListPage` | ✅ Done (2.4) |
| `/dashboard/tenant/vendors/[id]` | `VendorDetailPage` | ✅ Done (2.4) |
| `/dashboard/tenant/vendors/pending` | `VendorApprovalPage` | ✅ Implemented |
| `/dashboard/tenant/users` | `UserListPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/users/invite` | `InviteUserPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/users/[id]` | `UserDetailPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/interactions` | `InteractionListPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/interactions/[id]` | `InteractionDetailPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/reviews` | `ReviewListPage` | ✅ Done (2.8) |
| `/dashboard/tenant/reviews/pending` | `PendingReviewsPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/reviews/[id]` | `ReviewDetailPage` | ✅ Done (2.8) |
| `/dashboard/tenant/analytics` | `AnalyticsPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/analytics/listings` | `ListingAnalyticsPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/analytics/vendors` | `VendorAnalyticsPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/usage` | `UsagePage` | ✅ Implemented (stub) |
| `/dashboard/tenant/subscriptions` | `SubscriptionPage` | ✅ Implemented (stub) (🔧 Hooks Done 4.2) |
| `/dashboard/tenant/subscriptions/plans` | `PlansPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/subscriptions/billing` | `BillingPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/settings` | `SettingsPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/settings/branding` | `BrandingPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/settings/domains` | `DomainsPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/settings/notifications` | `NotificationsPage` | ✅ Implemented (stub) |
| `/dashboard/tenant/audit-logs` | `AuditLogsPage` | ✅ Implemented (stub) |

---

## 🟠 Vendor Portal (`/dashboard/vendor/*`)

**Access:** VENDOR_ADMIN, VENDOR_STAFF

### Sidebar Navigation

```
📊 Dashboard                  /dashboard/vendor
├── 📦 My Listings           /dashboard/vendor/listings
│   ├── All Listings         /dashboard/vendor/listings
│   ├── Create Listing       /dashboard/vendor/listings/create
│   ├── Drafts               /dashboard/vendor/listings?status=DRAFT
│   └── [id]                 /dashboard/vendor/listings/[id]
│       ├── Edit             /dashboard/vendor/listings/[id]/edit
│       └── Stats            /dashboard/vendor/listings/[id]/stats
├── 💬 Inbox                 /dashboard/vendor/inbox
│   ├── All                  /dashboard/vendor/inbox
│   ├── New                  /dashboard/vendor/inbox?status=NEW
│   ├── In Progress          /dashboard/vendor/inbox?status=CONTACTED
│   └── [id]                 /dashboard/vendor/inbox/[id]
├── ⭐ Reviews               /dashboard/vendor/reviews
│   └── [id]                 /dashboard/vendor/reviews/[id]
├── 📊 Analytics             /dashboard/vendor/analytics
│   ├── Overview             /dashboard/vendor/analytics
│   ├── Listing Performance  /dashboard/vendor/analytics/listings
│   └── Lead Analytics       /dashboard/vendor/analytics/leads
├── 👥 Team                  /dashboard/vendor/team
│   ├── Members              /dashboard/vendor/team
│   ├── Invite               /dashboard/vendor/team/invite
│   └── [id]                 /dashboard/vendor/team/[id]
├── 💳 Subscription          /dashboard/vendor/subscription
│   ├── Current Plan         /dashboard/vendor/subscription
│   ├── Usage                /dashboard/vendor/subscription/usage
│   └── Upgrade              /dashboard/vendor/subscription/upgrade
├── 🏢 Profile               /dashboard/vendor/profile
│   ├── Business Info        /dashboard/vendor/profile
│   ├── Documents            /dashboard/vendor/profile/documents
│   └── Public Page          /dashboard/vendor/profile/public
└── ⚙️ Settings              /dashboard/vendor/settings
    ├── General              /dashboard/vendor/settings
    ├── Notifications        /dashboard/vendor/settings/notifications
    └── Integrations         /dashboard/vendor/settings/integrations
```

### Role-Based Visibility

| Route | VENDOR_ADMIN | VENDOR_STAFF |
|-------|--------------|--------------|
| Dashboard | ✅ | ✅ |
| Listings (all) | ✅ | ✅ (assigned only) |
| Create Listing | ✅ | ✅ |
| Inbox | ✅ | ✅ (assigned only) |
| Reviews | ✅ | ✅ (read only) |
| Analytics | ✅ | ❌ |
| Team | ✅ | ❌ |
| Subscription | ✅ | ❌ |
| Profile | ✅ | ❌ |
| Settings | ✅ | ❌ |

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard/vendor` | `DashboardPage` | ✅ Implemented (stub) |
| `/dashboard/vendor/onboarding` | `VendorOnboardingPage` | ✅ Done (2.5) |
| `/dashboard/vendor/listings` | `ListingListPage` | ✅ Done (2.1) |
| `/dashboard/vendor/listings/create` | `ListingCreatePage` | ✅ Done (2.3) |
| `/dashboard/vendor/listings/[id]` | `ListingDetailPage` | ✅ Done (2.2) |
| `/dashboard/vendor/listings/[id]/edit` | `ListingEditPage` | ✅ Done (2.3) |
| `/dashboard/vendor/inbox` | `InboxPage` | ✅ Done (2.7) |
| `/dashboard/vendor/inbox/[id]` | `InteractionDetailPage` | ✅ Done (2.7) |
| `/dashboard/vendor/reviews` | `ReviewListPage` | ✅ Done (2.8) |
| `/dashboard/vendor/reviews/[id]` | `ReviewDetailPage` | ✅ Done (2.8) |
| `/dashboard/vendor/listings/[id]/stats` | `ListingStatsPage` | ✅ Implemented (stub) |
| `/dashboard/vendor/analytics` | `AnalyticsPage` | ✅ Implemented (stub) |
| `/dashboard/vendor/analytics/listings` | `ListingsAnalyticsPage` | ✅ Implemented (stub) |
| `/dashboard/vendor/analytics/leads` | `LeadsAnalyticsPage` | ✅ Implemented (stub) |
| `/dashboard/vendor/team` | `TeamPage` | ✅ Implemented (stub) |
| `/dashboard/vendor/team/invite` | `TeamInvitePage` | ✅ Implemented (stub) |
| `/dashboard/vendor/team/[id]` | `TeamMemberPage` | ✅ Implemented (stub) |
| `/dashboard/vendor/subscription` | `SubscriptionPage` | ✅ Implemented (stub) (🔧 Hooks Done 4.2) |
| `/dashboard/vendor/subscription/usage` | `SubscriptionUsagePage` | ✅ Implemented (stub) |
| `/dashboard/vendor/subscription/upgrade` | `SubscriptionUpgradePage` | ✅ Implemented (stub) |
| `/dashboard/vendor/profile` | `ProfilePage` | ✅ Implemented (stub) |
| `/dashboard/vendor/profile/documents` | `DocumentsPage` | ✅ Implemented (stub) |
| `/dashboard/vendor/profile/public` | `PublicProfilePage` | ✅ Implemented (stub) |
| `/dashboard/vendor/settings` | `SettingsPage` | ✅ Implemented (stub) |
| `/dashboard/vendor/settings/notifications` | `NotificationsPage` | ✅ Implemented (stub) |
| `/dashboard/vendor/settings/integrations` | `IntegrationsPage` | ✅ Implemented (stub) |

---

## 🟣 Customer Account Portal (`/dashboard/account/*`)

**Access:** CUSTOMER only (logged-in users)

### Sidebar Navigation

```
📊 Dashboard                  /dashboard/account
├── 👤 Profile               /dashboard/account/profile
│   ├── My Info              /dashboard/account/profile
│   └── Edit Profile         /dashboard/account/profile/edit
├── 💬 My Inquiries          /dashboard/account/inquiries
│   ├── All Inquiries        /dashboard/account/inquiries
│   ├── Active               /dashboard/account/inquiries?status=CONTACTED
│   └── [id]                 /dashboard/account/inquiries/[id]
├── ❤️ Saved Listings        /dashboard/account/saved
│   ├── All Saved            /dashboard/account/saved
│   └── Collections          /dashboard/account/saved/collections
├── ⭐ My Reviews            /dashboard/account/reviews
│   ├── All Reviews          /dashboard/account/reviews
│   └── [id]                 /dashboard/account/reviews/[id]
├── 🔔 Notifications         /dashboard/account/notifications
│   ├── All                  /dashboard/account/notifications
│   └── Preferences          /dashboard/account/notifications/preferences
└── ⚙️ Settings              /dashboard/account/settings
    ├── General              /dashboard/account/settings
    ├── Password             /dashboard/account/settings/password
    └── Privacy              /dashboard/account/settings/privacy
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard/account` | `AccountDashboardPage` | ✅ Done (2.10) |
| `/dashboard/account/profile` | `ProfilePage` | ✅ Done (2.10) |
| `/dashboard/account/profile/edit` | `ProfileEditPage` | ✅ Done (2.10) - via tabs |
| `/dashboard/account/inquiries` | `InquiryListPage` | ✅ Done (2.11) |
| `/dashboard/account/inquiries/[id]` | `InquiryDetailPage` | ⏳ Pending |
| `/dashboard/account/saved` | `SavedListingsPage` | ✅ Done (2.11) |
| `/dashboard/account/saved/collections` | `CollectionsPage` | ⏳ Pending |
| `/dashboard/account/reviews` | `ReviewListPage` | ✅ Done (2.11) |
| `/dashboard/account/reviews/[id]` | `ReviewDetailPage` | ⏳ Pending |
| `/dashboard/account/notifications` | `NotificationsPage` | ✅ Done (2.11) |
| `/dashboard/account/notifications/preferences` | `NotificationPrefsPage` | ✅ Done (2.11) - combined |
| `/dashboard/account/settings` | `SettingsPage` | ✅ Done (2.11) |
| `/dashboard/account/settings/password` | `PasswordSettingsPage` | ✅ Done (2.11) - via /security |
| `/dashboard/account/settings/privacy` | `PrivacySettingsPage` | ✅ Done (2.11) - via /settings |
| `/dashboard/account/security` | `SecurityPage` | ✅ Done (2.11) |

---

## 🌐 Public Pages (`/`)

**Access:** Everyone (no auth required)

### Routes

```
🏠 Home                       /
├── 🔍 Search                /search
│   └── With filters         /search?q=...&location=...
├── 📦 Listing               /listing/[slug]
├── 🏪 Vendor                /vendor/[slug]
├── 📄 Pages
│   ├── About                /about
│   ├── Contact              /contact
│   ├── Terms                /terms
│   └── Privacy              /privacy
└── 🔐 Auth
    ├── Login                /login
    ├── Register             /register
    ├── Forgot Password      /forgot-password
    └── Reset Password       /reset-password
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/` | `HomePage` | ⏳ Pending |
| `/search` | `SearchPage` | ✅ Done (4.1) |
| `/listing/[slug]` | `PublicListingPage` | ✅ Done (4.7) |
| `/vendor/[slug]` | `VendorPublicPage` | ⏳ Pending |
| `/login` | `LoginPage` | ✅ Done |
| `/register` | `RegisterPage` | ✅ Done |

---

## 🧭 Header Components

### Platform Admin Header
```
[Logo] [Search] [Notifications] [User Menu]
                                 └─ Profile
                                 └─ Settings
                                 └─ Logout
```

### Tenant Admin Header
```
[Tenant Logo] [Search] [Notifications] [User Menu]
                                        └─ Profile
                                        └─ Switch Tenant
                                        └─ Logout
```

### Vendor Header
```
[Vendor Name] [Quick Create] [Notifications] [User Menu]
                                              └─ Profile
                                              └─ Business Profile
                                              └─ Logout
```

### Public Header
```
[Logo] [Search Bar] [List Property] [Login/Register]
```

---

## 📝 Changelog

| Date | Session | Changes |
|------|---------|---------|
| 2026-01-29 | 4.9 | Added performance optimization: lib/performance/* with web-vitals monitoring (useWebVitals, reportWebVitals, WebVitalsReporter), optimized image components (OptimizedImage, OptimizedAvatar, OptimizedThumbnail, ImageGallery), route prefetching (usePrefetch, PrefetchLink, PrefetchOnHover), code splitting (lazyComponent, LazyChart, LazyEditor, LazyMediaViewer, ClientOnly), loading boundaries (LoadingBoundary, PageLoadingFallback, CardLoadingFallback, TableLoadingFallback, GridLoadingFallback, Spinner, LoadingOverlay), performance hooks (useIntersectionObserver, useDeferredValue, useThrottle, useDebounce, useIdleCallback); updated next.config.ts with caching headers and image optimization; added search page loading.tsx |
| 2026-01-29 | 4.8 | Added accessibility utilities: lib/accessibility/* with useReducedMotion, useAnnounce, useFocusTrap, useArrowNavigation, useKeyboardShortcuts, SkipLinks, VisuallyHidden, LiveRegion, AccessibleField, AccessibleButton; integrated into app/layout.tsx with SkipLinks and AnnounceProvider; enhanced focus styles in globals.css; WCAG 2.1 AA compliance utilities |
| 2026-01-29 | 4.2 | Added subscription module: types (Plan, Subscription, Entitlement, Usage), hooks (useSubscription, usePlans, useUsage, useEntitlements), components (PlanComparisonTable, CurrentPlanCard, UsageMeters, UpgradePrompt) - infrastructure ready for subscription pages |
| 2026-01-29 | 4.1 | Added public search page: /search with URL-synced filters, autocomplete, faceted filtering, geo search, grid/list views |
| 2026-01-28 | 3.6 | Added real estate filters: filters.ts (search mapping, presets), PriceRangeFilter, RoomCountFilter, PropertyTypeFacet, RealEstateSearchFilters (sidebar/horizontal/sheet variants), useRealEstateFilters hook with URL sync (no new routes - filter infrastructure) |
| 2026-01-28 | 3.5 | Added real estate vertical: types, schema with 16 attributes, Zod validation, formatters, PropertyTypeSelector, ListingTypeSelector, TenureSelector, FurnishingSelector, RealEstateAttributeForm (no new routes - vertical infrastructure) |
| 2026-01-28 | 3.4 | Added vertical registry infrastructure: VerticalRegistry class, attribute types, AttributeRenderer, DynamicForm, FilterBuilder with URL state sync (no new routes - infrastructure only) |
| 2026-01-28 | 3.3 | Added real-time update hooks: useRealtimeSync (master sync), useListingRealtime, useInteractionRealtime, useOfflineHandler (no new routes) |
| 2026-01-28 | 3.2 | Added notification module: NotificationBell, NotificationList, NotificationItem components; useNotifications, useNotificationMutations, useRealtimeNotifications hooks |
| 2026-01-28 | 3.1 | Added WebSocket infrastructure: SocketProvider, connection status indicator in auth layout (no new routes) |
| 2026-01-28 | 2.11 | Added account feature pages: inquiries, saved, reviews, notifications, security, settings |
| 2026-01-28 | 2.10 | Added account portal layout, dashboard, profile pages; Account routes: /dashboard/account, /dashboard/account/profile |
| 2026-01-28 | 1.10 | Added ErrorBoundary, global error handler, toast helpers, error.tsx, suspense boundaries |
| 2026-01-28 | 1.9 | Added TenantProvider to tenant, vendor, platform layouts; tenant-aware query keys |
| 2026-01-28 | 1.8 | Added AutoBreadcrumb component, integrated into portal header |
| 2026-01-28 | 1.7 | Added layout shells for all portals (PortalShell, PublicShell), navigation configs |
| 2026-01-28 | 1.6 | Added route guards for all portals, /forbidden and /session-expired pages |
| 2026-01-28 | 1.5 | Added Login and Register pages (✅ Done) |
| - | - | Initial structure defined |

