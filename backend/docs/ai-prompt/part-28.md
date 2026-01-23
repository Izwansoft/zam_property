# PART 28 — EVENT CATALOG & DOMAIN EVENT SPECIFICATIONS (LOCKED)

This part defines the **authoritative catalog of domain events** used for
internal communication, async workflows, and system integration.

All rules from PART 0–27 apply.

---

## 28.1 EVENT PHILOSOPHY

Rules:
- Events represent facts that have happened (past tense)
- Events are immutable once emitted
- Events are the primary mechanism for cross-domain communication
- Event handlers must be idempotent
- Events contain context, not commands

---

## 28.2 EVENT STRUCTURE (STANDARD)

All events must follow this base structure:

```typescript
interface DomainEvent<T = unknown> {
  // Identity
  eventId: string;           // UUID, unique per event
  eventType: string;         // e.g., "listing.published"
  eventVersion: string;      // e.g., "1.0"
  
  // Context
  tenantId: string | null;   // null for platform-level events
  correlationId: string;     // request/trace ID
  causationId?: string;      // ID of event that caused this
  
  // Actor
  actorType: 'user' | 'system' | 'admin';
  actorId?: string;
  
  // Payload
  payload: T;
  
  // Metadata
  occurredAt: string;        // ISO 8601 timestamp
  metadata?: Record<string, unknown>;
}
```

---

## 28.3 EVENT NAMING CONVENTIONS

Format: `<domain>.<entity>.<action>`

Examples:
- `tenant.tenant.created`
- `listing.listing.published`
- `interaction.lead.created`
- `subscription.subscription.cancelled`

Rules:
- Use lowercase
- Use dot notation for hierarchy
- Past tense for actions
- Be specific and descriptive

---

## 28.4 TENANT DOMAIN EVENTS

### tenant.tenant.created
```typescript
{
  eventType: "tenant.tenant.created",
  payload: {
    tenantId: string;
    name: string;
    slug: string;
    enabledVerticals: string[];
  }
}
```
Triggers: Subscription setup, welcome notification, audit log

### tenant.tenant.updated
```typescript
{
  eventType: "tenant.tenant.updated",
  payload: {
    tenantId: string;
    changes: {
      name?: string;
      enabledVerticals?: string[];
      settings?: object;
    };
    previousValues: object;
  }
}
```
Triggers: Cache invalidation, audit log

### tenant.tenant.suspended
```typescript
{
  eventType: "tenant.tenant.suspended",
  payload: {
    tenantId: string;
    reason: string;
    suspendedBy: string;
  }
}
```
Triggers: Access revocation, vendor notification, search de-index, audit log

### tenant.tenant.reactivated
```typescript
{
  eventType: "tenant.tenant.reactivated",
  payload: {
    tenantId: string;
    reactivatedBy: string;
  }
}
```
Triggers: Access restoration, search re-index, notification, audit log

---

## 28.5 USER DOMAIN EVENTS

### user.user.registered
```typescript
{
  eventType: "user.user.registered",
  payload: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
  }
}
```
Triggers: Welcome email, audit log

### user.user.email_verified
```typescript
{
  eventType: "user.user.email_verified",
  payload: {
    userId: string;
    email: string;
  }
}
```
Triggers: Feature unlock, audit log

### user.user.password_changed
```typescript
{
  eventType: "user.user.password_changed",
  payload: {
    userId: string;
  }
}
```
Triggers: Security notification, session invalidation, audit log

### user.tenant_membership.added
```typescript
{
  eventType: "user.tenant_membership.added",
  payload: {
    userId: string;
    tenantId: string;
    roles: string[];
    vendorId?: string;
  }
}
```
Triggers: Welcome notification, audit log

### user.tenant_membership.removed
```typescript
{
  eventType: "user.tenant_membership.removed",
  payload: {
    userId: string;
    tenantId: string;
    reason?: string;
  }
}
```
Triggers: Access revocation, notification, audit log

---

## 28.6 VENDOR DOMAIN EVENTS

### vendor.vendor.created
```typescript
{
  eventType: "vendor.vendor.created",
  payload: {
    vendorId: string;
    tenantId: string;
    name: string;
    slug: string;
  }
}
```
Triggers: Approval notification to tenant admin, audit log

### vendor.vendor.approved
```typescript
{
  eventType: "vendor.vendor.approved",
  payload: {
    vendorId: string;
    tenantId: string;
    approvedBy: string;
  }
}
```
Triggers: Vendor notification, feature unlock, audit log

### vendor.vendor.rejected
```typescript
{
  eventType: "vendor.vendor.rejected",
  payload: {
    vendorId: string;
    tenantId: string;
    rejectedBy: string;
    reason: string;
  }
}
```
Triggers: Vendor notification, audit log

### vendor.vendor.suspended
```typescript
{
  eventType: "vendor.vendor.suspended",
  payload: {
    vendorId: string;
    tenantId: string;
    suspendedBy: string;
    reason: string;
  }
}
```
Triggers: Listing de-index, notification, audit log

### vendor.vendor.verified
```typescript
{
  eventType: "vendor.vendor.verified",
  payload: {
    vendorId: string;
    tenantId: string;
    verificationType: string;
  }
}
```
Triggers: Trust badge update, notification, audit log

---

## 28.7 LISTING DOMAIN EVENTS

### listing.listing.created
```typescript
{
  eventType: "listing.listing.created",
  payload: {
    listingId: string;
    tenantId: string;
    vendorId: string;
    verticalType: string;
    schemaVersion: string;
    title: string;
    status: "DRAFT";
  }
}
```
Triggers: Usage increment, audit log

### listing.listing.updated
```typescript
{
  eventType: "listing.listing.updated",
  payload: {
    listingId: string;
    tenantId: string;
    vendorId: string;
    verticalType: string;
    changes: object;
    previousValues: object;
  }
}
```
Triggers: Search re-index (if published), audit log

### listing.listing.published
```typescript
{
  eventType: "listing.listing.published",
  payload: {
    listingId: string;
    tenantId: string;
    vendorId: string;
    verticalType: string;
    title: string;
    price: number | null;
    currency: string;
    location: object | null;
  }
}
```
Triggers: Search index, usage increment, notification, audit log

### listing.listing.unpublished
```typescript
{
  eventType: "listing.listing.unpublished",
  payload: {
    listingId: string;
    tenantId: string;
    vendorId: string;
    reason?: string;
  }
}
```
Triggers: Search de-index, audit log

### listing.listing.expired
```typescript
{
  eventType: "listing.listing.expired",
  payload: {
    listingId: string;
    tenantId: string;
    vendorId: string;
    expiredAt: string;
  }
}
```
Triggers: Search de-index, vendor notification, audit log

### listing.listing.archived
```typescript
{
  eventType: "listing.listing.archived",
  payload: {
    listingId: string;
    tenantId: string;
    vendorId: string;
    archivedBy: string;
  }
}
```
Triggers: Search de-index, audit log

### listing.listing.featured
```typescript
{
  eventType: "listing.listing.featured",
  payload: {
    listingId: string;
    tenantId: string;
    featuredUntil: string;
  }
}
```
Triggers: Search boost update, usage tracking, audit log

---

## 28.8 MEDIA DOMAIN EVENTS

### media.media.uploaded
```typescript
{
  eventType: "media.media.uploaded",
  payload: {
    mediaId: string;
    tenantId: string;
    ownerType: string;
    ownerId: string;
    mediaType: string;
    mimeType: string;
    size: number;
    storageKey: string;
  }
}
```
Triggers: Processing job (thumbnail, etc.), usage tracking

### media.media.processed
```typescript
{
  eventType: "media.media.processed",
  payload: {
    mediaId: string;
    tenantId: string;
    processingStatus: "completed" | "failed";
    thumbnailKey?: string;
    metadata?: object;
  }
}
```
Triggers: Owner notification (if failed), CDN cache warm

### media.media.deleted
```typescript
{
  eventType: "media.media.deleted",
  payload: {
    mediaId: string;
    tenantId: string;
    ownerType: string;
    ownerId: string;
    storageKey: string;
  }
}
```
Triggers: Storage cleanup job, CDN invalidation

---

## 28.9 INTERACTION DOMAIN EVENTS

### interaction.lead.created
```typescript
{
  eventType: "interaction.lead.created",
  payload: {
    interactionId: string;
    tenantId: string;
    vendorId: string;
    listingId: string;
    verticalType: string;
    interactionType: "LEAD" | "ENQUIRY";
    source: string;
  }
}
```
Triggers: Vendor notification, usage increment, audit log

### interaction.booking.created
```typescript
{
  eventType: "interaction.booking.created",
  payload: {
    interactionId: string;
    tenantId: string;
    vendorId: string;
    listingId: string;
    verticalType: string;
    bookingData: object;
    source: string;
  }
}
```
Triggers: Vendor notification, usage increment, audit log

### interaction.interaction.status_updated
```typescript
{
  eventType: "interaction.interaction.status_updated",
  payload: {
    interactionId: string;
    tenantId: string;
    vendorId: string;
    previousStatus: string;
    newStatus: string;
    updatedBy: string;
  }
}
```
Triggers: Analytics update, audit log

### interaction.booking.confirmed
```typescript
{
  eventType: "interaction.booking.confirmed",
  payload: {
    interactionId: string;
    tenantId: string;
    vendorId: string;
    listingId: string;
    confirmedBy: string;
  }
}
```
Triggers: User notification, calendar sync (if applicable), audit log

---

## 28.10 REVIEW DOMAIN EVENTS

### review.review.created
```typescript
{
  eventType: "review.review.created",
  payload: {
    reviewId: string;
    tenantId: string;
    targetType: string;
    targetId: string;
    verticalType: string;
    rating: number;
  }
}
```
Triggers: Moderation queue, vendor notification, audit log

### review.review.approved
```typescript
{
  eventType: "review.review.approved",
  payload: {
    reviewId: string;
    tenantId: string;
    targetType: string;
    targetId: string;
    rating: number;
    approvedBy: string;
  }
}
```
Triggers: Rating recalculation, search update, notification, audit log

### review.review.rejected
```typescript
{
  eventType: "review.review.rejected",
  payload: {
    reviewId: string;
    tenantId: string;
    rejectedBy: string;
    reason: string;
  }
}
```
Triggers: Reviewer notification (optional), audit log

### review.review.responded
```typescript
{
  eventType: "review.review.responded",
  payload: {
    reviewId: string;
    tenantId: string;
    vendorId: string;
  }
}
```
Triggers: Moderation queue (if required), audit log

---

## 28.11 SUBSCRIPTION DOMAIN EVENTS

### subscription.subscription.created
```typescript
{
  eventType: "subscription.subscription.created",
  payload: {
    subscriptionId: string;
    tenantId: string;
    planId: string;
    status: string;
    periodStart: string;
    periodEnd: string;
  }
}
```
Triggers: Entitlement computation, welcome flow, audit log

### subscription.subscription.plan_changed
```typescript
{
  eventType: "subscription.subscription.plan_changed",
  payload: {
    subscriptionId: string;
    tenantId: string;
    previousPlanId: string;
    newPlanId: string;
    effectiveAt: string;
  }
}
```
Triggers: Entitlement recomputation, notification, audit log

### subscription.subscription.renewed
```typescript
{
  eventType: "subscription.subscription.renewed",
  payload: {
    subscriptionId: string;
    tenantId: string;
    newPeriodStart: string;
    newPeriodEnd: string;
  }
}
```
Triggers: Usage counter reset, notification

### subscription.subscription.cancelled
```typescript
{
  eventType: "subscription.subscription.cancelled",
  payload: {
    subscriptionId: string;
    tenantId: string;
    cancelledAt: string;
    reason?: string;
    effectiveEndDate: string;
  }
}
```
Triggers: Grace period handling, notification, audit log

### subscription.subscription.past_due
```typescript
{
  eventType: "subscription.subscription.past_due",
  payload: {
    subscriptionId: string;
    tenantId: string;
    dueAmount?: number;
    dueSince: string;
  }
}
```
Triggers: Billing notification, grace period start, audit log

---

## 28.12 ENTITLEMENT DOMAIN EVENTS

### entitlement.entitlements.computed
```typescript
{
  eventType: "entitlement.entitlements.computed",
  payload: {
    tenantId: string;
    entitlements: object;
    planId?: string;
    overrides?: object;
  }
}
```
Triggers: Cache update

### entitlement.limit.reached
```typescript
{
  eventType: "entitlement.limit.reached",
  payload: {
    tenantId: string;
    entitlementKey: string;
    currentValue: number;
    limit: number;
  }
}
```
Triggers: Tenant admin notification, usage warning

### entitlement.limit.exceeded
```typescript
{
  eventType: "entitlement.limit.exceeded",
  payload: {
    tenantId: string;
    entitlementKey: string;
    attemptedAction: string;
    deniedAt: string;
  }
}
```
Triggers: Audit log, analytics

---

## 28.13 USAGE DOMAIN EVENTS

### usage.counter.incremented
```typescript
{
  eventType: "usage.counter.incremented",
  payload: {
    tenantId: string;
    metricKey: string;
    incrementBy: number;
    newTotal: number;
    periodStart: string;
  }
}
```
Triggers: Threshold check

### usage.threshold.warning
```typescript
{
  eventType: "usage.threshold.warning",
  payload: {
    tenantId: string;
    metricKey: string;
    currentValue: number;
    threshold: number;
    percentage: number;
  }
}
```
Triggers: Admin notification

### usage.period.reset
```typescript
{
  eventType: "usage.period.reset",
  payload: {
    tenantId: string;
    metricKey: string;
    previousTotal: number;
    newPeriodStart: string;
  }
}
```
Triggers: Analytics snapshot

---

## 28.14 BILLING DOMAIN EVENTS

### billing.payment.succeeded
```typescript
{
  eventType: "billing.payment.succeeded",
  payload: {
    tenantId: string;
    subscriptionId: string;
    amount: number;
    currency: string;
    externalPaymentId?: string;
  }
}
```
Triggers: Subscription status update, receipt notification, audit log

### billing.payment.failed
```typescript
{
  eventType: "billing.payment.failed",
  payload: {
    tenantId: string;
    subscriptionId: string;
    amount: number;
    currency: string;
    failureReason?: string;
  }
}
```
Triggers: Subscription status update, retry scheduling, notification, audit log

### billing.invoice.issued
```typescript
{
  eventType: "billing.invoice.issued",
  payload: {
    tenantId: string;
    invoiceId: string;
    amount: number;
    currency: string;
    dueDate: string;
  }
}
```
Triggers: Notification, audit log

---

## 28.15 SEARCH DOMAIN EVENTS (INTERNAL)

### search.index.requested
```typescript
{
  eventType: "search.index.requested",
  payload: {
    documentType: string;
    documentId: string;
    tenantId: string;
    operation: "index" | "delete";
  }
}
```
Triggers: Indexing job

### search.index.completed
```typescript
{
  eventType: "search.index.completed",
  payload: {
    documentType: string;
    documentId: string;
    tenantId: string;
    operation: "index" | "delete";
    success: boolean;
    error?: string;
  }
}
```
Triggers: Error alerting (if failed)

---

## 28.16 NOTIFICATION DOMAIN EVENTS

### notification.notification.created
```typescript
{
  eventType: "notification.notification.created",
  payload: {
    notificationId: string;
    tenantId?: string;
    userId: string;
    type: string;
    channels: string[];
  }
}
```
Triggers: Channel-specific delivery jobs

### notification.delivery.completed
```typescript
{
  eventType: "notification.delivery.completed",
  payload: {
    notificationId: string;
    channel: string;
    success: boolean;
    error?: string;
  }
}
```
Triggers: Retry (if failed), audit log

---

## 28.17 FEATURE FLAG EVENTS

### feature_flag.flag.updated
```typescript
{
  eventType: "feature_flag.flag.updated",
  payload: {
    flagKey: string;
    previousValue: object;
    newValue: object;
    updatedBy: string;
  }
}
```
Triggers: Cache invalidation, audit log

---

## 28.18 EVENT HANDLING RULES

Rules:
- Handlers must be idempotent (same event processed twice = same result)
- Handlers must not throw unrecoverable exceptions
- Failed events go to dead letter queue (DLQ)
- Events have retry policies with exponential backoff
- Event order is not guaranteed across domains
- Events within same aggregate should be ordered

---

## 28.19 EVENT STORAGE & REPLAY

Rules:
- Events may be stored for audit/replay purposes
- Event store is append-only
- Replay capability required for search reindexing
- Event retention policies configurable

---

## 28.20 FORBIDDEN PRACTICES

You must not:
- Emit events before transaction commits
- Put business logic in event names
- Use events for synchronous communication
- Create circular event dependencies
- Include sensitive PII in event payloads
- Modify events after emission

END OF PART 28.
