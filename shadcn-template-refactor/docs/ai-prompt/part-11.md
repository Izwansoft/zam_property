# FRONTEND (WEB) — PART 11 — REVIEWS, RATINGS & TRUST MODULE (MODERATION, SIGNALS & VISIBILITY) (LOCKED)

This part defines the UI for **Reviews, Ratings, and Trust Signals** across portals:
- review visibility
- moderation workflows
- trust indicators
- safe handling of abuse and disputes

All rules from WEB PART 0–10 apply fully.

---

## 11.1 TRUST UI PHILOSOPHY

Trust is earned, not assumed.
The UI must:
- make trust signals visible but not manipulable
- support moderation without silencing valid feedback
- protect users from abuse
- remain auditable and explainable

No hidden trust logic.

---

## 11.2 REVIEWS MODULE OWNERSHIP

Domain module:
- `modules/reviews/*`

Rules:
- Reviews module owns all fetching, mutations, and mappers
- Reviews are always tied to:
  - a listing
  - a vendor
- Backend does NOT enforce interaction-based review eligibility server-side
  (reviews require listingId and vendorId but no completed interaction)

---

## 11.3 ROLE-BASED VISIBILITY (AUTHORITATIVE)

### Vendor Portal
Vendors may:
- View reviews for their listings
- View aggregated ratings and trends
- Respond to reviews (reply only)
- See moderation outcomes (approved/rejected)

Vendors must NOT:
- Delete reviews
- Hide reviews
- See internal moderation notes
- Edit ratings content

---

### Tenant Admin Portal
Tenant Admins may:
- View all reviews in tenant
- Moderate reviews (approve, reject, flag)
- Respond officially (if allowed)
- View abuse signals and reports
- Override visibility in exceptional cases (audited)

---

### Platform Admin Portal
Platform Admins may:
- View reviews across tenants
- Inspect abuse patterns
- Adjust moderation rules (config-only)
- Perform escalated moderation (audited)

---

## 11.4 REVIEWS LIST PAGE

List page must include:
- Filters:
  - status (pending/approved/rejected/flagged)
  - rating (1–5)
  - listing
  - vendor
  - date range
- Search (by content keyword)
- Paginated table/list

List items show:
- Rating stars
- Review snippet
- Status badge
- Listing reference
- Vendor
- Created date
- Quick action (view/moderate)

Rules:
- Default view prioritizes pending/flagged reviews (for admins)
- Pagination mandatory
- URL-driven filters

---

## 11.5 REVIEW DETAIL & MODERATION PAGE

Detail page sections:
- Review content (read-only)
- Rating breakdown
- Interaction reference (masked as needed)
- Review history (if edited/reported)
- Moderation panel:
  - Approve
  - Reject (with reason)
  - Flag / Escalate
- Internal notes (admin only)

Rules:
- Rejecting/flagging requires a reason
- Decisions must be confirmed
- Actions must be auditable

---

## 11.6 REVIEW RESPONSE FLOW (VENDOR)

Vendor response UI:
- Allows reply text only
- Cannot modify original review
- Response is public (if approved)
- Response status visible (pending/approved)

Rules:
- Vendor replies may require moderation
- Abuse in replies must be handled

---

## 11.7 TRUST SIGNALS & RATING DISPLAY

UI must display:
- Average rating (rounded)
- Total review count
- Recent review trend (optional)
- Trust badges (e.g. “Verified Vendor”)

Rules:
- Trust badges are derived, not manually toggled
- Rating calculations come from backend
- UI must explain what ratings mean

No client-side rating math.

---

## 11.8 ABUSE & REPORTING UI

Admins must be able to:
- Flag reviews as abusive/spam
- View report reasons
- Track repeat offenders
- Escalate to platform-level moderation

Rules:
- Abuse signals are visible but not public
- Reporting actions must be auditable

---

## 11.9 VISIBILITY RULES

Rules:
- Approved reviews are visible to all allowed viewers
- Pending reviews are hidden from vendors and public views
- Rejected reviews are hidden but retained for audit
- Soft-deleted reviews remain in audit logs

---

## 11.10 MODULE API SURFACE (EXPECTED)

Reviews module should provide:
- `useReviewsList(params)`
- `useReviewDetail(reviewId)`
- `useApproveReview()`
- `useRejectReview()`
- `useFlagReview()`
- `useReplyToReview()`

---

## 11.11 PERFORMANCE & UX RULES

Rules:
- Avoid loading heavy review content in lists
- Lazy-load long content
- Use skeletons for rating summaries
- Ensure moderation actions are fast and responsive

---

## 11.12 TESTING REQUIREMENTS (REVIEWS)

Must include:
- unit tests for review mappers
- unit tests for moderation guards
- integration tests for approve/reject flows
- E2E critical path:
  - tenant admin moderates review
  - vendor sees updated status

---

## 11.13 FORBIDDEN PRACTICES

You must not:
- Allow vendors to delete or hide reviews
- Calculate ratings in UI
- Expose moderation notes to vendors
- Skip audit logging on moderation actions

---

## 11.14 EXECUTION DIRECTIVE

Reviews & Trust UI must:
- Preserve integrity of feedback
- Enable fair moderation
- Display trust signals transparently
- Integrate cleanly with interactions and listings

Trust is a platform asset.

END OF WEB PART 11.