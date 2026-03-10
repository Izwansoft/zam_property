# Zam-Property Web Frontend - Navigation Structure

> **This document defines ALL navigation items across portals.**  
> Update this file after adding any new routes or pages.
>
> IA benchmark reference: `docs/SUPER-ADMIN-IA-BENCHMARK.md`

---

## 📋 Summary

| Portal | Nav Items | Status |
|--------|-----------|--------|
| Platform Admin | 12 | ✅ Session 1.7 + 8.7 (nav config) |
| Tenant Admin | 7 | ✅ Session 1.7 (nav config) |
| Vendor Portal | 12 | ✅ Session 1.7 + 5.9 + 6.5 + 8.6 (nav config) |
| Customer Account | 10 | ✅ Session 1.7 + 2.10 (nav config) |
| Occupant Portal | 8 | ✅ Session 5.1 (nav config) |
| Company Portal | 8 | ✅ Session 8.2 (nav config) |
| Agent Portal | 8 | ✅ Session 8.4 (nav config) |
| Affiliate Portal | 5 | ✅ Session 8.5 (nav config) |
| Auth Pages | 5 | ✅ Session 1.5 |
| Guest Pages (Template) | 6 | ✅ Template + Session 8.1 |
| Public Pages | 12 | ✅ Session 1.7 + 4.1 + 4.7 |
| **Total** | **93** | |

---

## 🏗️ Route Structure

### App Router Organization (Actual)
```
app/
├── layout.tsx                    # Root layout
├── globals.css                   # Global styles
├── error.tsx                     # Root error boundary (Session 1.10)
├── not-found.tsx                 # 404 page (improved Session 1.10)
├── (auth)/                       # Guest-only auth pages (Session 1.5)
│   ├── layout.tsx                # Guest guard (redirect if authenticated)
│   ├── login/
│   │   └── page.tsx              # /login — Login form
│   ├── register/
│   │   └── page.tsx              # /register — Register form
│   └── forgot-password/
│       └── page.tsx              # /forgot-password — Forgot password
├── session-expired/
│   └── page.tsx                  # /session-expired — Session timeout
├── forbidden/
│   └── page.tsx                  # /forbidden — 403 access denied
└── dashboard/
    ├── (auth)/                   # Auth-protected routes
    │   ├── layout.tsx            # Auth layout (sidebar + header shell)
    │   ├── page.tsx              # Dashboard redirect
    │   ├── error.tsx             # Error boundary
    │   ├── platform/             # Platform Admin portal
    │   │   ├── layout.tsx        # SUPER_ADMIN guard + TenantProvider(optional) (Session 1.6, 1.9)
    │   │   ├── loading.tsx       # DashboardSkeleton fallback (Session 1.11)
    │   │   └── page.tsx
    │   ├── tenant/               # Tenant Admin portal
    │   │   ├── layout.tsx        # SUPER_ADMIN/TENANT_ADMIN guard + TenantProvider(required) (Session 1.6, 1.9)
    │   │   ├── loading.tsx       # DashboardSkeleton fallback (Session 1.11)
    │   │   └── page.tsx
    │   ├── vendor/               # Vendor portal
    │   │   ├── layout.tsx        # VENDOR_ADMIN/VENDOR_STAFF guard + TenantProvider(derived) (Session 1.6, 1.9)
    │   │   ├── loading.tsx       # DashboardSkeleton fallback (Session 1.11)
    │   │   └── page.tsx
    │   ├── account/              # Customer Account portal
    │   │   ├── layout.tsx        # Any authenticated guard + TenantProvider(none) (Session 1.6, 1.9)
    │   │   ├── loading.tsx       # PageShellSkeleton fallback (Session 1.11)
    │   │   └── page.tsx
    │   ├── occupant/             # Occupant Portal (PM)
    │   │   ├── layout.tsx        # OCCUPANT guard + TenantProvider(derived) (Session 5.1)
    │   │   ├── loading.tsx       # DashboardSkeleton fallback (Session 5.1)
    │   │   └── page.tsx
    │   ├── company/              # Company Admin Portal
    │   │   ├── layout.tsx        # COMPANY_ADMIN guard + TenantProvider(derived) (Session 8.2)
    │   │   ├── loading.tsx       # CompanyDashboardSkeleton fallback (Session 8.2)
    │   │   ├── page.tsx
    │   │   └── agents/           # Agent Management (Session 8.3)
    │   │       ├── page.tsx      # Agent list page
    │   │       ├── content.tsx   # AgentList client content
    │   │       ├── loading.tsx   # AgentListSkeleton
    │   │       └── [id]/         # Agent detail
    │   │           ├── page.tsx
    │   │           ├── content.tsx
    │   │           └── loading.tsx
    │   ├── agent/                # Agent Portal (Session 8.4)
    │   │   ├── layout.tsx        # AGENT guard + TenantProvider(derived) (Session 8.4)
    │   │   ├── loading.tsx       # AgentDashboardSkeleton fallback (Session 8.4)
    │   │   ├── page.tsx
    │   │   ├── content.tsx       # AgentDashboard client content
    │   │   └── commissions/      # Commission Management (Session 8.4)
    │   │       ├── page.tsx      # Commission list page
    │   │       ├── content.tsx   # CommissionList client content
    │   │       ├── loading.tsx   # CommissionListSkeleton
    │   │       └── [id]/         # Commission detail
    │   │           ├── page.tsx
    │   │           ├── content.tsx
    │   │           └── loading.tsx
    │   ├── affiliate/            # Affiliate Portal (Session 8.5)
    │   │   ├── layout.tsx        # Any auth user guard + TenantProvider(derived) (Session 8.5)
    │   │   ├── loading.tsx       # AffiliateDashboardSkeleton fallback (Session 8.5)
    │   │   ├── page.tsx
    │   │   ├── content.tsx       # AffiliateDashboard client content
    │   │   ├── referrals/        # Referral List (Session 8.5)
    │   │   │   ├── page.tsx
    │   │   │   ├── content.tsx   # ReferralList client content
    │   │   │   └── loading.tsx
    │   │   └── payouts/          # Payout History + Request (Session 8.5)
    │   │       ├── page.tsx
    │   │       ├── content.tsx   # AffiliatePayoutRequest client content
    │   │       └── loading.tsx
    │   └── reference/            # Template reference (shadcn UI kit)
    │       ├── academy/
    │       ├── apps/             # (ai-chat, calendar, chat, kanban, mail, etc.)
    │       ├── crm/
    │       ├── ecommerce/
    │       ├── finance/
    │       ├── pages/            # (settings, profile, pricing, etc.)
    │       ├── widgets/
    │       └── [...more]
    └── (guest)/                  # Guest routes (no auth required)
        ├── layout.tsx            # Guest layout (minimal chrome)
        ├── login/
        │   ├── v1/page.tsx       # Login variant 1
        │   └── v2/page.tsx       # Login variant 2
        ├── register/
        │   ├── v1/page.tsx       # Register variant 1
        │   └── v2/page.tsx       # Register variant 2
        ├── forgot-password/
        │   └── page.tsx
        └── reference/
            └── pages/error/      # (404, 500 error pages)
```

### Planned Additional Routes (To Be Created)
```
app/
├── (public)/                     # Public pages (no auth) — CREATED Session 1.7
│   ├── layout.tsx                # Public layout (header + footer, no sidebar)
│   ├── page.tsx                  # Home placeholder
│   ├── search/                   # Search results — CREATED Session 4.1
│   │   ├── page.tsx              # Search with metadata
│   │   ├── content.tsx           # Client search content
│   │   └── loading.tsx           # Search skeleton
│   ├── listings/[idOrSlug]/      # Public listing detail — CREATED Session 4.7
│   │   ├── page.tsx              # Server Component with generateMetadata + Schema.org
│   │   ├── loading.tsx           # Listing skeleton
│   │   ├── not-found.tsx         # Listing not found
│   │   └── _components/         # Listing sub-components
│   │       ├── listing-gallery.tsx
│   │       ├── listing-info.tsx
│   │       ├── listing-attributes.tsx
│   │       ├── listing-vendor-card.tsx
│   │       ├── listing-inquiry-cta.tsx
│   │       ├── listing-breadcrumbs.tsx
│   │       ├── listing-schema-org.tsx
│   │       └── related-listings.tsx
│   ├── vendors/[idOrSlug]/       # Vendor public profile — CREATED Session 4.7
│   │   ├── page.tsx              # Server Component with generateMetadata + Schema.org
│   │   ├── loading.tsx           # Vendor skeleton
│   │   ├── not-found.tsx         # Vendor not found
│   │   └── _components/         # Vendor sub-components
│   │       ├── vendor-header.tsx
│   │       ├── vendor-info.tsx
│   │       ├── vendor-listings-grid.tsx
│   │       ├── vendor-breadcrumbs.tsx
│   │       └── vendor-schema-org.tsx
│   └── listing/[id]/            # Legacy redirect → /listings/[id]
└── dashboard/
    └── (auth)/
        ├── platform/[...routes]  # All platform subroutes — TO CREATE
        ├── tenant/[...routes]    # All tenant subroutes — TO CREATE
        ├── vendor/[...routes]    # All vendor subroutes — PARTIALLY CREATED
        └── account/              # Customer Account portal — PARTIALLY CREATED
            ├── page.tsx          # Dashboard (Session 2.10)
            ├── profile/          # Profile (Session 2.10)
            ├── inquiries/        # My Inquiries (Session 2.11)
            ├── messages/         # Messages / Chat History (Enhancement #24)
            ├── bookings/         # My Viewings / Scheduled Visits (Enhancement #25)
            ├── saved/            # Saved Listings (Session 2.11)
            ├── reviews/          # My Reviews (Session 2.11)
            ├── notifications/    # Notification Preferences (Session 2.11)
            ├── settings/         # Account Settings (Session 2.11)
            └── security/         # Password & Account Deletion (Session 2.11)
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
│   ├── Notifications        /dashboard/platform/settings/notifications
│   └── System Config        /dashboard/platform/settings/config
├── 📜 Audit Logs            /dashboard/platform/audit
├── 💰 Pricing               /dashboard/platform/pricing
│   ├── Configs/Rules/Events /dashboard/platform/pricing (tabs)
│   ├── Config Detail        /dashboard/platform/pricing/configs/[id]
│   └── Charge Events        /dashboard/platform/pricing/charge-events
├── 🔧 Jobs                  /dashboard/platform/jobs
│   ├── Health Dashboard     /dashboard/platform/jobs (tab)
│   ├── Job List             /dashboard/platform/jobs (tab)
│   └── Bulk Operations      /dashboard/platform/jobs (tab)
├── 🧾 Partner Billing (PM)  /dashboard/platform/billing
└── ⚙️ System                /dashboard/platform/system
    ├── Health               /dashboard/platform/system/health
    └── Jobs                 /dashboard/platform/system/jobs
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard/platform` | `PlatformDashboardContent` | ✅ Session 4.3 |
| `/dashboard/platform/tenants` | `TenantListPage` | ✅ Session 2.6 |
| `/dashboard/platform/tenants/create` | `TenantCreatePage` | ⏳ Not started |
| `/dashboard/platform/tenants/[id]` | `TenantDetailPage` | ✅ Session 2.6 |
| `/dashboard/platform/tenants/[id]/settings` | `TenantSettingsPage` | ✅ Session 2.6 |
| `/dashboard/platform/listings` | `ListingModerationPage` | ✅ Session 4.14 |
| `/dashboard/platform/listings/[id]` | `ListingDetailPage` | ⏳ Not started |
| `/dashboard/platform/listings/moderation` | `ModerationQueuePage` | ⏳ Not started |
| `/dashboard/platform/vendors` | `VendorListPage` | ⏳ Not started |
| `/dashboard/platform/vendors/[id]` | `VendorDetailPage` | ⏳ Not started |
| `/dashboard/platform/vendors/pending` | `VendorApprovalPage` | ⏳ Not started |
| `/dashboard/platform/users` | `UserListPage` | ⏳ Not started |
| `/dashboard/platform/users/[id]` | `UserDetailPage` | ⏳ Not started |
| `/dashboard/platform/analytics` | `AnalyticsPage` | ⏳ Not started |
| `/dashboard/platform/analytics/revenue` | `RevenueAnalyticsPage` | ⏳ Not started |
| `/dashboard/platform/analytics/growth` | `GrowthAnalyticsPage` | ⏳ Not started |
| `/dashboard/platform/settings` | `SettingsPage` | ⏳ Not started |
| `/dashboard/platform/settings/feature-flags` | `FeatureFlagsPage` | ⏳ Not started |
| `/dashboard/platform/settings/verticals` | `VerticalsPage` | ⏳ Not started |
| `/dashboard/platform/settings/notifications` | `NotificationPreferencesPage` | ✅ Session 4.15 |
| `/dashboard/platform/settings/config` | `SystemConfigPage` | ⏳ Not started |
| `/dashboard/platform/audit` | `PlatformAuditContent` | ✅ Session 4.4 |
| `/dashboard/platform/feature-flags` | `FeatureFlagList` | ✅ Session 4.5 |
| `/dashboard/platform/feature-flags/[key]` | `FeatureFlagDetailView` | ✅ Session 4.5 |
| `/dashboard/platform/experiments` | `ExperimentsList` | ✅ Session 4.5 |
| `/dashboard/platform/experiments/[key]` | `ExperimentDetailView` | ✅ Session 4.5 |
| `/dashboard/platform/subscriptions` | `SubscriptionsPage` | ✅ Session 4.2 |
| `/dashboard/platform/pricing` | `PricingContent` (Tabs) | ✅ Session 4.12 |
| `/dashboard/platform/pricing/configs/[id]` | `PricingConfigDetailContent` | ✅ Session 4.12 |
| `/dashboard/platform/pricing/charge-events` | `ChargeEventsContent` | ✅ Session 4.12 |
| `/dashboard/platform/jobs` | `PlatformJobsContent` (Tabs) | ✅ Session 4.13 |
| `/dashboard/platform/billing` | `PlatformBillingContent` | ✅ Session 8.7 |
| `/dashboard/platform/system` | `SystemPage` | ⏳ Not started |
| `/dashboard/platform/system/health` | `HealthPage` | ⏳ Not started |
| `/dashboard/platform/system/jobs` | `JobsPage` | ⏳ Not started |

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
└── 📜 Audit Logs            /dashboard/tenant/audit
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard/tenant` | `TenantDashboardContent` | ✅ Session 4.3 |
| `/dashboard/tenant/listings` | `ListingListPage` | ✅ Session 2.1 (enhanced 4.14) |
| `/dashboard/tenant/listings/[id]` | `ListingDetailPage` | ✅ Session 2.2 |
| `/dashboard/tenant/listings/moderation` | `ModerationQueuePage` | ⏳ Not started |
| `/dashboard/tenant/listings/create` | `ListingCreatePage` | ⏳ Not started |
| `/dashboard/tenant/vendors` | `VendorListPage` | ✅ Session 2.4 |
| `/dashboard/tenant/vendors/[id]` | `VendorDetailPage` | ✅ Session 2.4 |
| `/dashboard/tenant/vendors/pending` | `VendorApprovalPage` | ⏳ Not started |
| `/dashboard/tenant/users` | `UserListPage` | ⏳ Not started |
| `/dashboard/tenant/users/invite` | `InviteUserPage` | ⏳ Not started |
| `/dashboard/tenant/users/[id]` | `UserDetailPage` | ⏳ Not started |
| `/dashboard/tenant/interactions` | `InteractionListPage` | ⏳ Not started |
| `/dashboard/tenant/interactions/[id]` | `InteractionDetailPage` | ⏳ Not started |
| `/dashboard/tenant/reviews` | `ReviewListPage` | ✅ Session 2.8 |
| `/dashboard/tenant/reviews/pending` | `PendingReviewsPage` | ⏳ Not started |
| `/dashboard/tenant/reviews/[id]` | `ReviewDetailPage` | ✅ Session 2.8 |
| `/dashboard/tenant/analytics` | `AnalyticsPage` | ⏳ Not started |
| `/dashboard/tenant/analytics/listings` | `ListingAnalyticsPage` | ⏳ Not started |
| `/dashboard/tenant/analytics/vendors` | `VendorAnalyticsPage` | ⏳ Not started |
| `/dashboard/tenant/usage` | `UsagePage` | ⏳ Not started |
| `/dashboard/tenant/subscriptions` | `SubscriptionPage` | ✅ Session 4.2 |
| `/dashboard/tenant/subscriptions/plans` | `PlansPage` | ⏳ Not started |
| `/dashboard/tenant/subscriptions/billing` | `BillingPage` | ⏳ Not started |
| `/dashboard/tenant/settings` | `SettingsPage` | ⏳ Not started |
| `/dashboard/tenant/settings/branding` | `BrandingPage` | ⏳ Not started |
| `/dashboard/tenant/settings/domains` | `DomainsPage` | ⏳ Not started |
| `/dashboard/tenant/settings/notifications` | `NotificationPreferencesPage` | ✅ Session 4.15 |
| `/dashboard/tenant/audit` | `TenantAuditContent` | ✅ Session 4.4 |

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
├── 🏘️ Tenancies             /dashboard/vendor/tenancies
│   ├── All Tenancies        /dashboard/vendor/tenancies
│   └── [id]                 /dashboard/vendor/tenancies/[id]
│       ├── Contract          /dashboard/vendor/tenancies/[id]/contract
│       ├── Handover          /dashboard/vendor/tenancies/[id]/handover
│       ├── Inspection        /dashboard/vendor/tenancies/[id]/inspection
│       └── History           /dashboard/vendor/tenancies/[id]/history
├── 🔧 Maintenance           /dashboard/vendor/maintenance
│   ├── All Tickets          /dashboard/vendor/maintenance
│   └── [id]                 /dashboard/vendor/maintenance/[id]
├── 💬 Inbox                 /dashboard/vendor/inbox
│   ├── All                  /dashboard/vendor/inbox
│   ├── New                  /dashboard/vendor/inbox?status=NEW
│   ├── In Progress          /dashboard/vendor/inbox?status=CONTACTED
│   └── [id]                 /dashboard/vendor/inbox/[id]
├── ⭐ Reviews               /dashboard/vendor/reviews
│   └── [id]                 /dashboard/vendor/reviews/[id]
├── ⚖️ Legal Cases            /dashboard/vendor/legal
│   ├── All Cases            /dashboard/vendor/legal
│   └── [id]                 /dashboard/vendor/legal/[id]
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
├── 💰 Finance (PM)          /dashboard/vendor/billing
│   ├── Billing              /dashboard/vendor/billing
│   └── Payouts              /dashboard/vendor/payouts
├── 📈 Insights              /dashboard/vendor/analytics
│   └── Analytics            /dashboard/vendor/analytics
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
| Tenancies | ✅ | ✅ (read only) |
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
| `/dashboard/vendor` | `VendorDashboardContent` | ✅ Session 4.3 |
| `/dashboard/vendor/onboarding` | `VendorOnboardingPage` | ✅ Session 2.5 |
| `/dashboard/vendor/listings` | `ListingListPage` | ✅ Session 2.1 |
| `/dashboard/vendor/listings/create` | `ListingCreatePage` | ✅ Session 2.3 |
| `/dashboard/vendor/listings/[id]` | `ListingDetailPage` | ✅ Session 2.2 |
| `/dashboard/vendor/listings/[id]/edit` | `ListingEditPage` | ✅ Session 2.3 |
| `/dashboard/vendor/tenancies` | `VendorTenanciesContent` | ✅ Session 5.9 |
| `/dashboard/vendor/tenancies/[id]` | `VendorTenancyDetailContent` | ✅ Session 5.9-5.10 |
| `/dashboard/vendor/tenancies/[id]/contract` | (Link from OwnerTenancyActions) | ⏳ Route stub |
| `/dashboard/vendor/tenancies/[id]/handover` | (Link from OwnerTenancyActions) | ⏳ Route stub |
| `/dashboard/vendor/tenancies/[id]/inspection` | (Link from OwnerTenancyActions) | ⏳ Route stub |
| `/dashboard/vendor/tenancies/[id]/history` | (Link from OwnerTenancyActions) | ⏳ Route stub |
| `/dashboard/vendor/maintenance` | `VendorMaintenanceContent` | ✅ Session 7.3 |
| `/dashboard/vendor/maintenance/[id]` | `VendorMaintenanceDetailContent` | ✅ Session 7.3 |
| `/dashboard/vendor/inspections/[id]` | `VendorInspectionDetailContent` | ✅ Session 7.5 |
| `/dashboard/vendor/claims` | `VendorClaimsContent` | ✅ Session 7.6 |
| `/dashboard/vendor/claims/[id]` | `VendorClaimDetailContent` | ✅ Session 7.6 |
| `/dashboard/vendor/legal` | `VendorLegalContent` | ✅ Session 8.6 |
| `/dashboard/vendor/legal/[id]` | `VendorLegalDetailContent` | ✅ Session 8.6 |
| `/dashboard/vendor/inbox` | `InboxPage` | ✅ Session 2.7 |
| `/dashboard/vendor/inbox/[id]` | `InteractionDetailPage` | ✅ Session 2.7 |
| `/dashboard/vendor/reviews` | `ReviewListPage` | ✅ Session 2.8 |
| `/dashboard/vendor/reviews/[id]` | `ReviewDetailPage` | ✅ Session 2.8 |
| `/dashboard/vendor/listings/[id]/stats` | `ListingStatsPage` | ⏳ Not started |
| `/dashboard/vendor/analytics` | `AnalyticsPage` | ⏳ Not started |
| `/dashboard/vendor/analytics/listings` | `ListingsAnalyticsPage` | ⏳ Not started |
| `/dashboard/vendor/analytics/leads` | `LeadsAnalyticsPage` | ⏳ Not started |
| `/dashboard/vendor/team` | `TeamPage` | ⏳ Not started |
| `/dashboard/vendor/team/invite` | `TeamInvitePage` | ⏳ Not started |
| `/dashboard/vendor/team/[id]` | `TeamMemberPage` | ⏳ Not started |
| `/dashboard/vendor/billing` | `VendorBillingContent` | ✅ Session 6.5 |
| `/dashboard/vendor/payouts` | `VendorPayoutsContent` | ✅ Session 6.6 |
| `/dashboard/vendor/payouts/[id]` | `VendorPayoutDetailContent` | ✅ Session 6.7 |
| `/dashboard/vendor/analytics` | `VendorAnalyticsContent` | ⏳ Not started |
| `/dashboard/vendor/subscription` | `SubscriptionPage` | ✅ Session 4.2 |
| `/dashboard/vendor/subscription/usage` | `SubscriptionUsagePage` | ⏳ Not started |
| `/dashboard/vendor/subscription/upgrade` | `SubscriptionUpgradePage` | ⏳ Not started |
| `/dashboard/vendor/profile` | `ProfilePage` | ⏳ Not started |
| `/dashboard/vendor/profile/documents` | `DocumentsPage` | ⏳ Not started |
| `/dashboard/vendor/profile/public` | `PublicProfilePage` | ⏳ Not started |
| `/dashboard/vendor/settings` | `VendorSettingsContent` | ✅ Session 4.15 |
| `/dashboard/vendor/settings/notifications` | `NotificationPreferencesPage` | ✅ Session 4.15 |
| `/dashboard/vendor/settings/integrations` | `IntegrationsPage` | ⏳ Not started |

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
├── 💬 Messages              /dashboard/account/messages
├── 📅 My Viewings           /dashboard/account/bookings
├── ❤️ Saved Listings        /dashboard/account/saved
│   ├── All Saved            /dashboard/account/saved
│   └── Collections          /dashboard/account/saved/collections
├── 🔍 Saved Searches        /dashboard/account/saved-searches
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
| `/dashboard/account` | `AccountDashboardPage` | ✅ Complete (Session 2.10) |
| `/dashboard/account/profile` | `ProfilePage` | ✅ Complete (Session 2.10) |
| `/dashboard/account/profile/edit` | `ProfileEditPage` | ✅ Inline edit via toggle (Session 2.10) |
| `/dashboard/account/inquiries` | `InquiriesContent` | ✅ Complete (Session 2.11) |
| `/dashboard/account/inquiries/[id]` | `InquiryDetailPage` | ⏳ Not started |
| `/dashboard/account/messages` | `MessagesContent` | ✅ Complete (Enhancement #24) |
| `/dashboard/account/bookings` | `BookingsContent` | ✅ Complete (Enhancement #25) |
| `/dashboard/account/saved` | `SavedListingsContent` | ✅ Complete (Session 2.11) |
| `/dashboard/account/saved-searches` | `SavedSearchesContent` | ✅ Complete (Session 4.1) |
| `/dashboard/account/saved/collections` | `CollectionsPage` | ⏳ Not started |
| `/dashboard/account/reviews` | `CustomerReviewsContent` | ✅ Complete (Session 2.11) |
| `/dashboard/account/reviews/[id]` | `ReviewDetailPage` | ⏳ Not started |
| `/dashboard/account/notifications` | `NotificationsContent` | ✅ Complete (Session 2.11) |
| `/dashboard/account/notifications/preferences` | `NotificationPrefsPage` | ✅ Session 4.15 |
| `/dashboard/account/settings` | `SettingsContent` | ✅ Complete (Session 2.11) |
| `/dashboard/account/settings/notifications` | `NotificationPreferencesPage` | ✅ Session 4.15 |
| `/dashboard/account/settings/password` | `PasswordSettingsPage` | ⏳ Not started |
| `/dashboard/account/settings/privacy` | `PrivacySettingsPage` | ⏳ Not started |
| `/dashboard/account/security` | `SecurityContent` | ✅ Complete (Session 2.11) |

---

## � Occupant Portal (`/dashboard/occupant/*`)

**Access:** OCCUPANT only (Property Management tenants)

### Sidebar Navigation

```
📊 Dashboard                  /dashboard/occupant
├── 🏠 My Tenancy            /dashboard/occupant/tenancy
│   ├── Current Tenancy      /dashboard/occupant/tenancy
│   └── [id]                 /dashboard/occupant/tenancy/[id]
│       └── Contract         /dashboard/occupant/tenancy/[id]/contract
├── 💳 Bills & Payments      /dashboard/occupant/bills
│   ├── All Bills            /dashboard/occupant/bills
│   └── [id]                 /dashboard/occupant/bills/[id]
│       └── Receipt          /dashboard/occupant/bills/[id]/receipt
├── 🔧 Maintenance           /dashboard/occupant/maintenance
│   ├── All Requests         /dashboard/occupant/maintenance
│   ├── New Request          /dashboard/occupant/maintenance/new
│   └── [id]                 /dashboard/occupant/maintenance/[id]
├── 📋 Inspections           /dashboard/occupant/inspections
│   ├── Scheduled            /dashboard/occupant/inspections
│   └── [id]                 /dashboard/occupant/inspections/[id]
├── 📄 Documents             /dashboard/occupant/documents
├── 👤 Profile               /dashboard/occupant/profile
└── ⚙️ Settings              /dashboard/occupant/settings
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard/occupant` | `OccupantDashboardContent` | ✅ Complete (Session 5.1) |
| `/dashboard/occupant/onboarding` | `OccupantOnboardingContent` | ✅ Complete (Session 5.2) |
| `/dashboard/occupant/tenancy` | `TenancyListContent` | ✅ Complete (Session 5.3) |
| `/dashboard/occupant/tenancy/[id]` | `TenancyDetailContent` | ✅ Complete (Session 5.4, 5.8: +DepositTracker) |
| `/dashboard/occupant/tenancy/[id]/contract` | `OccupantContractContent` | ✅ Complete (Session 5.6) |
| `/dashboard/occupant/bills` | `BillsListContent` | ✅ Complete (Session 6.1) |
| `/dashboard/occupant/bills/[id]` | `OccupantBillDetailContent` | ✅ Complete (Session 6.2, 6.3: +PaymentDialog) |
| `/dashboard/occupant/bills/payment` | `PaymentProcessingContent` | ✅ Complete (Session 6.3) |
| `/dashboard/occupant/bills/[id]/receipt` | `ReceiptContent` | ✅ Session 6.4 |
| `/dashboard/occupant/maintenance` | `MaintenanceListContent` | ✅ Complete (Session 7.1) |
| `/dashboard/occupant/maintenance/new` | `NewMaintenanceRequestContent` | ✅ Complete (Session 7.1) |
| `/dashboard/occupant/maintenance/[id]` | `MaintenanceDetailContent` | ✅ Complete (Session 7.2) |
| `/dashboard/occupant/inspections` | `InspectionContent` | ✅ Complete (Session 7.4) |
| `/dashboard/occupant/inspections/[id]` | `OccupantInspectionDetailContent` | ✅ Complete (Session 7.5) |
| `/dashboard/occupant/claims` | `OccupantClaimsContent` | ✅ Complete (Session 7.6) |
| `/dashboard/occupant/claims/[id]` | `OccupantClaimDetailContent` | ✅ Complete (Session 7.6) |
| `/dashboard/occupant/documents` | `DocumentsContent` | ⏳ Not started |
| `/dashboard/occupant/profile` | `OccupantProfileContent` | ⏳ Not started |
| `/dashboard/occupant/settings` | `OccupantSettingsContent` | ⏳ Not started |

---

## 🏢 Company Portal (`/dashboard/company/*`)

**Access:** COMPANY_ADMIN only (Real estate agency companies)

### Sidebar Navigation

```
📊 Dashboard                  /dashboard/company
├── 👥 Management
│   ├── Agents               /dashboard/company/agents
│   ├── Listings             /dashboard/company/listings
│   └── Tenancies            /dashboard/company/tenancies
├── 💰 Finance
│   ├── Billing              /dashboard/company/billing
│   └── Commissions          /dashboard/company/commissions
└── ⚙️ Account
    ├── Company Profile      /dashboard/company/profile
    └── Settings             /dashboard/company/settings
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard/company` | `CompanyDashboard` | ✅ Complete (Session 8.2) |
| `/dashboard/company/agents` | `AgentList` | ✅ Complete (Session 8.3) |
| `/dashboard/company/agents/[id]` | `AgentDetail` | ✅ Complete (Session 8.3) |
| `/dashboard/company/listings` | `CompanyListingsContent` | ⏳ Not started |
| `/dashboard/company/tenancies` | `CompanyTenanciesContent` | ⏳ Not started |
| `/dashboard/company/billing` | `CompanyBillingContent` | ⏳ Not started |
| `/dashboard/company/commissions` | `CompanyCommissionsContent` | ⏳ Not started |
| `/dashboard/company/profile` | `CompanyProfileContent` | ⏳ Not started |
| `/dashboard/company/settings` | `CompanySettingsContent` | ⏳ Not started |

---

## 🕴️ Agent Portal (`/dashboard/agent/*`)

**Access:** AGENT only (Real estate agents)

### Sidebar Navigation

```
📊 Dashboard                  /dashboard/agent
├── 💼 Work
│   ├── My Listings          /dashboard/agent/listings
│   └── My Tenancies         /dashboard/agent/tenancies
├── 💰 Earnings
│   ├── Commissions          /dashboard/agent/commissions
│   └── Performance          /dashboard/agent/performance
└── ⚙️ Account
    ├── Referrals            /dashboard/agent/referrals
    ├── Profile              /dashboard/agent/profile
    └── Settings             /dashboard/agent/settings
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard/agent` | `AgentDashboard` | ✅ Complete (Session 8.4) |
| `/dashboard/agent/commissions` | `CommissionList` | ✅ Complete (Session 8.4) |
| `/dashboard/agent/commissions/[id]` | `CommissionDetail` | ✅ Complete (Session 8.4) |
| `/dashboard/agent/listings` | `AgentListingsContent` | ⏳ Not started |
| `/dashboard/agent/tenancies` | `AgentTenanciesContent` | ⏳ Not started |
| `/dashboard/agent/performance` | `AgentPerformanceContent` | ⏳ Not started |
| `/dashboard/agent/referrals` | `AgentReferralsContent` | ⏳ Not started |
| `/dashboard/agent/profile` | `AgentProfileContent` | ⏳ Not started |
| `/dashboard/agent/settings` | `AgentSettingsContent` | ⏳ Not started |

---

## 🔗 Affiliate Portal (`/dashboard/affiliate/*`)

**Access:** Any authenticated user (affiliate is a module, not a role)

### Sidebar Navigation

```
📊 Dashboard                  /dashboard/affiliate
├── 📋 Activity
│   └── Referrals            /dashboard/affiliate/referrals
├── 💰 Earnings
│   └── Payouts              /dashboard/affiliate/payouts
└── ⚙️ Account
    ├── Profile              /dashboard/affiliate/profile
    └── Settings             /dashboard/affiliate/settings
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard/affiliate` | `AffiliateDashboard` | ✅ Complete (Session 8.5) |
| `/dashboard/affiliate/referrals` | `ReferralList` | ✅ Complete (Session 8.5) |
| `/dashboard/affiliate/payouts` | `AffiliatePayoutRequest` | ✅ Complete (Session 8.5) |
| `/dashboard/affiliate/profile` | `AffiliateProfileContent` | ⏳ Not started |
| `/dashboard/affiliate/settings` | `AffiliateSettingsContent` | ⏳ Not started |

---

## 🌐 Public Pages (`/`)

**Access:** Everyone (no auth required)

### Routes

```
🏠 Home                       /
├── 🔍 Search                /search
│   └── With filters         /search?q=...&city=...&sort=...
├── 📦 Listing               /listings/[idOrSlug]
├── 📦 Listing (Legacy)      /listing/[id]  → redirects to /listings/[id]
├── 🏪 Vendor                /vendors/[idOrSlug]
├── 🔄 Compare               /compare
└── 📄 Pages
    ├── About                /about
    ├── Contact              /contact
    ├── Terms                /terms
    ├── Privacy              /privacy
    └── Cookies              /cookies
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/` | `HomePage` | ✅ Session 1.7 (public layout) |
| `/search` | `SearchPage` → `SearchContent` | ✅ Session 4.1 |
| `/listings/[idOrSlug]` | `PublicListingPage` (SSR + Schema.org) | ✅ Session 4.7 |
| `/listing/[id]` | Legacy redirect → `/listings/[id]` | ✅ Session 4.7 |
| `/vendors/[idOrSlug]` | `VendorPublicPage` (SSR + Schema.org) | ✅ Session 4.7 |
| `/compare` | `ComparePage` | ✅ Session 4.7 |
| `/about` | `AboutPage` | ✅ Static page |
| `/contact` | `ContactPage` | ✅ Static page |
| `/terms` | `TermsPage` | ✅ Static page |
| `/privacy` | `PrivacyPage` | ✅ Static page |
| `/cookies` | `CookiesPage` | ✅ Static page |

---

## � Auth Pages (`/(auth)/*`) — Session 1.5

**Access:** Unauthenticated users only (guest guard redirects authenticated users to their portal)

### Routes

```
🔑 Login                      /login
📝 Register                   /register
🔒 Forgot Password            /forgot-password
⏰ Session Expired            /session-expired
🚫 Forbidden (403)            /forbidden
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/login` | `LoginPage` | ✅ Session 1.5 |
| `/register` | `RegisterPage` | ✅ Session 1.5 |
| `/forgot-password` | `ForgotPasswordPage` | ✅ Session 1.5 |
| `/session-expired` | `SessionExpiredPage` | ✅ Session 1.5 |
| `/forbidden` | `ForbiddenPage` | ✅ Session 1.5 |

---

## �🔐 Guest Pages (`/dashboard/(guest)/*`)

**Access:** Unauthenticated users only  
**Note:** These use the `(guest)` route group under `/dashboard/` with a minimal layout.

### Routes (Template Exists)

```
🔑 Login                      /dashboard/(guest)/login/v1
🔑 Login (v2)                 /dashboard/(guest)/login/v2
📝 Register                   /dashboard/(guest)/register/v1
📝 Register (v2)              /dashboard/(guest)/register/v2
🏢 Company Registration       /dashboard/(guest)/register/company
🔒 Forgot Password            /dashboard/(guest)/forgot-password
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard/(guest)/login/v1` | `LoginPageV1` | ✅ Template exists |
| `/dashboard/(guest)/login/v2` | `LoginPageV2` | ✅ Template exists |
| `/dashboard/(guest)/register/v1` | `RegisterPageV1` | ✅ Template exists |
| `/dashboard/(guest)/register/v2` | `RegisterPageV2` | ✅ Template exists |
| `/dashboard/(guest)/register/company` | `CompanyRegistrationPage` | ✅ Session 8.1 |
| `/dashboard/(guest)/forgot-password` | `ForgotPasswordPage` | ✅ Template exists |

### Reference Pages (Template UI Kit)

| Route | Purpose | Status |
|-------|---------|--------|
| `/dashboard/(guest)/reference/pages/error/404` | 404 error page template | ✅ Template exists |
| `/dashboard/(guest)/reference/pages/error/500` | 500 error page template | ✅ Template exists |

---

## 📚 Reference Template (`/dashboard/(auth)/reference/*`)

**Purpose:** shadcn UI kit template examples. Reuse components and patterns from here for portal development.  
**Note:** These are NOT part of the Zam-Property application — they are design/component references.

### Available Reference Sections

| Section | Route | Description |
|---------|-------|-------------|
| Academy | `/dashboard/(auth)/reference/academy` | LMS dashboard template |
| Apps | `/dashboard/(auth)/reference/apps/*` | AI Chat, Calendar, Chat, File Manager, Kanban, Mail, Notes, POS, Social Media, Tasks, Todo |
| CRM | `/dashboard/(auth)/reference/crm` | CRM dashboard template |
| Crypto | `/dashboard/(auth)/reference/crypto` | Crypto dashboard template |
| Default | `/dashboard/(auth)/reference/default` | Default dashboard template |
| Ecommerce | `/dashboard/(auth)/reference/ecommerce` | Ecommerce dashboard template |
| File Manager | `/dashboard/(auth)/reference/file-manager` | File manager template |
| Finance | `/dashboard/(auth)/reference/finance` | Finance dashboard template |
| Hospital | `/dashboard/(auth)/reference/hospital-management` | Hospital management template |
| Hotel | `/dashboard/(auth)/reference/hotel` | Hotel management + bookings template |
| Pages | `/dashboard/(auth)/reference/pages/*` | Empty states, Error (403), Onboarding, Orders, Pricing, Products, Profile, Settings, User Profile, Users |
| Payment | `/dashboard/(auth)/reference/payment` | Payment + transactions template |
| Project List | `/dashboard/(auth)/reference/project-list` | Project list template |
| Project Mgmt | `/dashboard/(auth)/reference/project-management` | Project management template |
| Sales | `/dashboard/(auth)/reference/sales` | Sales dashboard template |
| Web Analytics | `/dashboard/(auth)/reference/website-analytics` | Website analytics template |
| Widgets | `/dashboard/(auth)/reference/widgets` | Analytics, Ecommerce, Fitness widgets |

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
| 2026-02-18 | 4.13 | Implemented Job Queue Dashboard: `/dashboard/platform/jobs` with 3 tabs (Health Dashboard, Job List, Bulk Operations). Created jobs module with 12 hooks (4 query + 8 mutation), 5 components. Auto-refresh toggle with 10s polling. Uses format "D" for non-standard jobs response. |
| 2026-02-17 | 4.4 | Implemented audit logs: `/dashboard/platform/audit` (global logs), `/dashboard/tenant/audit` (tenant-scoped). Created audit module with 6 hooks, 5 components. Added contextual "View Audit History" links on vendor/listing/tenant detail pages. Updated route paths from `/audit-logs` to `/audit`. |
| 2026-02-17 | 4.3 | Implemented analytics dashboards: `/dashboard/platform` (admin stats, pie/bar charts), `/dashboard/tenant` (KPI cards, date range picker, bar chart), `/dashboard/vendor` (KPI cards, top listings table, CSV export). Created analytics module with 4 hooks, 8 components. |
| 2026-02-17 | 4.2 | Added subscription pages: `/dashboard/tenant/subscription` (full dashboard), `/dashboard/vendor/subscription` (read-only view), `/dashboard/platform/subscriptions` (admin overview). |
| 2026-02-16 | 1.7 | Created `config/navigation.ts` with portal-scoped nav trees (platform: 8, tenant: 9, vendor: 7, account: 8 items). Made sidebar portal-aware (detect from pathname). Updated `NavUser`/`UserMenu` to use auth context. Created `app/(public)/layout.tsx` with header+footer. Updated header search for portal-aware nav. |
| 2026-02-16 | 1.6 | Added portal layout guards: `platform/layout.tsx` (SUPER_ADMIN), `tenant/layout.tsx` (SUPER_ADMIN/TENANT_ADMIN), `vendor/layout.tsx` (VENDOR_ADMIN/VENDOR_STAFF), `account/layout.tsx` (any auth). Updated `proxy.ts` with edge route protection. Added `ProtectedRoute` and `GuestRoute` components. |
| 2026-02-16 | 1.5 | Added `(auth)/` route group: `/login`, `/register`, `/forgot-password`. Added `/session-expired` and `/forbidden` standalone pages. |
| - | Template | Initial shadcn-template-refactor structure: `dashboard/(auth)/` with portal stubs (platform, tenant, vendor, account), `dashboard/(guest)/` with login/register/forgot-password templates (v1, v2 variants), `dashboard/(auth)/reference/` with 58+ shadcn UI kit examples |
| 2026-02-26 | 8.8 | Final audit: Updated summary table counts (Platform→12, Vendor→12, Account→10, Public→12, Total→93). Added `/compare`, `/saved-searches`, `/listings/[idOrSlug]`, `/vendors/[idOrSlug]` routes. Updated stale public route statuses from ⏳ to ✅ (Session 4.7). |
| - | - | Planned routes defined for all portals (see sections above) |

