# PART 19 — BILLING PROVIDER ABSTRACTION & PAYMENTS INTEGRATION (LOCKED)

This part defines how payments and billing providers integrate with the platform
WITHOUT contaminating domains, entitlements, or core workflows.

All rules from PART 0–18 apply.

---

## 19.1 BILLING PHILOSOPHY

Billing is:
- An external concern
- Replaceable and optional
- Event-driven
- Never authoritative for access

Access control is determined by entitlements, not payments.

---

## 19.2 BILLING RESPONSIBILITIES (BOUNDARY)

Billing integration is responsible for:
- Creating invoices or charges
- Managing payment methods
- Handling payment events (success/failure)
- Syncing billing state to subscriptions

Billing integration is NOT responsible for:
- Enforcing access
- Validating business rules
- Managing domain state
- Blocking user actions directly

---

## 19.3 BILLING ADAPTER MODEL (AUTHORITATIVE)

Rules:
- Each billing provider is an adapter
- Adapters live in `infrastructure/billing/`
- Adapters subscribe to monetisation events
- Core never calls billing APIs directly

Adapters react; they are never invoked synchronously.

---

## 19.4 SUPPORTED BILLING MODELS

The platform must support:
- Subscription billing
- Usage-based billing
- One-time charges
- Manual invoicing
- Enterprise contracts

Billing models must be composable.

---

## 19.5 BILLING PROVIDER EXAMPLES

Possible adapters:
- Stripe
- PayPal
- Xendit
- Manual invoice (offline)
- Enterprise ERP integration

Adapters must be swappable without refactor.

---

## 19.6 EVENT-DRIVEN BILLING FLOW

Billing adapters may subscribe to:
- SubscriptionCreated
- SubscriptionUpdated
- UsageThresholdReached
- InvoiceRequested

Billing adapters may emit:
- PaymentSucceeded
- PaymentFailed
- InvoiceIssued

Events must never include provider secrets.

---

## 19.7 BILLING STATE SYNCHRONIZATION

Rules:
- Billing state is mirrored to subscriptions
- Sync must be idempotent
- Partial failures must be recoverable
- Conflicts must be logged and escalated

Billing truth does not override entitlement logic.

---

## 19.8 WEBHOOK HANDLING

Rules:
- Webhooks must be verified
- Webhooks must be idempotent
- Webhooks must be tenant-scoped
- Webhook processing must be async

Unverified webhooks are forbidden.

---

## 19.9 ERROR HANDLING & RETRIES

Rules:
- Billing failures must not crash core flows
- Retries must be exponential
- Permanent failures must be surfaced to admins
- Users must receive clear status messaging

---

## 19.10 SECURITY & COMPLIANCE

Rules:
- No payment data stored directly
- PCI scope minimized
- Secrets stored securely
- Audit logs required for billing actions

---

## 19.11 TESTING & SANDBOXING

Rules:
- Providers must support sandbox mode
- Billing flows must be testable
- Mock adapters must exist for development

---

## 19.12 FORBIDDEN PRACTICES

You must not:
- Call billing APIs from domain services
- Block user actions synchronously on billing
- Hardcode provider logic
- Store sensitive payment data

---

## 19.13 EXECUTION DIRECTIVE

Billing must:
- Remain an adapter layer
- Be replaceable at any time
- Communicate via events only
- Never dictate access directly

Billing collects money. Entitlements grant access.

END OF PART 19.