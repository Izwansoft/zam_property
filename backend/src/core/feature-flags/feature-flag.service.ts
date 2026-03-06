import { BadRequestException, Injectable, Logger, NotFoundException, Scope } from '@nestjs/common';
import { createHash } from 'crypto';
import { FeatureFlagType, Role } from '@prisma/client';

import { PartnerContextService } from '@core/partner-context';
import { CacheService, CacheTTL, ConfigCacheKeys } from '@infrastructure/cache';
import { PrismaService } from '@infrastructure/database';
import { EventBusService, FeatureFlagUpdatedEvent } from '@infrastructure/events';

export interface FeatureFlagEvaluationContext {
  partnerId: string;
  userId?: string;
  role?: Role;
  verticalType?: string;
}

export interface FeatureFlagEvaluationResult {
  key: string;
  enabled: boolean;
  reason:
    | 'emergency_override'
    | 'user_target'
    | 'partner_override'
    | 'vertical_override'
    | 'percentage'
    | 'default'
    | 'missing'
    | 'archived'
    | 'role_blocked'
    | 'vertical_blocked';
  bucket?: number;
}

type CachedFeatureFlag = {
  id: string;
  key: string;
  type: FeatureFlagType;
  description: string;
  owner: string;
  defaultValue: boolean;
  rolloutPercentage: number | null;
  allowedVerticals: string[];
  allowedRoles: Role[];
  reviewAt: string | null;
  expiresAt: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

type CachedFeatureFlagOverride = {
  id: string;
  featureFlagId: string;
  partnerId: string | null;
  verticalType: string | null;
  role: Role | null;
  isEmergency: boolean;
  value: boolean;
  rolloutPercentage: number | null;
  createdAt: string;
  updatedAt: string;
};

@Injectable({ scope: Scope.REQUEST })
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly cache: CacheService,
    private readonly eventBus: EventBusService,
  ) {}

  private get partnerId(): string {
    return this.PartnerContext.partnerId;
  }

  private stableBucket(subject: string, flagKey: string): number {
    const hash = createHash('sha256').update(`${flagKey}:${subject}`).digest();
    const value = hash.readUInt32BE(0);
    return value % 100;
  }

  private computeRolloutEnabled(
    flagKey: string,
    percent: number,
    subject?: string,
  ): { enabled: boolean; bucket?: number } {
    const normalized = Math.max(0, Math.min(100, Math.floor(percent)));
    if (normalized <= 0) return { enabled: false, bucket: 0 };
    if (normalized >= 100) return { enabled: true, bucket: 0 };

    const stableSubject = subject?.trim().length ? subject.trim() : this.partnerId;
    const bucket = this.stableBucket(stableSubject, flagKey);
    return { enabled: bucket < normalized, bucket };
  }

  private async getAllFlagsCached(): Promise<CachedFeatureFlag[]> {
    return this.cache.getOrSet<CachedFeatureFlag[]>(
      ConfigCacheKeys.featureFlags(),
      async () => {
        const flags = await this.prisma.featureFlag.findMany({
          where: { isArchived: false },
          orderBy: { key: 'asc' },
        });
        return flags.map((f) => ({
          id: f.id,
          key: f.key,
          type: f.type,
          description: f.description,
          owner: f.owner,
          defaultValue: f.defaultValue,
          rolloutPercentage: f.rolloutPercentage ?? null,
          allowedVerticals: f.allowedVerticals,
          allowedRoles: f.allowedRoles,
          reviewAt: f.reviewAt ? f.reviewAt.toISOString() : null,
          expiresAt: f.expiresAt ? f.expiresAt.toISOString() : null,
          isArchived: f.isArchived,
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        }));
      },
      { ttl: CacheTTL.FEATURE_FLAGS },
    );
  }

  private async getOverridesForTenantCached(
    partnerId: string,
  ): Promise<CachedFeatureFlagOverride[]> {
    return this.cache.getOrSet<CachedFeatureFlagOverride[]>(
      ConfigCacheKeys.featureFlagsTenantOverrides(partnerId),
      async () => {
        const overrides = await this.prisma.featureFlagOverride.findMany({
          where: {
            OR: [{ partnerId }, { partnerId: null }],
          },
        });
        return overrides.map((o) => ({
          id: o.id,
          featureFlagId: o.featureFlagId,
          partnerId: o.partnerId ?? null,
          verticalType: o.verticalType ?? null,
          role: o.role ?? null,
          isEmergency: o.isEmergency,
          value: o.value,
          rolloutPercentage: o.rolloutPercentage ?? null,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
        }));
      },
      { ttl: CacheTTL.FEATURE_FLAGS },
    );
  }

  private pickBestOverride(
    overrides: CachedFeatureFlagOverride[],
    context: FeatureFlagEvaluationContext,
    stage: 'emergency' | 'partner' | 'vertical',
  ): CachedFeatureFlagOverride | null {
    const matches = overrides.filter((o) => {
      if (stage === 'emergency' && !o.isEmergency) return false;
      if (stage !== 'emergency' && o.isEmergency) return false;

      if (stage === 'partner' && o.partnerId !== context.partnerId) return false;
      if (stage === 'vertical' && o.partnerId !== null) return false;

      if (o.verticalType && o.verticalType !== context.verticalType) return false;
      if (o.role && o.role !== context.role) return false;

      if (stage === 'vertical' && !o.verticalType) return false;

      return true;
    });

    if (matches.length === 0) return null;

    const score = (o: CachedFeatureFlagOverride): number => {
      let s = 0;
      if (o.partnerId) s += 100;
      if (o.verticalType) s += 10;
      if (o.role) s += 1;
      return s;
    };

    return matches.sort((a, b) => score(b) - score(a))[0] ?? null;
  }

  async evaluateFlag(
    flagKey: string,
    partialContext?: Partial<Omit<FeatureFlagEvaluationContext, 'partnerId'>>,
  ): Promise<FeatureFlagEvaluationResult> {
    const context: FeatureFlagEvaluationContext = {
      partnerId: this.partnerId,
      userId: partialContext?.userId,
      role: partialContext?.role,
      verticalType: partialContext?.verticalType,
    };

    const flags = await this.getAllFlagsCached();
    const flag = flags.find((f) => f.key === flagKey);

    if (!flag) {
      return { key: flagKey, enabled: false, reason: 'missing' };
    }

    if (flag.isArchived) {
      return { key: flagKey, enabled: false, reason: 'archived' };
    }

    if (flag.allowedRoles.length > 0) {
      if (!context.role || !flag.allowedRoles.includes(context.role)) {
        return { key: flagKey, enabled: false, reason: 'role_blocked' };
      }
    }

    if (flag.allowedVerticals.length > 0) {
      if (!context.verticalType || !flag.allowedVerticals.includes(context.verticalType)) {
        return { key: flagKey, enabled: false, reason: 'vertical_blocked' };
      }
    }

    const overridesAll = await this.getOverridesForTenantCached(context.partnerId);
    const overrides = overridesAll.filter((o) => o.featureFlagId === flag.id);

    // 1) Emergency override
    const emergency = this.pickBestOverride(overrides, context, 'emergency');
    if (emergency) {
      if (!emergency.value) return { key: flagKey, enabled: false, reason: 'emergency_override' };
      if (emergency.rolloutPercentage !== null) {
        const { enabled, bucket } = this.computeRolloutEnabled(
          flagKey,
          emergency.rolloutPercentage,
          context.userId,
        );
        return { key: flagKey, enabled, reason: 'emergency_override', bucket };
      }
      return { key: flagKey, enabled: true, reason: 'emergency_override' };
    }

    // 2) User target (user-segment)
    if (context.userId) {
      const target = await this.prisma.featureFlagUserTarget.findFirst({
        where: {
          partnerId: context.partnerId,
          userId: context.userId,
          featureFlagId: flag.id,
        },
        select: { value: true },
      });

      if (target) {
        return { key: flagKey, enabled: target.value, reason: 'user_target' };
      }
    }

    // 3) Partner override
    const partnerOverride = this.pickBestOverride(overrides, context, 'partner');
    if (partnerOverride) {
      if (!partnerOverride.value) return { key: flagKey, enabled: false, reason: 'partner_override' };
      if (partnerOverride.rolloutPercentage !== null) {
        const { enabled, bucket } = this.computeRolloutEnabled(
          flagKey,
          partnerOverride.rolloutPercentage,
          context.userId,
        );
        return { key: flagKey, enabled, reason: 'partner_override', bucket };
      }
      return { key: flagKey, enabled: true, reason: 'partner_override' };
    }

    // 4) Vertical override (global)
    const verticalOverride = this.pickBestOverride(overrides, context, 'vertical');
    if (verticalOverride) {
      if (!verticalOverride.value)
        return { key: flagKey, enabled: false, reason: 'vertical_override' };
      if (verticalOverride.rolloutPercentage !== null) {
        const { enabled, bucket } = this.computeRolloutEnabled(
          flagKey,
          verticalOverride.rolloutPercentage,
          context.userId,
        );
        return { key: flagKey, enabled, reason: 'vertical_override', bucket };
      }
      return { key: flagKey, enabled: true, reason: 'vertical_override' };
    }

    // 5) Percentage rollout
    if (flag.rolloutPercentage !== null) {
      const { enabled, bucket } = this.computeRolloutEnabled(
        flagKey,
        flag.rolloutPercentage,
        context.userId,
      );
      return { key: flagKey, enabled, reason: 'percentage', bucket };
    }

    // 6) Global default
    if (flag.type === FeatureFlagType.PERCENTAGE) {
      // No percentage specified; fail closed.
      return { key: flagKey, enabled: false, reason: 'default' };
    }

    return { key: flagKey, enabled: flag.defaultValue, reason: 'default' };
  }

  async isEnabled(
    flagKey: string,
    partialContext?: Partial<Omit<FeatureFlagEvaluationContext, 'partnerId'>>,
  ): Promise<boolean> {
    const result = await this.evaluateFlag(flagKey, partialContext);
    this.logger.debug({ message: 'Feature flag evaluated', ...result });
    return result.enabled;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN CRUD
  // ─────────────────────────────────────────────────────────────────────────

  async listFlags(): Promise<CachedFeatureFlag[]> {
    return this.getAllFlagsCached();
  }

  async getFlagByKeyOrThrow(key: string): Promise<CachedFeatureFlag> {
    const flags = await this.getAllFlagsCached();
    const flag = flags.find((f) => f.key === key);
    if (!flag) throw new NotFoundException('Feature flag not found');
    return flag;
  }

  async createFlag(input: {
    key: string;
    type: FeatureFlagType;
    description: string;
    owner: string;
    defaultValue: boolean;
    rolloutPercentage?: number | null;
    allowedVerticals?: string[];
    allowedRoles?: Role[];
    reviewAt?: Date | null;
    expiresAt?: Date | null;
  }): Promise<{ id: string; key: string }> {
    if (input.rolloutPercentage !== undefined && input.rolloutPercentage !== null) {
      if (input.rolloutPercentage < 0 || input.rolloutPercentage > 100) {
        throw new BadRequestException('rolloutPercentage must be between 0 and 100');
      }
    }

    const created = await this.prisma.featureFlag.create({
      data: {
        key: input.key,
        type: input.type,
        description: input.description,
        owner: input.owner,
        defaultValue: input.defaultValue,
        rolloutPercentage: input.rolloutPercentage ?? undefined,
        allowedVerticals: input.allowedVerticals ?? [],
        allowedRoles: input.allowedRoles ?? [],
        reviewAt: input.reviewAt ?? undefined,
        expiresAt: input.expiresAt ?? undefined,
      },
      select: { id: true, key: true },
    });

    await this.invalidateFlagCaches();
    await this.eventBus.publish(
      new FeatureFlagUpdatedEvent({
        partnerId: null,
        correlationId: this.PartnerContext.correlationId,
        actorType: 'user',
        actorId: this.PartnerContext.userId,
        payload: {
          flagKey: created.key,
          previousValue: {},
          newValue: input as unknown as Record<string, unknown>,
          updatedBy: this.PartnerContext.userId ?? 'system',
        },
      }),
    );

    return created;
  }

  async updateFlag(
    key: string,
    patch: {
      type?: FeatureFlagType;
      description?: string;
      owner?: string;
      defaultValue?: boolean;
      rolloutPercentage?: number | null;
      allowedVerticals?: string[];
      allowedRoles?: Role[];
      reviewAt?: Date | null;
      expiresAt?: Date | null;
      isArchived?: boolean;
    },
  ): Promise<{ id: string; key: string }> {
    const existing = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException('Feature flag not found');

    if (patch.rolloutPercentage !== undefined && patch.rolloutPercentage !== null) {
      if (patch.rolloutPercentage < 0 || patch.rolloutPercentage > 100) {
        throw new BadRequestException('rolloutPercentage must be between 0 and 100');
      }
    }

    const updated = await this.prisma.featureFlag.update({
      where: { key },
      data: {
        type: patch.type,
        description: patch.description,
        owner: patch.owner,
        defaultValue: patch.defaultValue,
        rolloutPercentage: patch.rolloutPercentage === null ? null : patch.rolloutPercentage,
        allowedVerticals: patch.allowedVerticals,
        allowedRoles: patch.allowedRoles,
        reviewAt: patch.reviewAt === null ? null : patch.reviewAt,
        expiresAt: patch.expiresAt === null ? null : patch.expiresAt,
        isArchived: patch.isArchived,
      },
      select: { id: true, key: true },
    });

    await this.invalidateFlagCaches();
    await this.eventBus.publish(
      new FeatureFlagUpdatedEvent({
        partnerId: null,
        correlationId: this.PartnerContext.correlationId,
        actorType: 'user',
        actorId: this.PartnerContext.userId,
        payload: {
          flagKey: key,
          previousValue: {
            type: existing.type,
            description: existing.description,
            owner: existing.owner,
            defaultValue: existing.defaultValue,
            rolloutPercentage: existing.rolloutPercentage,
            allowedVerticals: existing.allowedVerticals,
            allowedRoles: existing.allowedRoles,
            reviewAt: existing.reviewAt,
            expiresAt: existing.expiresAt,
            isArchived: existing.isArchived,
          },
          newValue: patch as unknown as Record<string, unknown>,
          updatedBy: this.PartnerContext.userId ?? 'system',
        },
      }),
    );

    return updated;
  }

  async upsertOverride(
    flagKey: string,
    input: {
      partnerId?: string | null;
      verticalType?: string | null;
      role?: Role | null;
      isEmergency?: boolean;
      value: boolean;
      rolloutPercentage?: number | null;
    },
  ): Promise<{ id: string }> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key: flagKey } });
    if (!flag) throw new NotFoundException('Feature flag not found');

    if (input.rolloutPercentage !== undefined && input.rolloutPercentage !== null) {
      if (input.rolloutPercentage < 0 || input.rolloutPercentage > 100) {
        throw new BadRequestException('rolloutPercentage must be between 0 and 100');
      }
    }

    const isEmergency = input.isEmergency ?? false;
    const partnerId = input.partnerId ?? null;
    const verticalType = input.verticalType ?? null;
    const role = input.role ?? null;

    const existing = await this.prisma.featureFlagOverride.findFirst({
      where: {
        featureFlagId: flag.id,
        partnerId,
        verticalType,
        role,
        isEmergency,
      },
      select: { id: true },
    });

    const override = existing
      ? await this.prisma.featureFlagOverride.update({
          where: { id: existing.id },
          data: {
            value: input.value,
            rolloutPercentage: input.rolloutPercentage === null ? null : input.rolloutPercentage,
          },
          select: { id: true },
        })
      : await this.prisma.featureFlagOverride.create({
          data: {
            featureFlagId: flag.id,
            partnerId,
            verticalType,
            role,
            isEmergency,
            value: input.value,
            rolloutPercentage: input.rolloutPercentage ?? undefined,
          },
          select: { id: true },
        });

    await this.invalidateFlagCaches(partnerId ?? undefined);
    await this.eventBus.publish(
      new FeatureFlagUpdatedEvent({
        partnerId: partnerId,
        correlationId: this.PartnerContext.correlationId,
        actorType: 'user',
        actorId: this.PartnerContext.userId,
        payload: {
          flagKey,
          previousValue: {},
          newValue: {
            scope: { partnerId, verticalType, role, isEmergency },
            value: input.value,
            rolloutPercentage: input.rolloutPercentage ?? null,
          },
          updatedBy: this.PartnerContext.userId ?? 'system',
        },
      }),
    );

    return override;
  }

  async setUserTarget(
    flagKey: string,
    input: { partnerId: string; userId: string; value: boolean },
  ): Promise<void> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key: flagKey } });
    if (!flag) throw new NotFoundException('Feature flag not found');

    await this.prisma.featureFlagUserTarget.upsert({
      where: {
        featureFlagId_partnerId_userId: {
          featureFlagId: flag.id,
          partnerId: input.partnerId,
          userId: input.userId,
        },
      },
      create: {
        featureFlagId: flag.id,
        partnerId: input.partnerId,
        userId: input.userId,
        value: input.value,
      },
      update: {
        value: input.value,
      },
    });

    await this.invalidateFlagCaches(input.partnerId);
  }

  async invalidateFlagCaches(partnerId?: string): Promise<void> {
    await this.cache.del(ConfigCacheKeys.featureFlags());
    if (partnerId) {
      await this.cache.del(ConfigCacheKeys.featureFlagsTenantOverrides(partnerId));
      return;
    }

    // Best-effort: partner override caches are per-partner; invalidating them all would require key scanning.
    // Rely on short TTL for propagation safety.
  }
}
