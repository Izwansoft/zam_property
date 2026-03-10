# FRONTEND (WEB) — PART 0 — GLOBAL RULES, AI GOVERNANCE & SPINE AUTHORITY (LOCKED)

This document defines the **absolute, non-negotiable rules** governing the WEB (dashboard) frontend.
All subsequent web parts (WEB PART 1 onward) are subordinate to this part.

If any instruction conflicts with WEB PART 0, **WEB PART 0 ALWAYS WINS**.

This web spine MUST align with the backend spine (PART 0–26).

---

## 0.1 PROJECT IDENTITY (WEB)

This web app is a **ROLE-BASED MANAGEMENT DASHBOARD + PUBLIC PORTAL** for a:
**Vertical-Agnostic Multi-Tenant Marketplace Platform**.

Phase 1 focus (MANDATORY):
- Platform Admin Portal (`/dashboard/platform/*`)
- Tenant Admin Portal (`/dashboard/tenant/*`)
- Vendor Portal (`/dashboard/vendor/*`)
- Customer Account Portal (`/dashboard/account/*`)
- Public Pages (`/(public)/*`) - listing detail, search

Phase 1 optional:
- Support/Ops Portal (can be added in Phase 2)

---

## 0.2 SPINE-FIRST DEVELOPMENT RULE (WEB)

This project follows the same **SPINE ARCHITECTURE APPROACH** as backend.

Rules:
1. Structure and contracts first
2. No feature coding until the spine is locked
3. UI modules attach to the spine, never reshape it
4. No “quick hacks” that bypass permissions, entitlements, or API contracts
5. Any change requires updating the spine first

---

## 0.3 TEMPLATE USAGE RULE (SHADCN UI KIT)

An existing shadcn UI kit template is located at `app/dashboard/`.

Rules:
- **REUSE** components and patterns from `app/dashboard/` to expedite development
- Copy/adapt layouts, navigation, and UI components as needed
- Do not introduce a second UI library that conflicts with shadcn/radix patterns
- The template serves as reference and component library

The template is the UI foundation; we adapt it, not replace it.

---

## 0.4 AI BEHAVIOUR & GOVERNANCE (CRITICAL)

Any AI agent (Copilot, ChatGPT, Cursor, etc.) MUST:

### MUST DO
- Follow parts in order (WEB PART 0 → WEB PART N)
- Respect backend spine constraints and contracts
- Keep implementation consistent with OpenAPI
- Produce maintainable, type-safe TypeScript code
- Prefer simple, explicit code over clever abstractions

### MUST NOT DO
- Invent new architecture
- “Improve” the stack without instruction
- Hardcode vertical-specific fields into core UI
- Bypass RBAC/entitlements checks for convenience
- Change the downloaded template structure drastically

AI is an executor, not a co-architect.

---

## 0.5 ARCHITECTURAL STYLE (WEB) (LOCKED)

The frontend follows:
- **Single Next.js App**
- **Role-based route groups / portals**
- **Domain-oriented UI modules**
- **Schema-driven vertical UI plugins** (attributes/forms/filters)
- **API-first** integration via generated OpenAPI client

Multiple dashboard apps are forbidden in Phase 1.

---

## 0.6 TECHNOLOGY STACK AUTHORITY (WEB)

Web stack is LOCKED unless revised later:

- Framework: **Next.js (App Router)**
- Language: **TypeScript (strict)**
- UI: **shadcn/ui (from existing kit) + Tailwind**
- Forms: **React Hook Form**
- Validation: **Zod**
- Server state: **TanStack Query**
- Client state: **Zustand** (minimal)
- API client: **OpenAPI generated client** from backend Swagger JSON
- Auth: **JWT/session via backend** (cookie or bearer per backend contract)
- Testing: **Vitest + Testing Library** (unit), **Playwright** (critical E2E)

No alternative frameworks (Remix, Nuxt, etc.) without spine amendment.

---

## 0.7 BACKEND CONTRACT IS SOURCE OF TRUTH

Rules:
- Backend OpenAPI is the authoritative contract
- Frontend must not guess payload shapes
- No manual typing of API DTOs where generation exists
- API errors must be handled according to backend error format
- Versioned APIs only (e.g. `/api/v1/...`)

If the backend spec is missing, we update backend first.

---

## 0.8 MULTI-TENANCY & ROLE SAFETY (WEB)

Rules:
- Every page and API call must operate in a resolved tenant context
- Cross-tenant access is forbidden by default
- Role boundaries must be enforced in routing AND UI
- Sensitive pages must be gated by permissions/entitlements

The UI must not leak data across tenants.

---

## 0.9 VERTICAL-AGNOSTIC UI PRINCIPLE (CRITICAL)

Rules:
- Core dashboard UI must not hardcode “property fields” or “car fields”
- Listing creation/edit must be **schema-driven**:
  - based on `vertical_type`
  - `schema_version`
  - attribute schema from registry endpoint

Vertical-specific UI belongs only in:
- Vertical UI plugins
- Attribute renderers
- Vertical filter builders

Hardcoding vertical logic into core pages is forbidden.

---

## 0.10 DOMAIN BOUNDARY ENFORCEMENT (WEB)

Rules:
- Pages are thin orchestration
- Domain modules own data fetching and mutations
- Shared UI components are presentational only
- No “global utils” dumping ground

Keep a clean separation:
- `app/` routes (shell + composition)
- `modules/` domain UI logic
- `components/` reusable UI building blocks
- `lib/` shared infra (api client, auth, query config)

---

## 0.11 PERFORMANCE & UX RULES

Rules:
- Use server rendering strategically (auth shell, layout)
- Use TanStack Query for caching and dedupe
- Avoid waterfalls; batch where possible
- Paginate all list views
- Provide loading, empty, error states everywhere

Dashboard UX must feel fast and reliable.

---

## 0.12 ACCESS CONTROL RULES (RBAC + ENTITLEMENTS)

Rules:
- Authorization is enforced at:
  - Route guard level
  - UI component level
- Entitlements gate features (buttons, pages, actions)
- Denied actions must show clear UX messaging (not silent failures)

No “security by hiding” only; always enforce in route and API.

---

## 0.13 OBSERVABILITY (WEB)

Rules:
- Errors must be captured and categorized
- Correlation IDs should be forwarded if provided by backend
- Logging must not leak secrets or PII

---

## 0.14 CHANGE MANAGEMENT RULE

Any of these require a spine amendment:
- Stack change
- Multi-app decision change
- Switching state management approach
- Breaking template structure

No ad-hoc changes.

---

## 0.15 EXECUTION DIRECTIVE

If at any point instructions:
- Are incomplete
- Are contradictory
- Would violate this web spine

The AI MUST stop and request clarification.

---

## 0.16 FINAL AUTHORITY

This web spine is the authoritative source of truth for the dashboard frontend.

Correctness and maintainability are mandatory.
Speed is secondary.
No vertical hardcoding.

END OF WEB PART 0.