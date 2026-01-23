# PART 11 — LEADS, ENQUIRIES & BOOKING CORE (LOCKED)

This part defines the **generic interaction layer** between end users and vendors.
It is vertical-agnostic and reusable across all business types.

All rules from PART 0–10 apply.

---

## 11.1 PURPOSE OF THE INTERACTION CORE

The Interaction Core:
- Captures user intent (interest, enquiry, booking)
- Connects users to vendors via listings
- Represents business value signals
- Feeds monetisation, analytics, and notifications

It must work for:
- Property enquiries
- Car rental requests
- Service bookings
- Equipment rental requests
- Course enrolments

---

## 11.2 CORE CONCEPTS (LOCKED)

Definitions:
- **Lead**: An expression of interest (non-committal)
- **Enquiry**: A question or information request
- **Booking Request**: A time- or availability-bound request

All three share the same core structure.

---

## 11.3 DATA MODEL (GENERIC)

Each interaction record must include:
- id
- tenant_id
- vendor_id
- listing_id
- vertical_type
- interaction_type (lead | enquiry | booking)
- contact_payload (validated, minimal)
- message (optional)
- status (new, contacted, confirmed, closed, invalid)
- source (web, mobile, api)
- created_at
- updated_at

Rules:
- Interaction records are append-only except status
- Contact payload must be minimal (PII-safe)
- Vertical-specific fields are forbidden here

---

## 11.4 INTERACTION LIFECYCLE

Allowed transitions:
- new → contacted
- contacted → confirmed (for bookings)
- contacted → closed
- new → invalid

Rules:
- Status transitions must be explicit
- Invalid transitions must be rejected
- All transitions emit domain events

---

## 11.5 PUBLIC INTERACTION CAPTURE

Rules:
- Public endpoints must be rate-limited
- CAPTCHA or abuse protection must be supported
- Tenant context must be resolved safely
- Vendor identity must not be exposed publicly

Public capture must be resilient under abuse.

---

## 11.6 OWNERSHIP & ACCESS RULES

Rules:
- Interactions belong to a tenant
- Vendors can only view interactions for their listings
- Tenant admins can view all interactions
- End users cannot access stored interactions

Access control is enforced upstream.

---

## 11.7 VERTICAL EXTENSION POINTS

Vertical modules MAY:
- Add validation rules before creation
- Add booking availability checks (async)
- Add domain-specific workflows via events

Vertical modules must NOT:
- Modify core interaction schema
- Block interaction creation synchronously
- Store vertical data in interaction records

---

## 11.8 EVENTS (MANDATORY)

Core interaction events include:
- InteractionCreated
- InteractionStatusUpdated
- BookingConfirmed

Rules:
- Events emitted after persistence
- Events include tenant_id, vendor_id, vertical_type
- Events contain no side effects

---

## 11.9 MONETISATION AWARENESS

Rules:
- Interaction creation may increment usage counters
- Pay-per-lead models attach via events
- Core must not block interactions based on billing
- Soft limits may emit warnings only

Monetisation enforcement occurs upstream.

---

## 11.10 SEARCH & ANALYTICS AWARENESS

Rules:
- Interactions are not searchable publicly
- Aggregates may feed analytics
- Raw interaction data must not be indexed for search

---

## 11.11 DATA RETENTION & COMPLIANCE

Rules:
- Retention policies must be configurable
- PII must be minimised
- Data anonymisation must be supported
- Audit trails must be preserved

---

## 11.12 FORBIDDEN PRACTICES

You must not:
- Build chat systems here
- Store large message histories
- Embed CRM logic
- Perform billing calculations
- Expose interaction data publicly

---

## 11.13 EXECUTION DIRECTIVE

All verticals must:
- Use this interaction core
- Extend behavior via events only
- Treat interactions as value signals

Leads and bookings are signals — not conversations.

END OF PART 11.