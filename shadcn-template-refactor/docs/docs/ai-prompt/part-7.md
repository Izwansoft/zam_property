# FRONTEND (WEB) — PART 7 — VERTICAL UI PLUGIN SPINE (SCHEMA REGISTRY, ATTRIBUTE RENDERER, DYNAMIC FORMS, FILTER BUILDER) (LOCKED)

This part defines the vertical-agnostic UI engine that allows the dashboard
to support **property, vehicles, services, goods, and future verticals**
WITHOUT hardcoding fields.

All rules from WEB PART 0–6 apply fully.

---

## 7.1 VERTICAL UI PRINCIPLE (NON-NEGOTIABLE)

Rules:
- Core listing pages NEVER hardcode vertical-specific fields
- Vertical behavior is driven by:
  - `vertical_type`
  - `schema_version`
  - attribute schema registry
  - search mapping metadata

If a field is vertical-specific, it must come from schema.

---

## 7.2 VERTICALS FOLDER (AUTHORITATIVE)

Vertical plugin system lives in:

verticals/
├── registry/
│ ├── api.ts
│ ├── keys.ts
│ ├── queries.ts
│ ├── types.ts
│ ├── cache.ts
│ └── mappers.ts
├── attribute-renderer/
│ ├── renderer.tsx
│ ├── fields/
│ │ ├── TextField.tsx
│ │ ├── NumberField.tsx
│ │ ├── SelectField.tsx
│ │ ├── MultiSelectField.tsx
│ │ ├── BooleanField.tsx
│ │ ├── DateField.tsx
│ │ ├── RangeField.tsx
│ │ └── GeoField.tsx (optional)
│ ├── zod.ts
│ ├── helpers.ts
│ └── tests/
├── filter-builder/
│ ├── builder.ts
│ ├── components/
│ ├── querystring.ts
│ └── tests/
└── types/
├── vertical.ts
├── attributes.ts
└── search.ts

yaml
Copy code

Rules:
- vertical system is a UI plugin layer, not a domain module
- it may only call registry endpoints (schemas + mappings)
- it must not fetch or mutate listings directly (domain modules do that)

---

## 7.3 REGISTRY DATA CONTRACT (FROM BACKEND)

Frontend expects backend to expose registry endpoints (exact routes are contract-driven via OpenAPI).
Minimum required registry data:

### A) Vertical definitions
- vertical_type
- display_name
- supported_schema_versions
- optional UI hints

### B) Attribute schema (per vertical + version)
For each attribute:
- key (string path)
- label (human text)
- type (string/number/boolean/enum/array/date)
- required flags (global + status-based rules)
- constraints (min/max/regex)
- UI hints (placeholder, unit, grouping, order)
- default value (optional)

### C) Search mapping metadata (per vertical)
- filterable fields
- sortable fields
- range fields
- enum facets

The frontend must not invent these.

---

## 7.4 REGISTRY CACHING RULES

Rules:
- Registry data is relatively static and should be cached aggressively
- Cache per:
  - vertical_type
  - schema_version
- Registry queries use TanStack Query with long staleTime
- Invalidation occurs on:
  - tenant vertical enablement change
  - schema version updates (manual refresh allowed)

Registry is shared infrastructure for forms and filters.

---

## 7.5 ATTRIBUTE RENDERER (DYNAMIC FORM ENGINE)

We implement a single AttributeRenderer that:
- consumes attribute schema
- renders RHF-compatible fields
- binds to `attributes.<key>` paths
- displays validation errors
- respects UI hints (grouping, order, labels, units)

Rules:
- Field components must be generic, reusable
- No vertical-specific field components in core
- Renderer must be deterministic: same schema → same UI

---

## 7.6 ZOD GENERATION FROM SCHEMA (MANDATORY)

We generate a Zod schema from attribute schema metadata.

Rules:
- Zod generation must:
  - enforce type and constraints
  - enforce required rules (status-based)
  - produce field-path errors compatible with RHF
- Schema generation must be pure and testable
- Server-side validation is still authoritative; UI validation is for UX only

No handwritten validation for vertical attributes.

---

## 7.7 LISTING FORM INTEGRATION (CORE + ATTRIBUTES)

Listing forms are split into:

### A) Core fields form section
- title, description, price, currency, location, status (as allowed)

### B) Attributes form section
- rendered by AttributeRenderer based on selected vertical schema

Rules:
- vertical_type is selected at creation and becomes immutable
- schema_version must be stored with listing attributes payload (or per backend requirement)
- “Publish” action triggers stricter status-based validation

---

## 7.8 STATUS-BASED REQUIRED ATTRIBUTES (UI RULE)

Rules:
- In draft mode:
  - only minimal required fields enforced
- In publish mode:
  - all required-by-publish attributes enforced
- UI must reflect what is required for publish vs draft clearly

If backend returns validation error for missing publish fields, UI must map it to fields.

---

## 7.9 FILTER BUILDER (DYNAMIC SEARCH FILTERS)

We implement a FilterBuilder that:
- consumes vertical search mapping metadata
- renders filter UI dynamically
- produces query params (shareable URLs)
- produces API search params for domain modules

Rules:
- Filters must be URL-driven (WEB PART 5)
- FilterBuilder must not hardcode vertical filters
- Filter UI must support:
  - term filters
  - range filters
  - enum filters
  - geo radius filter (optional)

---

## 7.10 VERTICAL SWITCHING IN LISTINGS UI

Rules:
- Listing list pages may:
  - filter by vertical_type
  - show vertical_type badge
- Listing create must:
  - select vertical_type before showing attributes
- Listing edit must:
  - use listing.vertical_type and listing.schema_version
  - never allow changing vertical_type

---

## 7.11 FALLBACK & COMPATIBILITY RULES

If schema registry data is unavailable:
- listing pages must fail gracefully
- show an error with retry
- allow saving as draft only if core allows (configurable)

If schema_version is unknown:
- UI must show a compatibility warning
- block publish
- allow admin resolution path

No silent broken forms.

---

## 7.12 TESTING REQUIREMENTS (VERTICAL SYSTEM)

Must include unit tests for:
- Zod schema generation for types/constraints/required fields
- Renderer field mapping and error display
- FilterBuilder querystring generation and parsing

This system is critical and must be reliable.

---

## 7.13 FORBIDDEN PRACTICES

You must not:
- Hardcode property/car fields in listing pages
- Build per-vertical React forms manually in core
- Add vertical-specific filters without registry metadata
- Skip schema_version handling
- Infer semantics from attribute keys

---

## 7.14 EXECUTION DIRECTIVE

The vertical UI system must:
- Keep the dashboard vertical-agnostic
- Render forms & filters from schema
- Enforce consistent validation UX
- Scale to unlimited verticals without refactor

This is the heart of the multi-vertical frontend.

END OF WEB PART 7.