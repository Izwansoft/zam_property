# FRONTEND (WEB) — PART 8 — LISTINGS DASHBOARD MODULE (ALL PORTALS) (LOCKED)

This part defines the Listings UI across Platform Admin, Tenant Admin, and Vendor portals:
- list views
- detail views
- create/edit flows
- publish lifecycle actions
- schema-driven attributes integration (WEB PART 7)
- media upload integration (S3 presigned flow)

All rules from WEB PART 0–7 apply fully.

---

## 8.1 LISTINGS UI PHILOSOPHY

Listings are the platform’s core object.
The UI must support:
- high-volume listing management
- moderation and lifecycle control
- multi-vertical listing creation without hardcoding fields
- safe operations and auditability

---

## 8.2 LISTINGS MODULE OWNERSHIP

Domain module:
- `modules/listings/*` owns all listing queries, mutations, mappers, forms

Vertical plugin:
- `verticals/*` provides schema-driven attributes UI and filter builder

Rules:
- Listing pages use `modules/listings` + `verticals` plugins
- Listing pages must not call registry endpoints directly (verticals layer does)

---

## 8.3 PORTAL CAPABILITIES (AUTHORITATIVE)

### Vendor portal (`/vendor/listings`)
- Create listing (choose vertical_type)
- Edit listing (core + attributes)
- Manage media
- Publish / unpublish (if allowed by entitlements)
- View listing performance (lite)
- View listing status + validation issues

### Tenant portal (`/tenant/listings`)
- View all listings in tenant
- Moderate listings (approve, reject, archive, unpublish)
- Enforce tenant policies (within backend contract)
- View listing audit trail
- Bulk actions (optional, permissioned)

### Platform portal (`/platform/.../listings` optional in Phase 1)
- Cross-tenant listing inspection (read-only unless explicit permission)
- Support escalation tools (force reindex, visibility checks)

Rules:
- Each portal is gated by RBAC + entitlements
- UI must show only actions allowed for that portal

---

## 8.4 LISTINGS LIST PAGE (STANDARD)

List page must include:
- Search bar (q)
- Filters (schema-driven when vertical selected)
- Vertical selector (optional; must filter registry to enabled verticals)
- Status filter (draft/published/expired/archived)
- Sort options (from search mapping metadata)
- Paginated table

Table columns (baseline):
- Title
- Vertical badge
- Status badge
- Price
- Location (short)
- Vendor (tenant/platform portals)
- Updated at
- Quick actions (view/edit)

Rules:
- Filters are URL-driven (WEB PART 5)
- Vertical-specific filters come from FilterBuilder (WEB PART 7)
- Pagination is mandatory

---

## 8.5 LISTING DETAIL PAGE (STANDARD)

Detail page sections:
- Header: title + status badge + vertical badge
- Action bar: edit, publish, archive, reindex (as allowed)
- Tabs:
  - Overview (core fields + attributes)
  - Media
  - Interactions (leads/bookings)
  - Reviews (if applicable)
  - Audit (tenant/platform)
  - Technical (optional: schema_version, validation status)

Rules:
- Attributes displayed using the same schema metadata (read mode renderer)
- Technical fields are not shown to vendors unless needed

---

## 8.6 CREATE LISTING FLOW (VENDOR-FIRST)

Create flow is a guided process:

Step 1: Select `vertical_type`
- Only enabled verticals for the tenant
- Show description and example fields (from registry metadata)

Step 2: Core Fields
- title, description, price, currency, location (as required by backend)

Step 3: Attributes Fields (schema-driven)
- rendered using AttributeRenderer
- validation from generated Zod schema

Step 4: Media Upload (optional)
- presigned upload flow
- attach media IDs to listing

Step 5: Save Draft
- always allowed if entitlement permits listing creation
- publish is a separate explicit action

Rules:
- vertical_type becomes immutable after create
- schema_version is captured at create time

---

## 8.7 EDIT LISTING FLOW

Edit page must:
- load listing detail
- resolve vertical schema using listing.vertical_type + schema_version
- render core + attributes with current values
- allow saving as draft or updating published listing (per backend rules)
- surface server validation errors mapped to form fields

Rules:
- Cannot change vertical_type
- Must respect status-based validation (draft vs publish)

---

## 8.8 PUBLISH / LIFECYCLE ACTIONS

Supported actions (depending on backend contract):
- Publish
- Unpublish
- Archive
- Restore (optional)
- Expire (system driven)
- Reindex (platform/tenant only)

Rules:
- Publish triggers strict validation (required-by-publish attributes)
- If publish fails, UI must show field-level errors and explain what is missing
- Destructive actions must confirm (WEB PART 5)

All lifecycle actions must:
- show success feedback
- invalidate affected list/detail queries
- display updated status badge

---

## 8.9 MEDIA MANAGEMENT (S3 PRESIGNED FLOW)

Media UI must support:
- Upload media (multiple files)
- Preview thumbnails
- Reorder media
- Delete media (logical)
- Set primary image (optional)

Rules:
- Upload uses presigned URLs (WEB PART 3.12)
- Media attach is by media ID, not by raw URL
- Private media requires signed URLs (if backend supports)

Vendor can only manage media for their listings.

---

## 8.10 LISTING VALIDATION UX (CRITICAL)

The UI must clearly distinguish:
- Draft-safe missing fields
- Publish-blocking missing fields

Mechanisms:
- “Publish readiness checklist” panel
- Field-level required markers
- Inline errors

If backend returns validation errors:
- map to RHF field paths
- display summary at top
- link to first invalid field

No “publish failed” generic message.

---

## 8.11 ENTITLEMENTS + LIMITS UX (IN LISTINGS)

Rules:
- If listing creation quota reached:
  - disable “Create listing”
  - show plan/limit message
  - provide upgrade CTA (where appropriate)
- If publish entitlement missing:
  - disable publish
  - show entitlement reason

UI must not tease unavailable features.

---

## 8.12 SEARCH INTEGRATION (OPENSEARCH)

Rules:
- Listing list uses search API (if provided) for discovery
- If backend uses DB list for admin, still treat filters the same
- Do not implement client-side filtering for large datasets

Search queries must remain tenant-scoped.

---

## 8.13 LISTINGS MODULE API SURFACE (EXPECTED)

Listings module should provide hooks like:
- `useListingsList(params)`
- `useListingDetail(listingId)`
- `useCreateListing()`
- `useUpdateListing()`
- `usePublishListing()`
- `useArchiveListing()`
- `useUploadListingMedia()` (or `modules/media`)

Params must include portal context when required.

---

## 8.14 TESTING REQUIREMENTS (LISTINGS)

Must include:
- unit tests for listing mappers (DTO → UI)
- unit tests for guards (create/edit/publish eligibility)
- integration tests for:
  - create draft
  - publish with required attributes
- E2E (Playwright) critical path:
  - vendor login → create listing → save draft → publish

---

## 8.15 FORBIDDEN PRACTICES

You must not:
- Hardcode vertical attribute fields
- Implement listing filters outside FilterBuilder metadata
- Upload media through the API server
- Allow publish without publish validation
- Store listing DTOs directly in UI without mapping

---

## 8.16 EXECUTION DIRECTIVE

Listings UI must:
- Work across portals with correct RBAC
- Be schema-driven for vertical attributes
- Integrate safe media flows
- Provide excellent validation and lifecycle UX

Listings are the proof that the entire spine works.

END OF WEB PART 8.