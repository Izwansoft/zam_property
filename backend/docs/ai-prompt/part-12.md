# PART 12 — REVIEWS, RATINGS & TRUST SIGNALS CORE (LOCKED)

This part defines the **platform-wide trust system**.
Trust must be consistent, auditable, and resistant to abuse.

All rules from PART 0–11 apply.

---

## 12.1 TRUST SYSTEM PURPOSE

The Trust System:
- Builds confidence between users and vendors
- Improves marketplace quality
- Influences discovery and conversion
- Works across all verticals

Trust must be earned, not assumed.

---

## 12.2 TRUST ENTITIES (GENERIC)

The core trust system supports:

- **Review**
- **Rating**
- **Trust Signal** (badges, verifications, history)

These are vertical-agnostic.

---

## 12.3 REVIEW & RATING MODEL

Each review record must include:
- id
- tenant_id
- reviewer_type (end_user | system)
- reviewer_reference (hashed or anonymised)
- target_type (vendor | listing)
- target_id
- vertical_type
- rating (numeric, bounded)
- review_text (optional)
- status (pending, approved, rejected)
- created_at

Rules:
- Reviews may be moderated
- Ratings must be bounded and normalized
- Reviews are immutable once approved

---

## 12.4 TRUST SIGNALS

Trust signals may include:
- Verified vendor
- Response rate
- Completion rate
- Longevity on platform
- Compliance badges

Rules:
- Trust signals are computed
- Trust signals are read-only
- Trust signals must be explainable

Manual overrides must be auditable.

---

## 12.5 REVIEW ELIGIBILITY

Rules:
- Reviews may only be created after interaction
- Eligibility rules are configurable
- Fake or spam reviews must be rejected
- Self-reviews are forbidden

Verticals may add stricter eligibility rules.

---

## 12.6 MODERATION FLOW

Rules:
- Reviews default to `pending`
- Moderation may be manual or automated
- Rejected reviews are retained for audit
- Moderation decisions must be logged

Moderation must not block core flows.

---

## 12.7 EVENTS (MANDATORY)

Trust-related events include:
- ReviewCreated
- ReviewApproved
- ReviewRejected
- TrustSignalUpdated

Rules:
- Events emitted after persistence
- Events include tenant_id and target references
- Events contain no side effects

---

## 12.8 SEARCH & RANKING AWARENESS

Rules:
- Aggregate ratings may influence ranking
- Trust signals may influence discovery
- Raw reviews must not be indexed for search

Search consumes trust summaries only.

---

## 12.9 MONETISATION & ABUSE CONSIDERATIONS

Rules:
- Trust must not be purchasable
- Paid boosts must be labeled clearly
- Trust signals must not be overridden by billing
- Abuse patterns must be detectable

Trust integrity is non-negotiable.

---

## 12.10 PRIVACY & COMPLIANCE

Rules:
- Reviewer identity must be protected
- PII must not be exposed
- Right-to-erasure must be supported
- Anonymization must preserve analytics

---

## 12.11 FORBIDDEN PRACTICES

You must not:
- Allow vendors to edit reviews
- Delete approved reviews silently
- Expose raw reviewer identities
- Tie trust scores directly to payments

---

## 12.12 EXECUTION DIRECTIVE

All modules must:
- Use this shared trust system
- Respect moderation and eligibility rules
- Treat trust as a platform asset

Trust is fragile. Guard it carefully.

END OF PART 12.