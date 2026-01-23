# FRONTEND (WEB) — PART 5 — UI COMPOSITION MODEL, LAYOUTS, NAVIGATION & DASHBOARD PATTERNS (LOCKED)

This part defines how we build pages consistently using the downloaded Shadcn UI Kit:
- layouts and shells
- navigation trees per portal
- page composition patterns
- tables, filters, detail views, action bars
- feedback states and UX conventions

All rules from WEB PART 0–4 apply fully.

---

## 5.1 UI PHILOSOPHY (DASHBOARD-FIRST)

Rules:
- Consistency beats creativity
- Operations UI must be:
  - fast
  - predictable
  - information-dense
  - safe for destructive actions
- Every page must communicate:
  - where you are
  - what you can do
  - what happens next

We reuse the kit’s components and styling primitives.

---

## 5.2 LAYOUT LAYERS (AUTHORITATIVE)

We use 3 layout layers:

### A) Root Layout (`app/layout.tsx`)
- theme, fonts, global providers
- no portal-specific logic
- no auth logic beyond bootstrap

### B) Portal Layouts (`/platform/layout.tsx`, `/tenant/layout.tsx`, `/vendor/layout.tsx`)
- enforce guards (from WEB PART 4)
- provide navigation shell (sidebar/topbar)
- provide portal-level context (portal name, tenant context)
- mount query providers if needed

### C) Page-Level Composition (per route)
- uses standard page templates and sections (below)
- no bespoke layout inventions

---

## 5.3 NAVIGATION TREES (PORTAL-SCOPED)

Each portal has its own nav tree.
Nav trees are defined centrally per portal (single source).

Rules:
- Navigation items are filtered by RBAC + entitlements
- Nav must not show actions the user cannot access
- Deep links must still be guarded (nav hiding ≠ security)

### Platform Admin Nav (baseline)
- Overview / Dashboard
- Tenants
- Plans & Pricing (view/config)
- Feature Flags
- Global Analytics
- Global Audit Logs
- Ops Tools (jobs, reindex)
- Support / Escalations (optional)

### Tenant Admin Nav (baseline)
- Overview / Dashboard
- Vendors (approval + management)
- Listings (moderation + lifecycle)
- Interactions (leads/bookings)
- Reviews (moderation)
- Usage & Limits
- Analytics
- Audit Logs
- Settings (tenant config)

### Vendor Nav (baseline)
- Overview / Dashboard
- Listings (create/edit/publish)
- Inbox (leads/bookings)
- Media Library (optional if separate)
- Performance (analytics-lite)
- Profile & Verification
- Plan / Limits (read-only)

---

## 5.4 STANDARD PAGE TYPES (AUTHORITATIVE)

All pages must use one of these patterns:

### A) List Page (Index)
- Header: title + breadcrumb
- Action bar: primary action(s) + quick actions
- Filters row: search + filter chips + sort
- Table: paginated, selectable rows (optional)
- Bulk actions (optional, permissioned)
- Footer: pagination + total count

### B) Detail Page
- Header: entity title + status badge + key actions
- Tabs or sections:
  - Overview
  - Related items (listings, leads, audit)
  - Activity timeline (optional)
- Right rail (optional): quick metadata, support actions
- Safe destructive actions with confirmation

### C) Create/Edit Form Page
- Header: title + status
- Form sections grouped logically
- Inline validation errors
- Sticky action bar:
  - Save draft
  - Save
  - Publish (if allowed)
- Cancel returns to last safe page

### D) Moderation/Decision Page
- Evidence section
- Decision controls (approve/reject/escalate)
- Audit notes (required for destructive/deny)
- Confirmation dialog
- Outcome feedback

---

## 5.5 TABLE & FILTER PATTERNS (LOCKED)

Tables:
- Must support pagination (mandatory)
- Column definitions must be centralized in the module
- Sort must be explicit and reflected in URL params
- Empty state must be informative and actionable

Filters:
- Use query string as the source of truth
- Filters must be shareable via URL
- Reset filters must be a single action
- Vertical-specific filters must come from vertical filter builder (WEB verticals/*)

No hidden state filters that can’t be shared or restored.

---

## 5.6 STATUS & BADGE SYSTEM

Rules:
- Standardized badges for statuses:
  - active/suspended/deactivated
  - pending/approved/rejected
  - draft/published/expired/archived
  - past_due/cancelled/active (subscriptions)
- Status colors must match template conventions
- Status display logic lives in shared presentational components

No ad-hoc status styling per page.

---

## 5.7 FEEDBACK STATES (MANDATORY EVERYWHERE)

Every screen must define:
- Loading state (skeletons preferred)
- Empty state (with CTA)
- Error state (with retry + requestId if available)
- Success feedback (toast + inline when appropriate)

Destructive actions:
- must confirm
- must show irreversible warning
- must log audit note when required by backend

---

## 5.8 URL & ROUTING CONVENTIONS

Rules:
- List views use URL params:
  - `page`, `pageSize`, `q`, `sort`, `filters`
- Detail views use route params:
  - `/tenants/[tenantId]`
- Nested resources use nested routes:
  - `/tenants/[tenantId]/vendors`
- Tabs are represented as:
  - query param `tab=` OR
  - nested route segments (pick one consistently per module)

Consistency is mandatory.

---

## 5.9 COMPONENT OWNERSHIP RULES

Rules:
- Presentational components live in `components/`
- Domain-specific components live in `modules/<domain>/components/`
- Forms live in `modules/<domain>/forms/`
- Table columns, filter configs, and view-model adapters live in the domain module
- Vertical schema-driven rendering lives in `verticals/`

No component should be “global” unless reused across 2+ domains.

---

## 5.10 DESIGN SYSTEM RULES (USING THE KIT)

Rules:
- Use existing typography scale and spacing tokens
- Use existing shadcn components from the kit
- Avoid introducing new design primitives
- Keep dashboards cohesive visually

We are optimizing delivery and consistency.

---

## 5.11 FORBIDDEN PRACTICES

You must not:
- Build bespoke page layouts per screen
- Use non-URL filter state for list pages
- Skip loading/empty/error states
- Mix portal navigation items
- Implement vertical-specific fields in core listing pages

---

## 5.12 EXECUTION DIRECTIVE

All web UI must:
- Use standard page patterns
- Reuse the template components
- Keep navigation portal-scoped
- Be consistent, safe, and operationally clear

END OF WEB PART 5.