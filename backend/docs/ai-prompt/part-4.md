# PART 4 — CORE PLATFORM DOMAINS (NON-VERTICAL, PERMANENT) (LOCKED)

This part defines the **core platform domains**.
These domains are **vertical-agnostic** and **never change** regardless of business type.

All vertical modules depend on these domains.
These domains must NEVER depend on vertical modules.

All rules from PART 0–3 apply.

---

## 4.1 CORE DOMAIN PRINCIPLE

Core platform domains:
- Represent platform capabilities, not industries
- Are shared by all verticals
- Must contain ZERO business-specific assumptions
- Must remain stable over time

If a domain contains words like:
- property
- car
- electronics
- service type

…it does NOT belong here.

---

## 4.2 AUTHORITATIVE LIST OF CORE DOMAINS

The platform MUST include the following core domains:

### 1️⃣ Auth & Identity
- Authentication
- Token management
- Identity verification
- Session / token lifecycle

Verticals must never handle auth.

---

### 2️⃣ Users
- User profiles
- User status
- Role assignment (not permissions)

Users are platform identities, not business entities.

---

### 3️⃣ Tenants
- Tenant lifecycle
- Tenant status (active/suspended)
- Tenant metadata

Tenants represent marketplace operators.

---

### 4️⃣ Vendors
- Vendor profiles
- Vendor onboarding
- Vendor-to-tenant association

Vendors represent sellers / service providers.

---

### 5️⃣ Listings (Core Engine)
- Generic listing lifecycle
- Status (draft, published, expired)
- Price, title, description
- Attribute container (opaque to core)

Core listings know nothing about vertical attributes.

---

### 6️⃣ Media & Assets
- File metadata
- Ownership references
- Lifecycle (upload, soft-delete, cleanup)

Media processing is vertical-agnostic.

---

### 7️⃣ Leads / Bookings Core
- Lead capture
- Booking requests
- Enquiry lifecycle

Verticals may extend behavior but not redefine it.

---

### 8️⃣ Reviews & Trust
- Ratings
- Reviews
- Trust indicators

Trust is platform-wide, not vertical-specific.

---

### 9️⃣ Search Core
- Search orchestration
- Query routing
- Ranking coordination

Search logic must be abstracted from verticals.

---

### 🔟 Notifications
- Email
- Push
- WhatsApp / SMS
- Templates & channels

Delivery logic is shared.

---

### 1️⃣1️⃣ Subscriptions & Plans
- Subscription records
- Plan association
- Billing state (abstract)

No billing provider logic here.

---

### 1️⃣2️⃣ Entitlements
- Feature access resolution
- Limit enforcement
- Capability checks

This is the monetisation gatekeeper.

---

### 1️⃣3️⃣ Usage Tracking
- Counters
- Quotas
- Period resets

Usage is tenant-scoped and vertical-aware.

---

### 1️⃣4️⃣ Analytics & Reporting
- Aggregations
- KPIs
- Tenant-level metrics

Analytics must never block core flows.

---

### 1️⃣5️⃣ Audit Logs
- Security events
- State changes
- Compliance trails

Audit logs are append-only.

---

## 4.3 CORE DOMAIN LOCATION & STRUCTURE

All core domains live under:

apps/api/src/core/

yaml
Copy code

Each core domain must follow:
- Clear module boundary
- Controller → Service → Repository discipline
- No vertical imports
- Event-driven extensibility

---

## 4.4 CORE DOMAIN DEPENDENCY RULES

Rules:
- Core domains may depend on:
  - infrastructure
  - shared utilities
- Core domains must NOT depend on:
  - vertical modules
  - vertical attribute schemas
  - vertical validation rules

Dependency direction is one-way:
verticals → core
NEVER core → verticals

yaml
Copy code

---

## 4.5 EXTENSION POINTS FOR VERTICALS

Core domains must expose:
- Hooks
- Events
- Interfaces
- Registries

Verticals attach behavior via:
- Event handlers
- Registrations
- Contracts

Monkey-patching or overriding core logic is forbidden.

---

## 4.6 CORE DOMAIN STABILITY RULE

Rules:
- Core domains evolve slowly
- Breaking changes require new API versions
- Vertical requirements must not force core redesign

If a vertical needs a change:
- Add extension
- Do not mutate core behavior

---

## 4.7 FORBIDDEN PRACTICES

You must not:
- Put vertical logic in core
- Add vertical flags in core tables
- Hardcode vertical assumptions
- Shortcut through core from verticals

---

## 4.8 EXECUTION DIRECTIVE

All future design must:
- Respect this core/vertical separation
- Keep core domains clean and generic
- Treat core as platform infrastructure

Core domains are the foundation. Protect them.

END OF PART 4.