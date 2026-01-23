# PART 6 — GENERIC LISTING ENGINE (POLYMORPHIC CORE) (LOCKED)

This part defines the **Generic Listing Engine**.
It is the shared abstraction used by ALL business verticals.

All rules from PART 0–5 apply.

---

## 6.1 LISTING ENGINE PURPOSE

The Listing Engine:
- Represents anything that can be listed in the marketplace
- Is agnostic to business type
- Supports multiple verticals via attributes
- Is the single source of truth for listing lifecycle

There must be exactly ONE listing engine.

---

## 6.2 LISTING IDENTITY

Each listing has:
- A globally unique ID
- A tenant owner
- A vendor owner
- A vertical type identifier

Rules:
- Listing IDs are immutable
- Vertical type is immutable after creation
- Listings may not change verticals

---

## 6.3 LISTING CORE FIELDS (MANDATORY)

Every listing must include:

- `id`
- `tenant_id`
- `vendor_id`
- `vertical_type`
- `status` (draft, published, expired, archived)
- `title`
- `description`
- `price`
- `currency`
- `location` (structured, optional)
- `attributes` (JSONB, opaque to core)
- `created_at`
- `updated_at`

No vertical-specific fields are allowed here.

---

## 6.4 LISTING LIFECYCLE (CORE)

Allowed transitions:
- create → draft
- draft → published
- published → expired
- published → archived
- expired → archived

Rules:
- Invalid transitions must be rejected
- State transitions must be explicit
- All transitions emit domain events
- Lifecycle enforcement is centralized

---

## 6.5 ATTRIBUTE HANDLING RULES

Rules:
- Attributes are stored as JSONB
- Core treats attributes as opaque
- Core does not validate attribute semantics
- Core only validates presence (if required)

Validation is delegated to vertical modules.

---

## 6.6 VERTICAL TYPE RESOLUTION

Rules:
- `vertical_type` is a string identifier (e.g. real_estate, vehicles)
- Vertical types must be registered at startup
- Unknown vertical types are rejected
- Vertical modules declare supported types

Core must not hardcode vertical names.

---

## 6.7 LISTING VISIBILITY

Rules:
- Visibility depends on listing status
- Draft listings are never public
- Published listings may be public
- Expired and archived listings are not public

Visibility flags may be extended by verticals via metadata.

---

## 6.8 LISTING EVENTS (MANDATORY)

Core listing events include:
- ListingCreated
- ListingUpdated
- ListingPublished
- ListingExpired
- ListingArchived

Rules:
- Events are emitted after persistence
- Events include tenant_id, vendor_id, vertical_type
- Events contain no business logic

---

## 6.9 OWNERSHIP & ACCESS CONTROL

Rules:
- Vendors may only manage their own listings
- Tenant admins may manage all listings under their tenant
- Platform admins may manage all listings
- End users never manage listings

Authorization is enforced upstream.

---

## 6.10 SEARCH & INDEXING AWARENESS

Rules:
- Listing engine does not index search data
- Listing events drive indexing asynchronously
- Core does not depend on OpenSearch

Search is a consumer, not a dependency.

---

## 6.11 MONETISATION AWARENESS

Rules:
- Listing engine does not enforce plan limits
- Limits are enforced upstream via entitlements
- Listing events may trigger usage tracking

Core remains monetisation-agnostic.

---

## 6.12 DATA INTEGRITY RULES

Rules:
- Tenant/vendor references must exist
- Soft deletes only
- No cascading deletes
- Referential integrity enforced at DB level

---

## 6.13 FORBIDDEN PRACTICES

You must not:
- Add vertical-specific fields to listings
- Validate business-specific attributes in core
- Embed monetisation logic
- Call vertical code from core

---

## 6.14 EXECUTION DIRECTIVE

All vertical modules must:
- Use this listing engine
- Extend behavior via attributes, validation, and events
- Never bypass the core lifecycle

The listing engine is the heart of the platform. Protect it.

END OF PART 6.