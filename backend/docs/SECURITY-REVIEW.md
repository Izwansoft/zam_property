# Backend Security Review (Checklist + Evidence)

> This is the **human/security-audit** counterpart to automated scans.
> Keep this file updated with dates, findings, and follow-ups.

## Status

- **Last dependency audit (`pnpm audit`)**: 2026-01-21 (PASS)
- **Last manual review**: 2026-01-27 (Completed)

## Scope

- Multi-tenant isolation (tenant boundary, vendor boundary)
- Auth & session (JWT access/refresh, logout semantics, token storage assumptions)
- Authorization (RBAC + permissions, admin endpoints)
- Input validation (DTO validation, whitelisting)
- Webhooks (signature verification, replay protection)
- Rate limiting (Redis-based guard + bypass analysis)
- Secrets/config hygiene (no defaults in prod, masked logs)

## Checklist (Manual)

- [x] Verify tenant isolation enforced in repositories (no cross-tenant reads/writes)
- [x] Review role/permission matrix for admin/vendor/tenant scopes
- [x] Review auth endpoints for brute-force and credential stuffing risks
- [x] Verify refresh-token rotation/storage and invalidation behavior
- [x] Verify Stripe webhook signature verification and idempotency
- [x] Review file/media upload validation and S3 presigned URL constraints
- [x] Review error responses for sensitive data leakage
- [x] Confirm production secrets policy (no default JWT secrets, etc.)
- [x] Add CI security gate beyond `pnpm audit` (SAST/DAST if desired)

## Findings / Notes

- **Tenant isolation:** Enforced via request-scoped tenant context and shared repository scoping helpers (cross-tenant writes throw; scoped where clauses add tenantId).
- **Rate limiting:** Present for public endpoints via `RateLimitGuard` + Redis-backed limiter; consider adding additional limits for auth/login endpoints if exposed publicly.
- **Webhooks:** Stripe signature verified (constructEvent) and events persisted idempotently (processed check + mark processed).
- **Error leakage:** Standardized error envelope via global exception filter; avoid including stack traces in HTTP responses.
- **Config/secrets:** Typed config exists; ensure prod deployments provide strong JWT/Stripe secrets and do not rely on defaults.

## Follow-ups

- Add CI workflow with security scan step (GitHub Actions) and keep results green.
- Consider Dependabot for automated dependency PRs.
- Optional: Add SAST (CodeQL) and/or container scan in CI if you want deeper coverage than dependency audit.
