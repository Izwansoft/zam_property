# PART 8 — VERTICAL MODULE CONTRACT (PLUG-IN RULES) (LOCKED)

This part defines the **mandatory contract** that every vertical module must implement.
It is the ONLY allowed way for business-specific logic to enter the platform.

All rules from PART 0–7 apply.

---

## 8.1 PURPOSE OF THE VERTICAL CONTRACT

The Vertical Module Contract ensures:
- Clean separation between core and business logic
- Predictable extension points
- Safe addition of new industries
- Zero core refactor when adding a vertical

If a vertical cannot fit this contract, it does not belong on the platform.

---

## 8.2 VERTICAL MODULE DEFINITION

A vertical module:
- Represents one industry family (e.g. real_estate, vehicles)
- Extends the generic listing engine
- Owns its attributes, validation, and workflows
- Does NOT own persistence of core entities

Vertical modules are **plug-ins**, not core code.

---

## 8.3 MANDATORY VERTICAL MODULE STRUCTURE

Each vertical module MUST follow this structure:

vertical-<name>/
├── vertical.module.ts
├── registry/
│ ├── vertical.definition.ts
│ ├── attribute.schema.ts
│ ├── validation.rules.ts
│ └── search.mapping.ts
├── workflows/
│ └── <optional vertical workflows>
├── hooks/
│ └── <event handlers>
├── constants/
└── README.md

yaml
Copy code

Rules:
- No controllers
- No repositories
- No direct DB access
- No core overrides

Verticals extend behavior, they do not own data.

---

## 8.4 VERTICAL REGISTRATION (MANDATORY)

Each vertical MUST register:

- `vertical_type` (string identifier)
- Human-readable name
- Attribute schema(s)
- Validation rules
- Search mapping definition
- Supported listing statuses

Registration occurs at application startup.

Unregistered verticals are rejected.

---

## 8.5 ATTRIBUTE OWNERSHIP

Rules:
- Vertical modules fully own attribute semantics
- Attribute validation lives here
- Attribute defaults live here
- Attribute evolution is vertical responsibility

Core treats attributes as opaque payloads.

---

## 8.6 VALIDATION RESPONSIBILITIES

Vertical modules must:
- Validate attributes on create/update/publish
- Validate cross-attribute consistency
- Validate status-based requirements

Verticals must NOT:
- Validate tenant, vendor, or ownership
- Enforce monetisation limits
- Perform authorization checks

---

## 8.7 SEARCH MAPPING OWNERSHIP

Vertical modules must:
- Define searchable attributes
- Define filter types (term, range, geo)
- Define sort capabilities
- Declare index compatibility

Search consumers use these definitions to build indexes.

---

## 8.8 WORKFLOWS & DOMAIN-SPECIFIC BEHAVIOR

Vertical modules MAY define:
- Domain workflows (e.g. approval steps)
- Domain-specific lifecycle extensions
- Domain events (vertical-scoped)

Rules:
- Workflows must not alter core lifecycle invariants
- Workflows must emit events
- Workflows must be idempotent

---

## 8.9 EVENT HOOKS

Vertical modules MAY subscribe to:
- Listing lifecycle events
- Lead events
- Review events

Rules:
- Hooks must not block core execution
- Hooks must be async
- Hooks must be failure-isolated

---

## 8.10 FRONTEND CONTRACT (AWARENESS)

Vertical modules must expose:
- Attribute definitions for UI rendering
- Validation rules for client-side validation
- Display metadata (labels, units)

This enables dynamic forms without hardcoding.

---

## 8.11 VERSIONING & BACKWARD COMPATIBILITY

Rules:
- Vertical modules are versioned
- Breaking changes require migration plans
- Multiple schema versions may coexist
- Version resolution must be explicit

Silent breaking changes are forbidden.

---

## 8.12 FORBIDDEN PRACTICES

Vertical modules must NOT:
- Add database tables
- Introduce controllers or APIs
- Call core repositories directly
- Bypass attribute engine
- Hardcode search queries

---

## 8.13 EXECUTION DIRECTIVE

Every vertical MUST:
- Implement this contract fully
- Register itself explicitly
- Remain isolated from other verticals
- Extend the platform without reshaping it

Verticals are guests. The platform is the host.

END OF PART 8.