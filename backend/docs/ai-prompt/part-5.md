# PART 5 — MULTI-TENANCY, VENDOR & OWNERSHIP MODEL (LOCKED)

This part defines how **tenants, vendors, users, and assets** relate to each other.
It is foundational and must be locked before listings, attributes, or vertical logic.

All rules from PART 0–4 apply.

---

## 5.1 TENANCY MODEL (AUTHORITATIVE)

Definitions:
- **Tenant**: An independent marketplace operator (business entity)
- **Platform Owner**: Super-admin operating the entire platform

Rules:
- The system is multi-tenant by design
- Every request (except public endpoints) is tenant-scoped
- Tenant isolation is enforced at:
  - API layer (guards)
  - Service layer (checks)
  - Data layer (queries)

Single-tenant assumptions are forbidden.

---

## 5.2 TENANT LIFECYCLE

Allowed states:
- `active`
- `suspended`
- `deactivated` (soft delete)

Rules:
- Suspended tenants lose access immediately
- Deactivated tenants retain data for audit/compliance
- Lifecycle transitions emit domain events
- Tenant deletion is forbidden (soft delete only)

---

## 5.3 USER ↔ TENANT RELATIONSHIP

Rules:
- Users may belong to one or more tenants
- A user’s role is tenant-scoped
- Cross-tenant privilege escalation is forbidden
- System users must be explicitly marked

Users are identities; authority is contextual to tenant.

---

## 5.4 VENDOR MODEL (CRITICAL)

Definitions:
- **Vendor**: A seller or service provider operating within a tenant

Rules:
- Vendors always belong to exactly one tenant
- A tenant may have many vendors
- Vendors do NOT span tenants
- Vendors may be individuals or companies

Vendors are business actors, not identities.

---

## 5.5 VENDOR LIFECYCLE

Allowed states:
- `pending`
- `approved`
- `rejected`
- `suspended`

Rules:
- Vendors must be approved before publishing listings
- Vendor suspension hides all listings
- Lifecycle transitions emit events
- Vendor compliance checks are externalized

---

## 5.6 OWNERSHIP MODEL

Ownership rules:
- Listings are owned by vendors
- Vendors operate under a tenant
- Assets (media, listings, leads) inherit tenant ownership
- End users never own listings

Ownership chain:
Tenant
└── Vendor
└── Listing
└── Leads / Media / Reviews

yaml
Copy code

Breaking this chain is forbidden.

---

## 5.7 PERMISSION & ACCESS MODEL (HIGH LEVEL)

Rules:
- Permissions are role-based and tenant-scoped
- Vendors can only manage their own assets
- Tenant admins can manage vendors within their tenant
- Platform owner can manage all tenants

Fine-grained permissions are handled by the auth/entitlement layer.

---

## 5.8 DATA ISOLATION & QUERY RULES

Rules:
- Every core table must include `tenant_id`
- Queries must always filter by `tenant_id`
- Background jobs must be tenant-aware
- Search documents must include `tenant_id`

Cross-tenant reads are critical failures.

---

## 5.9 MONETISATION ALIGNMENT

Rules:
- Subscriptions are tenant-level
- Usage limits are tenant-scoped
- Vendor limits derive from tenant entitlements
- Monetisation enforcement occurs upstream

Vendors must not bypass tenant limits.

---

## 5.10 PUBLIC VS PRIVATE CONTEXT

Rules:
- Public endpoints must not leak tenant internals
- Public search must enforce tenant visibility rules
- Public lead capture must resolve tenant safely

Public does not mean tenant-agnostic.

---

## 5.11 FORBIDDEN PRACTICES

You must not:
- Allow vendors across tenants
- Store assets without tenant ownership
- Perform unscoped queries
- Assume a default tenant

---

## 5.12 EXECUTION DIRECTIVE

All future modules must:
- Respect tenant isolation
- Preserve ownership chains
- Enforce vendor boundaries
- Remain monetisation-compatible

Multi-tenancy is not optional. It is the platform’s core constraint.

END OF PART 5.