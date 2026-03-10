# FRONTEND (WEB) — PART 12 — SUBSCRIPTIONS, ENTITLEMENTS & USAGE UI (PLANS, LIMITS & ACCESS VISIBILITY) (LOCKED)

This part defines how **plans, subscriptions, entitlements, and usage limits**
are surfaced across the dashboard so users clearly understand:
- what they have
- what they can do
- why something is blocked
- what to upgrade or request

All rules from WEB PART 0–11 apply fully.

---

## 12.1 MONETISATION UI PHILOSOPHY

Rules:
- The UI explains access; it does not compute billing
- Limits and denials must be explicit and human-readable
- Upgrade paths must be clear but non-deceptive
- Platform owners configure; tenants consume; vendors view (mostly read-only)

No “mystery limits”.

---

## 12.2 MODULE OWNERSHIP

Domain modules:
- `modules/subscriptions/*`
- `modules/entitlements/*`
- `modules/usage/*`

Rules:
- These modules are read-heavy
- They must be consistent across portals
- They must never infer access independently of backend data

---

## 12.3 ROLE-BASED VISIBILITY (AUTHORITATIVE)

### Platform Admin Portal
Platform Admins may:
- View all tenant subscriptions
- Configure plans & pricing (high-level UI only)
- View entitlement definitions (read-only)
- Inspect usage across tenants
- Trigger entitlement refresh (ops action)

---

### Tenant Admin Portal
Tenant Admins may:
- View current subscription & plan details
- View enabled verticals & features
- View usage counters vs limits
- View overage states and warnings
- Initiate upgrade/contact sales (CTA only)

Tenant Admins must NOT:
- Edit global plan definitions
- See other tenants’ usage

---

### Vendor Portal
Vendors may:
- View vendor-level limits (if applicable)
- View listing/lead usage counters
- Understand why actions are blocked
- View plan name and basic allowances (read-only)

Vendors must NOT:
- Change plans
- See tenant-level billing data

---

## 12.4 SUBSCRIPTION SUMMARY UI

Subscription summary panel must show:
- Plan name
- Billing period (monthly/annual)
- Status (active/past_due/cancelled)
- Enabled verticals
- Key feature highlights

Rules:
- Status badge standardized
- “What’s included” must be explicit
- No pricing math performed client-side

---

## 12.5 ENTITLEMENTS DISPLAY (FEATURE ACCESS)

Entitlements UI must:
- Group entitlements by domain (Listings, Interactions, Analytics, etc.)
- Display:
  - enabled / disabled
  - quota-based limits (if applicable)
- Provide explanation tooltip or text

Examples:
- “Max active listings: 50”
- “Leads per month: 100”
- “Advanced analytics: Not included”

Rules:
- Entitlements are descriptive, not editable (except platform config UI)
- UI must match backend enforcement exactly

---

## 12.6 USAGE DASHBOARD

Usage dashboard must show:
- Usage counters (current period)
- Limit values
- Percentage used
- Warning thresholds (e.g. 80%, 100%)
- Reset date (billing cycle)

Rules:
- Usage is eventually consistent
- UI must show “last updated” timestamp
- Over-limit state must be obvious

---

## 12.7 DENIAL & LIMIT UX (CRITICAL)

When a user attempts a blocked action:
- Disable the action pre-emptively if possible
- If attempted, show a clear message:
  - “You’ve reached your listing limit”
  - “Your plan does not include this feature”
- Provide next step:
  - upgrade
  - contact admin
  - wait for reset

Rules:
- No silent failures
- No generic “Forbidden” without context

---

## 12.8 UPGRADE & CTA RULES

Rules:
- Upgrade CTAs are informational
- No direct checkout unless explicitly added later
- CTA destinations:
  - contact sales
  - request upgrade
  - view plans comparison

UI must not promise instant upgrade unless backend supports it.

---

## 12.9 USAGE & ENTITLEMENT SYNC STATES

Rules:
- UI must handle stale data gracefully
- If usage data is temporarily unavailable:
  - show last known values
  - indicate sync delay
- Manual refresh allowed (permissioned)

---

## 12.10 MODULE API SURFACE (EXPECTED)

Subscriptions module:
- `useSubscriptionSummary(tenantId)`
- `useTenantPlans()`
- `useUpgradeInfo()` (read-only)

Entitlements module:
- `useEntitlementsSnapshot(context)`
- `useFeatureAvailability(featureKey)`

Usage module:
- `useUsageCounters(context)`
- `useUsageWarnings(context)`

---

## 12.11 VISUAL & UX CONSISTENCY

Rules:
- Use cards, tables, and progress bars from shadcn kit
- Avoid clutter
- Highlight limits visually (color + text)
- Keep terminology consistent across portals

---

## 12.12 TESTING REQUIREMENTS (MONETISATION UI)

Must include:
- unit tests for entitlement guard helpers
- unit tests for usage mapping
- integration tests for blocked action messaging
- E2E critical path:
  - vendor hits listing limit → sees correct message
  - tenant admin views usage dashboard

---

## 12.13 FORBIDDEN PRACTICES

You must not:
- Calculate billing amounts client-side
- Guess entitlements based on plan name
- Hide blocked actions without explanation
- Show upgrade CTAs to unauthorized roles

---

## 12.14 EXECUTION DIRECTIVE

Subscriptions, entitlements, and usage UI must:
- Be transparent
- Match backend enforcement exactly
- Reduce support tickets
- Encourage informed upgrades, not confusion

Access clarity builds trust.

END OF WEB PART 12.