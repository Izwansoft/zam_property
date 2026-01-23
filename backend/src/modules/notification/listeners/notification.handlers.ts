import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../services/notification.service';

/**
 * Generic event payload (domain events will be strongly typed in Phase 2)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DomainEvent = any;

/**
 * Event listener for listing-related notifications
 */
@Injectable()
export class ListingNotificationHandler {
  private readonly logger = new Logger(ListingNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('listing.published')
  async handleListingPublished(event: DomainEvent) {
    this.logger.log(`Handling listing.published event: ${event.listingId}`);

    // TODO: Get vendor user IDs and send notifications
    // await this.notificationService.sendNotification({
    //   tenantId: event.tenantId,
    //   userId: event.vendorUserId,
    //   userEmail: event.vendorEmail,
    //   type: NotificationType.LISTING_PUBLISHED,
    //   channel: NotificationChannel.EMAIL,
    //   variables: {
    //     ...event,
    //   },
    //   eventId: event.eventId,
    //   resourceType: 'Listing',
    //   resourceId: event.listingId,
    // });
  }

  @OnEvent('listing.expired')
  async handleListingExpired(event: DomainEvent) {
    this.logger.log(`Handling listing.expired event: ${event.listingId}`);
    // TODO: Implement notification
  }
}

/**
 * Event listener for interaction-related notifications
 */
@Injectable()
export class InteractionNotificationHandler {
  private readonly logger = new Logger(InteractionNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('interaction.created')
  async handleInteractionCreated(event: DomainEvent) {
    this.logger.log(`Handling interaction.created event: ${event.interactionId}`);
    // TODO: Notify vendor of new lead/enquiry
  }

  @OnEvent('interaction.message')
  async handleInteractionMessage(event: DomainEvent) {
    this.logger.log(`Handling interaction.message event: ${event.messageId}`);
    // TODO: Notify recipient of new message
  }
}

/**
 * Event listener for review-related notifications
 */
@Injectable()
export class ReviewNotificationHandler {
  private readonly logger = new Logger(ReviewNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('review.submitted')
  async handleReviewSubmitted(event: DomainEvent) {
    this.logger.log(`Handling review.submitted event: ${event.reviewId}`);
    // TODO: Notify vendor of new review
  }

  @OnEvent('review.approved')
  async handleReviewApproved(event: DomainEvent) {
    this.logger.log(`Handling review.approved event: ${event.reviewId}`);
    // TODO: Notify reviewer that review is approved
  }
}

/**
 * Event listener for subscription-related notifications
 */
@Injectable()
export class SubscriptionNotificationHandler {
  private readonly logger = new Logger(SubscriptionNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('subscription.created')
  async handleSubscriptionCreated(event: DomainEvent) {
    this.logger.log(`Handling subscription.created event: ${event.subscriptionId}`);
    // TODO: Notify tenant admin
  }

  @OnEvent('subscription.expiring')
  async handleSubscriptionExpiring(event: DomainEvent) {
    this.logger.log(`Handling subscription.expiring event: ${event.subscriptionId}`);
    // TODO: Notify tenant admin with renewal reminder
  }
}

/**
 * Event listener for payment/billing notifications
 */
@Injectable()
export class BillingNotificationHandler {
  private readonly logger = new Logger(BillingNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('billing.payment.succeeded')
  async handlePaymentSucceeded(event: DomainEvent) {
    this.logger.log(`Handling billing.payment.succeeded event: ${event.invoiceId}`);
    // TODO: Notify tenant admin of successful payment
  }

  @OnEvent('billing.payment.failed')
  async handlePaymentFailed(event: DomainEvent) {
    this.logger.log(`Handling billing.payment.failed event: ${event.invoiceId}`);
    // TODO: Notify tenant admin of payment failure
  }
}

/**
 * Delivery event listener (triggers actual channel delivery)
 */
@Injectable()
export class NotificationDeliveryHandler {
  private readonly logger = new Logger(NotificationDeliveryHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('notification.deliver')
  async handleNotificationDeliver(event: DomainEvent) {
    this.logger.log(`Delivering notification: ${event.notificationId}`);

    try {
      await this.notificationService.processDelivery({
        notificationId: event.notificationId,
        channel: event.channel,
        to: event.to,
        subject: event.subject,
        body: event.body,
        data: event.data,
      });
    } catch (error) {
      this.logger.error(`Failed to deliver notification ${event.notificationId}:`, error);
      // Error already logged in service, no need to rethrow
    }
  }
}
