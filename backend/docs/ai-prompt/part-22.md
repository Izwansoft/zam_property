# PART 22 — AUDIT LOGS, COMPLIANCE & GOVERNANCE (LOCKED)

This part defines how the platform ensures **traceability, compliance, and governance**
without impacting performance or contaminating business logic.

All rules from PART 0–21 apply.

---

## 22.1 AUDIT PHILOSOPHY

Audit logging is:
- Mandatory
- Append-only
- Tamper-resistant
- Tenant-aware
- Independent of business logic

If an action matters, it must be auditable.

---

## 22.2 WHAT MUST BE AUDITED (AUTHORITATIVE)

The platform must audit at minimum:
- Authentication & authorization events
- Tenant lifecycle changes
- Vendor lifecycle changes
- Listing lifecycle changes
- Subscription & entitlement changes
- Billing-related state changes (non-sensitive)
- Role & permission changes
- Manual overrides & admin actions

Auditing must be comprehensive, not selective.

---

## 22.3 AUDIT EVENT STRUCTURE

Each audit record must include:
- id
- tenant_id (nullable for platform-level)
- actor_type (user | system | admin)
- actor_id (hashed where required)
- action_type
- target_type
- target_id
- metadata (structured, minimal)
- ip_address (optional)
- user_agent (optional)
- timestamp

Rules:
- No PII unless strictly required
- Metadata must be structured
- Payload size must be bounded

---

## 22.4 APPEND-ONLY & IMMUTABILITY RULES

Rules:
- Audit logs are append-only
- No updates or deletes
- Corrections must be new entries
- Storage must prevent silent modification

Audit integrity is non-negotiable.

---

## 22.5 EVENT-DRIVEN AUDITING

Rules:
- Audit logs are generated from domain events
- Domain logic must not write audit records directly
- Audit handlers must be async
- Failures must not block core flows

Auditing must be reliable, not intrusive.

---

## 22.6 TENANT ISOLATION & VISIBILITY

Rules:
- Tenants may view only their own audit logs
- Vendors may have limited visibility (optional)
- Platform owners may view global logs
- Cross-tenant access is forbidden by default

Audit access must itself be auditable.

---

## 22.7 COMPLIANCE SUPPORT

The platform must support:
- GDPR-style data access requests
- Data retention policies
- Logical deletion tracking
- Consent and preference auditing

Compliance features must be configurable per tenant.

---

## 22.8 REGULATED VERTICAL SUPPORT

Rules:
- Certain verticals may require stricter auditing
- Compliance flags must be supported
- Extra metadata may be required per vertical
- Compliance extensions must not alter core logic

Regulated requirements are extensions, not forks.

---

## 22.9 RETENTION & ARCHIVAL

Rules:
- Retention periods must be configurable
- Cold storage must be supported
- Archived logs must be retrievable
- Deletion must respect legal requirements

Audit data must outlive application bugs.

---

## 22.10 SECURITY & INTEGRITY

Rules:
- Audit storage must be access-controlled
- Integrity checks must exist
- Exported logs must be verifiable
- Time synchronization must be reliable

Audit logs must be trustworthy.

---

## 22.11 REPORTING & EXPORT

Rules:
- Audit logs must be queryable
- Filtering by time, action, actor supported
- Exports must be read-only
- Exports must be logged

---

## 22.12 FORBIDDEN PRACTICES

You must not:
- Allow deletion of audit logs
- Hide admin actions from audit
- Mix audit data with business tables
- Expose audit logs publicly

---

## 22.13 EXECUTION DIRECTIVE

Audit & compliance must:
- Be comprehensive
- Be immutable
- Be tenant-safe
- Be operationally reliable

If it isn’t audited, it didn’t happen.

END OF PART 22.