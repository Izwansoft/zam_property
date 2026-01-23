# PART 24 — FEATURE FLAGS, EXPERIMENTS & PROGRESSIVE ROLLOUT (LOCKED)

This part defines how the platform introduces change safely using
feature flags, experiments, and staged rollouts.

All rules from PART 0–23 apply.

---

## 24.1 ROLLOUT PHILOSOPHY

Change must be:
- Incremental
- Reversible
- Observable
- Tenant-aware

Big-bang releases are forbidden.

---

## 24.2 FEATURE FLAG TYPES

Supported flag types:
- **Boolean flags** (on/off)
- **Percentage rollouts** (0–100%)
- **Tenant-scoped flags**
- **Vertical-scoped flags**
- **Role-scoped flags**

Flags must be declarative.

---

## 24.3 FLAG OWNERSHIP & LIFECYCLE

Rules:
- Every flag has an owner
- Flags must have a description and intent
- Flags must have an expiry or review date
- Flags must be removable

Permanent flags are forbidden.

---

## 24.4 FLAG RESOLUTION ORDER

Resolution precedence:
1. Emergency override
2. Tenant-specific flag
3. Vertical-specific flag
4. Percentage rollout
5. Global default

Resolution must be deterministic and cacheable.

---

## 24.5 ENFORCEMENT LOCATIONS

Flags may be evaluated:
- At API guards
- At application interceptors
- In UI rendering logic

Rules:
- Flags must not live deep inside domain logic
- Flags must not alter core invariants

Flags gate features, not correctness.

---

## 24.6 EXPERIMENTS (A/B TESTING)

Rules:
- Experiments must be opt-in
- Experiments must define success metrics
- Assignment must be deterministic
- Experiments must be time-bound

Experiments must not affect data integrity.

---

## 24.7 TENANT & VERTICAL SAFETY

Rules:
- Experiments must not mix tenant data
- Vertical experiments must not affect other verticals
- Control groups must remain unaffected

Isolation is mandatory.

---

## 24.8 OBSERVABILITY & METRICS

Rules:
- Flag evaluations must be observable
- Experiment outcomes must be measurable
- Rollback must be fast and safe
- Metrics must be defined before rollout

No blind rollouts.

---

## 24.9 EMERGENCY KILL SWITCHES

Rules:
- Kill switches must exist for critical features
- Kill switches must override all other flags
- Kill switch usage must be audited

Fast rollback beats perfect uptime.

---

## 24.10 CONFIGURATION & MANAGEMENT

Rules:
- Flags must be configurable at runtime
- Changes must be auditable
- Access must be permissioned
- Changes must propagate safely

---

## 24.11 FORBIDDEN PRACTICES

You must not:
- Hardcode feature toggles
- Use flags to hide broken features
- Leave dead flags in code
- Change behavior silently

---

## 24.12 EXECUTION DIRECTIVE

Feature flags & experiments must:
- Enable safe evolution
- Support tenant-specific rollout
- Be reversible and observable
- Never compromise data integrity

Change is inevitable. Chaos is optional.

END OF PART 24.