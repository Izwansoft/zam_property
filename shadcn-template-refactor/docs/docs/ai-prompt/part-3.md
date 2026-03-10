# FRONTEND (WEB) — PART 3 — API CLIENT, OPENAPI GENERATION, QUERY STRATEGY & ERROR NORMALIZATION (LOCKED)

This part defines the **frontend infrastructure spine**:
- OpenAPI client generation
- API calling conventions
- TanStack Query strategy
- Error normalization and retry rules
- Auth token propagation rules

All rules from WEB PART 0–2 apply fully.

---

## 3.1 API CONTRACT AUTHORITY (NON-NEGOTIABLE)

Rules:
- Backend OpenAPI is the single source of truth
- Frontend must not hand-write DTO types if generation exists
- API versioning is mandatory (e.g. `/api/v1`)
- Any API drift must be fixed by updating OpenAPI and regenerating client

---

## 3.2 OPENAPI CLIENT GENERATION (MANDATORY)

We will generate a typed client from backend Swagger JSON.

Rules:
- Generated client lives in: `apps/web/lib/api/generated/`
- Manual wrappers live in: `apps/web/lib/api/`
- Regeneration must be deterministic
- Do not edit generated files directly

Naming:
- Generated types are prefixed or namespaced to avoid collisions
- Wrapper exports expose stable and friendly APIs for domain modules

---

## 3.3 CLIENT GENERATION COMMAND (POLICY)

Rules:
- Use pnpm scripts (workspace-level)
- Generation must run in CI to detect drift
- Swagger JSON endpoint must be configurable by env

Example (conceptual):
- `pnpm api:gen` pulls swagger json and regenerates types

Do not hardcode backend base URL into generated artifacts.

---

## 3.4 API WRAPPER LAYER (REQUIRED)

We MUST implement a thin wrapper around the generated client to enforce:
- base URL resolution
- auth token/cookie handling
- correlation id propagation
- consistent headers
- consistent error normalization

Rules:
- Domain modules must never call the raw generated client directly
- Domain modules call wrapper functions only
- Wrapper must be isomorphic-safe (server/client)

---

## 3.5 AUTH TOKEN PROPAGATION (WEB)

Rules:
- Auth is handled via backend contract:
  - Cookie-based session OR Bearer token
- The web app must forward auth automatically:
  - Server components: forward cookies/headers
  - Client components: rely on browser cookies OR token store per backend approach
- Do not persist secrets in localStorage unless explicitly required

Tenant context must be implicit from auth claims where possible.

---

## 3.6 REQUEST CONTEXT HEADERS (STANDARD)

Standard headers (if supported by backend):
- `X-Request-Id` / correlation id
- `X-Client` = `web-dashboard`
- `X-Portal` = `platform|tenant|vendor|ops`
- `X-Vertical-Type` optional (for listing forms/search)
- `Accept-Language` optional

Rules:
- Never leak PII in headers
- Correlation ID must be reused across a page session where possible

---

## 3.7 TANSTACK QUERY STRATEGY (AUTHORITATIVE)

Rules:
- All server state is handled by TanStack Query
- Each domain module defines:
  - query keys
  - query functions (calling API wrapper)
  - mutation functions
  - cache invalidation rules
- No bespoke caching outside Query

Query keys must be stable and structured:
["tenant", tenantId, "vendors", "list", params]
["vendor", vendorId, "listings", "detail", listingId]
["platform", "tenants", "detail", tenantId]

yaml
Copy code

---

## 3.8 QUERY DEFAULTS & RETRY POLICY

Rules:
- Retry is allowed for:
  - network errors
  - 5xx errors
- Retry is NOT allowed for:
  - 4xx validation errors
  - 401/403 (auth/permission)
  - business rule denials

Use exponential backoff and cap retries.

---

## 3.9 CACHE INVALIDATION POLICY

Rules:
- Mutations must invalidate only affected keys
- Prefer targeted invalidation over global refetch
- Optimistic updates are allowed only when safe
- Large lists must use pagination keys correctly

No “invalidate everything” patterns.

---

## 3.10 ERROR NORMALIZATION (MANDATORY)

We must normalize backend errors to a consistent UI shape.

Rules:
- All API calls return either:
  - data, or
  - normalized error object

Normalized error shape (conceptual):
{
kind: "auth" | "forbidden" | "validation" | "not_found" | "rate_limit" | "server" | "unknown",
code?: string,
message: string,
fieldErrors?: Record<string, string[]>,
status?: number,
requestId?: string
}

yaml
Copy code

Rules:
- Validation errors must map to form fields
- Error messages must be user-readable
- Never show raw stack traces

---

## 3.11 UI ERROR PRESENTATION RULES

Rules:
- Every page must render:
  - Error boundary for unexpected exceptions
  - Inline error for expected API errors
- Actions must display errors near the action point
- Retry button must exist where meaningful
- Denials (403/entitlement) must show clear reason

No silent failure UX.

---

## 3.12 FILE UPLOAD CLIENT RULES (MEDIA)

Rules:
- Media uploads use pre-signed URL flow
- Upload progress is tracked client-side
- After upload success, confirm with backend metadata endpoint
- Upload errors must be retriable

Do not stream files through the API from the browser.

---

## 3.13 FORBIDDEN PRACTICES

You must not:
- Call raw generated client directly in UI pages
- Store server state in Zustand
- Hardcode DTO types
- Ignore backend error structure
- Skip pagination in list queries

---

## 3.14 EXECUTION DIRECTIVE

All future domain modules must:
- Use OpenAPI generated client via wrapper
- Use TanStack Query for all server state
- Normalize all errors consistently
- Respect retry/invalidation rules

Frontend infra must be deterministic, typed, and drift-resistant.

END OF WEB PART 3.