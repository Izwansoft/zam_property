import { BaseDomainEvent, EventOptionsWithoutType } from '../base-domain-event';

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION EVENTS
// Per Part 28: Lead generation and booking management events
// ─────────────────────────────────────────────────────────────────────────────

export interface InteractionLeadCreatedPayload {
  interactionId: string;
  listingId: string;
  vendorId: string;
  userEmail?: string;
  userPhone?: string;
  message?: string;
}

export class InteractionLeadCreatedEvent extends BaseDomainEvent<InteractionLeadCreatedPayload> {
  constructor(options: EventOptionsWithoutType<InteractionLeadCreatedPayload>) {
    super(
      {
        ...options,
        eventType: 'interaction.lead.created',
      },
      '1.0',
    );
  }
}

export interface InteractionBookingCreatedPayload {
  interactionId: string;
  listingId: string;
  vendorId: string;
  bookingDate: Date;
  bookingTime: string;
  guestCount?: number;
}

export class InteractionBookingCreatedEvent extends BaseDomainEvent<InteractionBookingCreatedPayload> {
  constructor(options: EventOptionsWithoutType<InteractionBookingCreatedPayload>) {
    super(
      {
        ...options,
        eventType: 'interaction.booking.created',
      },
      '1.0',
    );
  }
}

export interface InteractionStatusUpdatedPayload {
  interactionId: string;
  listingId: string;
  vendorId: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
}

export class InteractionStatusUpdatedEvent extends BaseDomainEvent<InteractionStatusUpdatedPayload> {
  constructor(options: EventOptionsWithoutType<InteractionStatusUpdatedPayload>) {
    super(
      {
        ...options,
        eventType: 'interaction.status.updated',
      },
      '1.0',
    );
  }
}

export interface InteractionBookingConfirmedPayload {
  interactionId: string;
  listingId: string;
  vendorId: string;
  confirmedAt: Date;
  confirmationCode: string;
}

export class InteractionBookingConfirmedEvent extends BaseDomainEvent<InteractionBookingConfirmedPayload> {
  constructor(options: EventOptionsWithoutType<InteractionBookingConfirmedPayload>) {
    super(
      {
        ...options,
        eventType: 'interaction.booking.confirmed',
      },
      '1.0',
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW EVENTS
// Per Part 28: Review moderation and management events
// ─────────────────────────────────────────────────────────────────────────────

export interface ReviewCreatedPayload {
  reviewId: string;
  listingId: string;
  vendorId: string;
  userId: string;
  rating: number;
  content?: string;
}

export class ReviewCreatedEvent extends BaseDomainEvent<ReviewCreatedPayload> {
  constructor(options: EventOptionsWithoutType<ReviewCreatedPayload>) {
    super(
      {
        ...options,
        eventType: 'review.review.created',
      },
      '1.0',
    );
  }
}

export interface ReviewApprovedPayload {
  reviewId: string;
  listingId: string;
  vendorId: string;
  approvedBy: string;
  approvedAt: Date;
}

export class ReviewApprovedEvent extends BaseDomainEvent<ReviewApprovedPayload> {
  constructor(options: EventOptionsWithoutType<ReviewApprovedPayload>) {
    super(
      {
        ...options,
        eventType: 'review.review.approved',
      },
      '1.0',
    );
  }
}

export interface ReviewRejectedPayload {
  reviewId: string;
  listingId: string;
  vendorId: string;
  rejectedBy: string;
  rejectedAt: Date;
  reason: string;
}

export class ReviewRejectedEvent extends BaseDomainEvent<ReviewRejectedPayload> {
  constructor(options: EventOptionsWithoutType<ReviewRejectedPayload>) {
    super(
      {
        ...options,
        eventType: 'review.review.rejected',
      },
      '1.0',
    );
  }
}

export interface ReviewRespondedPayload {
  reviewId: string;
  listingId: string;
  vendorId: string;
  responseBy: string;
  responseContent: string;
  respondedAt: Date;
}

export class ReviewRespondedEvent extends BaseDomainEvent<ReviewRespondedPayload> {
  constructor(options: EventOptionsWithoutType<ReviewRespondedPayload>) {
    super(
      {
        ...options,
        eventType: 'review.review.responded',
      },
      '1.0',
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION EVENTS
// Per Part 28: Subscription lifecycle events
// ─────────────────────────────────────────────────────────────────────────────

export interface SubscriptionCreatedPayload {
  subscriptionId: string;
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'annual';
  startDate: Date;
  endDate: Date;
}

export class SubscriptionCreatedEvent extends BaseDomainEvent<SubscriptionCreatedPayload> {
  constructor(options: EventOptionsWithoutType<SubscriptionCreatedPayload>) {
    super(
      {
        ...options,
        eventType: 'subscription.subscription.created',
      },
      '1.0',
    );
  }
}

export interface SubscriptionPlanChangedPayload {
  subscriptionId: string;
  oldPlanId: string;
  oldPlanName: string;
  newPlanId: string;
  newPlanName: string;
  effectiveDate: Date;
}

export class SubscriptionPlanChangedEvent extends BaseDomainEvent<SubscriptionPlanChangedPayload> {
  constructor(options: EventOptionsWithoutType<SubscriptionPlanChangedPayload>) {
    super(
      {
        ...options,
        eventType: 'subscription.subscription.planChanged',
      },
      '1.0',
    );
  }
}

export interface SubscriptionRenewedPayload {
  subscriptionId: string;
  planId: string;
  renewedAt: Date;
  nextBillingDate: Date;
}

export class SubscriptionRenewedEvent extends BaseDomainEvent<SubscriptionRenewedPayload> {
  constructor(options: EventOptionsWithoutType<SubscriptionRenewedPayload>) {
    super(
      {
        ...options,
        eventType: 'subscription.subscription.renewed',
      },
      '1.0',
    );
  }
}

export interface SubscriptionCancelledPayload {
  subscriptionId: string;
  planId: string;
  cancelledAt: Date;
  reason?: string;
  effectiveDate: Date;
}

export class SubscriptionCancelledEvent extends BaseDomainEvent<SubscriptionCancelledPayload> {
  constructor(options: EventOptionsWithoutType<SubscriptionCancelledPayload>) {
    super(
      {
        ...options,
        eventType: 'subscription.subscription.cancelled',
      },
      '1.0',
    );
  }
}

export interface SubscriptionPastDuePayload {
  subscriptionId: string;
  planId: string;
  dueDate: Date;
  amount: number;
  currency: string;
}

export class SubscriptionPastDueEvent extends BaseDomainEvent<SubscriptionPastDuePayload> {
  constructor(options: EventOptionsWithoutType<SubscriptionPastDuePayload>) {
    super(
      {
        ...options,
        eventType: 'subscription.subscription.pastDue',
      },
      '1.0',
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BILLING EVENTS
// Per Part 28: Payment and invoice events
// ─────────────────────────────────────────────────────────────────────────────

export interface BillingPaymentSucceededPayload {
  subscriptionId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
}

export class BillingPaymentSucceededEvent extends BaseDomainEvent<BillingPaymentSucceededPayload> {
  constructor(options: EventOptionsWithoutType<BillingPaymentSucceededPayload>) {
    super(
      {
        ...options,
        eventType: 'billing.payment.succeeded',
      },
      '1.0',
    );
  }
}

export interface BillingPaymentFailedPayload {
  subscriptionId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  failureReason: string;
  retryCount: number;
}

export class BillingPaymentFailedEvent extends BaseDomainEvent<BillingPaymentFailedPayload> {
  constructor(options: EventOptionsWithoutType<BillingPaymentFailedPayload>) {
    super(
      {
        ...options,
        eventType: 'billing.payment.failed',
      },
      '1.0',
    );
  }
}

export interface BillingInvoiceIssuedPayload {
  invoiceId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue';
}

export class BillingInvoiceIssuedEvent extends BaseDomainEvent<BillingInvoiceIssuedPayload> {
  constructor(options: EventOptionsWithoutType<BillingInvoiceIssuedPayload>) {
    super(
      {
        ...options,
        eventType: 'billing.invoice.issued',
      },
      '1.0',
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA EVENTS
// Per Part 28: Media upload and processing events
// ─────────────────────────────────────────────────────────────────────────────

export interface MediaUploadedPayload {
  mediaId: string;
  entityType: 'listing' | 'vendor' | 'user';
  entityId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
}

export class MediaUploadedEvent extends BaseDomainEvent<MediaUploadedPayload> {
  constructor(options: EventOptionsWithoutType<MediaUploadedPayload>) {
    super(
      {
        ...options,
        eventType: 'media.media.uploaded',
      },
      '1.0',
    );
  }
}

export interface MediaProcessedPayload {
  mediaId: string;
  entityType: 'listing' | 'vendor' | 'user';
  entityId: string;
  processedAt: Date;
  variants: Array<{
    size: string;
    url: string;
    width?: number;
    height?: number;
  }>;
}

export class MediaProcessedEvent extends BaseDomainEvent<MediaProcessedPayload> {
  constructor(options: EventOptionsWithoutType<MediaProcessedPayload>) {
    super(
      {
        ...options,
        eventType: 'media.media.processed',
      },
      '1.0',
    );
  }
}

export interface MediaDeletedPayload {
  mediaId: string;
  entityType: 'listing' | 'vendor' | 'user';
  entityId: string;
  deletedBy: string;
}

export class MediaDeletedEvent extends BaseDomainEvent<MediaDeletedPayload> {
  constructor(options: EventOptionsWithoutType<MediaDeletedPayload>) {
    super(
      {
        ...options,
        eventType: 'media.media.deleted',
      },
      '1.0',
    );
  }
}
