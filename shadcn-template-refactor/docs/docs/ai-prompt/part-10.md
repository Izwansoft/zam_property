# FRONTEND (WEB) — PART 10 — INTERACTIONS MODULE (LEADS, ENQUIRIES, BOOKINGS INBOX) (LOCKED)

This part defines the UI for managing **Interactions** across portals:
- leads
- enquiries
- booking requests
- moderation and follow-up workflows
- monetisation visibility (where applicable)

All rules from WEB PART 0–9 apply fully.

---

## 10.1 INTERACTIONS UI PHILOSOPHY

Interactions represent **real user intent**.
The UI must prioritize:
- speed of response
- clarity of status
- safe handling of PII
- auditability of decisions
- role-appropriate visibility

No interaction should be lost or silently ignored.

---

## 10.2 INTERACTIONS MODULE OWNERSHIP

Domain module:
- `modules/interactions/*`

Rules:
- Interactions module owns all data fetching, mutations, and mappers
- Portals consume the same module with different permissions and filters
- Interactions are read-only by default; actions are explicit

---

## 10.3 PORTAL-SPECIFIC VISIBILITY (AUTHORITATIVE)

### Vendor Portal
Vendors may:
- View interactions for their own listings
- Respond to leads/enquiries (reply action)
- Accept / reject booking requests (if supported)
- Update interaction status (responded, closed)
- View limited interaction metadata

Vendors must NOT:
- See platform-level monetisation data
- Access interactions outside their listings

---

### Tenant Admin Portal
Tenant Admins may:
- View all interactions within tenant
- Monitor response times
- Intervene in disputes or stalled bookings
- Moderate abusive interactions
- View aggregate interaction analytics

---

### Platform Admin Portal
Platform Admins may:
- View interactions across tenants (read-only by default)
- Inspect issues for support/escalation
- View monetisation signals (lead counts, billable flags)
- Trigger operational actions (replay events, mark resolved)

---

## 10.4 INTERACTIONS LIST (INBOX) PAGE

Inbox page must include:
- Tabs or filters:
  - All
  - Unread / New
  - Responded
  - Closed
- Search (by listing title, reference ID)
- Filters:
  - interaction type (lead/enquiry/booking)
  - listing
  - status
  - date range
- Paginated table or list

Table/List items must show:
- Interaction type icon
- Listing title
- Counterparty (masked where required)
- Status badge
- Created time
- Quick action (view)

Rules:
- Default sort: newest first
- Pagination mandatory
- URL-driven filters

---

## 10.5 INTERACTION DETAIL PAGE

Detail page sections:
- Header: interaction type + status badge
- Summary:
  - listing reference
  - vendor
  - tenant (platform only)
- Interaction content:
  - message history
  - booking details (dates, quantities if applicable)
- Metadata:
  - source
  - timestamps
- Actions panel:
  - reply
  - accept / reject (booking)
  - mark closed
  - escalate (tenant/platform)

Rules:
- PII fields must be masked if role does not allow full visibility
- Actions must be permission-checked and entitlement-checked

---

## 10.6 RESPONSE & ACTION FLOWS

### Reply / Respond
- Opens a form modal or inline editor
- Validates required content
- Submits via mutation
- Updates interaction status
- Triggers notification event

### Accept / Reject Booking
- Requires confirmation
- May require reason (reject)
- Updates status immediately
- Shows outcome feedback

Rules:
- All actions must show success/failure clearly
- Mutations invalidate only affected interaction queries

---

## 10.7 STATUS MODEL (UI REPRESENTATION)

Standard statuses (example; backend authoritative):
- new
- responded
- accepted
- rejected
- closed
- escalated

Rules:
- Status badges must be consistent across portals
- Transitions must reflect backend rules
- Invalid transitions must not be exposed in UI

---

## 10.8 MODERATION & ESCALATION (TENANT / PLATFORM)

Moderation UI must support:
- Flagging abusive or spam interactions
- Adding internal notes (not visible to vendors)
- Escalating to platform support
- Locking interactions (read-only)

Rules:
- Moderation actions must be auditable
- Vendors must see clear outcomes but not internal notes

---

## 10.9 MONETISATION VISIBILITY (READ-ONLY)

Where applicable, UI may show:
- Billable lead indicator
- Usage counters (lead count vs quota)
- Interaction source category

Rules:
- Vendors see limited, explanatory info
- Tenant Admins see aggregate usage
- Platform Admins see monetisation metadata

UI must not calculate billing amounts.

---

## 10.10 NOTIFICATIONS & ACTIVITY FEEDBACK

Rules:
- Interaction actions must surface:
  - notification sent indicator
  - delivery status if available
- Activity timeline may show:
  - responded
  - status changes
  - escalations

---

## 10.11 PERFORMANCE & UX RULES

Rules:
- Inbox list must be fast (server-side pagination)
- Avoid heavy detail page waterfalls
- Lazy-load message history if large
- Provide keyboard-friendly navigation (optional)

---

## 10.12 MODULE API SURFACE (EXPECTED)

Interactions module should provide:
- `useInteractionsList(params)`
- `useInteractionDetail(interactionId)`
- `useRespondToInteraction()`
- `useAcceptBooking()`
- `useRejectBooking()`
- `useCloseInteraction()`
- `useEscalateInteraction()`

---

## 10.13 TESTING REQUIREMENTS (INTERACTIONS)

Must include:
- unit tests for interaction mappers
- unit tests for permission guards
- integration tests for respond/accept/reject flows
- E2E critical path:
  - vendor receives lead → responds → tenant views update

---

## 10.14 FORBIDDEN PRACTICES

You must not:
- Expose full PII to unauthorized roles
- Allow actions without confirmation where required
- Hide monetisation signals inconsistently
- Implement interaction state transitions client-side only

---

## 10.15 EXECUTION DIRECTIVE

Interactions UI must:
- Support fast response workflows
- Enforce strict role boundaries
- Be auditable and transparent
- Integrate cleanly with notifications and monetisation

Interactions are where value is realized.

END OF WEB PART 10.