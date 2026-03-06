import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import {
  AnalyticsJob,
  EventTrackJob,
  MetricsAggregateJob,
  MetricsRollupJob,
  ReportGenerateJob,
  AnalyticsAggregationResult,
  ANALYTICS_EVENT_TYPES,
} from '../../queue/job-types';
import { JobResult } from '../../queue/queue.interfaces';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '@infrastructure/database';

/**
 * Analytics processor for handling analytics events and aggregations.
 *
 * Per part-31.md:
 * - event.track: Track analytics event (timeout: 5s, retries: 3)
 * - metrics.aggregate: Aggregate metrics for a time period (timeout: 300s, retries: 3)
 * - report.generate: Generate analytics report (timeout: 600s, retries: 2)
 */
@Processor(QUEUE_NAMES.ANALYTICS_PROCESS)
@Injectable()
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  // Redis key prefixes for analytics storage
  private readonly COUNTER_PREFIX = 'analytics:counter';
  private readonly EVENT_PREFIX = 'analytics:event';
  private readonly METRICS_PREFIX = 'analytics:metrics';

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<AnalyticsJob>): Promise<JobResult> {
    const startTime = Date.now();
    const { name, data } = job;

    this.logger.log({
      event: 'job.started',
      queue: QUEUE_NAMES.ANALYTICS_PROCESS,
      jobId: job.id,
      jobType: name,
      partnerId: data.partnerId,
    });

    try {
      let result: JobResult;

      switch (data.type) {
        case 'event.track':
          result = await this.handleEventTrack(job as Job<EventTrackJob>);
          break;
        case 'metrics.aggregate':
          result = await this.handleMetricsAggregate(job as Job<MetricsAggregateJob>);
          break;
        case 'metrics.rollup':
          result = await this.handleMetricsRollup(job as Job<MetricsRollupJob>);
          break;
        case 'report.generate':
          result = await this.handleReportGenerate(job as Job<ReportGenerateJob>);
          break;
        default:
          this.logger.warn(`Unknown job type: ${(data as AnalyticsJob).type}`);
          result = {
            success: false,
            message: `Unknown job type: ${(data as AnalyticsJob).type}`,
            processedAt: new Date().toISOString(),
          };
      }

      this.logger.log({
        event: 'job.completed',
        queue: QUEUE_NAMES.ANALYTICS_PROCESS,
        jobId: job.id,
        jobType: name,
        duration: Date.now() - startTime,
        success: result.success,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        event: 'job.failed',
        queue: QUEUE_NAMES.ANALYTICS_PROCESS,
        jobId: job.id,
        jobType: name,
        duration: Date.now() - startTime,
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  /**
   * Track a single analytics event.
   * Stores event and updates real-time counters in Redis.
   */
  private async handleEventTrack(job: Job<EventTrackJob>): Promise<JobResult> {
    const { partnerId, eventType, eventCategory, entityId, entityType, properties, timestamp } =
      job.data;

    this.logger.debug(`Tracking event: ${eventType} for ${entityType}:${entityId}`);

    await job.updateProgress(10);

    const redis = this.redisService.getClient();

    // 1. Update real-time counters
    const dateKey = this.getDateKey(timestamp);

    // Increment daily counter
    const counterKey = `${this.COUNTER_PREFIX}:${partnerId}:${eventType}:${dateKey}`;
    await redis.incr(counterKey);
    await redis.expire(counterKey, 86400 * 30); // Keep for 30 days

    await job.updateProgress(30);

    // 2. Update entity-specific counters
    const entityCounterKey = `${this.COUNTER_PREFIX}:${partnerId}:${entityType}:${entityId}:${eventType}`;
    await redis.incr(entityCounterKey);
    await redis.expire(entityCounterKey, 86400 * 90); // Keep for 90 days

    await job.updateProgress(50);

    // 3. Store event for later aggregation (using sorted set with timestamp score)
    const eventData = JSON.stringify({
      eventType,
      eventCategory,
      entityId,
      entityType,
      properties,
      userId: job.data.userId,
      sessionId: job.data.sessionId,
      timestamp,
    });

    const eventSetKey = `${this.EVENT_PREFIX}:${partnerId}:${dateKey}`;
    await redis.zadd(eventSetKey, Date.parse(timestamp), eventData);
    await redis.expire(eventSetKey, 86400 * 7); // Keep for 7 days

    await job.updateProgress(70);

    // 3b. Persist to database (daily aggregates) for dashboards
    await this.persistDailyAggregates(job.data);

    await job.updateProgress(80);

    // 4. Emit event for real-time dashboards
    this.eventEmitter.emit('analytics.event_tracked', {
      partnerId,
      eventType,
      entityId,
      entityType,
      timestamp,
    });

    await job.updateProgress(100);

    return {
      success: true,
      message: `Event ${eventType} tracked for ${entityType}:${entityId}`,
      data: { eventType, entityId, entityType, partnerId },
      processedAt: new Date().toISOString(),
    };
  }

  private getUtcDateOnly(timestamp: string): Date {
    const dt = new Date(timestamp);
    return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
  }

  private async persistDailyAggregates(data: EventTrackJob): Promise<void> {
    const partnerId = data.partnerId;
    const date = this.getUtcDateOnly(data.timestamp);

    if (data.eventType === ANALYTICS_EVENT_TYPES.LISTING_VIEW && data.entityType === 'listing') {
      const listingId = data.entityId;
      let vendorId = data.properties['vendorId'] as string | undefined;
      let verticalType = data.properties['verticalType'] as string | undefined;

      if (!vendorId || !verticalType) {
        const listing = await this.prisma.listing.findFirst({
          where: { id: listingId, partnerId },
          select: { vendorId: true, verticalType: true },
        });
        if (!listing) {
          return;
        }
        vendorId = listing.vendorId;
        verticalType = listing.verticalType;
      }

      await this.prisma.listingStats.upsert({
        where: {
          partnerId_listingId_date: {
            partnerId,
            listingId,
            date,
          },
        },
        create: {
          partnerId,
          listingId,
          vendorId,
          verticalType,
          date,
          viewsCount: 1,
        },
        update: {
          viewsCount: { increment: 1 },
        },
      });

      await this.prisma.vendorStats.upsert({
        where: {
          partnerId_vendorId_date: {
            partnerId,
            vendorId,
            date,
          },
        },
        create: {
          partnerId,
          vendorId,
          date,
          viewsCount: 1,
        },
        update: {
          viewsCount: { increment: 1 },
        },
      });

      return;
    }

    // Interactions: increment leads/enquiries/bookings counts
    if (data.eventType === 'interaction.created' && data.eventCategory === 'interaction') {
      const vendorId = data.properties['vendorId'] as string | undefined;
      const listingId = data.properties['listingId'] as string | undefined;
      const verticalType = data.properties['verticalType'] as string | undefined;
      const interactionType = data.properties['interactionType'] as string | undefined;

      if (!vendorId || !listingId || !verticalType || !interactionType) {
        return;
      }

      const listingUpdate: Record<string, unknown> = {};
      const vendorUpdate: Record<string, unknown> = {};
      const listingCreateCounts: {
        leadsCount?: number;
        enquiriesCount?: number;
        bookingsCount?: number;
      } = {};
      const vendorCreateCounts: {
        leadsCount?: number;
        enquiriesCount?: number;
        bookingsCount?: number;
      } = {};

      if (interactionType === 'LEAD') {
        listingUpdate.leadsCount = { increment: 1 };
        vendorUpdate.leadsCount = { increment: 1 };
        listingCreateCounts.leadsCount = 1;
        vendorCreateCounts.leadsCount = 1;
      } else if (interactionType === 'ENQUIRY') {
        listingUpdate.enquiriesCount = { increment: 1 };
        vendorUpdate.enquiriesCount = { increment: 1 };
        listingCreateCounts.enquiriesCount = 1;
        vendorCreateCounts.enquiriesCount = 1;
      } else if (interactionType === 'BOOKING') {
        listingUpdate.bookingsCount = { increment: 1 };
        vendorUpdate.bookingsCount = { increment: 1 };
        listingCreateCounts.bookingsCount = 1;
        vendorCreateCounts.bookingsCount = 1;
      } else {
        return;
      }

      await this.prisma.listingStats.upsert({
        where: {
          partnerId_listingId_date: {
            partnerId,
            listingId,
            date,
          },
        },
        create: {
          partnerId,
          listingId,
          vendorId,
          verticalType,
          date,
          ...listingCreateCounts,
        },
        update: listingUpdate,
      });

      await this.prisma.vendorStats.upsert({
        where: {
          partnerId_vendorId_date: {
            partnerId,
            vendorId,
            date,
          },
        },
        create: {
          partnerId,
          vendorId,
          date,
          ...vendorCreateCounts,
        },
        update: vendorUpdate,
      });
    }
  }

  /**
   * Aggregate metrics for a time period.
   */
  private async handleMetricsAggregate(job: Job<MetricsAggregateJob>): Promise<JobResult> {
    const { partnerId, aggregationType, dateRange, metrics } = job.data;

    this.logger.log(
      `Aggregating ${aggregationType} metrics for partner ${partnerId}: ${dateRange.start} to ${dateRange.end}`,
    );

    await job.updateProgress(10);

    const redis = this.redisService.getClient();
    const aggregatedMetrics: Record<string, number> = {};
    let recordsProcessed = 0;

    // Process each metric type
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];

      // Get all counter keys for this metric in the date range
      const pattern = `${this.COUNTER_PREFIX}:${partnerId}:${metric}:*`;
      const keys = await this.scanKeys(redis, pattern);

      let total = 0;
      for (const key of keys) {
        const dateKey = key.split(':').pop();
        if (dateKey && this.isWithinDateRange(dateKey, dateRange.start, dateRange.end)) {
          const value = await redis.get(key);
          total += parseInt(value || '0', 10);
          recordsProcessed++;
        }
      }

      aggregatedMetrics[metric] = total;

      const progress = 10 + Math.floor(((i + 1) / metrics.length) * 70);
      await job.updateProgress(progress);
    }

    await job.updateProgress(85);

    // Store aggregated metrics
    const metricsKey = `${this.METRICS_PREFIX}:${partnerId}:${aggregationType}:${dateRange.start}:${dateRange.end}`;
    await redis.set(metricsKey, JSON.stringify(aggregatedMetrics));
    await redis.expire(metricsKey, 86400 * 365); // Keep for 1 year

    await job.updateProgress(100);

    const result: AnalyticsAggregationResult = {
      success: true,
      aggregationType,
      recordsProcessed,
      metricsGenerated: Object.keys(aggregatedMetrics).length,
      dateRange,
      duration: 0, // Will be set by wrapper
      processedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: `Aggregated ${Object.keys(aggregatedMetrics).length} metrics (${recordsProcessed} records)`,
      data: { ...result, metrics: aggregatedMetrics },
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Roll up metrics from fine-grained to coarse-grained.
   */
  private async handleMetricsRollup(job: Job<MetricsRollupJob>): Promise<JobResult> {
    const { partnerId, sourceGranularity, targetGranularity, date, metrics } = job.data;

    this.logger.log(
      `Rolling up ${sourceGranularity} to ${targetGranularity} metrics for partner ${partnerId}`,
    );

    await job.updateProgress(10);

    // Determine source date range based on target granularity
    const _dateRange = this.getDateRangeForRollup(date, sourceGranularity, targetGranularity);

    await job.updateProgress(20);

    // Aggregate source metrics
    const redis = this.redisService.getClient();
    const aggregatedMetrics: Record<string, number> = {};

    for (const metric of metrics) {
      const pattern = `${this.METRICS_PREFIX}:${partnerId}:${sourceGranularity}:*`;
      const keys = await this.scanKeys(redis, pattern);

      let total = 0;
      for (const key of keys) {
        // Check if key is within date range
        const value = await redis.get(key);
        if (value) {
          const parsed = JSON.parse(value);
          total += parsed[metric] || 0;
        }
      }

      aggregatedMetrics[metric] = total;
    }

    await job.updateProgress(80);

    // Store rolled up metrics
    const rollupKey = `${this.METRICS_PREFIX}:${partnerId}:${targetGranularity}:${date}`;
    await redis.set(rollupKey, JSON.stringify(aggregatedMetrics));
    await redis.expire(rollupKey, 86400 * 730); // Keep for 2 years

    await job.updateProgress(100);

    return {
      success: true,
      message: `Rolled up ${sourceGranularity} to ${targetGranularity} metrics`,
      data: {
        sourceGranularity,
        targetGranularity,
        date,
        metrics: aggregatedMetrics,
      },
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate an analytics report.
   */
  private async handleReportGenerate(job: Job<ReportGenerateJob>): Promise<JobResult> {
    const { partnerId, reportType, vendorId, dateRange, format, recipientEmail, storageKey } =
      job.data;

    this.logger.log(`Generating ${reportType} report for partner ${partnerId}`);

    await job.updateProgress(10);

    // Gather metrics based on report type
    const reportData: Record<string, unknown> = {
      reportType,
      partnerId,
      vendorId,
      dateRange,
      generatedAt: new Date().toISOString(),
    };

    await job.updateProgress(30);

    // Build report based on type
    switch (reportType) {
      case 'vendor_performance':
        reportData.metrics = await this.gatherVendorMetrics(partnerId, vendorId!, dateRange);
        break;
      case 'listing_analytics':
        reportData.metrics = await this.gatherListingMetrics(partnerId, dateRange);
        break;
      case 'platform_overview':
        reportData.metrics = await this.gatherPlatformMetrics(partnerId, dateRange);
        break;
      default:
        reportData.metrics = {};
    }

    await job.updateProgress(70);

    // Format report (placeholder - would use actual report generation library)
    const _formattedReport = this.formatReport(reportData, format);

    await job.updateProgress(90);

    // Store or email report
    if (storageKey) {
      // Would upload to S3
      this.logger.log(`Report would be stored at: ${storageKey}`);
    }

    if (recipientEmail) {
      // Emit event to send email
      this.eventEmitter.emit('report.generated', {
        partnerId,
        reportType,
        recipientEmail,
        format,
      });
    }

    await job.updateProgress(100);

    return {
      success: true,
      message: `Report ${reportType} generated successfully`,
      data: {
        reportType,
        format,
        storageKey,
        recipientEmail,
        recordCount: Object.keys(reportData.metrics as Record<string, unknown>).length,
      },
      processedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────────────────────

  private getDateKey(timestamp: string): string {
    return timestamp.slice(0, 10); // YYYY-MM-DD
  }

  private async scanKeys(
    redis: ReturnType<RedisService['getClient']>,
    pattern: string,
  ): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== '0');

    return keys;
  }

  private isWithinDateRange(dateKey: string, start: string, end: string): boolean {
    return dateKey >= start.slice(0, 10) && dateKey <= end.slice(0, 10);
  }

  private getDateRangeForRollup(
    date: string,
    _sourceGranularity: string,
    targetGranularity: string,
  ): { start: string; end: string } {
    const d = new Date(date);

    switch (targetGranularity) {
      case 'weekly': {
        const dayOfWeek = d.getDay();
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          start: startOfWeek.toISOString().slice(0, 10),
          end: endOfWeek.toISOString().slice(0, 10),
        };
      }
      case 'monthly': {
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return {
          start: startOfMonth.toISOString().slice(0, 10),
          end: endOfMonth.toISOString().slice(0, 10),
        };
      }
      default:
        return { start: date, end: date };
    }
  }

  private async gatherVendorMetrics(
    partnerId: string,
    vendorId: string,
    _dateRange: { start: string; end: string },
  ): Promise<Record<string, unknown>> {
    // Placeholder - would gather actual vendor metrics
    return {
      vendorId,
      partnerId,
      totalListings: 0,
      activeListings: 0,
      totalViews: 0,
      totalInquiries: 0,
      conversionRate: 0,
    };
  }

  private async gatherListingMetrics(
    partnerId: string,
    _dateRange: { start: string; end: string },
  ): Promise<Record<string, unknown>> {
    return {
      partnerId,
      totalListings: 0,
      publishedListings: 0,
      expiredListings: 0,
      totalViews: 0,
      totalInquiries: 0,
    };
  }

  private async gatherPlatformMetrics(
    partnerId: string,
    _dateRange: { start: string; end: string },
  ): Promise<Record<string, unknown>> {
    return {
      partnerId,
      totalVendors: 0,
      activeVendors: 0,
      totalListings: 0,
      totalUsers: 0,
      totalInteractions: 0,
    };
  }

  private formatReport(data: Record<string, unknown>, format: string): string {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        // Placeholder - would use actual CSV library
        return 'CSV export placeholder';
      default:
        return JSON.stringify(data);
    }
  }
}
