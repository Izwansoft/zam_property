# FRONTEND (WEB) — PART 18 — TESTING STRATEGY, QUALITY GATES & CI DISCIPLINE (LOCKED)

This part defines how frontend quality is enforced:
- unit/integration/E2E testing pyramid
- what must be tested
- CI gates (GitHub Actions)
- release discipline for the dashboard

All rules from WEB PART 0–17 apply fully.

---

## 18.1 QUALITY PHILOSOPHY (WEB)

Rules:
- Quality is automated
- No green pipeline, no merge
- Tests protect the spine: auth, tenancy, entitlements, schema-driven UI
- Flaky tests are failures

Shipping fast is good only when safe.

---

## 18.2 TESTING PYRAMID (AUTHORITATIVE)

Target distribution:
- Unit tests (largest)
- Integration tests (medium)
- E2E tests (smallest, critical paths only)

Over-reliance on E2E is forbidden.

---

## 18.3 UNIT TESTS (MANDATORY)

Use:
- Vitest + Testing Library (where UI needed)

Must cover:
- Query key builders (`modules/*/keys.ts`)
- DTO→UI mappers (`modules/*/mappers.ts`)
- Permission/entitlement guards (`modules/*/guards/*`)
- Querystring encode/decode (WEB PART 16)
- Vertical schema → Zod generation (WEB PART 7)
- FilterBuilder encode/decode + labels (WEB PART 7/16)
- Error normalization (`lib/errors/*`)

Rules:
- Tests must be deterministic
- No real network calls
- No dependence on local environment

---

## 18.4 INTEGRATION TESTS (MANDATORY)

Goal: validate module wiring with mocked API layer.

Approach:
- Use MSW (recommended) OR mock `lib/api` wrapper
- Test module hooks + components composition
- Validate:
  - list page renders data and states
  - pagination triggers refetch
  - mutations invalidate correct keys
  - server validation errors map to fields

Rules:
- Integration tests must not hit real backend
- Keep them fast and focused

---

## 18.5 E2E TESTS (PLAYWRIGHT) — CRITICAL PATHS ONLY

E2E suites must cover only the most important user journeys:

### Vendor journey
- Login → Listings → Create listing (schema-driven) → Save draft → Publish
- Inbox → View interaction → Respond

### Tenant admin journey
- Login → Vendors → Approve vendor
- Listings → Moderate listing (if applicable)
- Reviews → Approve/reject review

### Platform admin journey
- Login → Tenants → Create tenant
- Feature flags → Toggle flag (and verify audit trail view)

Rules:
- E2E must run against:
  - staging environment OR
  - ephemeral preview environment
- Keep test data deterministic
- Avoid fragile selectors; use stable test IDs

---

## 18.6 ACCESSIBILITY & UI REGRESSION (OPTIONAL)

Optional Phase 1.5:
- basic accessibility checks (e.g. axe)
- screenshot snapshots for key pages (sparingly)

Do not introduce heavy visual regression pipelines unless needed.

---

## 18.7 QUALITY GATES (MANDATORY)

Before merge:
- TypeScript typecheck passes
- ESLint passes
- Unit tests pass
- Integration tests pass
- Build passes

Before deploy:
- All above
- E2E critical suite passes (or on release branch)

No exceptions.

---

## 18.8 COVERAGE POLICY

Rules:
- Coverage thresholds are enforced for:
  - vertical schema generation
  - permission/entitlement guards
  - error normalization
- Overall coverage is a guideline; critical areas are mandatory high coverage

No coverage gaming.

---

## 18.9 TEST DATA & FIXTURES RULES

Rules:
- All fixtures must be versioned
- Use factory helpers for DTO mocks
- Avoid randomization unless seeded
- Keep fixtures small and realistic

---

## 18.10 CI (GITHUB ACTIONS) DISCIPLINE

Rules:
- CI must run on:
  - pull requests
  - main branch pushes
- CI steps:
  1) Install (pnpm)
  2) Lint
  3) Typecheck
  4) Unit tests
  5) Integration tests
  6) Build
  7) (Optional) E2E in staging pipeline

Fail fast: stop pipeline on failures early.

---

## 18.11 RELEASE DISCIPLINE (WEB)

Rules:
- Releases are tagged and versioned
- Changelog required (auto acceptable)
- No “hotfix in prod” without PR and CI
- Rollback must be possible (deployment platform dependent)

---

## 18.12 FORBIDDEN PRACTICES

You must not:
- Merge with failing pipeline
- Disable tests to ship faster
- Rely on manual QA only
- Write E2E tests for everything
- Hit real backend in unit/integration tests

---

## 18.13 EXECUTION DIRECTIVE

Frontend quality must:
- protect tenancy, permissions, entitlements
- ensure schema-driven UI does not regress
- keep deployment safe and repeatable

Good UI is stable UI.
