# PART 18 — USAGE TRACKING & QUOTA MANAGEMENT (LOCKED)

This part defines how the platform **measures consumption**, evaluates quotas,
and feeds monetisation and analytics — without blocking core business flows.

All rules from PART 0–17 apply.

---

## 18.1 USAGE PHILOSOPHY

Usage tracking:
- Is observational, not authoritative
- Is tenant-scoped
- Is eventually consistent
- Must never block successful domain operations

Usage is a signal, not a gate (gates are entitlements).

---

## 18.2 USAGE CONCEPTS (LOCKED)

Definitions:
- **Usage Metric**: A measurable action (e.g. listings_created)
- **Counter**: Accumulated usage value
- **Period**: Time window (daily, monthly, yearly)
- **Threshold**: Limit tied to an entitlement

These definitions are canonical.

---

## 18.3 SUPPORTED USAGE METRICS

The platform must support metrics such as:
- Listings created (per vertical)
- Listings published
- Interactions created (leads/bookings)
- Media uploads
- API requests
- Notification sends
- Search queries (optional)

Metrics must be extensible without refactor.

---

## 18.4 TENANT & VERTICAL SCOPING

Rules:
- All usage metrics are tenant-scoped
- Metrics may be vertical-scoped
- Vendor-level breakdowns are optional
- Cross-tenant aggregation is forbidden by default

Example metric key:
listing.create.vehicles

yaml
Copy code

---

## 18.5 INCREMENT STRATEGY

Rules:
- Usage increments occur AFTER successful execution
- Increments must be idempotent
- Increments are async where possible
- Increments must tolerate retries

Usage updates must never rollback domain writes.

---

## 18.6 PERIOD MANAGEMENT

Rules:
- Usage is tracked per defined period
- Periods reset automatically
- Reset schedules must be configurable
- Historical usage must be preserved

Backdated mutations are forbidden.

---

## 18.7 STORAGE & PERFORMANCE

Rules:
- Counters must be optimized for writes
- Reads must be fast and cached
- Hot paths must not query historical data
- Aggregation jobs may run async

Usage tracking must scale with traffic.

---

## 18.8 THRESHOLD DETECTION

Rules:
- Thresholds are defined by entitlements
- Crossing a threshold emits events
- Soft thresholds emit warnings
- Hard thresholds are enforced upstream

Usage layer does not block actions directly.

---

## 18.9 EVENTS (MANDATORY)

Usage-related events include:
- UsageIncremented
- UsageThresholdReached
- UsagePeriodReset

Rules:
- Events include tenant context
- Events include metric identifiers
- Events contain no billing logic

---

## 18.10 VISIBILITY & REPORTING

Rules:
- Tenants can view their own usage
- Vendors may see scoped usage (optional)
- Platform admins can view aggregates
- Usage data must be explainable

No black-box counters.

---

## 18.11 FAILURE HANDLING

Rules:
- Failed increments must retry
- Lost increments must be detectable
- Partial data must not corrupt totals
- Monitoring must exist for drift

Accuracy is important, perfection is not required.

---

## 18.12 PRIVACY & COMPLIANCE

Rules:
- Usage data must not expose PII
- Aggregation must anonymize where needed
- Retention policies must be configurable

---

## 18.13 FORBIDDEN PRACTICES

You must not:
- Block execution based on usage layer
- Mix usage logic with billing providers
- Hardcode metric keys in domains
- Mutate historical usage silently

---

## 18.14 EXECUTION DIRECTIVE

Usage tracking must:
- Be reliable
- Be observable
- Be tenant- and vertical-aware
- Remain decoupled from core logic

Usage informs decisions; entitlements enforce them.

END OF PART 18.