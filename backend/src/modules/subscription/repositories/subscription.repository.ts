import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { TenantContextService } from '@core/tenant-context/tenant-context.service';
import {
  CreateSubscriptionParams,
  UpdateSubscriptionParams,
  SubscriptionRecord,
} from '../types/subscription.types';
import { SubscriptionStatus, Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Create a new subscription (tenant-scoped)
   */
  async create(params: CreateSubscriptionParams): Promise<SubscriptionRecord> {
    const tenantId = this.tenantContext.tenantId;

    return this.prisma.subscription.create({
      data: {
        tenantId: tenantId,
        planId: params.planId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: params.currentPeriodStart,
        currentPeriodEnd: params.currentPeriodEnd,
        externalId: params.externalId,
        externalProvider: params.externalProvider,
        overrides: params.overrides as Prisma.InputJsonValue,
      },
      include: {
        plan: true,
      },
    });
  }

  /**
   * Find subscription by tenant ID
   */
  async findByTenantId(tenantId: string): Promise<SubscriptionRecord | null> {
    return this.prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        plan: true,
      },
    });
  }

  /**
   * Find current tenant's subscription
   */
  async findCurrent(): Promise<SubscriptionRecord | null> {
    const tenantId = this.tenantContext.tenantId;
    return this.findByTenantId(tenantId);
  }

  /**
   * Update subscription
   */
  async update(tenantId: string, params: UpdateSubscriptionParams): Promise<SubscriptionRecord> {
    const data: {
      status?: SubscriptionStatus;
      currentPeriodEnd?: Date;
      externalId?: string;
      overrides?: Prisma.InputJsonValue;
    } = {};

    if (params.status !== undefined) data.status = params.status;
    if (params.currentPeriodEnd !== undefined) data.currentPeriodEnd = params.currentPeriodEnd;
    if (params.externalId !== undefined) data.externalId = params.externalId;
    if (params.overrides !== undefined) data.overrides = params.overrides as Prisma.InputJsonValue;

    return this.prisma.subscription.update({
      where: { tenantId },
      data,
      include: {
        plan: true,
      },
    });
  }

  /**
   * Update subscription status
   */
  async updateStatus(tenantId: string, status: SubscriptionStatus): Promise<SubscriptionRecord> {
    return this.prisma.subscription.update({
      where: { tenantId },
      data: { status },
      include: {
        plan: true,
      },
    });
  }

  /**
   * Cancel subscription
   */
  async cancel(tenantId: string): Promise<SubscriptionRecord> {
    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: {
        plan: true,
      },
    });
  }

  /**
   * Change plan
   */
  async changePlan(
    tenantId: string,
    newPlanId: string,
    effectiveDate?: Date,
  ): Promise<SubscriptionRecord> {
    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        planId: newPlanId,
        currentPeriodEnd: effectiveDate,
      },
      include: {
        plan: true,
      },
    });
  }

  /**
   * Get all subscriptions for a plan (for analytics)
   */
  async findByPlanId(planId: string): Promise<SubscriptionRecord[]> {
    return this.prisma.subscription.findMany({
      where: { planId },
      include: {
        plan: true,
        tenant: true,
      },
    });
  }

  /**
   * Count active subscriptions
   */
  async countActive(): Promise<number> {
    return this.prisma.subscription.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  /**
   * Count subscriptions by status
   */
  async countByStatus(status: SubscriptionStatus): Promise<number> {
    return this.prisma.subscription.count({
      where: { status },
    });
  }
}
