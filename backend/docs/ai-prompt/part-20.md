# PART 20 — PRICING MODELS (LEAD-BASED, COMMISSION, SAAS) (LOCKED)

This part defines the **pricing strategies** supported by the platform.
Pricing is a **business configuration**, not an architectural concern.

All rules from PART 0–19 apply.

---

## 20.1 PRICING PHILOSOPHY

Pricing models:
- Are declarative
- Are tenant-configurable
- Are enforced via entitlements + usage
- Must not require domain changes

Adding a new pricing model must not require refactoring core logic.

---

## 20.2 SUPPORTED PRICING MODELS (AUTHORITATIVE)

The platform must support the following pricing models:

### A) SaaS Subscription
- Fixed recurring fee
- Tiered plans
- Feature-based access

Typical for:
- Platform access
- Vendor onboarding
- Admin tools

---

### B) Pay-Per-Lead / Pay-Per-Interaction
- Charge per lead, enquiry, or booking
- Price may vary by vertical
- Free quota + paid overage supported

Typical for:
- Property
- Services
- Vehicles

---

### C) Commission-Based
- Percentage of transaction value
- Flat commission per booking
- Hybrid commission + subscription

Typical for:
- Rentals
- Equipment
- Events
- B2B deals

---

### D) Listing-Based Pricing
- Charge per active listing
- Charge per published listing
- Charge per featured listing

Typical for:
- Property
- Cars
- Goods

---

### E) Add-ons & Boosts
- Featured placement
- Priority ranking
- Extra media slots
- Premium analytics

Add-ons are entitlements.

---

## 20.3 PRICING MODEL COMPOSITION

Rules:
- A tenant may use multiple pricing models
- Pricing models must be composable
- Conflicts must be resolved explicitly

Example:
- Subscription + Pay-per-lead
- Subscription + Commission
- Free tier + Paid add-ons

---

## 20.4 VERTICAL-AWARE PRICING

Rules:
- Pricing may differ per vertical
- Vertical context must be explicit
- Core must not hardcode pricing logic

Example:
- Property leads: RM10 each
- Car leads: RM5 each
- Services bookings: 10% commission

---

## 20.5 CONFIGURATION LOCATION

Pricing configuration lives in:
- Plan definitions
- Add-on definitions
- Usage thresholds
- Billing adapter settings

Pricing logic must not live in domains.

---

## 20.6 ENFORCEMENT MECHANISM

Rules:
- Pricing enforcement occurs via:
  - Entitlements (access)
  - Usage thresholds (limits)
- Billing adapters calculate charges
- Domains remain pricing-agnostic

Domains do not “know” prices.

---

## 20.7 TRANSPARENCY & REPORTING

Rules:
- Pricing rules must be visible to tenants
- Charges must be explainable
- Usage breakdowns must be available
- Disputes must be traceable

Black-box pricing is forbidden.

---

## 20.8 FREE, PROMOTIONAL & ENTERPRISE PRICING

Rules:
- Free tiers supported
- Promotional pricing supported (time-bound)
- Enterprise pricing supported via overrides

Overrides must be auditable and scoped.

---

## 20.9 PRICING CHANGES & MIGRATION

Rules:
- Pricing changes must not affect historical charges
- Changes apply prospectively
- Migration paths must be explicit
- Users must be notified

Retroactive pricing changes are forbidden.

---

## 20.10 FORBIDDEN PRACTICES

You must not:
- Hardcode prices in code
- Tie pricing to vertical logic
- Block core flows due to pricing errors
- Hide pricing rules from tenants

---

## 20.11 EXECUTION DIRECTIVE

Pricing must:
- Be flexible
- Be explainable
- Be vertical-aware
- Remain outside core business logic

Pricing changes should feel like configuration, not engineering.

END OF PART 20.