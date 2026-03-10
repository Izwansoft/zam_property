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
- Send messages (reply) to leads/enquiries/bookings
- Update interaction status via allowed transitions:
  - NEW → CONTACTED (first response)
  - NEW → INVALID (spam/invalid)
  - CONTACTED → CONFIRMED (agreement reached)
  - CONTACTED → CLOSED (no longer relevant)
  - CONFIRMED → CLOSED (completed)
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
  - New
  - Contacted
  - Confirmed
  - Closed
  - Invalid
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
  - Send message (POST /interactions/:id/messages)
  - Update status (PATCH /interactions/:id/status) — show only valid transitions:
    - NEW → CONTACTED, INVALID
    - CONTACTED → CONFIRMED, CLOSED
    - CONFIRMED → CLOSED

Rules:
- PII fields must be masked if role does not allow full visibility
- Actions must be permission-checked and entitlement-checked

---

## 10.6 RESPONSE & ACTION FLOWS

### Send Message (Reply)
- Opens a form modal or inline editor
- Validates required content
- Submits via `POST /api/v1/interactions/:id/messages`
- Does NOT automatically change status (vendor must explicitly transition)
- Triggers INTERACTION_MESSAGE notification

### Update Status
- Dropdown or button menu showing only **valid next statuses** based on current status
- Transitions:
  - NEW → CONTACTED (vendor first contacts the customer)
  - NEW → INVALID (mark spam/irrelevant)
  - CONTACTED → CONFIRMED (agreement/booking confirmed)
  - CONTACTED → CLOSED (no further follow-up)
  - CONFIRMED → CLOSED (interaction completed)
- Requires confirmation dialog
- Updates status immediately via `PATCH /api/v1/interactions/:id/status`
- Shows outcome feedback

Rules:
- All actions must show success/failure clearly
- Mutations invalidate only affected interaction queries
- Invalid transitions must never be shown in the UI

---

## 10.7 STATUS MODEL (UI REPRESENTATION — BACKEND AUTHORITATIVE)

Backend `InteractionStatus` enum (Prisma):

```typescript
export enum InteractionStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  CONFIRMED = 'CONFIRMED',
  CLOSED = 'CLOSED',
  INVALID = 'INVALID',
}

export const INTERACTION_STATUS_CONFIG: Record<InteractionStatus, StatusConfig> = {
  [InteractionStatus.NEW]: { label: 'New', color: 'blue', icon: Inbox },
  [InteractionStatus.CONTACTED]: { label: 'Contacted', color: 'yellow', icon: MessageSquare },
  [InteractionStatus.CONFIRMED]: { label: 'Confirmed', color: 'green', icon: CheckCircle },
  [InteractionStatus.CLOSED]: { label: 'Closed', color: 'gray', icon: XCircle },
  [InteractionStatus.INVALID]: { label: 'Invalid', color: 'red', icon: Ban },
};
```

Valid transitions (enforce in UI — do NOT show invalid options):
```
NEW → CONTACTED | INVALID
CONTACTED → CONFIRMED | CLOSED
CONFIRMED → CLOSED
```

Rules:
- Status badges must be consistent across portals
- Transitions must reflect backend rules above
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

## 10.12 MODULE API SURFACE (BACKEND-ALIGNED)

Interactions module should provide:

```typescript
// Queries
useInteractionsList(params)        // GET /api/v1/interactions
useInteractionDetail(interactionId) // GET /api/v1/interactions/:id
useInteractionMessages(interactionId) // GET /api/v1/interactions/:id/messages

// Mutations
useCreateInteraction()             // POST /api/v1/interactions
useUpdateInteractionStatus()       // PATCH /api/v1/interactions/:id/status
                                   // Body: { status: InteractionStatus }
                                   // Enforces valid transitions server-side
useSendMessage()                   // POST /api/v1/interactions/:id/messages
                                   // Body: { content: string }
```

NOTE: There are NO separate accept/reject/escalate endpoints.
All status changes go through `useUpdateInteractionStatus()` with the target status.

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