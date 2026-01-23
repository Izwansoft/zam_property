import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@infrastructure/database';
import { QueueService } from './queue.service';
import { QUEUE_NAMES } from './queue.constants';

/**
 * Scheduler service for managing scheduled/cron jobs.
 *
 * Per part-31.md scheduled jobs:
 * - Subscription Renewal Check: Daily at midnight
 * - Usage Aggregation: Hourly
 * - Orphaned Media Cleanup: Daily at 3 AM
 * - Expired Sessions Cleanup: Every 15 minutes
 * - Search Index Health Check: Every 4 hours
 * - Metrics Roll-up: Daily at midnight
 * - Soft Delete Purge: Weekly on Sunday at 4 AM
 * - Listing Expiration Check: Every hour
 */
@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Scheduler service initialized');
  }

  /**
   * Check for expired listings - runs every hour.
   * Finds all PUBLISHED listings past their expiresAt date.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduleListingExpirationCheck(): Promise<void> {
    this.logger.log('Scheduling listing expiration check');

    try {
      // Get all tenants
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      for (const tenant of tenants) {
        await this.queueService.addJob('listing.expire', 'listing.check_expired', {
          tenantId: tenant.id,
          type: 'listing.check_expired',
          checkDate: new Date().toISOString(),
          batchSize: 100,
        });
      }

      this.logger.log(`Scheduled expiration check for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule listing expiration check: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up orphaned media - runs daily at 3 AM.
   */
  @Cron('0 3 * * *')
  async scheduleOrphanedMediaCleanup(): Promise<void> {
    this.logger.log('Scheduling orphaned media cleanup');

    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      // Cleanup media older than 24 hours that are still in PENDING state
      const olderThan = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      for (const tenant of tenants) {
        await this.queueService.addJob(QUEUE_NAMES.CLEANUP_PROCESS, 'media.orphaned', {
          tenantId: tenant.id,
          type: 'media.orphaned',
          olderThan,
          batchSize: 100,
          dryRun: false,
        });
      }

      this.logger.log(`Scheduled orphaned media cleanup for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule media cleanup: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up expired sessions - runs every 15 minutes.
   */
  @Cron('*/15 * * * *')
  async scheduleExpiredSessionsCleanup(): Promise<void> {
    this.logger.log('Scheduling expired sessions cleanup');

    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      const olderThan = new Date().toISOString();

      for (const tenant of tenants) {
        await this.queueService.addLowPriorityJob(QUEUE_NAMES.CLEANUP_PROCESS, 'sessions.expired', {
          tenantId: tenant.id,
          type: 'sessions.expired',
          olderThan,
          batchSize: 500,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to schedule sessions cleanup: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up expired tokens - runs every 15 minutes.
   */
  @Cron('*/15 * * * *')
  async scheduleExpiredTokensCleanup(): Promise<void> {
    this.logger.log('Scheduling expired tokens cleanup');

    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      const olderThan = new Date().toISOString();

      for (const tenant of tenants) {
        await this.queueService.addLowPriorityJob(QUEUE_NAMES.CLEANUP_PROCESS, 'tokens.expired', {
          tenantId: tenant.id,
          type: 'tokens.expired',
          tokenType: 'all',
          olderThan,
          batchSize: 500,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to schedule tokens cleanup: ${(error as Error).message}`);
    }
  }

  /**
   * Aggregate hourly usage metrics - runs every hour.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduleHourlyUsageAggregation(): Promise<void> {
    this.logger.log('Scheduling hourly usage aggregation');

    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      for (const tenant of tenants) {
        await this.queueService.addLowPriorityJob(
          QUEUE_NAMES.ANALYTICS_PROCESS,
          'metrics.aggregate',
          {
            tenantId: tenant.id,
            type: 'metrics.aggregate',
            aggregationType: 'hourly',
            dateRange: {
              start: hourAgo.toISOString(),
              end: now.toISOString(),
            },
            metrics: ['listing.view', 'listing.impression', 'listing.contact', 'search.query'],
          },
        );
      }

      this.logger.log(`Scheduled hourly usage aggregation for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule usage aggregation: ${(error as Error).message}`);
    }
  }

  /**
   * Daily metrics roll-up - runs at midnight.
   */
  @Cron('0 0 * * *')
  async scheduleDailyMetricsRollup(): Promise<void> {
    this.logger.log('Scheduling daily metrics roll-up');

    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().slice(0, 10);

      for (const tenant of tenants) {
        await this.queueService.addLowPriorityJob(QUEUE_NAMES.ANALYTICS_PROCESS, 'metrics.rollup', {
          tenantId: tenant.id,
          type: 'metrics.rollup',
          sourceGranularity: 'hourly',
          targetGranularity: 'daily',
          date: dateStr,
          metrics: [
            'listing.view',
            'listing.impression',
            'listing.contact',
            'search.query',
            'user.signup',
            'user.login',
          ],
        });
      }

      this.logger.log(`Scheduled daily metrics roll-up for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule metrics roll-up: ${(error as Error).message}`);
    }
  }

  /**
   * Weekly soft-delete purge - runs on Sunday at 4 AM.
   */
  @Cron('0 4 * * 0')
  async scheduleWeeklySoftDeletePurge(): Promise<void> {
    this.logger.log('Scheduling weekly soft-delete purge');

    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      // Purge records soft-deleted more than 30 days ago
      const olderThan = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      for (const tenant of tenants) {
        await this.queueService.addLowPriorityJob(
          QUEUE_NAMES.CLEANUP_PROCESS,
          'soft_deletes.purge',
          {
            tenantId: tenant.id,
            type: 'soft_deletes.purge',
            entityType: 'all',
            olderThan,
            batchSize: 100,
          },
        );
      }

      this.logger.log(`Scheduled soft-delete purge for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule soft-delete purge: ${(error as Error).message}`);
    }
  }

  /**
   * Search index health check - runs every 4 hours.
   */
  @Cron('0 */4 * * *')
  async scheduleSearchIndexHealthCheck(): Promise<void> {
    this.logger.log('Scheduling search index health check');

    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      for (const tenant of tenants) {
        // Queue a bulk reindex check (not full reindex)
        await this.queueService.addLowPriorityJob(QUEUE_NAMES.SEARCH_INDEX, 'bulk.reindex', {
          tenantId: tenant.id,
          type: 'bulk.reindex',
          indexName: `listings_${tenant.id}`,
          entityType: 'listing',
          batchSize: 10, // Just check a small sample
        });
      }

      this.logger.log(`Scheduled search index health check for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(
        `Failed to schedule search index health check: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Archive old audit logs - runs monthly on the 1st at 2 AM.
   */
  @Cron('0 2 1 * *')
  async scheduleMonthlyLogArchive(): Promise<void> {
    this.logger.log('Scheduling monthly log archive');

    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      // Archive logs older than 90 days
      const olderThan = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      for (const tenant of tenants) {
        await this.queueService.addLowPriorityJob(QUEUE_NAMES.CLEANUP_PROCESS, 'logs.archive', {
          tenantId: tenant.id,
          type: 'logs.archive',
          logType: 'audit',
          olderThan,
          compress: true,
        });
      }

      this.logger.log(`Scheduled log archive for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule log archive: ${(error as Error).message}`);
    }
  }
}
