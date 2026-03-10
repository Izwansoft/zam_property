import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationChannel, NotificationStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
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

  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  private normalizeListingEvent(event: DomainEvent): {
    partnerId: string;
    eventId?: string;
    listingId: string;
    vendorId: string;
    reason?: string;
    actorId?: string;
  } | null {
    const payload = event?.payload ?? event;
    const partnerId = event?.partnerId ?? payload?.partnerId;
    const listingId = payload?.listingId;
    const vendorId = payload?.vendorId;

    if (!partnerId || !listingId || !vendorId) {
      return null;
    }

    return {
      partnerId,
      eventId: event?.eventId,
      listingId,
      vendorId,
      reason: payload?.reason,
      actorId: event?.actorId,
    };
  }

  private async resolveRecipients(partnerId: string, listingId: string, vendorId: string) {
    const [vendorUsers, assignedAgents] = await Promise.all([
      this.prisma.userVendor.findMany({
        where: {
          vendorId,
          user: {
            partnerId,
            deletedAt: null,
          },
        },
        select: {
          userId: true,
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      }),
      this.prisma.agentListing.findMany({
        where: {
          listingId,
          removedAt: null,
          agent: {
            deletedAt: null,
          },
        },
        select: {
          agent: {
            select: {
              userId: true,
              user: {
                select: {
                  email: true,
                  fullName: true,
                },
              },
              company: {
                select: {
                  admins: {
                    select: {
                      userId: true,
                      user: {
                        select: {
                          email: true,
                          fullName: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const recipientMap = new Map<string, { userId: string; email: string; fullName: string }>();

    for (const vendorUser of vendorUsers) {
      recipientMap.set(vendorUser.userId, {
        userId: vendorUser.userId,
        email: vendorUser.user.email,
        fullName: vendorUser.user.fullName,
      });
    }

    for (const assignment of assignedAgents) {
      recipientMap.set(assignment.agent.userId, {
        userId: assignment.agent.userId,
        email: assignment.agent.user.email,
        fullName: assignment.agent.user.fullName,
      });

      for (const admin of assignment.agent.company?.admins ?? []) {
        recipientMap.set(admin.userId, {
          userId: admin.userId,
          email: admin.user.email,
          fullName: admin.user.fullName,
        });
      }
    }

    return Array.from(recipientMap.values());
  }

  private async notifyListingModeration(params: {
    event: DomainEvent;
    type: NotificationType;
    listingStatus: string;
  }): Promise<void> {
    const normalized = this.normalizeListingEvent(params.event);
    if (!normalized) {
      this.logger.warn('Skipping listing moderation notification: invalid event payload');
      return;
    }

    const listing = await this.prisma.listing.findFirst({
      where: {
        id: normalized.listingId,
        partnerId: normalized.partnerId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        partner: { select: { name: true } },
        vendor: { select: { name: true } },
      },
    });

    if (!listing) {
      this.logger.warn(`Skipping listing moderation notification: listing not found ${normalized.listingId}`);
      return;
    }

    const recipients = await this.resolveRecipients(
      normalized.partnerId,
      normalized.listingId,
      normalized.vendorId,
    );

    if (recipients.length === 0) {
      this.logger.debug(`No recipients found for listing moderation notification ${normalized.listingId}`);
      return;
    }

    const appUrl = process.env.APP_URL || '';
    const listingUrl = `${appUrl}/dashboard/listings/${listing.id}`;
    const timestamp = new Date().toISOString();
    const fallbackTitle = `Listing ${params.listingStatus.toLowerCase()}`;
    const fallbackBody = `"${listing.title}" is now ${params.listingStatus.toLowerCase()}.`;

    await Promise.all(
      recipients
        .filter((recipient) => recipient.userId !== normalized.actorId)
        .map(async (recipient) => {
          try {
            await this.notificationService.sendNotification({
              partnerId: normalized.partnerId,
              userId: recipient.userId,
              userEmail: recipient.email,
              type: params.type,
              channel: NotificationChannel.IN_APP,
              variables: {
                partnerName: listing.partner.name,
                userName: recipient.fullName,
                userEmail: recipient.email,
                timestamp,
                appUrl,
                listingId: listing.id,
                listingTitle: listing.title,
                listingUrl,
                listingStatus: params.listingStatus,
                vendorName: listing.vendor.name,
                reason: normalized.reason,
              },
              eventId: normalized.eventId,
              resourceType: 'Listing',
              resourceId: listing.id,
            });
          } catch (error) {
            this.logger.error(
              `Failed listing moderation notification for user ${recipient.userId}: ${(error as Error).message}`,
            );

            // Fallback to direct in-app notification when template is missing.
            await this.prisma.notification.create({
              data: {
                partnerId: normalized.partnerId,
                userId: recipient.userId,
                type: params.type,
                channel: NotificationChannel.IN_APP,
                title: fallbackTitle,
                body: fallbackBody,
                data: {
                  listingId: listing.id,
                  listingTitle: listing.title,
                  listingUrl,
                  listingStatus: params.listingStatus,
                },
                eventId: normalized.eventId,
                resourceType: 'Listing',
                resourceId: listing.id,
                status: NotificationStatus.SENT,
                sentAt: new Date(),
              },
            });
          }
        }),
    );
  }

  @OnEvent('listing.listing.published')
  @OnEvent('listing.published')
  async handleListingPublished(event: DomainEvent) {
    this.logger.log('Handling listing published notification');
    await this.notifyListingModeration({
      event,
      type: NotificationType.LISTING_PUBLISHED,
      listingStatus: 'PUBLISHED',
    });
  }

  @OnEvent('listing.listing.unpublished')
  @OnEvent('listing.unpublished')
  async handleListingUnpublished(event: DomainEvent) {
    this.logger.log('Handling listing unpublished notification');
    await this.notifyListingModeration({
      event,
      type: NotificationType.SYSTEM_ALERT,
      listingStatus: 'DRAFT',
    });
  }

  @OnEvent('listing.listing.archived')
  @OnEvent('listing.archived')
  async handleListingArchived(event: DomainEvent) {
    this.logger.log('Handling listing archived notification');
    await this.notifyListingModeration({
      event,
      type: NotificationType.SYSTEM_ALERT,
      listingStatus: 'ARCHIVED',
    });
  }

  @OnEvent('listing.listing.expired')
  @OnEvent('listing.expired')
  async handleListingExpired(event: DomainEvent) {
    this.logger.log('Handling listing expired notification');
    await this.notifyListingModeration({
      event,
      type: NotificationType.LISTING_EXPIRED,
      listingStatus: 'EXPIRED',
    });
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
