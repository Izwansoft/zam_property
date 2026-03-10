# FRONTEND (WEB) — PART 14 — AUDIT LOGS, FEATURE FLAGS & ADMIN OPS UI (LOCKED)

This part defines **operational control surfaces** for administrators:
- audit log viewers
- feature flag management
- operational / support tools
- safe admin-only actions

All rules from WEB PART 0–13 apply fully.

---

## 14.1 OPERATIONS UI PHILOSOPHY

Rules:
- Admin power must be visible, scoped, and auditable
- Operational tools must be safe by default
- Read-only first, write only when necessary
- No hidden backdoors

If an action can affect many users, it must be traceable.

---

## 14.2 MODULE OWNERSHIP

Domain modules:
- `modules/audit/*`
- `modules/feature-flags/*`
- `modules/ops/*`

Rules:
- Ops modules are admin-only
- They must never bypass backend rules
- Every action must surface audit confirmation

---

## 14.3 AUDIT LOGS UI

### Audit Logs List Page
Must include:
- Filters:
  - entity type (tenant, vendor, listing, interaction, etc.)
  - action type
  - actor type (user/system/admin)
  - date range
- Search (by entity ID or reference)
- Paginated table

Table columns:
- Timestamp
- Actor
- Action
- Target
- Result/status
- Request ID (if available)

Rules:
- Pagination mandatory
- Default sort: newest first
- Filters URL-driven

---

### Audit Log Detail View
Must show:
- Full action description
- Actor details (masked where needed)
- Target entity snapshot (minimal)
- Metadata (structured JSON, read-only)
- Correlation/request ID
- Related actions (optional)

Rules:
- Audit records are immutable
- No edit or delete UI
- Export must be permissioned

---

## 14.4 ROLE-BASED AUDIT VISIBILITY

Rules:
- Platform Admin: global audit logs
- Tenant Admin: tenant-scoped logs only
- Vendor: no audit log access (unless explicitly allowed later)
- Support/Ops: scoped, read-only access

Audit visibility itself must be auditable.

---

## 14.5 FEATURE FLAGS UI

Feature Flags UI must support:
- Listing flags
- Flag scope:
  - global
  - tenant
  - vertical
- Flag types:
  - boolean
  - percentage rollout
- Flag status indicators (on/off/partial)

Rules:
- Flags must show description and owner
- Flags must show last modified + by whom
- Flag changes must require confirmation
- Flag changes must be audited

---

## 14.6 FLAG EDIT FLOW

Editing a flag must:
- Show current effective value
- Show scope clearly
- Require explicit confirmation
- Apply changes without page reload where possible

Rules:
- Emergency kill switches must be visually distinct
- Rollback action must be available

---

## 14.7 OPERATIONAL TOOLS (OPS UI)

Platform Ops UI may include:
- Background job status
- Failed job inspection
- Retry job action
- Search reindex trigger
- Cache refresh trigger
- Entitlement refresh

Rules:
- Ops actions must be clearly labeled as dangerous
- Require confirmation
- Be permissioned
- Be audited

---

## 14.8 SUPPORT & DIAGNOSTICS UI

Support tools may allow:
- Tenant lookup
- Vendor lookup
- Listing lookup
- Read-only state inspection
- Support notes (internal)

Rules:
- No direct data mutation without admin flow
- Notes are internal-only
- Lookups must respect scope

---

## 14.9 UX SAFETY MECHANISMS

Rules:
- Dangerous actions require:
  - confirmation dialog
  - explicit reason (optional but encouraged)
- Long-running ops must show progress/feedback
- Errors must show request ID for support tracing

---

## 14.10 MODULE API SURFACE (EXPECTED)

Audit module:
- `useAuditLogsList(params)`
- `useAuditLogDetail(id)`

Feature Flags module:
- `useFeatureFlagsList()`
- `useUpdateFeatureFlag()`

Ops module:
- `useJobStatus()`
- `useRetryJob()`
- `useTriggerReindex()`
- `useRefreshEntitlements()`

---

## 14.11 PERFORMANCE & SECURITY RULES

Rules:
- Ops pages must be protected from accidental reload loops
- Heavy queries must be paginated
- Sensitive data must be masked by default
- No client-side aggregation of audit data

---

## 14.12 TESTING REQUIREMENTS (OPS & ADMIN)

Must include:
- unit tests for permission guards
- unit tests for audit mappers
- integration tests for flag toggle flow
- E2E critical path:
  - platform admin toggles flag
  - audit log entry appears

---

## 14.13 FORBIDDEN PRACTICES

You must not:
- Hide admin actions from audit
- Allow inline destructive actions without confirmation
- Expose ops tools to non-admin roles
- Modify audit data

---

## 14.14 EXECUTION DIRECTIVE

Admin Ops UI must:
- Be safe and explicit
- Provide operational visibility
- Never bypass backend enforcement
- Leave a clear audit trail

Power must always leave fingerprints.

END OF WEB PART 14.