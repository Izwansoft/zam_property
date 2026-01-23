# 🧠 MASTER BACKEND SPINE PROMPT
## Vertical-Agnostic Multi-Tenant Marketplace Platform
## (Property, Vehicles, Rentals, Services, Goods & Future Verticals)

This document is the **single source of truth** for backend architecture.
All AI agents, developers, and systems MUST follow this document.

Deviation requires explicit spine amendment.

---

# PART 0 — GLOBAL RULES & SPINE AUTHORITY

- This is a **spine architecture**
- Order matters
- Later parts may extend, never contradict earlier parts
- Core > Vertical > Infrastructure is a one-way dependency
- Multi-tenant, monetised, vertical-agnostic by design
- NestJS + PostgreSQL + Prisma + Redis + BullMQ + OpenSearch
- pnpm is mandatory
- OpenAPI / Swagger is mandatory
- Event-driven internal communication
- No Laravel patterns, no fat controllers, no god services

---

# PART 1 — PROJECT BRIEF

Build a **multi-tenant marketplace platform** capable of supporting:
- Property selling & rental
- Vehicle selling & rental
- Services & bookings
- Goods & electronics
- Future business verticals without refactor

The platform is:
- Vendor-driven
- Tenant-owned
- Monetised via subscription, usage, commission, and add-ons
- API-first (web, mobile, partners)

---

# PART 2 — SYSTEM SHAPE & ARCHITECTURE

- Modular monolith
- Event-driven internals
- Clear domain boundaries
- No cross-domain mutation
- Async side effects only

Domains communicate via **events**, not direct calls.

---

# PART 3 — REPO, TOOLING & BASELINE

- Monorepo
- pnpm workspace
- NestJS (Node 20+)
- Prisma ORM
- PostgreSQL
- Redis (cache + BullMQ)
- OpenSearch
- S3 compatible storage
- Nginx + Cloudflare
- GitHub Actions CI/CD
- Swagger generated from code

---

# PART 4 — CORE PLATFORM DOMAINS (PERMANENT)

Core domains (never vertical-specific):

- Auth & Identity
- Users
- Tenants
- Vendors
- Listings (generic)
- Media & Assets
- Interactions (Leads / Bookings)
- Reviews & Trust
- Search Core
- Notifications
- Subscriptions
- Entitlements
- Usage Tracking
- Analytics
- Audit Logs

Core NEVER depends on verticals.

---

# PART 5 — TENANCY, VENDOR & OWNERSHIP MODEL

Ownership chain (immutable):

Tenant  
└── Vendor  
  └── Listing  
    ├── Media  
    ├── Leads / Bookings  
    └── Reviews  

Rules:
- Everything is tenant-scoped
- Vendors belong to exactly one tenant
- Users may belong to multiple tenants
- Soft deletes only

---

# PART 6 — GENERIC LISTING ENGINE

Single listing engine for all verticals.

Mandatory fields:
- id
- tenant_id
- vendor_id
- vertical_type (immutable)
- status
- title
- description
- price
- currency
- location
- attributes (JSONB)
- timestamps

Lifecycle:
draft → published → expired → archived

Core treats attributes as opaque.

---

# PART 7 — ATTRIBUTE ENGINE & VALIDATION

- Attributes stored as JSONB
- Schema defined per vertical
- Versioned schemas
- Validation delegated to vertical modules
- Required attributes may vary by status
- Search metadata defined per attribute

No unvalidated JSON allowed.

---

# PART 8 — VERTICAL MODULE CONTRACT

Verticals are **plug-ins**, not domains.

Each vertical provides:
- vertical_type registration
- attribute schemas
- validation rules
- search mappings
- optional workflows & hooks

Verticals:
- No DB access
- No controllers
- No repositories
- No core overrides

---

# PART 9 — SEARCH ARCHITECTURE

- OpenSearch
- Event-driven indexing
- Async, idempotent jobs
- Tenant-scoped documents
- Vertical-aware mappings
- Index versioning mandatory

Search is a mirror, not a brain.

---

# PART 10 — MEDIA & ASSETS

- S3 compatible object storage
- Presigned uploads
- CDN delivery
- Async processing
- Media metadata in DB
- Ownership enforced

No blobs in database.

---

# PART 11 — LEADS, ENQUIRIES & BOOKINGS

Generic interaction model:
- Lead
- Enquiry
- Booking request

Rules:
- Append-only records
- Minimal PII
- Event-driven
- Monetisation hooks via events only

---

# PART 12 — REVIEWS & TRUST

- Reviews tied to interactions
- Moderation supported
- Trust signals computed
- Ratings influence discovery
- Anti-abuse mandatory

Trust is never purchasable.

---

# PART 13 — NOTIFICATIONS

- Email, Push, WhatsApp, In-app
- Event-driven
- Template-based
- Tenant-aware
- Async delivery
- Preference & opt-out support

Notifications never block logic.

---

# PART 14 — WORKFLOWS & STATE MACHINES

- Explicit states
- Valid transitions only
- Event emission mandatory
- Resumable, idempotent
- Vertical extensions allowed (without breaking invariants)

If you can’t diagram it, you can’t build it.

---

# PART 15 — API DESIGN & OPENAPI

- REST only
- Versioned APIs
- DTOs only
- Stable error contracts
- Pagination mandatory
- Idempotency keys supported
- Swagger mandatory

APIs are promises.

---

# PART 16 — SUBSCRIPTIONS & PLANS

- Tenant-level subscriptions
- Declarative plans
- Vertical-aware allowances
- Feature flags & add-ons
- No billing logic in domains

---

# PART 17 — ENTITLEMENTS & ENFORCEMENT

- Single gatekeeper
- Declarative policies
- Enforced via guards/interceptors
- Cached, deny-safe
- Vertical-aware

Domains assume entitlements already enforced.

---

# PART 18 — USAGE TRACKING

- Async counters
- Tenant & vertical scoped
- Period-based resets
- Threshold events
- Observational, not authoritative

---

# PART 19 — BILLING ADAPTERS

- Providers as adapters
- Event-driven
- Webhooks verified & idempotent
- Replaceable providers
- No payment data stored

Billing never grants access directly.

---

# PART 20 — PRICING MODELS

Supported:
- SaaS subscription
- Pay-per-lead
- Commission
- Listing-based
- Add-ons / boosts

Pricing is configuration, not code.

---

# PART 21 — ANALYTICS & REPORTING

- Event-derived
- Async ingestion
- Tenant-isolated
- Pre-aggregated metrics
- No OLTP blocking

Analytics inform, not enforce.

---

# PART 22 — AUDIT & COMPLIANCE

- Append-only
- Immutable
- Tenant-aware
- Admin actions audited
- Retention & export supported

If it isn’t audited, it didn’t happen.

---

# PART 23 — ADMIN & BACKOFFICE

- Platform admin
- Tenant admin
- Ops/support roles
- Safe overrides
- No rule bypass
- Separate admin APIs

Power must be visible.

---

# PART 24 — FEATURE FLAGS & EXPERIMENTS

- Tenant-scoped
- Vertical-scoped
- Percentage rollouts
- Kill switches
- Audited changes

Change must be reversible.

---

# PART 25 — INFRASTRUCTURE & DEPLOYMENT

- Docker everywhere
- CI/CD mandatory
- Environment isolation
- Observability built-in
- Disaster recovery planned

No snowflake servers.

---

# PART 26 — TESTING & RELEASE DISCIPLINE

- Testing pyramid enforced
- Quality gates mandatory
- Versioned releases
- No broken pipelines
- Regression culture

Fast teams ship safely.

---

# 🧭 FINAL DIRECTIVE

This spine enables:
- Unlimited future verticals
- Clean monetisation
- Enterprise-grade governance
- Long-term scalability

All development MUST align to this spine.

END OF MASTER PROMPT
