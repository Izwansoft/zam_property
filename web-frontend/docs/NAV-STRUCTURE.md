# Zam-Property Web Frontend - Navigation Structure

> **This document defines ALL navigation items across portals.**  
> Update this file after adding any new routes or pages.

---

## 📋 Summary

| Portal | Nav Items | Status |
|--------|-----------|--------|
| Platform Admin | 0 | ⏳ Pending |
| Tenant Admin | 0 | ⏳ Pending |
| Vendor Portal | 0 | ⏳ Pending |
| Public Pages | 0 | ⏳ Pending |
| **Total** | **0** | |

---

## 🏗️ Route Structure

### App Router Organization
```
src/app/
├── (public)/                 # Public pages (no auth)
│   ├── page.tsx              # Home
│   ├── search/               # Search results
│   └── listing/[slug]/       # Public listing detail
├── (auth)/                   # Auth pages
│   ├── login/
│   └── register/
├── platform/                 # Platform Admin portal
│   └── [...routes]
├── tenant/                   # Tenant Admin portal
│   └── [...routes]
└── vendor/                   # Vendor portal
    └── [...routes]
```

---

## 🔵 Platform Admin Portal (`/platform/*`)

**Access:** SUPER_ADMIN only

### Sidebar Navigation

```
📊 Dashboard                  /platform
├── 🏢 Tenants               /platform/tenants
│   ├── All Tenants          /platform/tenants
│   ├── Create Tenant        /platform/tenants/create
│   └── [id]                 /platform/tenants/[id]
├── 📦 Listings (Global)     /platform/listings
│   ├── All Listings         /platform/listings
│   ├── Moderation Queue     /platform/listings/moderation
│   └── [id]                 /platform/listings/[id]
├── 🏪 Vendors (Global)      /platform/vendors
│   ├── All Vendors          /platform/vendors
│   ├── Pending Approvals    /platform/vendors/pending
│   └── [id]                 /platform/vendors/[id]
├── 👥 Users (Global)        /platform/users
│   ├── All Users            /platform/users
│   └── [id]                 /platform/users/[id]
├── 📊 Analytics             /platform/analytics
│   ├── Overview             /platform/analytics
│   ├── Revenue              /platform/analytics/revenue
│   └── Growth               /platform/analytics/growth
├── 🔧 Settings              /platform/settings
│   ├── Feature Flags        /platform/settings/feature-flags
│   ├── Verticals            /platform/settings/verticals
│   └── System Config        /platform/settings/config
├── 📜 Audit Logs            /platform/audit-logs
└── ⚙️ System                /platform/system
    ├── Health               /platform/system/health
    └── Jobs                 /platform/system/jobs
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/platform` | `DashboardPage` | ⏳ Pending |
| `/platform/tenants` | `TenantListPage` | ⏳ Pending |
| `/platform/tenants/create` | `TenantCreatePage` | ⏳ Pending |
| `/platform/tenants/[id]` | `TenantDetailPage` | ⏳ Pending |
| `/platform/listings` | `ListingListPage` | ⏳ Pending |
| `/platform/listings/moderation` | `ModerationQueuePage` | ⏳ Pending |
| `/platform/vendors` | `VendorListPage` | ⏳ Pending |
| `/platform/vendors/pending` | `VendorApprovalPage` | ⏳ Pending |
| `/platform/users` | `UserListPage` | ⏳ Pending |
| `/platform/analytics` | `AnalyticsPage` | ⏳ Pending |
| `/platform/settings/feature-flags` | `FeatureFlagsPage` | ⏳ Pending |
| `/platform/audit-logs` | `AuditLogsPage` | ⏳ Pending |

---

## 🟢 Tenant Admin Portal (`/tenant/*`)

**Access:** TENANT_ADMIN only

### Sidebar Navigation

```
📊 Dashboard                  /tenant
├── 📦 Listings              /tenant/listings
│   ├── All Listings         /tenant/listings
│   ├── Moderation Queue     /tenant/listings/moderation
│   ├── Create Listing       /tenant/listings/create
│   └── [id]                 /tenant/listings/[id]
├── 🏪 Vendors               /tenant/vendors
│   ├── All Vendors          /tenant/vendors
│   ├── Pending Approvals    /tenant/vendors/pending
│   └── [id]                 /tenant/vendors/[id]
├── 👥 Users                 /tenant/users
│   ├── All Users            /tenant/users
│   ├── Invite User          /tenant/users/invite
│   └── [id]                 /tenant/users/[id]
├── 💬 Interactions          /tenant/interactions
│   ├── All                  /tenant/interactions
│   └── [id]                 /tenant/interactions/[id]
├── ⭐ Reviews               /tenant/reviews
│   ├── All Reviews          /tenant/reviews
│   ├── Pending              /tenant/reviews/pending
│   └── [id]                 /tenant/reviews/[id]
├── 📊 Analytics             /tenant/analytics
│   ├── Overview             /tenant/analytics
│   ├── Listings             /tenant/analytics/listings
│   └── Vendors              /tenant/analytics/vendors
├── 💳 Subscriptions         /tenant/subscriptions
│   ├── Plans                /tenant/subscriptions/plans
│   └── Billing              /tenant/subscriptions/billing
├── 🔧 Settings              /tenant/settings
│   ├── General              /tenant/settings
│   ├── Branding             /tenant/settings/branding
│   ├── Domains              /tenant/settings/domains
│   └── Notifications        /tenant/settings/notifications
└── 📜 Audit Logs            /tenant/audit-logs
```

### Implementation Status

| Route | Component | Status |
|-------|-----------|--------|
| `/tenant` | `DashboardPage` | ⏳ Pending |
| `/tenant/listings` | `ListingListPage` | ⏳ Pending |
| `/tenant/listings/moderation` | `ModerationQueuePage` | ⏳ Pending |
| `/tenant/listings/create` | `ListingCreatePage` | ⏳ Pending |
| `/tenant/vendors` | `VendorListPage` | ⏳ Pending |
| `/tenant/vendors/pending` | `VendorApprovalPage` | ⏳ Pending |
| `/tenant/users` | `UserListPage` | ⏳ Pending |
| `/tenant/interactions` | `InteractionListPage` | ⏳ Pending |
| `/tenant/reviews` | `ReviewListPage` | ⏳ Pending |
| `/tenant/analytics` | `AnalyticsPage` | ⏳ Pending |
| `/tenant/subscriptions` | `SubscriptionPage` | ⏳ Pending |
| `/tenant/settings` | `SettingsPage` | ⏳ Pending |
| `/tenant/audit-logs` | `AuditLogsPage` | ⏳ Pending |

---

## 🟠 Vendor Portal (`/vendor/*`)

**Access:** VENDOR_ADMIN, VENDOR_STAFF

### Sidebar Navigation

```
📊 Dashboard                  /vendor
├── 📦 My Listings           /vendor/listings
│   ├── All Listings         /vendor/listings
│   ├── Create Listing       /vendor/listings/create
│   ├── Drafts               /vendor/listings?status=DRAFT
│   └── [id]                 /vendor/listings/[id]
│       ├── Edit             /vendor/listings/[id]/edit
│       └── Stats            /vendor/listings/[id]/stats
├── 💬 Inbox                 /vendor/inbox
│   ├── All                  /vendor/inbox
│   ├── New                  /vendor/inbox?status=NEW
│   ├── In Progress          /vendor/inbox?status=CONTACTED
│   └── [id]                 /vendor/inbox/[id]
├── ⭐ Reviews               /vendor/reviews
│   └── [id]                 /vendor/reviews/[id]
├── 📊 Analytics             /vendor/analytics
│   ├── Overview             /vendor/analytics
│   ├── Listing Performance  /vendor/analytics/listings
│   └── Lead Analytics       /vendor/analytics/leads
├── 👥 Team                  /vendor/team
│   ├── Members              /vendor/team
│   ├── Invite               /vendor/team/invite
│   └── [id]                 /vendor/team/[id]
├── 💳 Subscription          /vendor/subscription
│   ├── Current Plan         /vendor/subscription
│   ├── Usage                /vendor/subscription/usage
│   └── Upgrade              /vendor/subscription/upgrade
├── 🏢 Profile               /vendor/profile
│   ├── Business Info        /vendor/profile
│   ├── Documents            /vendor/profile/documents
│   └── Public Page          /vendor/profile/public
└── ⚙️ Settings              /vendor/settings
    ├── General              /vendor/settings
    ├── Notifications        /vendor/settings/notifications
    └── Integrations         /vendor/settings/integrations
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
| `/vendor` | `DashboardPage` | ⏳ Pending |
| `/vendor/listings` | `ListingListPage` | ⏳ Pending |
| `/vendor/listings/create` | `ListingCreatePage` | ⏳ Pending |
| `/vendor/listings/[id]` | `ListingDetailPage` | ⏳ Pending |
| `/vendor/listings/[id]/edit` | `ListingEditPage` | ⏳ Pending |
| `/vendor/inbox` | `InboxPage` | ⏳ Pending |
| `/vendor/inbox/[id]` | `InteractionDetailPage` | ⏳ Pending |
| `/vendor/reviews` | `ReviewListPage` | ⏳ Pending |
| `/vendor/analytics` | `AnalyticsPage` | ⏳ Pending |
| `/vendor/team` | `TeamPage` | ⏳ Pending |
| `/vendor/subscription` | `SubscriptionPage` | ⏳ Pending |
| `/vendor/profile` | `ProfilePage` | ⏳ Pending |
| `/vendor/settings` | `SettingsPage` | ⏳ Pending |

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
| `/search` | `SearchPage` | ⏳ Pending |
| `/listing/[slug]` | `ListingPage` | ⏳ Pending |
| `/vendor/[slug]` | `VendorPublicPage` | ⏳ Pending |
| `/login` | `LoginPage` | ⏳ Pending |
| `/register` | `RegisterPage` | ⏳ Pending |

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
| - | - | Initial structure defined |

