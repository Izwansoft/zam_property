# FRONTEND (WEB) — PART 20 — FINAL WEB SPINE CHECKLIST, HANDOVER & RUN BUILD SANITY (LOCKED)

This part is the authoritative completion checklist for the WEB dashboard spine.
It defines:
- what must exist in the codebase
- acceptance criteria per module
- dependency and boundary validation
- build/run sanity steps (as policy)

All rules from WEB PART 0–19 apply fully.

---

## 20.1 FINAL WEB SPINE SCOPE (PHASE 1)

The web dashboard must deliver:
- Platform Admin Portal
- Tenant Admin Portal
- Vendor Portal
- (Optional) Ops Portal

Core modules included:
- Auth & Session
- Tenants
- Vendors
- Listings (schema-driven)
- Interactions inbox
- Reviews moderation
- Subscriptions/Entitlements/Usage visibility
- Analytics dashboards
- Audit log viewer
- Feature flags UI
- Ops tools (admin-only)

Public marketplace UI (basic listing detail page + search) is IN scope (see Part-25).
Full public marketplace with browse/explore/category pages is deferred.

---

## 20.2 REQUIRED FOLDER MAP (MUST MATCH WEB PART 2)

The repo MUST contain:

- `app/` with portal route groups and layouts
- `modules/` with domain modules following WEB PART 6
- `verticals/` with registry + renderer + filter builder following WEB PART 7
- `components/` with kit UI components + presentational reusable pieces
- `lib/` with api wrapper + auth + query config + error normalization
- `styles/`, `public/`, `next.config.*`

No significant deviation allowed without amendment.

---

## 20.3 HARD BOUNDARY VALIDATION (NON-NEGOTIABLE)

Must be true:
- `app/*` does not call API directly (except minimal server proxy if used)
- Only `modules/*` calls `lib/api/*`
- No module deep-imports another module’s internals
- `verticals/*` does not fetch domain data (only registry)
- Core listing UI never hardcodes vertical fields

Violations must be removed, not justified.

---

## 20.4 FUNCTIONAL ACCEPTANCE CHECKLIST (BY PORTAL)

### Platform Admin
Must be able to:
- View tenants list + tenant detail
- Create tenant (if enabled)
- View tenant usage and subscription summary
- Toggle feature flags (with confirmation)
- View audit logs
- Run safe ops actions (reindex/refresh entitlements) if permitted

### Tenant Admin
Must be able to:
- View vendors list and approve/reject vendor
- View listings across tenant with filters
- Moderate listings (if contract supports)
- View interactions inbox (tenant-scoped)
- Moderate reviews
- View usage/limits and analytics
- View tenant audit logs

### Vendor
Must be able to:
- View own dashboard
- Create listing (select vertical_type → schema-driven attributes)
- Save draft, edit, publish (with validation UX)
- Upload media via presigned flow
- View inbox and respond to interactions
- View reviews and reply (if allowed)
- View plan/limits read-only

---

## 20.5 SCHEMA-DRIVEN LISTING SYSTEM ACCEPTANCE (CRITICAL)

Must be true:
- Create listing requires selecting `vertical_type`
- Attribute schema is fetched from registry and cached
- Zod schema generated from registry schema
- AttributeRenderer renders fields deterministically
- Publish enforces required-by-publish attributes
- Vertical filters come from FilterBuilder metadata
- Schema version is respected (edit uses listing schema_version)

If this fails, the multi-vertical promise fails.

---

## 20.6 AUTH, RBAC & TENANT SAFETY ACCEPTANCE

Must be true:
- Portal layouts enforce route guards
- Tenant context resolution matches WEB PART 4
- UI actions are gated by RBAC + entitlements
- Forbidden routes show forbidden page, not broken UI
- No cross-tenant data leakage in UI

---

## 20.7 UI/UX CONSISTENCY ACCEPTANCE

Must be true:
- Every page has loading/empty/error states
- Tables are paginated
- Filters are URL-driven and shareable
- Destructive actions require confirmation
- Feedback toasts/banners are consistent
- Template styling is preserved (no UI fragmentation)

---

## 20.8 PERFORMANCE ACCEPTANCE

Must be true:
- No large list renders without pagination
- Search input debounced
- Registry cached with long staleTime
- No repeated duplicate fetches per page load
- Heavy libraries are not imported in root layout

---

## 20.9 TESTING & CI ACCEPTANCE (WEB PART 18)

Must be true:
- Lint passes
- Typecheck passes
- Unit tests pass (keys/mappers/guards/schema generation)
- Integration tests pass (module wiring)
- E2E critical journeys pass (Playwright), at least on staging/release

No bypass.

---

## 20.10 DOCUMENTATION MINIMUMS

Must exist:
- `README.md` for web app:
  - how to run locally
  - env vars
  - how to regenerate OpenAPI client
  - portal routes
- `ARCHITECTURE.md` (short):
  - folder boundaries
  - vertical schema-driven concept
  - key conventions (query keys, filters)

Docs must reflect this spine.

---

## 20.11 RUN BUILD SANITY (MANDATORY POLICY)

Before declaring any web milestone “done”, run:

Local (run from `shadcn-template-refactor/` directory):
1) `pnpm install`
2) `pnpm lint`
3) `pnpm typecheck`
4) `pnpm test`
5) `pnpm build`
6) `pnpm start`

CI:
- ensure GitHub Actions green

No milestone is accepted without build sanity.

---

## 20.12 FINAL DIRECTIVE

This concludes the WEB dashboard spine for Phase 1.
All future UI work must attach to this spine.

If marketplace public UI is added later:
- it must be a new spine extension
- it must not contaminate admin dashboard patterns

END OF WEB PART 20.