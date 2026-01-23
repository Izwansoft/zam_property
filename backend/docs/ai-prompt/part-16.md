# PART 16 — SUBSCRIPTIONS, PLANS & MONETISATION MODELS (LOCKED)

This part defines how the platform generates revenue while remaining
**vertical-agnostic**, **tenant-scoped**, and **architecturally clean**.

All rules from PART 0–15 apply.

---

## 16.1 MONETISATION PHILOSOPHY

Monetisation is enforced via:
- Subscriptions
- Entitlements
- Usage tracking

Billing providers are implementation details.

Business logic must never depend on payment state.

---

## 16.2 SUBSCRIPTION MODEL

Definitions:
- **Plan**: A static definition of entitlements
- **Subscription**: A tenant’s active plan instance

Rules:
- Subscriptions are tenant-level
- A tenant has at most one active subscription
- Subscriptions have lifecycle states:
  - active
  - past_due
  - paused
  - cancelled

Subscription state changes emit events.

---

## 16.3 PLAN STRUCTURE

A plan may define:
- Allowed verticals
- Listing limits per vertical
- Interaction limits (leads/bookings)
- Media upload quotas
- Feature flags
- Support level

Plans must be declarative, not procedural.

---

## 16.4 MULTI-VERTICAL PRICING SUPPORT

Rules:
- Plans may include multiple vertical allowances
- Limits may differ per vertical
- New verticals must not require plan redesign

Example:
- Property: 10 listings
- Vehicles: 5 listings
- Services: unlimited

Vertical expansion must not break monetisation.

---

## 16.5 SUBSCRIPTION LIFECYCLE RULES

Rules:
- Subscription changes must be auditable
- Grace periods must be configurable
- Cancellation does not delete data
- Downgrades may restrict future actions only

Historical data must remain accessible.

---

## 16.6 MONETISATION EVENTS

Events include:
- SubscriptionCreated
- SubscriptionUpdated
- SubscriptionCancelled
- PlanChanged

Rules:
- Events include tenant context
- Events contain no billing provider data
- Billing adapters subscribe to events

---

## 16.7 BILLING PROVIDER ABSTRACTION

Rules:
- Billing providers are adapters
- No provider-specific logic in domains
- Providers may fail without corrupting state
- Providers may be swapped

Supported models:
- Subscription billing
- Pay-per-use
- Manual invoicing
- Enterprise contracts

---

## 16.8 FREE, TRIAL & ENTERPRISE PLANS

Rules:
- Free plans are supported
- Trial periods are configurable
- Enterprise plans may bypass limits via overrides

Overrides must be explicit and auditable.

---

## 16.9 FEATURE FLAGS & ADD-ONS

Rules:
- Add-ons are entitlements
- Add-ons are composable
- Feature flags must be tenant-scoped

Paid features must not be hardcoded.

---

## 16.10 MONETISATION FAILURE HANDLING

Rules:
- Past-due subscriptions may enter grace period
- Hard blocks occur only after grace
- Soft warnings must be emitted via events

User experience must degrade gracefully.

---

## 16.11 FORBIDDEN PRACTICES

You must not:
- Check payment state in domain services
- Hardcode limits in business logic
- Block reads due to billing
- Tie billing providers to core modules

---

## 16.12 EXECUTION DIRECTIVE

All monetisation logic must:
- Be declarative
- Be tenant-scoped
- Be enforceable upstream
- Remain replaceable

Money must flow without poisoning the architecture.

END OF PART 16.