# Zam-Property — User Flow Documentation

> **Generated:** 2026-02-26 (Session 8.8 — Final Testing & Documentation)
> **Status:** All 80/80 sessions complete. 627 tests passing. 0 TypeScript errors.

---

## 📋 Table of Contents

1. [Customer (Account) Flow](#1-customer-account-flow)
2. [Vendor (Property Owner) Flow](#2-vendor-property-owner-flow)
3. [Occupant (Tenant) Flow](#3-occupant-tenant-flow)
4. [Tenant Admin Flow](#4-tenant-admin-flow)
5. [Platform Admin (Super Admin) Flow](#5-platform-admin-super-admin-flow)
6. [Company Admin Flow](#6-company-admin-flow)
7. [Agent Flow](#7-agent-flow)
8. [Affiliate Flow](#8-affiliate-flow)

---

## 1. Customer (Account) Flow

**Role:** `CUSTOMER`
**Portal:** `/dashboard/account`
**Purpose:** Browse listings, inquire, save favourites, manage profile.

### Journey

```
Register/Login → Dashboard → Browse Listings → Inquire → Track Inquiries → Review
```

### Steps

| Step | Route | Action |
|------|-------|--------|
| 1. Register | `/register` | Create account with email/password |
| 2. Login | `/login` | Authenticate → redirect to `/dashboard/account` |
| 3. Dashboard | `/dashboard/account` | View stats (inquiries, saved, reviews), quick actions |
| 4. Search | `/search` | Search listings with filters (location, price, property type) |
| 5. View Listing | `/listings/[id]` | Public listing detail with gallery, attributes, vendor info |
| 6. Inquire | `/listings/[id]` → CTA | Submit inquiry → creates interaction |
| 7. Track Inquiries | `/dashboard/account/inquiries` | View sent inquiries, status updates |
| 8. Save Listings | `/dashboard/account/saved` | Heart icon saves listings, manage collections |
| 9. Write Review | `/dashboard/account/reviews` | View reviews written by customer |
| 10. Profile | `/dashboard/account/profile` | View/edit personal information |
| 11. Settings | `/dashboard/account/settings` | Language, timezone, privacy preferences |
| 12. Security | `/dashboard/account/security` | Change password, delete account |
| 13. Notifications | `/dashboard/account/settings/notifications` | Toggle notification preferences (13 types × 5 channels) |

### Key Hooks

- `useProfile`, `useUpdateProfile` — Profile management
- `useDashboardStats` — Dashboard statistics
- `useInquiries` — Inquiry history
- `useSavedListings`, `useUnsaveListing` — Favourites
- `useCustomerReviews` — Review history
- `useNotificationPreferences` — Notification settings

---

## 2. Vendor (Property Owner) Flow

**Role:** `VENDOR_ADMIN`, `VENDOR_STAFF`
**Portal:** `/dashboard/vendor`
**Purpose:** List properties, manage tenancies, handle maintenance, receive payouts.

### Journey

```
Register → Onboard → Create Listings → Manage Tenancies → Handle Maintenance → Receive Payouts
```

### Steps

| Step | Route | Action |
|------|-------|--------|
| 1. Register | `/register` | Create account, select VENDOR role |
| 2. Onboarding | `/dashboard/vendor/onboarding` | Multi-step wizard (business info, docs, bank details) |
| 3. Dashboard | `/dashboard/vendor` | KPI cards, top listings, analytics overview |
| 4. Create Listing | `/dashboard/vendor/listings/create` | 5-step wizard (vertical → basic info → attributes → media → review) |
| 5. Manage Listings | `/dashboard/vendor/listings` | View all listings, filter by status, edit/publish/archive |
| 6. Inbox | `/dashboard/vendor/inbox` | Respond to inquiries from customers |
| 7. Reviews | `/dashboard/vendor/reviews` | View reviews, reply to customer reviews |
| 8. Tenancies | `/dashboard/vendor/tenancies` | View all tenancies across properties |
| 9. Tenancy Actions | `/dashboard/vendor/tenancies/[id]` | Approve/reject booking, confirm deposit, sign contract, handover |
| 10. Maintenance | `/dashboard/vendor/maintenance` | Manage tickets (verify, assign, resolve, close) |
| 11. Claims | `/dashboard/vendor/claims` | Review damage claims, approve/reject with evidence |
| 12. Billing | `/dashboard/vendor/billing` | View billing summary, collection status per property |
| 13. Payouts | `/dashboard/vendor/payouts` | View payout history, download statements |
| 14. Legal | `/dashboard/vendor/legal` | View escalated legal cases, timeline, assigned lawyer |
| 15. Subscription | `/dashboard/vendor/subscription` | View current plan, usage meters |
| 16. Settings | `/dashboard/vendor/settings` | Business info, logo, visibility, notification prefs |

### Key Hooks

- `useListings`, `useCreateListing`, `useUpdateListing`, `usePublishListing` — Listing CRUD
- `useOwnerTenancies`, `useApproveTenancy`, `useRejectTenancy` — Tenancy management
- `useOwnerMaintenanceTickets`, `useVerifyMaintenance`, `useAssignMaintenance` — Maintenance inbox
- `useOwnerBillings`, `useOwnerBillingSummary` — Billing overview
- `usePayouts`, `usePayout`, `usePayoutStatement` — Payout management
- `useLegalCases`, `useLegalCase` — Legal case tracking
- `useVendorSettings`, `useUpdateVendorSettings` — Business settings

---

## 3. Occupant (Tenant) Flow

**Role:** `OCCUPANT`
**Portal:** `/dashboard/occupant`
**Purpose:** Manage tenancy, pay bills, request maintenance, track inspections/claims.

### Journey

```
Register → Onboard → Book Property → Sign Contract → Pay Bills → Request Maintenance → Inspections
```

### Steps

| Step | Route | Action |
|------|-------|--------|
| 1. Register | `/register` | Create account as OCCUPANT |
| 2. Onboarding | `/dashboard/occupant/onboarding` | 4-step wizard (personal details, IC upload, emergency contact, review) |
| 3. Dashboard | `/dashboard/occupant` | Active tenancy summary, upcoming bills, recent maintenance |
| 4. Book Property | Listing detail → Booking wizard | Confirm property → verify identity → deposit → confirmation |
| 5. View Tenancy | `/dashboard/occupant/tenancy` | List tenancies, view status, property info |
| 6. Tenancy Detail | `/dashboard/occupant/tenancy/[id]` | Dates, financial summary, deposit tracker, timeline |
| 7. View Contract | `/dashboard/occupant/tenancy/[id]/contract` | PDF viewer, signature status, sign button |
| 8. Pay Bills | `/dashboard/occupant/bills` | View bills (Pending/Paid/Overdue), pay via Card/FPX/Bank Transfer |
| 9. Bill Detail | `/dashboard/occupant/bills/[id]` | Line items breakdown, payment history, pay button |
| 10. Receipt | `/dashboard/occupant/bills/[id]/receipt` | Payment receipt with download PDF |
| 11. Maintenance | `/dashboard/occupant/maintenance` | List requests, create new request |
| 12. New Request | `/dashboard/occupant/maintenance/new` | Category, description, priority, photo upload |
| 13. Track Maintenance | `/dashboard/occupant/maintenance/[id]` | Status timeline, comments thread, updates |
| 14. Inspections | `/dashboard/occupant/inspections` | View scheduled inspections (move-in/periodic/move-out) |
| 15. Inspection Detail | `/dashboard/occupant/inspections/[id]` | Upload video, review checklist |
| 16. Claims | `/dashboard/occupant/claims` | View claims against deposits, submit disputes |

### Key Hooks

- `useOccupantProfile`, `useSubmitOccupantOnboarding` — Onboarding
- `useTenancies`, `useTenancy`, `useCreateTenancy` — Tenancy lifecycle
- `useContract`, `useSignContract` — Contract management
- `useBillings`, `useBilling`, `useCreatePayment` — Bill payment
- `useMaintenanceTickets`, `useCreateMaintenance` — Maintenance requests
- `useInspections`, `useScheduleInspection`, `useSubmitVideo` — Inspections
- `useClaims`, `useCreateClaim`, `useDisputeClaim` — Claim management
- `useDepositsByTenancy`, `useDepositSummary` — Deposit tracking

---

## 4. Tenant Admin Flow

**Role:** `TENANT_ADMIN`
**Portal:** `/dashboard/tenant`
**Purpose:** Manage marketplace tenant — vendors, listings, reviews, analytics.

### Journey

```
Login → Dashboard → Manage Vendors → Moderate Listings → Monitor Analytics → Audit
```

### Steps

| Step | Route | Action |
|------|-------|--------|
| 1. Dashboard | `/dashboard/tenant` | KPI cards, date range picker, bar charts |
| 2. Vendors | `/dashboard/tenant/vendors` | List vendors, approve/reject/suspend |
| 3. Vendor Detail | `/dashboard/tenant/vendors/[id]` | Vendor info, stats, listing count |
| 4. Listings | `/dashboard/tenant/listings` | Moderate listings (publish/unpublish/feature) |
| 5. Reviews | `/dashboard/tenant/reviews` | Moderate reviews (approve/reject/flag) |
| 6. Subscription | `/dashboard/tenant/subscription` | View plan, usage meters, entitlements |
| 7. Audit Logs | `/dashboard/tenant/audit` | Tenant-scoped audit trail |
| 8. Settings | `/dashboard/tenant/settings/notifications` | Notification preferences |

### Key Hooks

- `useTenantAnalytics` — Dashboard analytics
- `useVendors`, `useApproveVendor`, `useRejectVendor` — Vendor management
- `useAdminListings`, `useAdminPublishListing` — Listing moderation
- `useReviews`, `useApproveReview`, `useRejectReview` — Review moderation
- `useSubscription`, `useUsage`, `useEntitlements` — Subscription overview
- `useAuditLogs` — Audit trail

---

## 5. Platform Admin (Super Admin) Flow

**Role:** `SUPER_ADMIN`
**Portal:** `/dashboard/platform`
**Purpose:** Manage entire platform — tenants, pricing, feature flags, PM oversight.

### Journey

```
Login → Platform Dashboard → Manage Tenants → Configure Platform → Monitor Operations
```

### Steps

| Step | Route | Action |
|------|-------|--------|
| 1. Dashboard | `/dashboard/platform` | Platform-wide analytics (pie/bar charts) |
| 2. Tenants | `/dashboard/platform/tenants` | List/manage all tenants |
| 3. Tenant Detail | `/dashboard/platform/tenants/[id]` | Tenant info, stats, subscription, settings |
| 4. Listings | `/dashboard/platform/listings` | Global listing moderation (feature/publish/archive) |
| 5. Subscriptions | `/dashboard/platform/subscriptions` | Admin subscription overview |
| 6. Pricing | `/dashboard/platform/pricing` | Pricing configs, rules, charge events, calculator |
| 7. Feature Flags | `/dashboard/platform/feature-flags` | Toggle features, manage overrides |
| 8. Experiments | `/dashboard/platform/experiments` | A/B test management |
| 9. Audit Logs | `/dashboard/platform/audit` | Global audit trail |
| 10. Job Queue | `/dashboard/platform/jobs` | Health dashboard, job list, bulk operations |
| 11. PM: Partner Billing | `/dashboard/platform/billing` | Governance billing oversight (platform-wide and partner-scoped) |
| 12. Settings | `/dashboard/platform/settings/notifications` | Platform notification preferences |

### Key Hooks

- `usePlatformAnalytics` — Platform analytics
- `useTenants`, `useTenantDetail`, `useSuspendTenant` — Tenant management
- `useAdminListings`, `useAdminFeatureListing` — Listing moderation
- `usePricingConfigs`, `useCreatePricingConfig` — Pricing config
- `useFeatureFlags`, `useCreateFeatureFlag` — Feature flags
- `useAuditLogs`, `useAuditLogDetail` — Audit trail
- `useJobsHealth`, `useJobsList`, `useRetryJob` — Job queue
- `useAdminPMStats`, `useAdminBills` — PM governance billing oversight
- `useBulkProcessBills` — Bulk billing operations

---

## 6. Company Admin Flow

**Role:** `COMPANY_ADMIN`
**Portal:** `/dashboard/company`
**Purpose:** Manage real estate company — agents, listings, commissions.

### Journey

```
Register Company → Dashboard → Add Agents → Assign Listings → Track Commissions
```

### Steps

| Step | Route | Action |
|------|-------|--------|
| 1. Register Company | `/dashboard/(guest)/register/company` | 6-step wizard (company, admin, docs, package, payment, confirm) |
| 2. Dashboard | `/dashboard/company` | Stats (properties, agents, tenancies, revenue), activity feed |
| 3. Agent List | `/dashboard/company/agents` | List agents, register new agents |
| 4. Agent Detail | `/dashboard/company/agents/[id]` | Agent profile, assigned listings, performance |

### Key Hooks

- `useCompanies`, `useCompany`, `useRegisterCompany` — Company management
- `useAgents`, `useRegisterAgent`, `useAssignListing` — Agent CRUD
- `useCompanyAdmins`, `useAddCompanyAdmin` — Admin management

---

## 7. Agent Flow

**Role:** `AGENT`
**Portal:** `/dashboard/agent`
**Purpose:** Manage assigned listings, track commissions, referrals.

### Journey

```
Assigned by Company → Dashboard → Manage Listings → Track Commissions → Referrals
```

### Steps

| Step | Route | Action |
|------|-------|--------|
| 1. Dashboard | `/dashboard/agent` | My listings, tenancies, commission summary, referral code |
| 2. Commissions | `/dashboard/agent/commissions` | List commissions (pending/approved/paid) |
| 3. Commission Detail | `/dashboard/agent/commissions/[id]` | Commission breakdown, status timeline |

### Key Hooks

- `useAgentCommissions`, `useAgentCommissionSummary` — Commission tracking
- `useAgentListings` — Assigned listings
- `useRegenerateReferralCode` — Referral management

---

## 8. Affiliate Flow

**Role:** Any authenticated user (affiliate is a module, not a role)
**Portal:** `/dashboard/affiliate`
**Purpose:** Share referral codes, track referrals, earn commissions.

### Journey

```
Get Referral Code → Share → Track Referrals → Request Payout
```

### Steps

| Step | Route | Action |
|------|-------|--------|
| 1. Dashboard | `/dashboard/affiliate` | Referral code (copy), shareable links, stats, earnings |
| 2. Referrals | `/dashboard/affiliate/referrals` | List referrals, conversion status |
| 3. Payouts | `/dashboard/affiliate/payouts` | Payout history, request new payout |

### Key Hooks

- `useAffiliateProfile`, `useUpdateAffiliate` — Affiliate profile
- `useAffiliateReferrals` — Referral tracking
- `useAffiliateEarnings`, `useAffiliatePayouts` — Earnings & payouts
- `useRequestPayout` — Payout requests

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Total Sessions** | 80/80 (100%) |
| **TypeScript Errors** | 0 |
| **Test Files** | 23 |
| **Tests Passing** | 627/627 |
| **Total Hooks** | ~269 |
| **Nav Items** | 93 (across 8 portals + public) |
| **Route Pages** | 115 (excluding reference templates) |
| **Portal Types** | 8 (Platform, Tenant, Vendor, Account, Occupant, Company, Agent, Affiliate) |
| **UI Components** | 58+ shadcn/ui components |
| **Phases Completed** | 8/8 |

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4+ |
| UI Components | shadcn/ui (Radix primitives) |
| Server State | TanStack Query v5+ |
| Client State | Zustand |
| Forms | React Hook Form + Zod |
| Real-time | Socket.IO client |
| Testing | Vitest + Playwright |
| Package Manager | pnpm |
