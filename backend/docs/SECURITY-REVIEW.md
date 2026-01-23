# Backend Security Review (Checklist + Evidence)

> This is the **human/security-audit** counterpart to automated scans.
> Keep this file updated with dates, findings, and follow-ups.

## Status

- **Last dependency audit (`pnpm audit`)**: 2026-01-21 (PASS)
- **Last manual review**: (not completed)

## Scope

- Multi-tenant isolation (tenant boundary, vendor boundary)
- Auth & session (JWT access/refresh, logout semantics, token storage assumptions)
- Authorization (RBAC + permissions, admin endpoints)
- Input validation (DTO validation, whitelisting)
- Webhooks (signature verification, replay protection)
- Rate limiting (Redis-based guard + bypass analysis)
- Secrets/config hygiene (no defaults in prod, masked logs)

## Checklist (Manual)

- [ ] Verify tenant isolation enforced in repositories (no cross-tenant reads/writes)
- [ ] Review role/permission matrix for admin/vendor/tenant scopes
- [ ] Review auth endpoints for brute-force and credential stuffing risks
- [ ] Verify refresh-token rotation/storage and invalidation behavior
- [ ] Verify Stripe webhook signature verification and idempotency
- [ ] Review file/media upload validation and S3 presigned URL constraints
- [ ] Review error responses for sensitive data leakage
- [ ] Confirm production secrets policy (no default JWT secrets, etc.)
- [ ] Add CI security gate beyond `pnpm audit` (SAST/DAST if desired)

## Findings / Notes

- None recorded yet.

## Follow-ups

- Add CI workflow with security scan step (GitHub Actions) and keep results green.
- Consider Dependabot for automated dependency PRs.
