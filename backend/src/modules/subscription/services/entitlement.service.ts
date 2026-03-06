import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { Prisma } from '@prisma/client';
import {
  ResolvedEntitlements,
  EntitlementCheckResult,
  PlanEntitlements,
} from '../types/subscription.types';

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly PartnerContext: PartnerContextService,
  ) {}

  /**
   * Resolve entitlements for current partner
   * Returns cached snapshot if available and not expired
   */
  async resolve(): Promise<ResolvedEntitlements> {
    const partnerId = this.PartnerContext.partnerId;

    // Check for cached snapshot
    const snapshot = await this.prisma.entitlementSnapshot.findUnique({
      where: { partnerId },
    });

    if (snapshot && snapshot.expiresAt > new Date()) {
      this.logger.debug(`Using cached entitlements for partner ${partnerId}`);
      return snapshot.entitlements as ResolvedEntitlements;
    }

    // Compute fresh entitlements
    const entitlements = await this.computeEntitlements(partnerId);

    // Cache the result
    await this.cacheEntitlements(partnerId, entitlements);

    return entitlements;
  }

  /**
   * Check if an action is allowed
   */
  async check(entitlementKey: string): Promise<EntitlementCheckResult> {
    const entitlements = await this.resolve();

    const value = entitlements[entitlementKey];

    if (value === undefined) {
      return {
        allowed: false,
        reason: `Entitlement '${entitlementKey}' not defined`,
      };
    }

    if (typeof value === 'boolean') {
      return {
        allowed: value,
        reason: value ? undefined : `Entitlement '${entitlementKey}' denied`,
      };
    }

    // For numeric entitlements, return true if > 0
    if (typeof value === 'number') {
      return {
        allowed: value > 0,
        limit: value,
        reason: value > 0 ? undefined : `Quota exceeded for '${entitlementKey}'`,
      };
    }

    return {
      allowed: false,
      reason: `Invalid entitlement type for '${entitlementKey}'`,
    };
  }

  /**
   * Check if quota allows action (for usage-based entitlements)
   */
  async checkQuota(entitlementKey: string, currentUsage: number): Promise<EntitlementCheckResult> {
    const entitlements = await this.resolve();

    const limit = entitlements[entitlementKey];

    if (typeof limit !== 'number') {
      return {
        allowed: true, // no limit defined = unlimited
        currentUsage,
      };
    }

    const allowed = currentUsage < limit;

    return {
      allowed,
      currentUsage,
      limit,
      reason: allowed
        ? undefined
        : `Quota limit reached for '${entitlementKey}' (${currentUsage}/${limit})`,
    };
  }

  /**
   * Invalidate cached entitlements
   */
  async invalidate(partnerId?: string): Promise<void> {
    const targetpartnerId = partnerId || this.PartnerContext.partnerId;

    await this.prisma.entitlementSnapshot.deleteMany({
      where: { partnerId: targetpartnerId },
    });

    this.logger.log(`Invalidated entitlements cache for partner ${targetpartnerId}`);
  }

  /**
   * Compute entitlements from subscription + plan + overrides
   */
  private async computeEntitlements(partnerId: string): Promise<ResolvedEntitlements> {
    const subscription = await this.subscriptionRepository.findBypartnerId(partnerId);

    if (!subscription || !subscription.plan) {
      // No subscription = minimal free tier
      return this.getFreeTierEntitlements();
    }

    const planEntitlements = subscription.plan.entitlements as PlanEntitlements;
    const overrides = (subscription.overrides as PlanEntitlements) || {};

    // Merge plan entitlements with overrides
    const resolved: ResolvedEntitlements = {};

    // Process listing limits
    const listingLimit = overrides.listings?.limit ?? planEntitlements.listings?.limit ?? 0;
    resolved['listing.create.limit'] = listingLimit;

    // Process vertical-specific listing limits
    const verticalLimits = {
      ...planEntitlements.listings?.verticals,
      ...overrides.listings?.verticals,
    };
    Object.entries(verticalLimits).forEach(([vertical, limit]) => {
      resolved[`listing.create.${vertical}.limit`] = limit;
    });

    // Process interaction limits
    const interactionLimit =
      overrides.interactions?.limit ?? planEntitlements.interactions?.limit ?? 0;
    resolved['interaction.create.limit'] = interactionLimit;

    // Process media limits
    const mediaUploadLimit =
      overrides.media?.uploadLimit ?? planEntitlements.media?.uploadLimit ?? 0;
    resolved['media.upload.limit'] = mediaUploadLimit;

    const mediaStorageLimit =
      overrides.media?.storageLimit ?? planEntitlements.media?.storageLimit ?? 0;
    resolved['media.storage.limit'] = mediaStorageLimit;

    // Process feature flags
    const features = [...(planEntitlements.features || []), ...(overrides.features || [])];
    features.forEach((feature) => {
      resolved[`feature.${feature}`] = true;
    });

    // Process vertical access
    const verticals = [...(planEntitlements.verticals || []), ...(overrides.verticals || [])];
    verticals.forEach((vertical) => {
      resolved[`vertical.${vertical}.enabled`] = true;
    });

    // Process API rate limits
    const apiRateLimit =
      overrides.api?.requestsPerMinute ?? planEntitlements.api?.requestsPerMinute ?? 60; // default 60 req/min
    resolved['api.requests.limit'] = apiRateLimit;

    this.logger.debug(
      `Computed entitlements for partner ${partnerId}: ${Object.keys(resolved).length} keys`,
    );

    return resolved;
  }

  /**
   * Get free tier entitlements (fallback when no subscription)
   */
  private getFreeTierEntitlements(): ResolvedEntitlements {
    return {
      'listing.create.limit': 3,
      'interaction.create.limit': 10,
      'media.upload.limit': 10,
      'media.storage.limit': 1,
      'api.requests.limit': 30,
    };
  }

  /**
   * Cache entitlements
   */
  private async cacheEntitlements(
    partnerId: string,
    entitlements: ResolvedEntitlements,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.CACHE_TTL);

    const subscription = await this.subscriptionRepository.findBypartnerId(partnerId);

    await this.prisma.entitlementSnapshot.upsert({
      where: { partnerId },
      update: {
        entitlements,
        planId: subscription?.planId,
        overrides: subscription?.overrides
          ? (subscription.overrides as Prisma.InputJsonValue)
          : Prisma.DbNull,
        computedAt: new Date(),
        expiresAt,
      },
      create: {
        partnerId,
        entitlements,
        planId: subscription?.planId,
        overrides: subscription?.overrides
          ? (subscription.overrides as Prisma.InputJsonValue)
          : Prisma.DbNull,
        expiresAt,
      },
    });

    this.logger.debug(`Cached entitlements for partner ${partnerId}`);
  }
}
