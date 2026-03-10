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

  private unwrapListingEvent<T extends { listingId: string }>(
    event: T | { payload?: T; partnerId?: string },
  ): (T & { partnerId: string }) | null {
    const payload = (event as { payload?: T }).payload;
    const partnerId = (event as { partnerId?: string }).partnerId;
    const normalized = (payload ?? event) as T;

    if (!partnerId || !normalized?.listingId) {
      return null;
    }

    return {
      ...normalized,
      partnerId,
    };
  }

  // ============================================
  // LISTING EVENTS
  // ============================================

  @OnEvent('listing.listing.created')
  @OnEvent('listing.created')
  handleListingCreated(event: {
    partnerId: string;
    listingId: string;
    vendorId: string;
    title: string;
  } | {
    partnerId: string;
    payload: {
      listingId: string;
      vendorId: string;
      title: string;
    };
  }): void {
    const normalized = this.unwrapListingEvent(event);
    if (!normalized) {
      this.logger.warn('Skipping listing.created websocket broadcast: invalid event payload');
      return;
    }

    this.logger.debug(`Broadcasting listing.created: ${normalized.listingId}`);

    // Notify partner admins
    this.broadcastService.broadcastToTenantListings(normalized.partnerId, 'listing:created', {
      listingId: normalized.listingId,
      title: normalized.title,
      vendorId: normalized.vendorId,
    });

    // Notify vendor
    this.broadcastService.broadcastToVendor(normalized.vendorId, 'listing:created', {
      listingId: normalized.listingId,
      title: normalized.title,
    });
  }

  @OnEvent('listing.listing.updated')
  @OnEvent('listing.updated')
  handleListingUpdated(event: {
    partnerId: string;
    listingId: string;
    vendorId: string;
    changes: Record<string, unknown>;
  } | {
    partnerId: string;
    payload: {
      listingId: string;
      vendorId: string;
      changes: Record<string, unknown>;
    };
  }): void {
    const normalized = this.unwrapListingEvent(event);
    if (!normalized) {
      this.logger.warn('Skipping listing.updated websocket broadcast: invalid event payload');
      return;
    }

    this.logger.debug(`Broadcasting listing.updated: ${normalized.listingId}`);

    // Notify listing viewers
    this.broadcastService.broadcastToListing(normalized.listingId, 'listing:updated', {
      listingId: normalized.listingId,
      changes: normalized.changes,
    });

    // Notify vendor
    this.broadcastService.broadcastToVendor(normalized.vendorId, 'listing:updated', {
      listingId: normalized.listingId,
      changes: normalized.changes,
    });
  }

  @OnEvent('listing.listing.published')
  @OnEvent('listing.published')
  handleListingPublished(event: {
    partnerId: string;
    listingId: string;
    vendorId: string;
    title: string;
    publishedAt: Date;
  } | {
    partnerId: string;
    payload: {
      listingId: string;
      vendorId: string;
      title: string;
    };
    occurredAt: string;
  }): void {
    const normalized = this.unwrapListingEvent(event);
    if (!normalized) {
      this.logger.warn('Skipping listing.published websocket broadcast: invalid event payload');
      return;
    }

    const publishedAt =
      (normalized as { publishedAt?: Date }).publishedAt ??
      new Date((event as { occurredAt?: string }).occurredAt ?? Date.now());

    this.logger.debug(`Broadcasting listing.published: ${normalized.listingId}`);

    // Notify all partner members
    this.broadcastService.broadcastToTenant(normalized.partnerId, 'listing:published', {
      listingId: normalized.listingId,
      title: normalized.title,
      publishedAt,
    });

    // Notify listing viewers
    this.broadcastService.broadcastToListing(normalized.listingId, 'listing:updated', {
      listingId: normalized.listingId,
      status: 'PUBLISHED',
    });

    // Notify vendor
    this.broadcastService.broadcastToVendor(normalized.vendorId, 'listing:published', {
      listingId: normalized.listingId,
      title: normalized.title,
      publishedAt,
    });
  }

  @OnEvent('listing.listing.unpublished')
  @OnEvent('listing.unpublished')
  handleListingUnpublished(
    event:
      | { partnerId: string; listingId: string; vendorId: string }
      | { partnerId: string; payload: { listingId: string; vendorId: string } },
  ): void {
    const normalized = this.unwrapListingEvent(event);
    if (!normalized) {
      this.logger.warn('Skipping listing.unpublished websocket broadcast: invalid event payload');
      return;
    }

    this.logger.debug(`Broadcasting listing.unpublished: ${normalized.listingId}`);

    // Notify listing viewers
    this.broadcastService.broadcastToListing(normalized.listingId, 'listing:unpublished', {
      listingId: normalized.listingId,
    });

    // Notify vendor
    this.broadcastService.broadcastToVendor(normalized.vendorId, 'listing:unpublished', {
      listingId: normalized.listingId,
    });
  }

  @OnEvent('listing.listing.expired')
  @OnEvent('listing.expired')
  handleListingExpired(event: {
    partnerId: string;
    listingId: string;
    vendorId: string;
    reason?: string;
  } | {
    partnerId: string;
    payload: {
      listingId: string;
      vendorId: string;
      reason?: string;
    };
  }): void {
    const normalized = this.unwrapListingEvent(event);
    if (!normalized) {
      this.logger.warn('Skipping listing.expired websocket broadcast: invalid event payload');
      return;
    }

    this.logger.debug(`Broadcasting listing.expired: ${normalized.listingId}`);

    // Notify vendor
    this.broadcastService.broadcastToVendor(normalized.vendorId, 'listing:expired', {
      listingId: normalized.listingId,
      reason: (normalized as { reason?: string }).reason,
    });

    // Notify listing viewers
    this.broadcastService.broadcastToListing(normalized.listingId, 'listing:expired', {
      listingId: normalized.listingId,
    });
  }

  @OnEvent('listing.listing.deleted')
  @OnEvent('listing.deleted')
  handleListingDeleted(
    event:
      | { partnerId: string; listingId: string; vendorId: string }
      | { partnerId: string; payload: { listingId: string; vendorId: string } },
  ): void {
    const normalized = this.unwrapListingEvent(event);
    if (!normalized) {
      this.logger.warn('Skipping listing.deleted websocket broadcast: invalid event payload');
      return;
    }

    this.logger.debug(`Broadcasting listing.deleted: ${normalized.listingId}`);

    // Notify listing viewers to redirect
    this.broadcastService.broadcastToListing(normalized.listingId, 'listing:deleted', {
      listingId: normalized.listingId,
    });

    // Notify vendor
    this.broadcastService.broadcastToVendor(normalized.vendorId, 'listing:deleted', {
      listingId: normalized.listingId,
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
