import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BroadcastService } from './broadcast.service';

/**
 * Bridge between domain events and WebSocket broadcasts.
 *
 * Per Part 33.5 - listens to domain events and broadcasts
 * real-time updates to connected clients.
 *
 * Event flow:
 * Domain Service → EventBus → EventBridge → BroadcastService → Clients
 */
@Injectable()
export class WebSocketEventBridge {
  private readonly logger = new Logger(WebSocketEventBridge.name);

  constructor(private readonly broadcastService: BroadcastService) {}

  // ============================================
  // LISTING EVENTS
  // ============================================

  @OnEvent('listing.created')
  handleListingCreated(event: {
    partnerId: string;
    listingId: string;
    vendorId: string;
    title: string;
  }): void {
    this.logger.debug(`Broadcasting listing.created: ${event.listingId}`);

    // Notify partner admins
    this.broadcastService.broadcastToTenantListings(event.partnerId, 'listing:created', {
      listingId: event.listingId,
      title: event.title,
      vendorId: event.vendorId,
    });

    // Notify vendor
    this.broadcastService.broadcastToVendor(event.vendorId, 'listing:created', {
      listingId: event.listingId,
      title: event.title,
    });
  }

  @OnEvent('listing.updated')
  handleListingUpdated(event: {
    partnerId: string;
    listingId: string;
    vendorId: string;
    changes: Record<string, unknown>;
  }): void {
    this.logger.debug(`Broadcasting listing.updated: ${event.listingId}`);

    // Notify listing viewers
    this.broadcastService.broadcastToListing(event.listingId, 'listing:updated', {
      listingId: event.listingId,
      changes: event.changes,
    });

    // Notify vendor
    this.broadcastService.broadcastToVendor(event.vendorId, 'listing:updated', {
      listingId: event.listingId,
      changes: event.changes,
    });
  }

  @OnEvent('listing.published')
  handleListingPublished(event: {
    partnerId: string;
    listingId: string;
    vendorId: string;
    title: string;
    publishedAt: Date;
  }): void {
    this.logger.debug(`Broadcasting listing.published: ${event.listingId}`);

    // Notify all partner members
    this.broadcastService.broadcastToTenant(event.partnerId, 'listing:published', {
      listingId: event.listingId,
      title: event.title,
      publishedAt: event.publishedAt,
    });

    // Notify listing viewers
    this.broadcastService.broadcastToListing(event.listingId, 'listing:updated', {
      listingId: event.listingId,
      status: 'PUBLISHED',
    });

    // Notify vendor
    this.broadcastService.broadcastToVendor(event.vendorId, 'listing:published', {
      listingId: event.listingId,
      title: event.title,
      publishedAt: event.publishedAt,
    });
  }

  @OnEvent('listing.unpublished')
  handleListingUnpublished(event: { partnerId: string; listingId: string; vendorId: string }): void {
    this.logger.debug(`Broadcasting listing.unpublished: ${event.listingId}`);

    // Notify listing viewers
    this.broadcastService.broadcastToListing(event.listingId, 'listing:unpublished', {
      listingId: event.listingId,
    });

    // Notify vendor
    this.broadcastService.broadcastToVendor(event.vendorId, 'listing:unpublished', {
      listingId: event.listingId,
    });
  }

  @OnEvent('listing.expired')
  handleListingExpired(event: {
    partnerId: string;
    listingId: string;
    vendorId: string;
    reason?: string;
  }): void {
    this.logger.debug(`Broadcasting listing.expired: ${event.listingId}`);

    // Notify vendor
    this.broadcastService.broadcastToVendor(event.vendorId, 'listing:expired', {
      listingId: event.listingId,
      reason: event.reason,
    });

    // Notify listing viewers
    this.broadcastService.broadcastToListing(event.listingId, 'listing:expired', {
      listingId: event.listingId,
    });
  }

  @OnEvent('listing.deleted')
  handleListingDeleted(event: { partnerId: string; listingId: string; vendorId: string }): void {
    this.logger.debug(`Broadcasting listing.deleted: ${event.listingId}`);

    // Notify listing viewers to redirect
    this.broadcastService.broadcastToListing(event.listingId, 'listing:deleted', {
      listingId: event.listingId,
    });

    // Notify vendor
    this.broadcastService.broadcastToVendor(event.vendorId, 'listing:deleted', {
      listingId: event.listingId,
    });
  }

  // ============================================
  // INTERACTION EVENTS
  // ============================================

  @OnEvent('interaction.created')
  handleInteractionCreated(event: {
    partnerId: string;
    interactionId: string;
    vendorId: string;
    listingId: string;
    interactionType: string;
    contactName: string;
    customerId: string;
  }): void {
    this.logger.debug(`Broadcasting interaction.created: ${event.interactionId}`);

    // Notify vendor (new lead!)
    this.broadcastService.broadcastToVendor(event.vendorId, 'interaction:new', {
      interactionId: event.interactionId,
      type: event.interactionType,
      listingId: event.listingId,
      contactName: event.contactName,
    });
  }

  @OnEvent('interaction.updated')
  handleInteractionUpdated(event: {
    partnerId: string;
    interactionId: string;
    vendorId: string;
    status: string;
  }): void {
    this.logger.debug(`Broadcasting interaction.updated: ${event.interactionId}`);

    // Notify all participants
    this.broadcastService.broadcastToInteraction(event.interactionId, 'interaction:updated', {
      interactionId: event.interactionId,
      status: event.status,
    });
  }

  @OnEvent('interaction.message.created')
  handleInteractionMessage(event: {
    interactionId: string;
    messageId: string;
    senderId: string;
    content: string;
    createdAt: Date;
  }): void {
    this.logger.debug(`Broadcasting interaction.message: ${event.messageId}`);

    // Notify all participants in the interaction
    this.broadcastService.broadcastToInteraction(event.interactionId, 'interaction:message', {
      interactionId: event.interactionId,
      message: {
        id: event.messageId,
        senderId: event.senderId,
        content: event.content,
        createdAt: event.createdAt,
      },
    });
  }

  // ============================================
  // NOTIFICATION EVENTS
  // ============================================

  @OnEvent('notification.created')
  handleNotificationCreated(event: {
    recipientId: string;
    notification: {
      id: string;
      type: string;
      title: string;
      message: string;
      data?: Record<string, unknown>;
      createdAt: Date;
    };
  }): void {
    this.logger.debug(`Broadcasting notification.created to user: ${event.recipientId}`);

    this.broadcastService.sendToUser(event.recipientId, 'notification:new', event.notification);
  }

  // ============================================
  // VENDOR EVENTS
  // ============================================

  @OnEvent('vendor.approved')
  handleVendorApproved(event: {
    partnerId: string;
    vendorId: string;
    vendorName: string;
    ownerId: string;
  }): void {
    this.logger.debug(`Broadcasting vendor.approved: ${event.vendorId}`);

    // Notify vendor owner
    this.broadcastService.sendToUser(event.ownerId, 'vendor:approved', {
      vendorId: event.vendorId,
      vendorName: event.vendorName,
    });

    // Notify partner admins
    this.broadcastService.broadcastToTenantListings(event.partnerId, 'vendor:approved', {
      vendorId: event.vendorId,
      vendorName: event.vendorName,
    });
  }

  @OnEvent('vendor.rejected')
  handleVendorRejected(event: {
    partnerId: string;
    vendorId: string;
    vendorName: string;
    ownerId: string;
    reason?: string;
  }): void {
    this.logger.debug(`Broadcasting vendor.rejected: ${event.vendorId}`);

    // Notify vendor owner
    this.broadcastService.sendToUser(event.ownerId, 'vendor:rejected', {
      vendorId: event.vendorId,
      vendorName: event.vendorName,
      reason: event.reason,
    });
  }

  @OnEvent('vendor.suspended')
  handleVendorSuspended(event: {
    partnerId: string;
    vendorId: string;
    vendorName: string;
    ownerId: string;
    reason?: string;
  }): void {
    this.logger.debug(`Broadcasting vendor.suspended: ${event.vendorId}`);

    // Notify vendor users
    this.broadcastService.broadcastToVendor(event.vendorId, 'vendor:suspended', {
      vendorId: event.vendorId,
      reason: event.reason,
    });

    // Notify vendor owner
    this.broadcastService.sendToUser(event.ownerId, 'vendor:suspended', {
      vendorId: event.vendorId,
      reason: event.reason,
    });
  }

  // ============================================
  // REVIEW EVENTS
  // ============================================

  @OnEvent('review.created')
  handleReviewCreated(event: {
    partnerId: string;
    reviewId: string;
    vendorId: string;
    rating: number;
    reviewerName: string;
  }): void {
    this.logger.debug(`Broadcasting review.created: ${event.reviewId}`);

    // Notify vendor
    this.broadcastService.broadcastToVendor(event.vendorId, 'review:new', {
      reviewId: event.reviewId,
      rating: event.rating,
      reviewerName: event.reviewerName,
    });
  }

  @OnEvent('review.approved')
  handleReviewApproved(event: {
    partnerId: string;
    reviewId: string;
    vendorId: string;
    rating: number;
  }): void {
    this.logger.debug(`Broadcasting review.approved: ${event.reviewId}`);

    // Notify vendor
    this.broadcastService.broadcastToVendor(event.vendorId, 'review:approved', {
      reviewId: event.reviewId,
      rating: event.rating,
    });
  }

  // ============================================
  // SUBSCRIPTION EVENTS
  // ============================================

  @OnEvent('subscription.created')
  handleSubscriptionCreated(event: {
    partnerId: string;
    subscriptionId: string;
    vendorId: string;
    planName: string;
  }): void {
    this.logger.debug(`Broadcasting subscription.created: ${event.subscriptionId}`);

    // Notify vendor
    this.broadcastService.broadcastToVendor(event.vendorId, 'subscription:created', {
      subscriptionId: event.subscriptionId,
      planName: event.planName,
    });
  }

  @OnEvent('subscription.expiring')
  handleSubscriptionExpiring(event: {
    partnerId: string;
    subscriptionId: string;
    vendorId: string;
    expiresAt: Date;
  }): void {
    this.logger.debug(`Broadcasting subscription.expiring: ${event.subscriptionId}`);

    // Notify vendor
    this.broadcastService.broadcastToVendor(event.vendorId, 'subscription:expiring', {
      subscriptionId: event.subscriptionId,
      expiresAt: event.expiresAt,
    });
  }

  @OnEvent('subscription.expired')
  handleSubscriptionExpired(event: {
    partnerId: string;
    subscriptionId: string;
    vendorId: string;
  }): void {
    this.logger.debug(`Broadcasting subscription.expired: ${event.subscriptionId}`);

    // Notify vendor
    this.broadcastService.broadcastToVendor(event.vendorId, 'subscription:expired', {
      subscriptionId: event.subscriptionId,
    });
  }

  // ============================================
  // SYSTEM EVENTS
  // ============================================

  @OnEvent('system.maintenance')
  handleSystemMaintenance(event: { message: string; scheduledAt: Date; partnerId?: string }): void {
    this.logger.debug(`Broadcasting system.maintenance`);

    if (event.partnerId) {
      // Partner-specific maintenance
      this.broadcastService.broadcastToTenant(event.partnerId, 'system:maintenance', {
        message: event.message,
        scheduledAt: event.scheduledAt,
      });
    } else {
      // Platform-wide maintenance
      this.broadcastService.broadcastToPlatform('system:maintenance', {
        message: event.message,
        scheduledAt: event.scheduledAt,
      });
    }
  }
}
