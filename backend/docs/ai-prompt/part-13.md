# PART 13 — NOTIFICATIONS & COMMUNICATION SYSTEM (LOCKED)

This part defines how the platform communicates with users, vendors, and tenants.
Notifications are **event-driven**, **tenant-aware**, and **channel-agnostic**.

All rules from PART 0–12 apply.

---

## 13.1 COMMUNICATION PHILOSOPHY

Notifications:
- Are side effects, never core logic
- Must never block business flows
- Are driven exclusively by events
- Must be auditable and configurable

Communication failure must not equal business failure.

---

## 13.2 SUPPORTED CHANNELS

The platform must support:
- Email
- Push notifications
- WhatsApp / SMS (via adapters)
- In-app notifications

Rules:
- Channels are optional and configurable
- Channels are replaceable via adapters
- No channel is mandatory for core flows

---

## 13.3 NOTIFICATION TYPES

Notifications may be triggered for:
- Listing lifecycle events
- Interaction (lead / booking) events
- Review & moderation events
- Subscription & billing events
- Security & audit events

Notifications must always correspond to a domain event.

---

## 13.4 TEMPLATE-DRIVEN MESSAGING

Rules:
- All notifications must use templates
- Templates must be tenant-customisable
- Templates must support localization (i18n)
- Templates must support variables only (no logic)

Hardcoded messages are forbidden.

---

## 13.5 TENANT & ROLE AWARENESS

Rules:
- Notifications are tenant-scoped
- Recipient resolution respects roles
- Vendors receive only vendor-relevant messages
- Platform admins receive platform-level alerts

No cross-tenant notification leakage is allowed.

---

## 13.6 DELIVERY FLOW (ASYNC)

Rules:
- Notifications are sent via background jobs
- Jobs must be idempotent
- Retries must be supported
- Failures must be logged and traceable

Notification delivery must never block requests.

---

## 13.7 PREFERENCES & OPT-OUT

Rules:
- Users must have notification preferences
- Opt-out rules must be respected
- Mandatory notifications (security, legal) must bypass opt-out
- Preferences are tenant-scoped

Compliance is mandatory.

---

## 13.8 EVENT SUBSCRIPTION MODEL

Rules:
- Notification handlers subscribe to domain events
- Handlers must not call domain services
- Handlers must not mutate domain state

Handlers may enrich payloads for messaging only.

---

## 13.9 RATE LIMITING & SAFETY

Rules:
- Notification bursts must be throttled
- Abuse patterns must be detected
- External provider limits must be respected
- Failover strategies must exist

---

## 13.10 MONETISATION AWARENESS

Rules:
- Notification usage may be metered
- Paid plans may unlock channels
- Enforcement occurs upstream
- Notification logic must remain billing-agnostic

---

## 13.11 AUDIT & OBSERVABILITY

Rules:
- Every notification attempt must be logged
- Delivery status must be traceable
- Correlation IDs must be preserved
- Sensitive content must be masked in logs

---

## 13.12 FORBIDDEN PRACTICES

You must not:
- Send notifications synchronously
- Embed business logic in templates
- Hardcode recipients
- Bypass preference checks

---

## 13.13 EXECUTION DIRECTIVE

All communication must:
- Be event-driven
- Be tenant-aware
- Be failure-tolerant
- Respect user consent

Notifications inform — they do not decide.

END OF PART 13.