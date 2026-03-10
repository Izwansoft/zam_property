import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PricingModel, PricingConfig, PricingRule, Prisma } from '@prisma/client';
import { PricingConfigWithRules } from '../types/pricing.types';

/**
 * Pricing Configuration Repository
 * Manages pricing configurations, rules, and charge events
 */
@Injectable()
export class PricingConfigRepository {
  private readonly logger = new Logger(PricingConfigRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // PRICING CONFIG CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async createConfig(data: {
    partnerId: string;
    model: PricingModel;
    name: string;
    description?: string;
    config: Prisma.InputJsonValue;
    verticalId?: string;
    isActive?: boolean;
  }): Promise<PricingConfig> {
    return this.prisma.pricingConfig.create({
      data: {
        partnerId: data.partnerId,
        model: data.model,
        name: data.name,
        description: data.description,
        config: data.config,
        verticalId: data.verticalId,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findConfigById(id: string, partnerId: string): Promise<PricingConfigWithRules | null> {
    return this.prisma.pricingConfig.findFirst({
      where: { id, partnerId },
      include: { rules: true },
    });
  }

  async findConfigs(params: {
    partnerId: string;
    model?: PricingModel;
    isActive?: boolean;
    verticalId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: PricingConfigWithRules[]; total: number }> {
    const { partnerId, model, isActive, verticalId, page = 1, pageSize = 20 } = params;

    const where: Prisma.PricingConfigWhereInput = {
      partnerId,
      ...(model && { model }),
      ...(isActive !== undefined && { isActive }),
      ...(verticalId && { verticalId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.pricingConfig.findMany({
        where,
        include: { rules: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.pricingConfig.count({ where }),
    ]);

    return { items, total };
  }

  async findActiveConfigs(partnerId: string, eventType?: string): Promise<PricingConfigWithRules[]> {
    const where: Prisma.PricingConfigWhereInput = {
      partnerId,
      isActive: true,
      rules: {
        some: {
          isActive: true,
          ...(eventType && { eventType }),
        },
      },
    };

    return this.prisma.pricingConfig.findMany({
      where,
      include: {
        rules: {
          where: {
            isActive: true,
            ...(eventType && { eventType }),
          },
        },
      },
    });
  }

  async updateConfig(
    id: string,
    partnerId: string,
    data: {
      name?: string;
      description?: string;
      config?: Prisma.InputJsonValue;
      isActive?: boolean;
    },
  ): Promise<PricingConfig> {
    return this.prisma.pricingConfig.update({
      where: { id, partnerId },
      data,
    });
  }

  async deleteConfig(id: string, partnerId: string): Promise<void> {
    await this.prisma.pricingConfig.delete({
      where: { id, partnerId },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRICING RULE CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async createRule(data: {
    pricingConfigId: string;
    name: string;
    description?: string;
    eventType: string;
    chargeType: string;
    amount: number;
    currency?: string;
    conditions?: Prisma.InputJsonValue;
    isActive?: boolean;
  }): Promise<PricingRule> {
    return this.prisma.pricingRule.create({
      data: {
        pricingConfigId: data.pricingConfigId,
        name: data.name,
        description: data.description,
        eventType: data.eventType,
        chargeType: data.chargeType as
          | 'SUBSCRIPTION'
          | 'LEAD'
          | 'INTERACTION'
          | 'COMMISSION'
          | 'LISTING'
          | 'ADDON'
          | 'OVERAGE',
        amount: data.amount,
        currency: data.currency ?? 'MYR',
        conditions: data.conditions,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findRules(params: {
    pricingConfigId?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: PricingRule[]; total: number }> {
    const { pricingConfigId, isActive, page = 1, pageSize = 20 } = params;

    const where: Prisma.PricingRuleWhereInput = {
      ...(pricingConfigId && { pricingConfigId }),
      ...(isActive !== undefined && { isActive }),
    };

    const [items, total] = await Promise.all([
      this.prisma.pricingRule.findMany({
        where,
        include: { pricingConfig: { select: { id: true, name: true, model: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.pricingRule.count({ where }),
    ]);

    return { items, total };
  }

  async findRuleById(id: string): Promise<PricingRule | null> {
    return this.prisma.pricingRule.findUnique({
      where: { id },
    });
  }

  async updateRule(
    id: string,
    data: {
      name?: string;
      description?: string;
      amount?: number;
      conditions?: Prisma.InputJsonValue;
      isActive?: boolean;
    },
  ): Promise<PricingRule> {
    return this.prisma.pricingRule.update({
      where: { id },
      data,
    });
  }

  async deleteRule(id: string): Promise<void> {
    await this.prisma.pricingRule.delete({
      where: { id },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHARGE EVENT CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async createChargeEvent(data: {
    partnerId: string;
    chargeType: string;
    amount: number;
    currency?: string;
    eventType: string;
    resourceType: string;
    resourceId: string;
    pricingConfigId?: string;
    pricingRuleId?: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<void> {
    await this.prisma.chargeEvent.create({
      data: {
        partnerId: data.partnerId,
        chargeType: data.chargeType as
          | 'SUBSCRIPTION'
          | 'LEAD'
          | 'INTERACTION'
          | 'COMMISSION'
          | 'LISTING'
          | 'ADDON'
          | 'OVERAGE',
        amount: data.amount,
        currency: data.currency ?? 'MYR',
        eventType: data.eventType,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        pricingConfigId: data.pricingConfigId,
        pricingRuleId: data.pricingRuleId,
        metadata: data.metadata,
        processed: false,
      },
    });

    this.logger.log(
      `Created charge event: ${data.chargeType} - ${data.amount} ${data.currency} for ${data.resourceType}:${data.resourceId}`,
    );
  }

  async findChargeEvents(params: {
    partnerId: string;
    chargeType?: string;
    eventType?: string;
    processed?: boolean;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: unknown[]; total: number }> {
    const {
      partnerId,
      chargeType,
      eventType,
      processed,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = params;

    const where: Prisma.ChargeEventWhereInput = {
      partnerId,
      ...(chargeType && {
        chargeType: chargeType as
          | 'SUBSCRIPTION'
          | 'LEAD'
          | 'INTERACTION'
          | 'COMMISSION'
          | 'LISTING'
          | 'ADDON'
          | 'OVERAGE',
      }),
      ...(eventType && { eventType }),
      ...(processed !== undefined && { processed }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    const [items, total] = await Promise.all([
      this.prisma.chargeEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.chargeEvent.count({ where }),
    ]);

    return { items, total };
  }

  async markChargeEventProcessed(id: string, invoiceId?: string): Promise<void> {
    await this.prisma.chargeEvent.update({
      where: { id },
      data: {
        processed: true,
        processedAt: new Date(),
        invoiceId,
      },
    });
  }

  async getChargeSummary(partnerId: string): Promise<{
    totalPending: number;
    totalProcessed: number;
    breakdownByType: Record<string, number>;
  }> {
    const [pending, processed, breakdown] = await Promise.all([
      this.prisma.chargeEvent.aggregate({
        where: { partnerId, processed: false },
        _sum: { amount: true },
      }),
      this.prisma.chargeEvent.aggregate({
        where: { partnerId, processed: true },
        _sum: { amount: true },
      }),
      this.prisma.chargeEvent.groupBy({
        by: ['chargeType'],
        where: { partnerId, processed: false },
        _sum: { amount: true },
      }),
    ]);

    const breakdownByType: Record<string, number> = {};
    breakdown.forEach((item) => {
      breakdownByType[item.chargeType] = Number(item._sum.amount || 0);
    });

    return {
      totalPending: Number(pending._sum.amount || 0),
      totalProcessed: Number(processed._sum.amount || 0),
      breakdownByType,
    };
  }
}
