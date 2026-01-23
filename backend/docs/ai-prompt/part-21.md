# PART 21 — ANALYTICS & REPORTING (LOCKED)

This part defines how the platform collects, aggregates, and exposes insights
for tenants, vendors, and platform owners — without slowing core operations.

All rules from PART 0–20 apply.

---

## 21.1 ANALYTICS PHILOSOPHY

Analytics:
- Are derived from events and snapshots
- Must never block user-facing flows
- Are eventually consistent
- Must be explainable and auditable

Analytics inform decisions; they do not enforce them.

---

## 21.2 ANALYTICS SCOPE

The platform must support analytics for:
- Listings performance
- Interactions (leads/bookings)
- Conversion funnels
- Usage & limits
- Revenue & pricing (aggregated)
- Search & discovery performance
- Vendor performance
- Vertical-level insights

Analytics must be vertical-aware but core-managed.

---

## 21.3 DATA SOURCES (AUTHORITATIVE)

Analytics may consume data from:
- Domain events
- Usage counters
- Search metrics
- Billing summaries (non-sensitive)
- Periodic snapshots

Rules:
- No synchronous reads from transactional paths
- No joins on hot paths
- No direct dependency from domains

---

## 21.4 COLLECTION MODEL

Rules:
- Collection is event-driven
- Events are enriched asynchronously
- Write amplification must be controlled
- Backpressure must be supported

Analytics ingestion must be resilient.

---

## 21.5 STORAGE & MODELS

Rules:
- Analytics storage may be separate from OLTP
- Time-series friendly schemas preferred
- Aggregations must be precomputed where possible
- Raw events retention must be configurable

Do not overload the primary database.

---

## 21.6 TENANT & ROLE VISIBILITY

Rules:
- Tenants see only their own analytics
- Vendors see scoped analytics (optional)
- Platform owners see global aggregates
- Vertical comparisons must respect isolation

Cross-tenant visibility is forbidden by default.

---

## 21.7 REPORTING & DASHBOARDS

Rules:
- Dashboards are read-only
- Metrics must be defined explicitly
- Time ranges must be selectable
- Exports (CSV/PDF) must be supported

Reports must not trigger heavy recomputation.

---

## 21.8 REAL-TIME VS BATCH

Rules:
- Near-real-time metrics are acceptable (seconds/minutes)
- Batch reports are acceptable (hourly/daily)
- SLA per metric must be defined

False “real-time” promises are forbidden.

---

## 21.9 ANOMALY & ALERTING

Rules:
- Threshold-based alerts supported
- Anomaly detection optional
- Alerts must be configurable
- Alerts must not spam users

Alerts inform; they do not punish.

---

## 21.10 PRIVACY & COMPLIANCE

Rules:
- Analytics must avoid PII
- Aggregation must anonymize data
- Retention policies must be configurable
- Right-to-erasure must be supported where applicable

---

## 21.11 PERFORMANCE & COST CONTROL

Rules:
- Query limits enforced
- Heavy aggregations precomputed
- Cold data archived
- Cost visibility must exist

Analytics must scale economically.

---

## 21.12 FORBIDDEN PRACTICES

You must not:
- Query analytics from transactional APIs
- Block core flows for analytics writes
- Expose raw event data publicly
- Infer analytics by scraping logs

---

## 21.13 EXECUTION DIRECTIVE

Analytics must:
- Be event-driven
- Be tenant-safe
- Be explainable
- Remain decoupled from core logic

Insight without impact is the goal.

END OF PART 21.