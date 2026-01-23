# PART 17 — ENTITLEMENTS & ENFORCEMENT LAYER (LOCKED)

This part defines how **plans become permissions**, how limits are enforced,
and how the platform prevents abuse **without contaminating domain logic**.

All rules from PART 0–16 apply.

---

## 17.1 ENTITLEMENT PHILOSOPHY

Entitlements are:
- The single source of truth for access control
- Resolved per tenant
- Evaluated BEFORE domain execution
- Independent of billing providers

Domains must assume entitlements have already been enforced.

---

## 17.2 CORE DEFINITIONS (LOCKED)

Definitions:
- **Entitlement**: A resolved capability (boolean, quota, or rate)
- **Policy**: A mapping between actions and entitlements
- **Enforcement Point**: Where access is allowed or denied

These definitions are canonical and must not be reinterpreted.

---

## 17.3 ENTITLEMENT TYPES

Supported entitlement types:
- **Boolean**: allow/deny (e.g. `listing.publish`)
- **Quota**: numeric limits (e.g. `listing.create.limit`)
- **Rate**: time-bound limits (e.g. `api.requests.per_min`)
- **Feature Flag**: conditional enablement

Each entitlement must declare its type explicitly.

---

## 17.4 ENTITLEMENT RESOLUTION FLOW

Resolution steps:
1. Resolve tenant subscription
2. Load plan entitlements
3. Apply tenant-specific overrides
4. Apply enterprise overrides
5. Cache resolved entitlements

Rules:
- Resolution must be deterministic
- Resolution must be fast
- Resolution must be cacheable
- Resolution must not call billing providers

---

## 17.5 ENFORCEMENT LOCATIONS (AUTHORITATIVE)

Enforcement must occur:
- At API Guards
- At Application Interceptors

Rules:
- Enforcement happens BEFORE service logic
- Enforcement is declarative
- Enforcement is auditable

Example (conceptual only):
@RequiresEntitlement("listing.create", { vertical: "vehicles" })
@RequiresQuota("listing.create.limit", 1)

yaml
Copy code

---

## 17.6 VERTICAL-AWARE ENTITLEMENTS

Rules:
- Entitlements may be vertical-specific
- Vertical context must be explicit
- Core must not hardcode vertical rules

Example:
- `listing.create.real_estate`
- `listing.create.vehicles`

---

## 17.7 HARD VS SOFT LIMITS

Rules:
- **Hard limits** block execution immediately
- **Soft limits** allow execution but emit warning events
- Limit type must be defined per entitlement

Grace periods must be configurable.

---

## 17.8 USAGE INTEGRATION

Rules:
- Successful actions may increment usage counters
- Usage increments must be idempotent
- Usage updates occur AFTER successful execution
- Usage failures must not rollback core actions

Usage tracking is eventual, not transactional.

---

## 17.9 OVERRIDES & EXCEPTIONS

Rules:
- Overrides must be explicit
- Overrides must be auditable
- Overrides must have expiration support
- Manual overrides must be logged

Implicit bypasses are forbidden.

---

## 17.10 ERROR HANDLING

Rules:
- Denials must be explicit
- Error messages must be user-readable
- Error codes must be stable
- Internal resolution details must not leak

Example:
ENTITLEMENT_DENIED: Listing creation limit reached

yaml
Copy code

---

## 17.11 OBSERVABILITY & AUDIT

Rules:
- All enforcement decisions must be logged
- Denials must be traceable
- Metrics must exist for entitlement usage
- Correlation IDs must be preserved

---

## 17.12 PERFORMANCE & CACHING

Rules:
- Entitlements must be cached per tenant
- Cache invalidation must occur on plan change
- Cache TTL must be configurable
- Stale entitlements must fail safe (deny)

---

## 17.13 FORBIDDEN PRACTICES

You must not:
- Check plans inside domain services
- Hardcode limits in business logic
- Skip enforcement for convenience
- Perform billing checks during enforcement

---

## 17.14 EXECUTION DIRECTIVE

All access control must:
- Flow through this entitlement layer
- Be declarative and auditable
- Remain vertical-agnostic at core

Entitlements are the gatekeepers of the platform.

END OF PART 17.