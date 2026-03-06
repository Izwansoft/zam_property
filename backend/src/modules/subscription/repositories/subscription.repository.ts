import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
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
    private readonly PartnerContext: PartnerContextService,
  ) {}

  /**
   * Create a new subscription (partner-scoped)
   */
  async create(params: CreateSubscriptionParams): Promise<SubscriptionRecord> {
    const partnerId = this.PartnerContext.partnerId;

    return this.prisma.subscription.create({
      data: {
        partnerId: partnerId,
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
   * Find subscription by partner ID
   */
  async findBypartnerId(partnerId: string): Promise<SubscriptionRecord | null> {
    return this.prisma.subscription.findUnique({
      where: { partnerId },
      include: {
        plan: true,
      },
    });
  }

  /**
   * Find current partner's subscription
   */
  async findCurrent(): Promise<SubscriptionRecord | null> {
    const partnerId = this.PartnerContext.partnerId;
    return this.findBypartnerId(partnerId);
  }

  /**
   * Update subscription
   */
  async update(partnerId: string, params: UpdateSubscriptionParams): Promise<SubscriptionRecord> {
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
      where: { partnerId },
      data,
      include: {
        plan: true,
      },
    });
  }

  /**
   * Update subscription status
   */
  async updateStatus(partnerId: string, status: SubscriptionStatus): Promise<SubscriptionRecord> {
    return this.prisma.subscription.update({
      where: { partnerId },
      data: { status },
      include: {
        plan: true,
      },
    });
  }

  /**
   * Cancel subscription
   */
  async cancel(partnerId: string): Promise<SubscriptionRecord> {
    return this.prisma.subscription.update({
      where: { partnerId },
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
    partnerId: string,
    newPlanId: string,
    effectiveDate?: Date,
  ): Promise<SubscriptionRecord> {
    return this.prisma.subscription.update({
      where: { partnerId },
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
        partner: true,
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
