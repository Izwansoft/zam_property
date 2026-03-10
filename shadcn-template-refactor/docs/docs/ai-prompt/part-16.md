# FRONTEND (WEB) — PART 16 — SEARCH UI DEEP DIVE (ADVANCED FILTERS, SAVED VIEWS, DISCOVERY UX) (LOCKED)

This part defines the Search UX across dashboard modules:
- how search is used in list pages (listings, vendors, interactions, audit)
- vertical-aware filters and sort (schema-driven)
- saved searches / saved views (optional but recommended)
- URL querystring conventions and parsing rules

All rules from WEB PART 0–15 apply fully.

---

## 16.1 SEARCH UX PHILOSOPHY

Rules:
- Search must feel instant and predictable
- Filters must be discoverable and reversible
- Search state must be shareable (URL-driven)
- Search must remain tenant-safe and role-safe

No client-side filtering for real datasets.

---

## 16.2 SEARCH SURFACES (AUTHORITATIVE)

Search UI exists in these modules:
- Listings (primary: vertical filters)
- Vendors
- Interactions inbox
- Reviews moderation
- Audit logs
- Tenants (platform)

Rules:
- Each list page uses the same search composition pattern (WEB PART 5)
- Search controls are placed consistently:
  - search box left
  - filters near search
  - sort right
  - reset visible

---

## 16.3 GLOBAL SEARCH VS MODULE SEARCH

Phase 1 scope:
- Module-level search only (within a list page)

Optional Phase 1.5:
- Global search bar (platform/tenant portals) that routes to scoped results

Rules:
- Do not implement global search until module search is stable
- Avoid “one search bar to rule them all” complexity early

---

## 16.4 QUERYSTRING CONTRACT (LOCKED)

Every list/search page must use a consistent querystring schema:

Baseline params:
- `q`           : string search term
- `page`        : number
- `pageSize`    : number
- `sort`        : string key (e.g. `updatedAt:desc`)
- `filters`     : encoded object (stable serialization)

Rules:
- The URL is the single source of truth
- Filters must be deterministic when serialized
- Unknown params must be ignored safely
- Defaults must be applied consistently

---

## 16.5 FILTER SERIALIZATION RULES

We must choose a stable, explicit approach:

Recommended encoding:
- `filters` as JSON string encoded safely (or repeated params per filter)
- Must support:
  - string terms
  - enums (multi)
  - ranges
  - booleans
  - dates
  - geo (optional)

Rules:
- FilterBuilder owns encoding/decoding for vertical attributes (WEB PART 7)
- Domain modules own encoding/decoding for non-vertical filters (status, vendorId, etc.)

No manual filter parsing sprinkled through pages.

---

## 16.6 VERTICAL-AWARE SEARCH (LISTINGS)

Listings search must support:
- selecting `vertical_type` (optional filter)
- showing only vertical filters relevant to the selected vertical
- sort keys from vertical search mapping metadata
- filter UI built dynamically from registry metadata

Rules:
- If no vertical selected:
  - show only core filters (status, vendor, location basic)
  - vertical filter section remains hidden or disabled
- If vertical selected:
  - enable FilterBuilder UI for that vertical

No hardcoded vertical filter UI.

---

## 16.7 ADVANCED FILTERS UI PATTERN

Advanced filters should:
- collapse/expand
- show active filter chips
- allow removing single filters quickly
- allow “Reset all” in one action

Rules:
- Active filters must be visible (chips)
- Reset must return to default view
- Filter chips must use human-readable labels derived from schema metadata

---

## 16.8 SAVED SEARCHES / SAVED VIEWS (OPTIONAL, RECOMMENDED)

Saved view concept:
- save current querystring state as a named view
- apply view later
- share view link

Rules:
- Saved views are scoped:
  - platform: per admin user (optional)
  - tenant: per tenant admin user or shared within tenant (optional)
  - vendor: per vendor user (optional)
- Saved views must store:
  - querystring state
  - vertical_type context (if applicable)
  - name
- Saved views must NOT store:
  - raw results
  - sensitive data

If backend does not support this yet:
- implement as client-only (local storage) as a temporary optional feature
- clearly mark as “Saved on this device”

---

## 16.9 SEARCH RESULT PRESENTATION RULES

Rules:
- Highlight search term matches only if backend provides highlight snippets
- Do not “fake highlight” by client scanning large text fields
- Show counts and pagination summary (e.g. “1–25 of 2,340”)

---

## 16.10 SEARCH ERROR & EMPTY STATES

Rules:
- Empty state must differentiate:
  - no results due to filters
  - no data exists at all
- Search error must:
  - offer retry
  - show requestId when available
  - suggest reducing filters if 400 validation

No generic “Something went wrong” without context.

---

## 16.11 PERFORMANCE & DEBOUNCE RULES

Rules:
- Search input `q` must be debounced (e.g. 300–500ms)
- Filter changes should apply immediately (or with “Apply” button for complex UIs)
- Pagination changes should not reset filters unexpectedly
- Cache previous results while fetching next (keepPreviousData)

Avoid flicker and repeated refetch.

---

## 16.12 MODULE API SURFACE (EXPECTED)

Listings search:
- `useListingsList({ q, page, pageSize, sort, filters, verticalType })`

Saved views (optional):
- `useSavedViewsList(context)`
- `useSaveView()`
- `useDeleteView()`

FilterBuilder helpers:
- `encodeFilters(filters) -> string`
- `decodeFilters(string) -> filters`

---

## 16.13 TESTING REQUIREMENTS (SEARCH UX)

Must include:
- unit tests for:
  - querystring parsing/serialization
  - filter chip labeling
  - FilterBuilder encode/decode
- integration tests:
  - filter changes update URL and refetch
- E2E critical path:
  - vendor listings search + vertical filters + pagination

---

## 16.14 FORBIDDEN PRACTICES

You must not:
- Implement client-side filtering for large lists
- Store filter state outside URL for list pages
- Hardcode vertical filter UI
- Break filters when adding new schema attributes
- Couple saved views to results data

---

## 16.15 EXECUTION DIRECTIVE

Search UX must:
- Be URL-driven and shareable
- Be schema-driven for vertical filters
- Be fast and predictable
- Scale to large datasets without hacks

Search is the dashboard’s discovery engine.

END OF WEB PART 16.