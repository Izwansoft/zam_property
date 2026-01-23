import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import {
  CreatePlanParams,
  UpdatePlanParams,
  FindManyPlansParams,
  PlanRecord,
} from '../types/subscription.types';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

@Injectable()
export class PlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new plan
   */
  async create(params: CreatePlanParams): Promise<PlanRecord> {
    return this.prisma.plan.create({
      data: {
        name: params.name,
        slug: params.slug,
        description: params.description,
        priceMonthly: params.priceMonthly ? new Decimal(params.priceMonthly.toString()) : null,
        priceYearly: params.priceYearly ? new Decimal(params.priceYearly.toString()) : null,
        currency: params.currency || 'MYR',
        entitlements: params.entitlements as Prisma.InputJsonValue,
        isActive: params.isActive ?? true,
        isPublic: params.isPublic ?? true,
      },
    });
  }

  /**
   * Find plan by ID
   */
  async findById(id: string): Promise<PlanRecord | null> {
    return this.prisma.plan.findUnique({
      where: { id },
    });
  }

  /**
   * Find plan by slug
   */
  async findBySlug(slug: string): Promise<PlanRecord | null> {
    return this.prisma.plan.findUnique({
      where: { slug },
    });
  }

  /**
   * Find all plans with pagination and filters
   */
  async findMany(params: FindManyPlansParams = {}): Promise<{ data: PlanRecord[]; total: number }> {
    const { isActive, isPublic, page = 1, pageSize = 20 } = params;

    const where: {
      isActive?: boolean;
      isPublic?: boolean;
    } = {};

    if (isActive !== undefined) where.isActive = isActive;
    if (isPublic !== undefined) where.isPublic = isPublic;

    const [data, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.plan.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Update plan
   */
  async update(id: string, params: UpdatePlanParams): Promise<PlanRecord> {
    const data: {
      name?: string;
      description?: string;
      priceMonthly?: Decimal | null;
      priceYearly?: Decimal | null;
      entitlements?: Prisma.InputJsonValue;
      isActive?: boolean;
      isPublic?: boolean;
    } = {};

    if (params.name !== undefined) data.name = params.name;
    if (params.description !== undefined) data.description = params.description;
    if (params.priceMonthly !== undefined) {
      data.priceMonthly = params.priceMonthly ? new Decimal(params.priceMonthly.toString()) : null;
    }
    if (params.priceYearly !== undefined) {
      data.priceYearly = params.priceYearly ? new Decimal(params.priceYearly.toString()) : null;
    }
    if (params.entitlements !== undefined)
      data.entitlements = params.entitlements as Prisma.InputJsonValue;
    if (params.isActive !== undefined) data.isActive = params.isActive;
    if (params.isPublic !== undefined) data.isPublic = params.isPublic;

    return this.prisma.plan.update({
      where: { id },
      data,
    });
  }

  /**
   * Activate a plan
   */
  async activate(id: string): Promise<PlanRecord> {
    return this.prisma.plan.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Deactivate a plan
   */
  async deactivate(id: string): Promise<PlanRecord> {
    return this.prisma.plan.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Delete a plan (soft delete - deactivate instead)
   */
  async delete(id: string): Promise<PlanRecord> {
    return this.deactivate(id);
  }

  /**
   * Count subscriptions using this plan
   */
  async countSubscriptions(planId: string): Promise<number> {
    return this.prisma.subscription.count({
      where: { planId },
    });
  }
}
