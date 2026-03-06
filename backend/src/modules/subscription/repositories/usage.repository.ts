import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import { UsageCounterRecord } from '../types/subscription.types';

@Injectable()
export class UsageRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
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
    const partnerId = this.PartnerContext.partnerId;

    // Upsert pattern for idempotency
    return this.prisma.usageCounter.upsert({
      where: {
        partnerId_metricKey_periodStart: {
          partnerId,
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
        partnerId,
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
    const partnerId = this.PartnerContext.partnerId;

    return this.prisma.usageCounter.findUnique({
      where: {
        partnerId_metricKey_periodStart: {
          partnerId,
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
    const partnerId = this.PartnerContext.partnerId;

    return this.prisma.usageCounter.findMany({
      where: {
        partnerId,
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
   * Get all usage for current partner in a period
   */
  async getAllForPeriod(periodStart: Date, periodEnd: Date): Promise<UsageCounterRecord[]> {
    const partnerId = this.PartnerContext.partnerId;

    return this.prisma.usageCounter.findMany({
      where: {
        partnerId,
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
    const partnerId = this.PartnerContext.partnerId;

    // We don't actually delete - historical data is preserved
    // New periods are created via increment()
    // This method is here for completeness but typically not used
    await this.prisma.usageCounter.deleteMany({
      where: {
        partnerId,
        metricKey,
        periodStart: oldPeriodStart,
      },
    });
  }

  /**
   * Get total usage across all metrics for analytics
   */
  async getTotalsByMetric(fromDate: Date, toDate: Date): Promise<Record<string, number>> {
    const partnerId = this.PartnerContext.partnerId;

    const results = await this.prisma.usageCounter.groupBy({
      by: ['metricKey'],
      where: {
        partnerId,
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
