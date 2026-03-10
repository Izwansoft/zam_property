# FRONTEND (WEB) — PART 1 — PROJECT BRIEF, DASHBOARD SCOPE & ROLES (AUTHORITATIVE)

This part defines **what we are building first** on the web frontend.
It is business-facing but architecturally precise.

All rules from WEB PART 0 apply fully.

---

## 1.1 WEB PRODUCT VISION (PHASE 1)

Phase 1 delivers a **Management Dashboard** for a:
**Vertical-Agnostic, Multi-Tenant Marketplace Platform**

This dashboard enables platform operations for:
- onboarding tenants and vendors
- managing listings (multi-vertical)
- managing monetisation access (entitlements/usage)
- monitoring operations (audit, analytics, jobs)
- supporting marketplace quality (reviews/moderation)

Phase 1 is operational-first, not marketing-first.

---

## 1.2 PRIMARY GOALS (PHASE 1)

The dashboard must:
- Support multiple roles with strict access boundaries
- Operate safely in multi-tenant context
- Manage listings without vertical hardcoding
- Render dynamic listing forms from backend schemas
- Provide auditability and operational tooling
- Validate the backend spine through real workflows

---

## 1.3 OUT OF SCOPE (PHASE 1)

Explicitly out of scope unless amended later:
- Full SEO landing pages (marketing)
- Consumer checkout/payment UX
- Chat systems
- Social/community features
- Ops Portal (moved to Phase 2)

Note: Public listing detail page and basic search ARE in scope.

---

## 1.4 ROLE PORTALS (AUTHORITATIVE)

The web app contains **role-based portals** within a single Next.js app:

### A) Platform Admin Portal
Purpose: Operate the entire platform across all tenants.

Key capabilities:
- Tenant management (create/suspend/configure)
- Subscription plans & pricing configuration (high-level UI)
- Feature flags / vertical enablement controls
- Global audit logs & analytics
- Job/reindex controls and operational tools
- Support escalation tools

Route namespace:
- `/dashboard/platform/*`

---

### B) Tenant Admin Portal
Purpose: Operate a single tenant marketplace.

Key capabilities:
- Vendor approvals and management
- Listing moderation and lifecycle actions
- Tenant settings (branding, vertical enablement within allowed scope)
- Tenant analytics and usage view
- Review moderation workflows
- Access control (tenant-scoped roles)

Route namespace:
- `/dashboard/tenant/*`

---

### C) Vendor Portal
Purpose: Vendors manage their own listings and leads.

Key capabilities:
- Vendor profile and verification status
- Listings CRUD (schema-driven forms)
- Media management for listings
- Leads/enquiries/booking requests inbox
- Performance insights (limited analytics)
- Subscription/limits visibility (as allowed)

Route namespace:
- `/dashboard/vendor/*`

---

### D) Customer Account Portal
Purpose: Customers manage their profile and activity.

Key capabilities:
- Profile management
- Inquiry history (sent inquiries)
- Saved/favorited listings
- Reviews written by customer
- Notification preferences
- Account settings

Route namespace:
- `/dashboard/account/*`

---

### E) Public Pages
Purpose: Public-facing pages for unauthenticated users.

Key capabilities:
- Listing detail view
- Search/browse listings
- Inquiry form (leads to login/register)

Route namespace:
- `/(public)/*`

---

### F) Support/Ops Portal (Optional - Phase 2)
Purpose: Operational troubleshooting without full platform admin power.

Key capabilities:
- Read-only diagnostics
- Issue triage
- Tenant support tools (scoped)
- Job inspection (scoped)

Route namespace:
- `/ops/*`

---

## 1.5 CORE DASHBOARD MODULES (PHASE 1)

These modules must exist (UI-facing), aligned with backend core domains:

- Auth & Session
- Tenant Context Resolver / Switcher (where applicable)
- Users & Roles UI (scoped by portal)
- Tenants Management (platform)
- Vendors Management (platform + tenant)
- Listings Management (platform + tenant + vendor)
- Attribute Schema Registry UI (invisible to users; used by listing forms)
- Search UI (tenant-scoped; vertical filters)
- Interactions Inbox (leads/enquiries/bookings)
- Reviews & Moderation UI
- Notifications log view (optional)
- Subscriptions / Plans view (tenant-facing)
- Entitlements & Limits view
- Usage dashboards
- Analytics dashboards
- Audit log viewer
- Feature flags management (platform + tenant scope)
- Operational tools (reindex, job retries) (platform only)

---

## 1.6 KEY UX PRINCIPLES (DASHBOARD)

Rules:
- No dead-end screens: always provide clear next actions
- Every list view must have:
  - pagination
  - search/filter
  - empty states
  - error states
- Every write action must have:
  - success feedback
  - error feedback
  - retry strategy where possible
- Forms must support:
  - draft saving
  - validation feedback (field-specific)
  - optimistic UX where safe

---

## 1.7 VERTICAL-AGNOSTIC LISTING UX (MANDATORY)

Listing UI must:
- Allow selection of `vertical_type` at creation time
- Fetch schema for the selected vertical
- Render dynamic form fields from schema
- Validate using Zod derived from schema
- Store attributes payload exactly as required by backend

No property/car-specific hardcoding is allowed in core listing pages.

---

## 1.8 SUCCESS CRITERIA (PHASE 1)

Phase 1 is successful if:
- Platform Admin can onboard tenants and configure vertical availability
- Tenant Admin can approve vendors and manage marketplace content
- Vendor can create/publish listings via schema-driven forms
- Leads/enquiries flow is visible and manageable
- Search and filters work tenant-safely
- Audit logs show critical actions
- Entitlements and usage limits are visible and enforced in UI

---

## 1.9 EXECUTION DIRECTIVE

All subsequent web parts must:
- Preserve single-app role portal strategy
- Respect backend OpenAPI contracts
- Stay vertical-agnostic in core
- Use schema-driven listing UI

END OF WEB PART 1.