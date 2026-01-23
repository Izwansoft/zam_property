# PART 9 — SEARCH ARCHITECTURE & INDEXING STRATEGY (LOCKED)

This part defines how search, filtering, and discovery operate across
multiple verticals using OpenSearch.

All rules from PART 0–8 apply.

---

## 9.1 SEARCH PHILOSOPHY

Search is:
- A derived read model
- Eventually consistent
- Vertical-aware but core-managed
- Optimized for discovery, not correctness

The database remains the source of truth.

---

## 9.2 SEARCH RESPONSIBILITIES (BOUNDARY)

Search is responsible for:
- Fast discovery
- Filtering and sorting
- Relevance scoring
- Geo queries
- Faceted navigation

Search is NOT responsible for:
- Validation
- Business rules
- Authorization
- Monetisation enforcement

---

## 9.3 SEARCH SYSTEM SHAPE

The platform uses:
- **OpenSearch** as the search engine
- **Async indexing** via events
- **Read-optimized documents**

Search never blocks write paths.

---

## 9.4 INDEXING STRATEGY (AUTHORITATIVE)

Two supported strategies:

### Option A — Index per Vertical (Preferred)
listings_real_estate_v1
listings_vehicles_v1
listings_goods_v1

pgsql
Copy code

### Option B — Unified Index with Vertical Partition
listings_v1

vertical_type

yaml
Copy code

Rules:
- Strategy must be chosen per deployment
- Mappings must be explicit
- Vertical isolation must be preserved

---

## 9.5 SEARCH DOCUMENT STRUCTURE

Each search document MUST include:

- document_id
- listing_id
- tenant_id
- vendor_id
- vertical_type
- status
- title
- description
- price
- location (geo)
- searchable attributes (flattened)
- visibility flags
- timestamps

Documents must be immutable snapshots.

---

## 9.6 ATTRIBUTE → SEARCH MAPPING

Rules:
- Only registered attributes may be indexed
- Mapping is defined by vertical modules
- Attribute metadata defines:
  - filterable
  - sortable
  - range
  - keyword vs text

Search must never infer attribute meaning.

---

## 9.7 INDEX VERSIONING & MIGRATION

Rules:
- Indexes are versioned (`_v1`, `_v2`)
- Mappings are immutable per index
- New mappings require new index versions
- Alias switching is mandatory

Zero-downtime reindexing is required.

---

## 9.8 EVENT-DRIVEN INDEXING

Indexing is triggered by events:
- ListingCreated
- ListingUpdated
- ListingPublished
- ListingExpired
- ListingArchived

Rules:
- Indexing is async
- Indexing jobs are idempotent
- Failures must retry
- Permanent failures go to DLQ

Indexing must never affect core writes.

---

## 9.9 VISIBILITY & FILTER RULES

Rules:
- Only published listings are searchable
- Tenant visibility rules are enforced during indexing
- Vendor suspension removes listings from search
- Vertical-specific visibility flags may exist

Search reflects visibility, it does not decide it.

---

## 9.10 RANKING & RELEVANCE

Rules:
- Ranking logic is centralized
- Vertical modules may provide ranking signals
- Monetisation may provide boost signals
- Core owns final score calculation

No vertical may hardcode ranking formulas.

---

## 9.11 GEO & LOCATION SEARCH

Rules:
- Geo fields must be normalized
- Distance queries must be indexed
- Vertical modules may opt-in to geo search
- Location precision must be configurable

---

## 9.12 TENANT ISOLATION IN SEARCH

Rules:
- All search queries are tenant-scoped
- Cross-tenant search is forbidden
- Public search resolves tenant context explicitly

Search leakage is a critical failure.

---

## 9.13 PERFORMANCE & SAFETY

Rules:
- Query limits enforced
- Pagination required
- Aggregations bounded
- Heavy queries rate-limited

Search abuse must be controlled.

---

## 9.14 FORBIDDEN PRACTICES

You must not:
- Query database for search
- Index unvalidated attributes
- Block requests on indexing
- Embed business logic in search queries

---

## 9.15 EXECUTION DIRECTIVE

Search must:
- Remain decoupled from domains
- Be driven purely by events
- Support vertical evolution safely

Search is a mirror, not a brain.

END OF PART 9.