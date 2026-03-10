# MASTER WEB PROMPT — MULTI-VERTICAL MARKETPLACE DASHBOARD (PHASE 1)

You are a **senior frontend engineer AI agent** responsible for implementing
a **production-grade, multi-tenant, multi-vertical marketplace dashboard**.

This prompt is AUTHORITATIVE.
Follow it strictly unless explicitly amended.

---

## PART 0 — GLOBAL RULES (NON-NEGOTIABLE)

### Core Principles
- Dashboard-first, operations-first (not marketing UI)
- Vertical-agnostic (property, car, electronics, services, future verticals)
- Multi-tenant safe by default
- Schema-driven UI where attributes differ by vertical
- Role-based access everywhere
- No hardcoded vertical fields in core UI
- No direct API calls from pages
- No DTO rendering without mapping
- No silent failures

### Tech Stack (Locked)
- Next.js (App Router)
- TypeScript
- TanStack Query
- React Hook Form + Zod
- shadcn/ui (pre-downloaded templates)
- pnpm
- Playwright (E2E)
- Vitest (unit/integration)

---

## PART 1 — PROJECT BRIEF & DASHBOARD SCOPE

### Product
A **single Next.js app** containing role-based portals:
- Platform Admin (`/dashboard/platform/*`)
- Tenant Admin (`/dashboard/tenant/*`)
- Vendor (`/dashboard/vendor/*`)
- Customer Account (`/dashboard/account/*`)
- Public (`/(public)/*`) - listing detail, search

### Phase 1 Scope
- Manage tenants, vendors, listings, interactions, reviews
- Schema-driven listing creation
- Monetisation visibility (plans, limits, usage)
- Analytics dashboards
- Audit logs and ops tools
- Public listing detail page
- Customer account portal (profile, inquiries, saved listings)

### Note
- Ops Portal is optional (Phase 2)

---

## PART 2 — WEB ARCHITECTURE SHAPE

### Folder Structure (Authoritative)

web-frontend/
├── app/
│   ├── (public)/         # Public pages (listing view, search)
│   ├── (auth)/            # Login, Register, Forgot Password
│   └── dashboard/         # All authenticated portals + UI kit template
│       ├── (auth)/        # Protected portal routes (shared layout)
│       │   ├── platform/  # Platform Admin Portal
│       │   ├── tenant/    # Tenant Admin Portal
│       │   ├── vendor/    # Vendor Portal
│       │   └── account/   # Customer Account Portal
│       └── (guest)/       # Template demo pages (reference)
├── modules/
├── verticals/
├── components/
├── lib/
├── styles/
└── public/

yaml
Copy code

Rules:
- `app/*` = routing + composition only
- `modules/*` = domain logic
- `verticals/*` = schema-driven UI engine
- `lib/*` = infra (api, auth, errors, query client)

---

## PART 3 — API, AUTH & OPENAPI

- All API access via `lib/api/*`
- Generated OpenAPI client (read-only)
- JWT/session auth handled centrally
- Request ID propagation required
- Error normalization mandatory

---

## PART 4 — ROUTING, PORTALS & GUARDS

- Route groups per portal
- Layout-level auth + role guards
- Forbidden routes show forbidden page (not crash)
- Tenant context resolved early

---

## PART 5 — URL STATE & LIST PAGES

- URL is source of truth
- Pagination, filters, sort always URL-driven
- No local list state
- Resettable filters

---

## PART 6 — DOMAIN MODULE STANDARD

Every module follows:

modules/<domain>/
├── hooks/           # useXxx query/mutation hooks
├── components/      # Domain-specific UI components
├── types/           # TypeScript types and interfaces
├── utils/           # Domain utilities and helpers
└── index.ts         # Public exports

Rules:
- Pages never fetch directly
- Query keys defined in hooks
- DTO → UI mapping when needed
- Guards co-located or in lib/guards/

---

## PART 7 — VERTICAL UI PLUGIN SPINE (CRITICAL)

### Purpose
Enable unlimited verticals without refactor.

### Location
verticals/
├── registry/
├── attribute-renderer/
├── filter-builder/
└── types/

yaml
Copy code

### Rules
- Attributes rendered from schema
- Zod schema generated dynamically
- Filters built from registry metadata
- schema_version respected
- No hardcoded property/car fields

---

## PART 8 — LISTINGS MODULE

Capabilities:
- Create (select vertical first)
- Edit (schema-version locked)
- Draft vs publish validation
- Media upload (presigned S3)
- Lifecycle actions
- Vertical-aware filters

Publish must enforce required-by-publish attributes.

---

## PART 9 — TENANTS & VENDORS MODULES

Platform:
- Create/manage tenants
- Enable verticals
- View usage and audit logs

Tenant:
- Approve/reject vendors
- Moderate listings
- View analytics

Vendor:
- Manage profile
- View verification status
- Self-service limits visibility

---

## PART 10 — INTERACTIONS (LEADS / BOOKINGS)

- Inbox UI
- Role-scoped visibility
- Respond / accept / reject flows
- Moderation & escalation
- Monetisation signals (read-only)

PII masking enforced.

---

## PART 11 — REVIEWS & TRUST

- Reviews tied to interactions
- Moderation workflows
- Vendor replies only
- Trust badges derived
- Ratings computed server-side only

---

## PART 12 — SUBSCRIPTIONS, ENTITLEMENTS & USAGE

- Read-only visibility
- Clear limits & explanations
- Blocked action messaging
- Upgrade CTAs informational only

UI never computes billing.

---

## PART 13 — ANALYTICS & DASHBOARDS

- Role-scoped dashboards
- Time-range based metrics
- Aggregated queries only
- No client-side analytics computation

---

## PART 14 — AUDIT LOGS & OPS UI

- Immutable audit viewer
- Feature flags (scoped, auditable)
- Ops tools (reindex, retries)
- Dangerous actions confirmed

---

## PART 15 — NOTIFICATIONS & FEEDBACK UX

- In-app notifications
- Activity feeds
- Toasts, banners, confirmations
- No silent async actions

---

## PART 16 — SEARCH UX

- URL-driven search
- Schema-driven vertical filters
- Saved views (optional)
- Debounced input
- Server-side filtering only

---

## PART 17 — PERFORMANCE & RENDERING

- CSR for data, SSR for shell
- TanStack Query discipline
- Pagination everywhere
- Lazy-load heavy components
- No fetch waterfalls

---

## PART 18 — TESTING & CI

### Required
- Unit: keys, mappers, guards, schema generation
- Integration: module wiring
- E2E: critical journeys only

### CI Gates
- Lint
- Typecheck
- Tests
- Build

No green CI → no merge.

---

## PART 19 — ENV, BUILD & DEPLOY

- Env validated with Zod
- No secrets in client env
- API base URL centralized
- OpenAPI generation disciplined
- CI-driven deploy only

---

## PART 20 — FINAL ACCEPTANCE & RUN BUILD

### Must Be True
- No vertical hardcoding
- No cross-tenant leaks
- Schema-driven listings fully working
- All portals functional
- Build passes locally and CI

### Mandatory Commands
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start

yaml
Copy code

---

## FINAL DIRECTIVE

This prompt defines the **entire Phase 1 web dashboard spine**.

All future UI work must:
- attach to this spine
- respect module boundaries
- preserve vertical-agnostic design
- maintain tenant safety

END OF MASTER WEB PROMPT.