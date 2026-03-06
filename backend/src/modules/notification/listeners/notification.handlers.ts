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
    //   partnerId: event.partnerId,
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
    // TODO: Notify partner admin
  }

  @OnEvent('subscription.expiring')
  async handleSubscriptionExpiring(event: DomainEvent) {
    this.logger.log(`Handling subscription.expiring event: ${event.subscriptionId}`);
    // TODO: Notify partner admin with renewal reminder
  }
}

/**
 * Event listener for payment/billing notifications
 */
@Injectable()
export class BillingNotificationHandler {
  private readonly logger = new Logger(BillingNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('billing.generated')
  async handleBillGenerated(event: DomainEvent) {
    this.logger.log(`Handling billing.generated event: ${event.billNumber}`);

    try {
      // Send bill notification to tenant via email
      if (event.tenantUserId && event.tenantEmail) {
        await this.notificationService.sendNotification({
          partnerId: event.partnerId,
          userId: event.tenantUserId,
          userEmail: event.tenantEmail,
          type: 'BILL_GENERATED' as any,
          channel: 'EMAIL' as any,
          variables: {
            partnerName: event.ownerName || '',
            userName: event.tenantName || '',
            userEmail: event.tenantEmail,
            timestamp: new Date().toISOString(),
            appUrl: process.env.APP_URL || '',
            billNumber: event.billNumber,
            totalAmount: event.totalAmount,
            dueDate: event.dueDate,
            tenantName: event.tenantName,
            ownerName: event.ownerName,
            propertyTitle: event.propertyTitle,
          },
          resourceType: 'RentBilling',
          resourceId: event.billingId,
        });
      }

      // Also send in-app notification
      if (event.tenantUserId) {
        await this.notificationService.sendNotification({
          partnerId: event.partnerId,
          userId: event.tenantUserId,
          userEmail: event.tenantEmail || '',
          type: 'BILL_GENERATED' as any,
          channel: 'IN_APP' as any,
          variables: {
            partnerName: event.ownerName || '',
            userName: event.tenantName || '',
            userEmail: event.tenantEmail || '',
            timestamp: new Date().toISOString(),
            appUrl: process.env.APP_URL || '',
            billNumber: event.billNumber,
            totalAmount: event.totalAmount,
            dueDate: event.dueDate,
            propertyTitle: event.propertyTitle,
          },
          resourceType: 'RentBilling',
          resourceId: event.billingId,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send bill generated notification: ${(error as Error).message}`,
      );
    }
  }

  @OnEvent('billing.overdue')
  async handleBillOverdue(event: DomainEvent) {
    this.logger.log(`Handling billing.overdue event: ${event.billNumber}`);

    try {
      // We need tenant info — fetch from DB if not in event
      // The processor emits minimal data, so we log and handle gracefully
      this.logger.log(
        `Bill ${event.billNumber} is overdue. Balance due: ${event.balanceDue}. ` +
        `Notification will be sent via reminder system.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle bill overdue event: ${(error as Error).message}`,
      );
    }
  }

  @OnEvent('billing.payment.succeeded')
  async handlePaymentSucceeded(event: DomainEvent) {
    this.logger.log(`Handling billing.payment.succeeded event: ${event.paymentIntentId}`);
    // Platform/subscription payment notifications (non-rent)
  }

  @OnEvent('billing.payment.failed')
  async handlePaymentFailed(event: DomainEvent) {
    this.logger.log(`Handling billing.payment.failed event: ${event.paymentIntentId}`);
    // Platform/subscription payment failure notifications (non-rent)
  }

  @OnEvent('rent.payment.completed')
  async handleRentPaymentCompleted(event: DomainEvent) {
    this.logger.log(
      `Handling rent.payment.completed event: paymentId=${event.paymentId}`,
    );

    try {
      const baseVars = {
        partnerName: event.partnerName || '',
        userName: event.payerName || '',
        userEmail: event.payerEmail || '',
        timestamp: new Date().toISOString(),
        appUrl: process.env.APP_URL || '',
      };

      // Send email notification if payer info available
      if (event.payerEmail && event.userId) {
        await this.notificationService.sendNotification({
          partnerId: event.partnerId,
          userId: event.userId,
          userEmail: event.payerEmail,
          type: 'BILLING_REMINDER' as any,
          channel: 'EMAIL' as any,
          variables: {
            ...baseVars,
            amount: String(event.amount),
            currency: event.currency || 'MYR',
            billNumber: event.billNumber || '',
            receiptNumber: event.receiptNumber || '',
            paymentDate: event.paymentDate || new Date().toISOString(),
            payerName: event.payerName || '',
            payerEmail: event.payerEmail || '',
          },
          resourceType: 'RentPayment',
          resourceId: event.paymentId,
        });
      }

      // Also send in-app notification
      if (event.userId) {
        await this.notificationService.sendNotification({
          partnerId: event.partnerId,
          userId: event.userId,
          userEmail: event.payerEmail || '',
          type: 'BILLING_REMINDER' as any,
          channel: 'IN_APP' as any,
          variables: {
            ...baseVars,
            amount: String(event.amount),
            currency: event.currency || 'MYR',
            billNumber: event.billNumber || '',
            receiptNumber: event.receiptNumber || '',
          },
          resourceType: 'RentPayment',
          resourceId: event.paymentId,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send rent payment notification: ${(error as Error).message}`,
      );
    }
  }

  @OnEvent('rent.payment.failed')
  async handleRentPaymentFailed(event: DomainEvent) {
    this.logger.log(
      `Handling rent.payment.failed event: paymentId=${event.paymentId}`,
    );

    try {
      if (event.userId) {
        await this.notificationService.sendNotification({
          partnerId: event.partnerId,
          userId: event.userId,
          userEmail: event.payerEmail || '',
          type: 'BILLING_REMINDER' as any,
          channel: 'IN_APP' as any,
          variables: {
            partnerName: event.partnerName || '',
            userName: event.payerName || '',
            userEmail: event.payerEmail || '',
            timestamp: new Date().toISOString(),
            appUrl: process.env.APP_URL || '',
            amount: String(event.amount || ''),
            currency: event.currency || 'MYR',
            billNumber: event.billNumber || '',
            error: event.error || 'Payment processing failed',
          },
          resourceType: 'RentPayment',
          resourceId: event.paymentId,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send rent payment failure notification: ${(error as Error).message}`,
      );
    }
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
