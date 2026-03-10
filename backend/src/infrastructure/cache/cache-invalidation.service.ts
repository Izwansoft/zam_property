import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { CacheService } from './cache.service';
import {
  EntityCacheKeys,
  ComputedCacheKeys,
  ConfigCacheKeys,
  CachePatterns,
} from './cache-key.builder';
import type { DomainEvent } from '@infrastructure/events';

/**
 * Event payloads for cache invalidation.
 */
export interface PartnerUpdatedEvent {
  partnerId: string;
}

export interface PartnerSuspendedEvent {
  partnerId: string;
}

export interface VendorUpdatedEvent {
  partnerId: string;
  vendorId: string;
}

export interface ListingUpdatedEvent {
  partnerId: string;
  listingId: string;
  vendorId?: string;
}

export interface ListingPublishedEvent {
  partnerId: string;
  listingId: string;
  vendorId: string;
}

export interface SubscriptionChangedEvent {
  partnerId: string;
}

export interface PlanUpdatedEvent {
  planId: string;
}

export interface FeatureFlagChangedEvent {
  flagKey: string;
}

export interface VerticalSchemaUpdatedEvent {
  verticalType: string;
}

export interface UserUpdatedEvent {
  partnerId: string;
  userId: string;
}

/**
 * Cache invalidation service.
 * Listens to domain events and invalidates relevant cache keys.
 *
 * Per part-32.md Cascading Invalidation Map:
 * - partner.updated → ent:t:{id}:partner, cfg:t:{id}:*
 * - partner.suspended → ent:t:{id}:*, comp:t:{id}:*, cfg:t:{id}:*
 * - vendor.updated → ent:t:{tid}:vendor:{id}, comp:t:{tid}:vendor:{id}:*
 * - listing.updated → ent:t:{tid}:listing:{id}*
 * - listing.published → ent:t:{tid}:listing:{id}*, comp:t:{tid}:stats:*
 * - subscription.changed → comp:t:{tid}:entitlements, comp:t:{tid}:usage:*
 * - plan.updated → ent:g:plan:{id}, cfg:g:plans:*
 * - feature_flag.flag.updated → cfg:g:feature-flags
 * - vertical.schema_updated → cfg:t:*:vertical:{type}:schema
 */
@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  constructor(private readonly cacheService: CacheService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // Partner Events
  // ───────────────────────────────────────────────────────────────────────────

  @OnEvent('partner.updated')
  async handleTenantUpdated(event: PartnerUpdatedEvent): Promise<void> {
    const { partnerId } = event;
    this.logger.debug(`Invalidating cache for partner.updated: ${partnerId}`);

    await Promise.all([
      this.cacheService.del(EntityCacheKeys.partner(partnerId)),
      this.cacheService.delByPattern(CachePatterns.allTenantConfig(partnerId)),
    ]);
  }

  @OnEvent('partner.suspended')
  async handleTenantSuspended(event: PartnerSuspendedEvent): Promise<void> {
    const { partnerId } = event;
    this.logger.debug(`Invalidating cache for partner.suspended: ${partnerId}`);

    // Invalidate all partner-scoped caches
    await Promise.all([
      this.cacheService.delByPattern(CachePatterns.allTenantEntities(partnerId)),
      this.cacheService.delByPattern(CachePatterns.allTenantComputed(partnerId)),
      this.cacheService.delByPattern(CachePatterns.allTenantConfig(partnerId)),
    ]);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Vendor Events
  // ───────────────────────────────────────────────────────────────────────────

  @OnEvent('vendor.updated')
  async handleVendorUpdated(event: VendorUpdatedEvent): Promise<void> {
    const { partnerId, vendorId } = event;
    this.logger.debug(`Invalidating cache for vendor.updated: ${partnerId}/${vendorId}`);

    await Promise.all([
      this.cacheService.del(EntityCacheKeys.vendor(partnerId, vendorId)),
      this.cacheService.delByPattern(CachePatterns.allVendor(partnerId, vendorId)),
    ]);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Listing Events
  // ───────────────────────────────────────────────────────────────────────────

  @OnEvent('listing.listing.updated')
  @OnEvent('listing.updated')
  async handleListingUpdated(
    event: ListingUpdatedEvent | { partnerId: string; payload: { listingId: string; vendorId?: string } },
  ): Promise<void> {
    const payload = 'payload' in event ? event.payload : event;
    const partnerId = event.partnerId;
    const listingId = payload.listingId;
    const vendorId = payload.vendorId;

    if (!partnerId || !listingId) {
      this.logger.warn('Skipping listing.updated cache invalidation: invalid event payload');
      return;
    }

    this.logger.debug(`Invalidating cache for listing.updated: ${partnerId}/${listingId}`);

    const invalidations = [
      this.cacheService.del(EntityCacheKeys.listing(partnerId, listingId)),
      this.cacheService.del(EntityCacheKeys.listingFull(partnerId, listingId)),
    ];

    // Also invalidate vendor stats if vendorId is known
    if (vendorId) {
      invalidations.push(this.cacheService.del(ComputedCacheKeys.vendorStats(partnerId, vendorId)));
    }

    await Promise.all(invalidations);
  }

  @OnEvent('listing.listing.published')
  @OnEvent('listing.published')
  async handleListingPublished(
    event: ListingPublishedEvent | { partnerId: string; payload: { listingId: string; vendorId: string } },
  ): Promise<void> {
    const payload = 'payload' in event ? event.payload : event;
    const partnerId = event.partnerId;
    const listingId = payload.listingId;
    const vendorId = payload.vendorId;

    if (!partnerId || !listingId || !vendorId) {
      this.logger.warn('Skipping listing.published cache invalidation: invalid event payload');
      return;
    }

    this.logger.debug(`Invalidating cache for listing.published: ${partnerId}/${listingId}`);

    await Promise.all([
      this.cacheService.del(EntityCacheKeys.listing(partnerId, listingId)),
      this.cacheService.del(EntityCacheKeys.listingFull(partnerId, listingId)),
      this.cacheService.del(ComputedCacheKeys.dashboardStats(partnerId)),
      this.cacheService.del(ComputedCacheKeys.vendorStats(partnerId, vendorId)),
    ]);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Subscription Events
  // ───────────────────────────────────────────────────────────────────────────

  @OnEvent('subscription.changed')
  async handleSubscriptionChanged(event: SubscriptionChangedEvent): Promise<void> {
    const { partnerId } = event;
    this.logger.debug(`Invalidating cache for subscription.changed: ${partnerId}`);

    await Promise.all([
      this.cacheService.del(ComputedCacheKeys.entitlements(partnerId)),
      this.cacheService.delByPattern(`comp:t:${partnerId}:usage:*`),
    ]);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Plan Events
  // ───────────────────────────────────────────────────────────────────────────

  @OnEvent('plan.updated')
  async handlePlanUpdated(event: PlanUpdatedEvent): Promise<void> {
    const { planId } = event;
    this.logger.debug(`Invalidating cache for plan.updated: ${planId}`);

    await Promise.all([
      this.cacheService.del(EntityCacheKeys.plan(planId)),
      this.cacheService.delByPattern('cfg:g:plans:*'),
    ]);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Feature Flag Events
  // ───────────────────────────────────────────────────────────────────────────

  @OnEvent('feature_flag.flag.updated')
  async handleFeatureFlagUpdated(event: DomainEvent<unknown>): Promise<void> {
    this.logger.debug('Invalidating cache for feature_flag.flag.updated');

    await Promise.all([
      this.cacheService.del(ConfigCacheKeys.featureFlags()),
      this.cacheService.del(ConfigCacheKeys.experiments()),
      event.partnerId
        ? this.cacheService.del(ConfigCacheKeys.featureFlagsTenantOverrides(event.partnerId))
        : Promise.resolve(),
      event.partnerId
        ? this.cacheService.del(ConfigCacheKeys.experimentOptInsForTenant(event.partnerId))
        : Promise.resolve(),
    ]);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Vertical Events
  // ───────────────────────────────────────────────────────────────────────────

  @OnEvent('vertical.schema_updated')
  async handleVerticalSchemaUpdated(event: VerticalSchemaUpdatedEvent): Promise<void> {
    const { verticalType } = event;
    this.logger.debug(`Invalidating cache for vertical.schema_updated: ${verticalType}`);

    await this.cacheService.delByPattern(`cfg:t:*:vertical:${verticalType}:schema`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // User Events
  // ───────────────────────────────────────────────────────────────────────────

  @OnEvent('user.updated')
  async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    const { partnerId, userId } = event;
    this.logger.debug(`Invalidating cache for user.updated: ${partnerId}/${userId}`);

    await this.cacheService.del(EntityCacheKeys.user(partnerId, userId));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Manual Invalidation Methods
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Invalidate all caches for a partner.
   * Use with caution - this is expensive!
   */
  async invalidateTenantCache(partnerId: string): Promise<void> {
    this.logger.warn(`Invalidating ALL cache for partner: ${partnerId}`);
    await this.cacheService.delByPattern(CachePatterns.allTenant(partnerId));
  }

  /**
   * Invalidate a specific entity cache.
   */
  async invalidateEntity(
    partnerId: string,
    entityType: 'listing' | 'vendor' | 'user',
    entityId: string,
  ): Promise<void> {
    this.logger.debug(`Manual cache invalidation: ${entityType} ${partnerId}/${entityId}`);

    switch (entityType) {
      case 'listing':
        await this.cacheService.del(EntityCacheKeys.listing(partnerId, entityId));
        await this.cacheService.del(EntityCacheKeys.listingFull(partnerId, entityId));
        break;
      case 'vendor':
        await this.cacheService.del(EntityCacheKeys.vendor(partnerId, entityId));
        break;
      case 'user':
        await this.cacheService.del(EntityCacheKeys.user(partnerId, entityId));
        break;
    }
  }
}
