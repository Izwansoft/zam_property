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
export interface TenantUpdatedEvent {
  tenantId: string;
}

export interface TenantSuspendedEvent {
  tenantId: string;
}

export interface VendorUpdatedEvent {
  tenantId: string;
  vendorId: string;
}

export interface ListingUpdatedEvent {
  tenantId: string;
  listingId: string;
  vendorId?: string;
}

export interface ListingPublishedEvent {
  tenantId: string;
  listingId: string;
  vendorId: string;
}

export interface SubscriptionChangedEvent {
  tenantId: string;
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
  tenantId: string;
  userId: string;
}

/**
 * Cache invalidation service.
 * Listens to domain events and invalidates relevant cache keys.
 *
 * Per part-32.md Cascading Invalidation Map:
 * - tenant.updated → ent:t:{id}:tenant, cfg:t:{id}:*
 * - tenant.suspended → ent:t:{id}:*, comp:t:{id}:*, cfg:t:{id}:*
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
  // Tenant Events
  // ───────────────────────────────────────────────────────────────────────────

  @OnEvent('tenant.updated')
  async handleTenantUpdated(event: TenantUpdatedEvent): Promise<void> {
    const { tenantId } = event;
    this.logger.debug(`Invalidating cache for tenant.updated: ${tenantId}`);

    await Promise.all([
      this.cacheService.del(EntityCacheKeys.tenant(tenantId)),
      this.cacheService.delByPattern(CachePatterns.allTenantConfig(tenantId)),
    ]);
  }

  @OnEvent('tenant.suspended')
  async handleTenantSuspended(event: TenantSuspendedEvent): Promise<void> {
    const { tenantId } = event;
    this.logger.debug(`Invalidating cache for tenant.suspended: ${tenantId}`);

    // Invalidate all tenant-scoped caches
    await Promise.all([
      this.cacheService.delByPattern(CachePatterns.allTenantEntities(tenantId)),
      this.cacheService.delByPattern(CachePatterns.allTenantComputed(tenantId)),
      this.cacheService.delByPattern(CachePatterns.allTenantConfig(tenantId)),
    ]);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Vendor Events
  // ───────────────────────────────────────────────────────────────────────────

  @OnEvent('vendor.updated')
  async handleVendorUpdated(event: VendorUpdatedEvent): Promise<void> {
    const { tenantId, vendorId } = event;
    this.logger.debug(`Invalidating cache for vendor.updated: ${tenantId}/${vendorId}`);

    await Promise.all([
      this.cacheService.del(EntityCacheKeys.vendor(tenantId, vendorId)),
      this.cacheService.delByPattern(CachePatterns.allVendor(tenantId, vendorId)),
    ]);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Listing Events
  // ───────────────────────────────────────────────────────────────────────────

  @OnEvent('listing.updated')
  async handleListingUpdated(event: ListingUpdatedEvent): Promise<void> {
    const { tenantId, listingId, vendorId } = event;
    this.logger.debug(`Invalidating cache for listing.updated: ${tenantId}/${listingId}`);

    const invalidations = [
      this.cacheService.del(EntityCacheKeys.listing(tenantId, listingId)),
      this.cacheService.del(EntityCacheKeys.listingFull(tenantId, listingId)),
    ];

    // Also invalidate vendor stats if vendorId is known
    if (vendorId) {
      invalidations.push(this.cacheService.del(ComputedCacheKeys.vendorStats(tenantId, vendorId)));
    }

    await Promise.all(invalidations);
  }

  @OnEvent('listing.published')
  async handleListingPublished(event: ListingPublishedEvent): Promise<void> {
    const { tenantId, listingId, vendorId } = event;
    this.logger.debug(`Invalidating cache for listing.published: ${tenantId}/${listingId}`);

    await Promise.all([
      this.cacheService.del(EntityCacheKeys.listing(tenantId, listingId)),
      this.cacheService.del(EntityCacheKeys.listingFull(tenantId, listingId)),
      this.cacheService.del(ComputedCacheKeys.dashboardStats(tenantId)),
      this.cacheService.del(ComputedCacheKeys.vendorStats(tenantId, vendorId)),
    ]);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Subscription Events
  // ───────────────────────────────────────────────────────────────────────────

  @OnEvent('subscription.changed')
  async handleSubscriptionChanged(event: SubscriptionChangedEvent): Promise<void> {
    const { tenantId } = event;
    this.logger.debug(`Invalidating cache for subscription.changed: ${tenantId}`);

    await Promise.all([
      this.cacheService.del(ComputedCacheKeys.entitlements(tenantId)),
      this.cacheService.delByPattern(`comp:t:${tenantId}:usage:*`),
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
      event.tenantId
        ? this.cacheService.del(ConfigCacheKeys.featureFlagsTenantOverrides(event.tenantId))
        : Promise.resolve(),
      event.tenantId
        ? this.cacheService.del(ConfigCacheKeys.experimentOptInsForTenant(event.tenantId))
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
    const { tenantId, userId } = event;
    this.logger.debug(`Invalidating cache for user.updated: ${tenantId}/${userId}`);

    await this.cacheService.del(EntityCacheKeys.user(tenantId, userId));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Manual Invalidation Methods
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Invalidate all caches for a tenant.
   * Use with caution - this is expensive!
   */
  async invalidateTenantCache(tenantId: string): Promise<void> {
    this.logger.warn(`Invalidating ALL cache for tenant: ${tenantId}`);
    await this.cacheService.delByPattern(CachePatterns.allTenant(tenantId));
  }

  /**
   * Invalidate a specific entity cache.
   */
  async invalidateEntity(
    tenantId: string,
    entityType: 'listing' | 'vendor' | 'user',
    entityId: string,
  ): Promise<void> {
    this.logger.debug(`Manual cache invalidation: ${entityType} ${tenantId}/${entityId}`);

    switch (entityType) {
      case 'listing':
        await this.cacheService.del(EntityCacheKeys.listing(tenantId, entityId));
        await this.cacheService.del(EntityCacheKeys.listingFull(tenantId, entityId));
        break;
      case 'vendor':
        await this.cacheService.del(EntityCacheKeys.vendor(tenantId, entityId));
        break;
      case 'user':
        await this.cacheService.del(EntityCacheKeys.user(tenantId, entityId));
        break;
    }
  }
}
