import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { TenantContextService } from '@core/tenant-context/tenant-context.service';
import { UsageCounterRecord } from '../types/subscription.types';

@Injectable()
export class UsageRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Increment usage counter (idempotent)
   */
  async increment(
    metricKey: string,
    periodStart: Date,
    periodEnd: Date,
    amount: number = 1,
  ): Promise<UsageCounterRecord> {
    const tenantId = this.tenantContext.tenantId;

    // Upsert pattern for idempotency
    return this.prisma.usageCounter.upsert({
      where: {
        tenantId_metricKey_periodStart: {
          tenantId,
          metricKey,
          periodStart,
        },
      },
      update: {
        count: {
          increment: amount,
        },
      },
      create: {
        tenantId,
        metricKey,
        periodStart,
        periodEnd,
        count: amount,
      },
    });
  }

  /**
   * Get current usage for a metric
   */
  async getCurrent(metricKey: string, periodStart: Date): Promise<UsageCounterRecord | null> {
    const tenantId = this.tenantContext.tenantId;

    return this.prisma.usageCounter.findUnique({
      where: {
        tenantId_metricKey_periodStart: {
          tenantId,
          metricKey,
          periodStart,
        },
      },
    });
  }

  /**
   * Get usage history for a metric
   */
  async getHistory(metricKey: string, fromDate: Date, toDate: Date): Promise<UsageCounterRecord[]> {
    const tenantId = this.tenantContext.tenantId;

    return this.prisma.usageCounter.findMany({
      where: {
        tenantId,
        metricKey,
        periodStart: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: {
        periodStart: 'desc',
      },
    });
  }

  /**
   * Get all usage for current tenant in a period
   */
  async getAllForPeriod(periodStart: Date, periodEnd: Date): Promise<UsageCounterRecord[]> {
    const tenantId = this.tenantContext.tenantId;

    return this.prisma.usageCounter.findMany({
      where: {
        tenantId,
        periodStart: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: {
        metricKey: 'asc',
      },
    });
  }

  /**
   * Reset usage counter for a new period
   */
  async reset(metricKey: string, oldPeriodStart: Date): Promise<void> {
    const tenantId = this.tenantContext.tenantId;

    // We don't actually delete - historical data is preserved
    // New periods are created via increment()
    // This method is here for completeness but typically not used
    await this.prisma.usageCounter.deleteMany({
      where: {
        tenantId,
        metricKey,
        periodStart: oldPeriodStart,
      },
    });
  }

  /**
   * Get total usage across all metrics for analytics
   */
  async getTotalsByMetric(fromDate: Date, toDate: Date): Promise<Record<string, number>> {
    const tenantId = this.tenantContext.tenantId;

    const results = await this.prisma.usageCounter.groupBy({
      by: ['metricKey'],
      where: {
        tenantId,
        periodStart: {
          gte: fromDate,
          lte: toDate,
        },
      },
      _sum: {
        count: true,
      },
    });

    const totals: Record<string, number> = {};
    for (const result of results) {
      totals[result.metricKey] = result._sum.count || 0;
    }

    return totals;
  }
}
