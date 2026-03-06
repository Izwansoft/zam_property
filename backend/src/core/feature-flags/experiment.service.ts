import { BadRequestException, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { createHash } from 'crypto';

import { PartnerContextService } from '@core/partner-context';
import { CacheService, CacheTTL, ConfigCacheKeys } from '@infrastructure/cache';
import { PrismaService } from '@infrastructure/database';
import { EventBusService, FeatureFlagUpdatedEvent } from '@infrastructure/events';

export interface ExperimentVariant {
  key: string;
  weight: number;
}

type CachedExperiment = {
  id: string;
  key: string;
  description: string;
  owner: string;
  successMetrics: string | null;
  variants: ExperimentVariant[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  featureFlagId: string | null;
  createdAt: string;
  updatedAt: string;
};

@Injectable({ scope: Scope.REQUEST })
export class ExperimentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly cache: CacheService,
    private readonly eventBus: EventBusService,
  ) {}

  private get partnerId(): string {
    return this.PartnerContext.partnerId;
  }

  private stableBucket(subject: string, experimentKey: string): number {
    const hash = createHash('sha256').update(`${experimentKey}:${subject}`).digest();
    const value = hash.readUInt32BE(0);
    return value % 10000;
  }

  private pickVariant(
    experimentKey: string,
    subject: string,
    variants: ExperimentVariant[],
  ): string {
    const total = variants.reduce((sum, v) => sum + Math.max(0, v.weight), 0);
    if (total <= 0) return variants[0]?.key ?? 'control';

    const bucket = this.stableBucket(subject, experimentKey);
    const target = bucket % total;

    let cumulative = 0;
    for (const v of variants) {
      cumulative += Math.max(0, v.weight);
      if (target < cumulative) return v.key;
    }

    return variants[variants.length - 1]?.key ?? 'control';
  }

  async listExperiments(): Promise<CachedExperiment[]> {
    return this.cache.getOrSet<CachedExperiment[]>(
      ConfigCacheKeys.experiments(),
      async () => {
        const experiments = await this.prisma.experiment.findMany({ orderBy: { key: 'asc' } });
        return experiments.map((e) => ({
          id: e.id,
          key: e.key,
          description: e.description,
          owner: e.owner,
          successMetrics: e.successMetrics ?? null,
          variants: (e.variants as unknown as ExperimentVariant[]) ?? [],
          startsAt: e.startsAt.toISOString(),
          endsAt: e.endsAt.toISOString(),
          isActive: e.isActive,
          featureFlagId: e.featureFlagId ?? null,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        }));
      },
      { ttl: CacheTTL.FEATURE_FLAGS },
    );
  }

  async getExperimentByKeyOrThrow(key: string): Promise<CachedExperiment> {
    const experiments = await this.listExperiments();
    const experiment = experiments.find((e) => e.key === key);
    if (!experiment) throw new NotFoundException('Experiment not found');
    return experiment;
  }

  async createExperiment(input: {
    key: string;
    description: string;
    owner: string;
    successMetrics?: string | null;
    variants: ExperimentVariant[];
    startsAt: Date;
    endsAt: Date;
    isActive?: boolean;
    featureFlagKey?: string | null;
  }): Promise<{ id: string; key: string }> {
    if (input.endsAt <= input.startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
    if (!input.variants?.length) {
      throw new BadRequestException('variants must not be empty');
    }

    const featureFlagId = input.featureFlagKey
      ? (
          await this.prisma.featureFlag.findUnique({
            where: { key: input.featureFlagKey },
            select: { id: true },
          })
        )?.id
      : undefined;

    if (input.featureFlagKey && !featureFlagId) {
      throw new BadRequestException('featureFlagKey not found');
    }

    const created = await this.prisma.experiment.create({
      data: {
        key: input.key,
        description: input.description,
        owner: input.owner,
        successMetrics: input.successMetrics ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        variants: input.variants as any,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        isActive: input.isActive ?? true,
        featureFlagId: featureFlagId ?? undefined,
      },
      select: { id: true, key: true },
    });

    await this.cache.del(ConfigCacheKeys.experiments());
    await this.eventBus.publish(
      new FeatureFlagUpdatedEvent({
        partnerId: null,
        correlationId: this.PartnerContext.correlationId,
        actorType: 'user',
        actorId: this.PartnerContext.userId,
        payload: {
          flagKey: `experiment:${created.key}`,
          previousValue: {},
          newValue: input as unknown as Record<string, unknown>,
          updatedBy: this.PartnerContext.userId ?? 'system',
        },
      }),
    );

    return created;
  }

  async upsertTenantOptIn(experimentKey: string, partnerId: string, optIn: boolean): Promise<void> {
    const experiment = await this.prisma.experiment.findUnique({
      where: { key: experimentKey },
      select: { id: true },
    });
    if (!experiment) throw new NotFoundException('Experiment not found');

    if (!optIn) {
      await this.prisma.experimentPartnerOptIn.deleteMany({
        where: { experimentId: experiment.id, partnerId },
      });
      await this.cache.del(ConfigCacheKeys.experimentOptInsForTenant(partnerId));
      return;
    }

    await this.prisma.experimentPartnerOptIn.upsert({
      where: { experimentId_partnerId: { experimentId: experiment.id, partnerId } },
      create: { experimentId: experiment.id, partnerId },
      update: {},
    });

    await this.cache.del(ConfigCacheKeys.experimentOptInsForTenant(partnerId));
  }

  async isTenantOptedIn(experimentKey: string, partnerId: string): Promise<boolean> {
    const optIns = await this.cache.getOrSet<string[]>(
      ConfigCacheKeys.experimentOptInsForTenant(partnerId),
      async () => {
        const rows = await this.prisma.experimentPartnerOptIn.findMany({
          where: { partnerId },
          select: { experiment: { select: { key: true } } },
        });
        return rows.map((r) => r.experiment.key);
      },
      { ttl: CacheTTL.FEATURE_FLAGS },
    );

    return optIns.includes(experimentKey);
  }

  async getAssignment(
    experimentKey: string,
    subject: string,
    partnerId: string,
  ): Promise<{ variant: string } | null> {
    const experiment = await this.getExperimentByKeyOrThrow(experimentKey);
    if (!experiment.isActive) return null;

    const now = Date.now();
    if (now < Date.parse(experiment.startsAt) || now > Date.parse(experiment.endsAt)) return null;

    const optedIn = await this.isTenantOptedIn(experimentKey, partnerId);
    if (!optedIn) return null;

    return { variant: this.pickVariant(experimentKey, subject, experiment.variants) };
  }
}
