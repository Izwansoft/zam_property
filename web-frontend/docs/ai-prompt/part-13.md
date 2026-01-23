# FRONTEND (WEB) — PART 13 — ANALYTICS & DASHBOARDS UI (ROLE-SCOPED INSIGHTS) (LOCKED)

This part defines how **analytics and dashboards** are presented across portals:
- metrics and KPIs
- charts and trends
- role-based visibility
- performance and cost-safe querying

All rules from WEB PART 0–12 apply fully.

---

## 13.1 ANALYTICS UI PHILOSOPHY

Rules:
- Analytics inform decisions, not enforce rules
- Dashboards must be:
  - fast
  - understandable
  - role-appropriate
- Every metric must answer a question
- Every chart must have context

No vanity dashboards.

---

## 13.2 MODULE OWNERSHIP

Domain module:
- `modules/analytics/*`

Rules:
- Analytics module is read-only
- No mutations allowed
- No analytics logic outside this module

---

## 13.3 ROLE-BASED DASHBOARDS (AUTHORITATIVE)

### Platform Admin Dashboard
Focus:
- Platform health
- Tenant growth
- Vertical performance
- Monetisation signals

Metrics examples:
- Active tenants
- Listings by vertical
- Interactions volume
- Usage vs limits (aggregated)
- Revenue indicators (if exposed)

---

### Tenant Admin Dashboard
Focus:
- Marketplace performance
- Vendor activity
- Content quality
- Usage efficiency

Metrics examples:
- Active listings
- Leads/bookings trend
- Vendor response times
- Review ratings
- Usage counters vs plan

---

### Vendor Dashboard
Focus:
- Personal performance
- Listing effectiveness
- Lead conversion

Metrics examples:
- Views/leads per listing
- Response rate
- Active listings
- Reviews summary

Rules:
- Vendors see only their own data
- No cross-vendor comparison

---

## 13.4 DASHBOARD PAGE STRUCTURE

Each dashboard page must include:
- Header with time range selector
- KPI cards (top-level)
- Charts/graphs (trend-based)
- Tables (top items)
- Context/help text

Rules:
- Default time range must be sensible (e.g. last 30 days)
- Time range must be adjustable
- Charts must reflect time range clearly

---

## 13.5 METRIC DEFINITION & LABELING

Rules:
- Metric labels must be human-readable
- Tooltips must explain what the metric means
- Units must be explicit (count, %, currency if allowed)
- Metric definitions must match backend definitions

No ambiguous metrics.

---

## 13.6 FILTERING & SEGMENTATION

Rules:
- Filters must be role-appropriate:
  - Platform: tenant, vertical
  - Tenant: vendor, vertical
  - Vendor: listing
- Filters must be explicit and resettable
- Filter state should be reflected in URL when appropriate

---

## 13.7 PERFORMANCE & LOADING RULES

Rules:
- Analytics queries must be paginated or aggregated
- Avoid N+1 chart queries
- Use skeletons for charts while loading
- Cache analytics queries with appropriate TTL

Dashboards must feel fast.

---

## 13.8 EMPTY & PARTIAL DATA HANDLING

Rules:
- No-data states must explain why:
  - “No data yet”
  - “Data still processing”
- Partial data must be indicated clearly
- “Last updated” timestamp should be shown where relevant

---

## 13.9 VISUALIZATION RULES

Rules:
- Use simple, readable charts (line, bar, stacked)
- Avoid overloading a single chart
- Use consistent color mapping for statuses/verticals
- Respect shadcn kit styling

Clarity over aesthetics.

---

## 13.10 EXPORT & SHARING (OPTIONAL PHASE 1.5)

If supported:
- CSV export for tables
- Time-range export
- Exports must respect permissions

Exports must be auditable.

---

## 13.11 MODULE API SURFACE (EXPECTED)

Analytics module should provide:
- `useDashboardSummary(context, timeRange)`
- `useTrendMetrics(context, metricKey, timeRange)`
- `useTopItems(context, metricKey, params)`

---

## 13.12 TESTING REQUIREMENTS (ANALYTICS UI)

Must include:
- unit tests for metric mappers
- unit tests for role-based visibility guards
- integration tests for dashboard load
- E2E critical path:
  - tenant admin views dashboard metrics correctly

---

## 13.13 FORBIDDEN PRACTICES

You must not:
- Compute analytics client-side
- Mix tenant data accidentally
- Show monetisation metrics to unauthorized roles
- Over-fetch raw analytics events

---

## 13.14 EXECUTION DIRECTIVE

Analytics UI must:
- Respect role and tenant boundaries
- Be fast and readable
- Reflect backend metrics accurately
- Help users make decisions, not confuse them

Insights without clarity are useless.

END OF WEB PART 13.