import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsageRepository } from '../repositories/usage.repository';
import { EntitlementService } from './entitlement.service';
import { IncrementUsageParams, GetUsageParams, UsageSummary } from '../types/subscription.types';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    private readonly usageRepository: UsageRepository,
    private readonly entitlementService: EntitlementService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Increment usage counter (idempotent)
   */
  async increment(params: IncrementUsageParams): Promise<void> {
    const { metricKey, amount = 1 } = params;

    // Get current period (monthly)
    const { periodStart, periodEnd } = this.getCurrentPeriod();

    try {
      await this.usageRepository.increment(metricKey, periodStart, periodEnd, amount);

      this.logger.debug(
        `Incremented usage: ${metricKey} by ${amount} for partner ${params.partnerId}`,
      );

      // Get current usage and check threshold
      const current = await this.usageRepository.getCurrent(metricKey, periodStart);

      if (current) {
        await this.checkThreshold(metricKey, current.count);
      }

      this.eventEmitter.emit('usage.incremented', {
        partnerId: params.partnerId,
        metricKey,
        amount,
        currentCount: current?.count || amount,
      });
    } catch (error) {
      this.logger.error(`Failed to increment usage for ${metricKey}:`, error);
      // Don't throw - usage tracking is observational, not blocking
    }
  }

  /**
   * Get current usage for a metric
   */
  async getCurrent(metricKey: string): Promise<UsageSummary> {
    const { periodStart, periodEnd } = this.getCurrentPeriod();

    const counter = await this.usageRepository.getCurrent(metricKey, periodStart);

    const count = counter?.count || 0;

    // Get limit from entitlements
    const limitKey = `${metricKey}.limit`;
    const checkResult = await this.entitlementService.check(limitKey);

    const limit = typeof checkResult.limit === 'number' ? checkResult.limit : undefined;

    const percentage = limit !== undefined && limit > 0 ? (count / limit) * 100 : undefined;

    return {
      metricKey,
      currentPeriod: {
        count,
        periodStart,
        periodEnd,
      },
      limit,
      percentage,
    };
  }

  /**
   * Get usage for a specific period
   */
  async getUsage(params: GetUsageParams): Promise<number> {
    const counter = await this.usageRepository.getCurrent(params.metricKey, params.periodStart);

    return counter?.count || 0;
  }

  /**
   * Get usage history for a metric
   */
  async getHistory(
    metricKey: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<{ periodStart: Date; periodEnd: Date; count: number }[]> {
    const counters = await this.usageRepository.getHistory(metricKey, fromDate, toDate);

    return counters.map((counter) => ({
      periodStart: counter.periodStart,
      periodEnd: counter.periodEnd,
      count: counter.count,
    }));
  }

  /**
   * Get all usage for current period
   */
  async getAllCurrent(): Promise<UsageSummary[]> {
    const { periodStart, periodEnd } = this.getCurrentPeriod();

    const counters = await this.usageRepository.getAllForPeriod(periodStart, periodEnd);

    const summaries: UsageSummary[] = [];

    for (const counter of counters) {
      const limitKey = `${counter.metricKey}.limit`;
      const checkResult = await this.entitlementService.check(limitKey);

      const limit = typeof checkResult.limit === 'number' ? checkResult.limit : undefined;

      const percentage =
        limit !== undefined && limit > 0 ? (counter.count / limit) * 100 : undefined;

      summaries.push({
        metricKey: counter.metricKey,
        currentPeriod: {
          count: counter.count,
          periodStart: counter.periodStart,
          periodEnd: counter.periodEnd,
        },
        limit,
        percentage,
      });
    }

    return summaries;
  }

  /**
   * Check if threshold has been reached and emit event
   */
  private async checkThreshold(metricKey: string, currentUsage: number): Promise<void> {
    const limitKey = `${metricKey}.limit`;
    const checkResult = await this.entitlementService.checkQuota(limitKey, currentUsage);

    if (!checkResult.limit) {
      return; // No limit defined
    }

    const percentage = (currentUsage / checkResult.limit) * 100;

    // Emit warning at 80% threshold
    if (percentage >= 80 && percentage < 100) {
      this.eventEmitter.emit('usage.threshold.warning', {
        metricKey,
        currentUsage,
        limit: checkResult.limit,
        percentage,
        level: 'warning',
      });

      this.logger.warn(
        `Usage warning: ${metricKey} at ${percentage.toFixed(1)}% (${currentUsage}/${checkResult.limit})`,
      );
    }

    // Emit limit reached at 100%
    if (percentage >= 100) {
      this.eventEmitter.emit('usage.threshold.reached', {
        metricKey,
        currentUsage,
        limit: checkResult.limit,
        percentage,
        level: 'critical',
      });

      this.logger.warn(
        `Usage limit reached: ${metricKey} at ${percentage.toFixed(1)}% (${currentUsage}/${checkResult.limit})`,
      );
    }
  }

  /**
   * Get current monthly period
   */
  private getCurrentPeriod(): { periodStart: Date; periodEnd: Date } {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return { periodStart, periodEnd };
  }
}
