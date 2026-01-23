# PART 7 — ATTRIBUTE ENGINE & VALIDATION SYSTEM (LOCKED)

This part defines the **Attribute Engine** used to extend listings for different business verticals.
It ensures flexibility WITHOUT sacrificing safety, consistency, or searchability.

All rules from PART 0–6 apply.

---

## 7.1 PURPOSE OF THE ATTRIBUTE ENGINE

The Attribute Engine:
- Enables vertical-specific attributes per listing
- Provides structured validation for JSONB attributes
- Decouples business-specific data from core schema
- Supports search, filtering, and display requirements

Attributes are the ONLY extension mechanism for verticals.

---

## 7.2 ATTRIBUTE STORAGE MODEL

Rules:
- All attributes are stored in `listings.attributes` as JSONB
- Core treats attributes as opaque
- Attribute keys and values are vertical-defined
- Attribute schema is versioned per vertical

No attribute fields are allowed in core tables.

---

## 7.3 ATTRIBUTE SCHEMA DEFINITION (PER VERTICAL)

Each vertical MUST define:
- Attribute schema (JSON Schema–like structure)
- Required vs optional attributes
- Data types (string, number, boolean, enum, array)
- Constraints (min/max, regex, allowed values)
- Default values (if any)

Schemas must be explicit and deterministic.

---

## 7.4 ATTRIBUTE REGISTRATION (STARTUP)

Rules:
- Vertical modules must register their attribute schemas at startup
- Registration includes:
  - `vertical_type`
  - `schema_version`
  - attribute definitions
- Core rejects duplicate or conflicting registrations
- Unregistered verticals are rejected

Dynamic runtime schema mutation is forbidden.

---

## 7.5 ATTRIBUTE VALIDATION FLOW

Validation occurs:
1. Before listing creation
2. Before listing update
3. Before publishing a listing

Rules:
- Validation is performed by the vertical module
- Core delegates validation via a contract/interface
- Validation failures must be explicit and user-readable
- Partial validation is forbidden

Invalid attributes must never be persisted.

---

## 7.6 REQUIRED ATTRIBUTES & STATUS DEPENDENCY

Rules:
- Required attributes may vary by listing status
- Example:
  - Draft: minimal attributes allowed
  - Publish: full required attributes enforced
- Vertical modules define status-based requirements

Core enforces WHEN validation happens, not WHAT is validated.

---

## 7.7 ATTRIBUTE VERSIONING & MIGRATION

Rules:
- Attribute schemas are versioned
- Existing listings retain their schema version
- Schema upgrades must be backward-compatible OR migrated explicitly
- Silent schema breaking is forbidden

Migration logic must be explicit and auditable.

---

## 7.8 ATTRIBUTE ACCESS RULES

Rules:
- Core never reads attribute internals
- Vertical modules may read/write attributes
- Search mappers may read attributes
- Frontend receives attributes as structured objects

Attribute parsing must be centralized.

---

## 7.9 SEARCH & FILTER COMPATIBILITY

Rules:
- Only registered attributes may be indexed
- Attribute definitions include search metadata:
  - filterable
  - sortable
  - range-searchable
- Search mapping is generated from attribute definitions

Search must not guess attribute semantics.

---

## 7.10 PERFORMANCE & SAFETY

Rules:
- Attribute size limits must be enforced
- Deeply nested structures are forbidden
- Large blobs or media data are forbidden
- Attribute writes must be validated synchronously

Abuse of JSONB is forbidden.

---

## 7.11 ERROR HANDLING

Rules:
- Attribute errors must be descriptive
- Error paths must point to exact attribute keys
- Validation errors must not leak internal schema details

User-facing errors must be understandable.

---

## 7.12 FORBIDDEN PRACTICES

You must not:
- Hardcode attributes in core
- Allow arbitrary unvalidated JSON
- Perform validation in controllers
- Bypass attribute engine during updates

---

## 7.13 EXECUTION DIRECTIVE

All vertical modules must:
- Define and register attribute schemas
- Own attribute validation logic
- Respect schema versioning rules
- Treat attributes as the ONLY customization path

Attributes are power tools. Handle them carefully.

END OF PART 7.