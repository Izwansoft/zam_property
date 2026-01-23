# FRONTEND (WEB) — PART 6 — DOMAIN MODULE PATTERNS (HOOKS, VIEW-MODELS, QUERIES, MUTATIONS) (LOCKED)

This part defines the standard structure and conventions for all `modules/*`
(domain UI modules). These rules ensure consistency, testability, and zero chaos.

All rules from WEB PART 0–5 apply fully.

---

## 6.1 DOMAIN MODULE PHILOSOPHY

Domain modules:
- Own all API interactions (via wrappers)
- Own query keys, caching, invalidation
- Own view-model mapping (DTO → UI models)
- Own domain-specific UI components and forms
- Keep `app/*` routes thin and declarative

Pages compose; modules implement.

---

## 6.2 AUTHORITATIVE MODULE STRUCTURE

Every domain module MUST follow this structure:

modules/<domain>/
├── index.ts # public exports only
├── api.ts # wrapper calls (uses lib/api)
├── keys.ts # TanStack query keys
├── queries.ts # useQuery hooks
├── mutations.ts # useMutation hooks
├── mappers.ts # DTO ↔ UI model adapters
├── types.ts # UI-facing types (NOT DTO duplication)
├── components/ # domain-specific UI components
├── forms/ # RHF + Zod schemas for domain forms
├── guards/ # domain-level permission helpers
├── constants.ts
└── tests/ # unit tests for keys/mappers/guards

yaml
Copy code

Rules:
- `api.ts` calls `lib/api/*` wrapper (never generated client directly)
- `types.ts` contains UI types only; DTOs come from generated client types
- Export surface area ONLY via `index.ts`

---

## 6.3 QUERY KEY STANDARD (MANDATORY)

All modules must define query keys in `keys.ts`.

Rules:
- Keys must be hierarchical and stable
- Keys must include tenant/vendor context where applicable
- Keys must be deterministic from inputs

Examples (conceptual):
- `platformTenants.list(params)`
- `tenantVendors.list(tenantId, params)`
- `vendorListings.detail(vendorId, listingId)`

No ad-hoc key arrays inside pages.

---

## 6.4 QUERY HOOK STANDARD

`queries.ts` defines hooks like:
- `useTenantsList(params)`
- `useTenantDetail(tenantId)`
- `useVendorListingsList(params)`
- `useListingDetail(listingId)`

Rules:
- Hooks must be thin wrappers around `useQuery`
- Hooks must normalize errors using `lib/errors`
- Hooks must apply pagination defaults
- Hooks must handle `enabled` properly (avoid firing before context ready)

---

## 6.5 MUTATION HOOK STANDARD

`mutations.ts` defines hooks like:
- `useCreateTenant()`
- `useApproveVendor()`
- `useUpdateListing()`
- `usePublishListing()`

Rules:
- Mutations must:
  - use API wrapper
  - normalize errors
  - invalidate only affected keys
- Optimistic updates allowed only for safe, local UI-only fields
- Mutations must return typed results

No mutation logic inside page components.

---

## 6.6 VIEW-MODEL MAPPING (DTO → UI)

All modules must implement mappers in `mappers.ts`.

Rules:
- Backend DTOs are not used directly in UI rendering
- Always map:
  - formatting (dates, currency)
  - enums to labels
  - status badges
  - derived fields
- Mapping must be pure and unit-tested

UI becomes stable even if DTO changes slightly.

---

## 6.7 FORM STANDARD (RHF + ZOD)

All forms live in `forms/`.

Rules:
- Forms must use:
  - React Hook Form
  - Zod schema (validation)
- Validation errors must map to field paths
- Submit must call mutation hooks only
- Forms must support:
  - disabled state while submitting
  - server-side validation error mapping
  - draft save where applicable

No uncontrolled forms for critical flows.

---

## 6.8 DOMAIN GUARDS (PERMISSION HELPERS)

Each module may define `guards/`:
- `canCreateTenant(identity)`
- `canApproveVendor(identity)`
- `canPublishListing(identity, entitlements)`

Rules:
- Guards must be pure
- Guards must not call API
- Guards must use canonical identity/entitlement snapshot
- Guards must have unit tests

Pages use guards to show/hide actions consistently.

---

## 6.9 URL PARAMS & MODULE INTERFACE

Rules:
- Parsing URL params happens in the route/page layer
- Validated params are passed into module hooks
- Modules must not read router state directly
- Modules must accept explicit `context` arguments:
  - `tenantId`, `vendorId`, `portal`

No hidden dependencies.

---

## 6.10 CROSS-MODULE DEPENDENCY RULES

Rules:
- Modules may depend on:
  - `modules/auth` for identity
  - `lib/*` infrastructure
  - `components/*` presentational UI
- Modules must not:
  - import other modules’ internals directly
  - share private utils by deep import

Shared logic goes into shared infra or a dedicated shared module.

---

## 6.11 LOADING/EMPTY/ERROR UI OWNERSHIP

Rules:
- Modules should provide reusable domain components:
  - `ListEmptyState`
  - `ListErrorState`
  - `DetailSkeleton`
- Pages compose these states, but modules own the patterns

No custom empty states per page.

---

## 6.12 TESTING REQUIREMENTS (MODULE LEVEL)

Each domain module must have unit tests for:
- query keys shape
- mappers (DTO → UI)
- guards (permission logic)
- schema validation (Zod)

Integration/E2E tests are defined later.

---

## 6.13 FORBIDDEN PRACTICES

You must not:
- Put API calls in `app/*` pages directly
- Put query keys in pages
- Render DTOs directly without mapping
- Duplicate DTO types manually
- Store server state in Zustand

---

## 6.14 EXECUTION DIRECTIVE

All domain UI work must:
- follow the module structure
- use query keys + hooks
- map DTOs to UI models
- keep pages thin
- remain consistent across portals

This is how we scale UI without chaos.

END OF WEB PART 6.