# Zam-Property - Super Admin IA Benchmark

> Status: Proposed canonical IA for partner drill-down and platform sidebar.
> Purpose: Prevent navigation and hierarchy drift during implementation.

---

## 1. Domain Taxonomy (Source of Truth)

Use this taxonomy consistently across backend, frontend labels, and routing.

1. Identity and Access
- User accounts, roles, invitations, access audits.
- Roles include `SUPER_ADMIN`, `PARTNER_ADMIN`, `COMPANY_ADMIN`, `AGENT`, `VENDOR_ADMIN`, `VENDOR_STAFF`, `CUSTOMER`, `TENANT`.

2. Ecosystem (Supply Side)
- `Vendor` (property owner/supplier)
- `Company` (agency/intermediary)
- `Agent` (company agent or independent)

3. Demand Side
- `Customer` and `Tenant` are consumer-side users.
- They are not ecosystem operators and should not be mixed into supply-side pages.

4. Commercial and Operations
- Listings, moderation, assignment, transactions, payouts, commissions.

---

## 2. Partner Drill-Down IA (Platform Super Admin)

Route base: `/dashboard/platform/partners/[id]`

Top-level tabs should be:

1. `Overview`
2. `Access`
3. `Ecosystem`
4. `Listings`
5. `Finance`
6. `Settings`

### 2.1 Access (under partner)
- Users
- Roles (custom partner roles)
- Invitations
- Access Audit

### 2.2 Ecosystem (under partner)
- Vendors
- Companies
- Agents
- Independent Agents (saved filter, `companyId = null`)
- Relationships (graph/table view)

### 2.3 Listings (under partner)
- All Listings
- Moderation
- Assignment
- Performance

### 2.4 Finance (under partner)
- Partner billing oversight
- Subscription/plan assignment visibility
- Entitlement and pricing references

Note:
- Partner operational finance (`transactions`, `payouts`, tenancy collections) belongs to partner scope portals, not platform super-admin partner drill-down.

---

## 3. Customer Placement Rule

Customer belongs to partner tenancy scope, but not to ecosystem supply hierarchy.

Rules:

1. `Customer` and `Tenant` live under Access/Users segmentation (or a dedicated Customers section).
2. `Vendor`, `Company`, `Agent` live under Ecosystem.
3. Never merge customer tables with ecosystem management tables.

---

## 4. Super Admin Sidebar (Platform) - Recommended

Route base: `/dashboard/platform/*`

Use this sequence to reduce cognitive load:

1. Dashboard
2. Partners
3. Access
4. Ecosystem
5. Listings
6. Finance
7. Governance
8. Platform Settings

### 4.1 Suggested sidebar tree

1. `Dashboard`
- `/dashboard/platform`

2. `Partners`
- `/dashboard/platform/partners`
- `/dashboard/platform/partners/[id]`

3. `Access`
- `/dashboard/platform/users`
- `/dashboard/platform/roles` (new)
- `/dashboard/platform/invitations` (new)

4. `Ecosystem`
- `/dashboard/platform/vendors`
- `/dashboard/platform/companies`
- `/dashboard/platform/agents`
- `/dashboard/platform/verticals`

5. `Listings`
- `/dashboard/platform/listings`
- `/dashboard/platform/listings/moderation`

6. `Finance`
- `/dashboard/platform/billing`
- `/dashboard/platform/subscriptions`
- `/dashboard/platform/pricing`

7. `Governance`
- `/dashboard/platform/audit`
- `/dashboard/platform/jobs`

8. `Platform Settings`
- `/dashboard/platform/settings`
- `/dashboard/platform/feature-flags`
- `/dashboard/platform/experiments`

### 4.2 Explicitly excluded from super-admin navigation

These routes are partner-operational and are blocked in platform scope:

- `/dashboard/platform/tenancies`
- `/dashboard/platform/transactions`
- `/dashboard/platform/payouts`
- `/dashboard/platform/partners/[id]/transactions`
- `/dashboard/platform/partners/[id]/payouts`

---

## 5. Naming and Labeling Rules

1. Use `Partners` in UI (not mixed with Tenants unless migration is complete).
2. Use `Companies` for agencies/intermediaries.
3. Show agent affiliation badges:
- `Company Agent`
- `Independent`
4. Listing ownership labels must be explicit:
- `Vendor Listed`
- `Agent Listed`
- `Company Managed`

---

## 6. Guardrails for Production Grade

1. Block deleting company with active agents.
2. Block suspending entities with active tenancies unless override reason is provided.
3. Require reason + audit event for role changes and suspension/reactivation.
4. Add integrity widgets on Partner Overview:
- listings without assignee
- agents without company
- pending verifications

---

## 7. Implementation Order

1. Align partner tabs to benchmark taxonomy.
2. Add route aliases/groups for Access, Ecosystem, Listings, Finance.
3. Move existing pages into grouped sections without breaking API contracts.
4. Add missing global routes (`roles`, `invitations`) as governance features.
5. Update navigation config and breadcrumbs.

---

## 8. Current Implementation Status (March 2026)

1. Completed
- Platform sidebar regrouped to governance/billing boundaries.
- Partner overview cards route to grouped tabs (`access`, `ecosystem`, `finance`).
- Partner finance landing now routes to platform billing/subscription/pricing governance views.
- Edge proxy and platform layout guards block partner-operational platform routes.
- Partner tab active matching no longer treats `transactions` and `payouts` as finance destinations.

2. Remaining
- Continue migrating legacy pages into partner-scope portals where required.
- Add first-class `roles` and `invitations` platform pages.
